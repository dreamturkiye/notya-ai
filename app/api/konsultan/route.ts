/**
 * KONSULTASYONLAR-01 — konsültan portalı (hesap yok).
 * GET  ?t=<jeton>  → dilim (soru, özgeçmiş, onaylı cümleler)
 * POST { t, not, dosyalar[] } → belge kasaya + asistan ön not + isteyen muayeneye bağ
 *
 * Jeton: HMAC (randevu eylem deseni) veya SHA-256 hash (intake deseni) — ikisi de kabul.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import {
  KONSULTASYON_KOLONLARI,
  BEKLEYEN_DURUMLAR,
  hedefEtiketi,
  type KonsultasyonSatiri,
} from '@/lib/doktor/konsultasyon'
import {
  konsultanJetonuCoz,
  portalJetonHash,
} from '@/lib/doktor/konsultanJeton'
import {
  asistanOnNotYaz,
  konsultanDilimi,
  konsultanNotDogrula,
  portalBelgeDogrula,
  KONSULTAN_DAVET_SATIRI,
} from '@/lib/doktor/konsultanPortal'
import { uploadDocument, VaultValidationError } from '@/lib/vault/service'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { doktorIletisimAyari, muayenehaneTelefonAyari } from '@/lib/iletisim/sunucu'
import { epostaAdresi } from '@/lib/iletisim/baglantilar'
import { gorunenTelefonSec, telefonGorunum } from '@/lib/portal/hekimKarti'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function sevkBul(jeton: string): Promise<KonsultasyonSatiri | null> {
  const sb = servisSupabase()
  const hmac = konsultanJetonuCoz(jeton)
  if (hmac) {
    const { data } = await sb.from('sevkler').select(KONSULTASYON_KOLONLARI).eq('id', hmac.sevkId).maybeSingle()
    const s = data as unknown as KonsultasyonSatiri | null
    if (!s) return null
    if (s.portal_jeton_son && Date.parse(s.portal_jeton_son) < Date.now()) return null
    return s
  }
  // Hash deseni (e-posta linkinde ham jeton)
  const hash = portalJetonHash(jeton)
  const { data } = await sb
    .from('sevkler')
    .select(KONSULTASYON_KOLONLARI)
    .eq('portal_jeton_hash', hash)
    .maybeSingle()
  const s = data as unknown as KonsultasyonSatiri | null
  if (!s) return null
  if (s.portal_jeton_son && Date.parse(s.portal_jeton_son) < Date.now()) return null
  return s
}

async function hekimKartBilgisi(
  sb: ReturnType<typeof servisSupabase>,
  doctorId: string,
): Promise<{ ad: string; telefon: string | null; eposta: string | null }> {
  const [{ data }, ayar, tel] = await Promise.all([
    sb.from('users').select('title, first_name, last_name, full_name, recete_baslik, iletisim_whatsapp_muayenehane').eq('id', doctorId).maybeSingle(),
    doktorIletisimAyari(sb, doctorId),
    muayenehaneTelefonAyari(sb, doctorId),
  ])
  let ad = 'İsteyen hekim'
  if (data) {
    const parca = [data.title, data.first_name, data.last_name].filter(Boolean).join(' ').trim()
    if (parca && (data.first_name || data.last_name)) ad = parca
    else {
      const tam = String(data.full_name || '').trim()
      if (tam) ad = tam
    }
  }
  const rb = (data?.recete_baslik && typeof data.recete_baslik === 'object' ? data.recete_baslik : {}) as { satirlar?: unknown }
  const satirlar = Array.isArray(rb.satirlar) ? rb.satirlar.map((x) => String(x ?? '').trim()).filter(Boolean) : []
  const telefonHam = tel.gorunenTelefon || gorunenTelefonSec({
    varsayilanTelefon: tel.varsayilanTelefon,
    muayenehaneTelefon: tel.muayenehaneTelefon,
    whatsappMuayenehane: data?.iletisim_whatsapp_muayenehane ? String(data.iletisim_whatsapp_muayenehane) : null,
    satirlar,
  })
  const eposta = epostaAdresi(ayar.eposta) || (ayar.eposta ? String(ayar.eposta).trim() : null)
  return {
    ad,
    telefon: telefonGorunum(telefonHam),
    eposta: eposta || null,
  }
}

async function hastaAdi(sb: ReturnType<typeof servisSupabase>, patientId: string): Promise<string> {
  const { data } = await sb.from('patients').select('name_encrypted').eq('id', patientId).maybeSingle()
  try {
    if (data?.name_encrypted) {
      const j = JSON.parse(decrypt(data.name_encrypted)) as { ad?: string }
      return String(j.ad || '').trim() || 'Hasta'
    }
  } catch { /* */ }
  return 'Hasta'
}

/** Onaylı nottan kısa cümleler — ham SOAP / transkript değil. */
async function onayliCumleler(sb: ReturnType<typeof servisSupabase>, noteId: string | null | undefined): Promise<string[]> {
  if (!noteId) return []
  const { data } = await sb
    .from('notes')
    .select('content_degerlendirme, content_plan, content_tani, approved_at')
    .eq('id', noteId)
    .maybeSingle()
  if (!data || !data.approved_at) return []
  const parcalar = [data.content_tani, data.content_degerlendirme, data.content_plan]
    .map((x) => String(x || '').replace(/\s+/g, ' ').trim())
    .filter((x) => x.length >= 8)
  return parcalar.flatMap((p) => p.split(/(?<=[.!?…])\s+/).filter((c) => c.length >= 8)).slice(0, 6)
}

export async function GET(req: NextRequest) {
  const jeton = String(req.nextUrl.searchParams.get('t') || '')
  if (!jeton) return NextResponse.json({ error: 'Bağlantı geçersiz.' }, { status: 400 })
  const s = await sevkBul(jeton)
  if (!s) return NextResponse.json({ error: 'Bu bağlantı geçersiz veya süresi dolmuş.' }, { status: 404 })
  const sb = servisSupabase()
  const doctorId = String(s.doctor_id || '')
  const [hekim, hasta, cumleler] = await Promise.all([
    hekimKartBilgisi(sb, doctorId),
    hastaAdi(sb, s.patient_id),
    onayliCumleler(sb, s.kaynak_not_id),
  ])
  const dilim = konsultanDilimi({
    satir: s,
    hekimAdi: hekim.ad,
    hekimTelefon: hekim.telefon,
    hekimEposta: hekim.eposta,
    hastaAdi: hasta,
    onayliCumleler: cumleler,
  })
  const kapali = !(BEKLEYEN_DURUMLAR as readonly string[]).includes(s.durum) && s.durum !== 'yanitlandi'
  return NextResponse.json({
    ok: true,
    dilim,
    gonderildi: !!s.konsultan_notu || !!s.belge_id,
    kapali,
    davet: KONSULTAN_DAVET_SATIRI,
  })
}

type DosyaGirdi = { ad: string; mime?: string; base64: string }

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const jeton = String(b?.t || b?.jeton || '')
  if (!jeton) return NextResponse.json({ error: 'Bağlantı geçersiz.' }, { status: 400 })
  const s = await sevkBul(jeton)
  if (!s) return NextResponse.json({ error: 'Bu bağlantı geçersiz veya süresi dolmuş.' }, { status: 404 })
  if (!(BEKLEYEN_DURUMLAR as readonly string[]).includes(s.durum) && s.durum !== 'yanitlandi') {
    return NextResponse.json({ error: 'Bu konsültasyon kapatılmış — yeni rapor eklenemez.' }, { status: 409 })
  }
  const notD = konsultanNotDogrula(b?.not ?? b?.konsultanNotu)
  if ('hata' in notD) return NextResponse.json({ error: notD.hata }, { status: 400 })

  const dosyalar = Array.isArray(b?.dosyalar) ? (b!.dosyalar as DosyaGirdi[]) : []
  if (!dosyalar.length && !(b?.dosya as DosyaGirdi | undefined)?.base64) {
    return NextResponse.json({ error: 'En az bir belge yükleyin (JPEG, PDF veya kısa video).' }, { status: 400 })
  }
  const liste: DosyaGirdi[] = dosyalar.length
    ? dosyalar.slice(0, 5)
    : [b!.dosya as DosyaGirdi]

  const sb = servisSupabase()
  const doctorId = String(s.doctor_id || '')
  if (!doctorId) return NextResponse.json({ error: 'Konsültasyon kaydı eksik.' }, { status: 500 })

  const belgeIdler: string[] = Array.isArray(s.belge_idler) ? [...s.belge_idler] : []
  const belgeAdlari: string[] = []
  let birincilBelge: string | null = s.belge_id

  for (const d of liste) {
    const ad = String(d?.ad || 'rapor.bin')
    const bytes = Buffer.from(String(d?.base64 || ''), 'base64')
    const dog = portalBelgeDogrula(ad, d?.mime ?? null, bytes.length)
    if ('hata' in dog) return NextResponse.json({ error: dog.hata }, { status: 400 })
    try {
      const meta = await uploadDocument({ supabase: sb }, {
        doctorId,
        patientId: s.patient_id,
        visitId: null,
        fileName: ad,
        fileType: dog.mime,
        bytes,
        notes: `Konsültan portalı — ${hedefEtiketi(s)}`,
        category: 'konsultasyon',
        uploadedBy: doctorId,
      })
      belgeIdler.push(meta.id)
      belgeAdlari.push(meta.fileName)
      if (!birincilBelge) birincilBelge = meta.id
    } catch (e) {
      if (e instanceof VaultValidationError) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
      console.error('[konsultan] upload', e)
      return NextResponse.json({ error: 'Belge kaydedilemedi — lütfen tekrar deneyin.' }, { status: 500 })
    }
  }

  const onNot = asistanOnNotYaz({
    konsultanNotu: notD.not,
    belgeAdlari,
    brans: hedefEtiketi(s),
  })

  const { data: guncel, error } = await sb
    .from('sevkler')
    .update({
      konsultan_notu: notD.not,
      belge_id: birincilBelge,
      belge_idler: belgeIdler,
      asistan_on_not: onNot,
      asistan_on_not_at: new Date().toISOString(),
      // Hekim kendi özetini yazana kadar yanıt bekleniyor kalabilir; belge bağlandı
      durum: s.durum === 'yanitlandi' ? 'yanitlandi' : 'yanit_bekleniyor',
    })
    .eq('id', s.id)
    .select(KONSULTASYON_KOLONLARI)
    .maybeSingle()

  if (error || !guncel) {
    console.error('[konsultan] update', error?.message)
    return NextResponse.json({ error: 'Yanıt kaydedilemedi.' }, { status: 500 })
  }

  // Asistan ön notunu isteyen muayeneye düşür (hekim onayına kadar hastaya gitmez).
  try {
    if (s.kaynak_not_id) {
      const { data: not } = await sb
        .from('notes')
        .select('id, content_degerlendirme, doctor_id')
        .eq('id', s.kaynak_not_id)
        .eq('doctor_id', doctorId)
        .maybeSingle()
      if (not) {
        const once = String(not.content_degerlendirme || '').trim()
        const sonra = once ? `${once}\n\n${onNot}` : onNot
        await sb.from('notes').update({ content_degerlendirme: sonra }).eq('id', not.id).eq('doctor_id', doctorId)
      } else {
        await gununNotunaEkle(sb, doctorId, s.patient_id, onNot)
      }
    } else {
      await gununNotunaEkle(sb, doctorId, s.patient_id, onNot)
    }
  } catch (e) {
    console.error('[konsultan] on-not', e)
  }

  return NextResponse.json({
    ok: true,
    davet: KONSULTAN_DAVET_SATIRI,
    mesaj: 'Teşekkürler — rapor isteyen hekime iletildi.',
  })
}
