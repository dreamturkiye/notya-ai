/**
 * NOTYA-EYLEM-19 — voice surface: prepare a taslak, then spoken Evet/Hayır → eylemOnayla / vazgeç.
 *
 * ElevenLabs client tools call this with the doctor's bearer token. The model never writes;
 * hazirla only inserts eylem_onerileri; onayla runs the same spine as the tap (core/eylemler/onayla.ts).
 *
 * AUTH: doktorOturum — clinical records, not pratikOturum (sekreter must not commit).
 * HASTA-IZOLASYON-01: patient resolved server-side via hastaninSozunuCoz / hastaSahibiMi; foreign id → 404.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaninSozunuCoz } from '@/lib/doktor/hastaCozumleyici'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { eylemKapali } from '@/core/eylemler/araclar'
import { oneriHazirla, kaynaklariCoz } from '@/core/eylemler/oneri'
import { eylemOnayla, eylemVazgec } from '@/core/eylemler/onayla'
import { eylemBul } from '@/core/eylemler/kayit'
import { hastaOzetiGetir } from '@/core/eylemler/hasta'
import { bugunTRT } from '@/core/eylemler/types'
import {
  dogumdaTarihDoldur,
  sesCiddiUyariEngeli,
  sesEksikAlanEngeli,
  sesOnayMetniGecerliMi,
  sesOzetMetni,
} from '@/core/eylemler/sesKapilari'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import type { IlacUyarisi } from '@/core/eylemler/ilacUyari'

export const dynamic = 'force-dynamic'

async function hekimBransi(supabase: Parameters<typeof hastaSahibiMi>[0], doktorId: string): Promise<SpecialtyKey | null> {
  const { data } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  return bransAnahtari((data as { specialty?: string } | null)?.specialty)
}

/** TTS-facing payload: always `sonuc` string; never claim kaydedildi without ok:true from onayla. */
function sesYanit(sonuc: string, ekstra: Record<string, unknown> = {}, durum = 200) {
  return NextResponse.json({ sonuc, ...ekstra }, { status: durum })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  if (eylemKapali()) {
    return sesYanit('Dosyaya kayıt hazırlama şu an kapalı. Ekrandan Aşılar / İlaçlar sekmesini kullanın.')
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const adim = String(body.adim || '').trim()
  const brans = await hekimBransi(supabase, user.id)

  if (adim === 'hazirla') {
    const eylemAnahtar = String(body.eylem || body.eylemAnahtar || '').trim()
    const hastaAdi = String(body.hastaAdi || body.hasta || body.isim || '').trim()
    let alanlarHam: Record<string, unknown> = {}
    if (typeof body.alanlar === 'string' && body.alanlar.trim()) {
      try {
        const p = JSON.parse(body.alanlar)
        if (p && typeof p === 'object' && !Array.isArray(p)) alanlarHam = p as Record<string, unknown>
        else alanlarHam = { notlar: body.alanlar }
      } catch {
        alanlarHam = { notlar: body.alanlar }
      }
    } else if (body.alanlar && typeof body.alanlar === 'object' && !Array.isArray(body.alanlar)) {
      alanlarHam = body.alanlar as Record<string, unknown>
    }
    if (!eylemAnahtar) return sesYanit('Hangi kaydı hazırlayacağımı anlayamadım (aşı, ilaç, alerji…). Tekrar söyler misiniz?')
    if (!hastaAdi) return sesYanit('Hangi hasta için hazırlayayım? Adını söyler misiniz?')

    const eylem = eylemBul(eylemAnahtar)
    if (!eylem) return sesYanit('Bu tür bir kaydı sesle hazırlayamıyorum. Ekrandan ilgili sekmeyi açın.')

    const cozum = await hastaninSozunuCoz(supabase, user.id, hastaAdi)
    if (cozum.tur === 'coklu') {
      const liste = cozum.adaylar.map((a, i) => `${i + 1}. ${a.ad}`).join(', ')
      return sesYanit(`"${hastaAdi}" için birden fazla kayıt var: ${liste}. Hangisini istiyorsunuz?`)
    }
    if (cozum.tur === 'yok') return sesYanit(`Kayıtlarımda "${hastaAdi}" adında hasta bulamadım.`)

    const hasta = await hastaOzetiGetir(supabase, user.id, cozum.patientId)
    if (!hasta) return sesYanit('Hasta bulunamadı.', {}, 404)

    const kaynaklarHam = body.alan_kaynaklari ?? body.alanKaynaklari
    // Default undeclared fields to doktor_soyledi on voice — the doctor is speaking the values.
    const alanKaynaklari: Record<string, unknown> =
      kaynaklarHam && typeof kaynaklarHam === 'object' ? { ...(kaynaklarHam as Record<string, unknown>) } : {}
    for (const a of eylem.alanlar) {
      if (alanlarHam[a.anahtar] == null || String(alanlarHam[a.anahtar]).trim() === '') continue
      if (!alanKaynaklari[a.anahtar]) alanKaynaklari[a.anahtar] = { kaynak: 'doktor_soyledi' }
    }

    const girdi: Record<string, unknown> = { ...alanlarHam, alan_kaynaklari: alanKaynaklari }
    // Soft DOB fill before proposal so read-back can ask for Evet without an empty date.
    const k = kaynaklariCoz(alanKaynaklari)
    const doldurulmus = dogumdaTarihDoldur(alanlarHam, k, hasta.dogumTarihi)
    if (doldurulmus.uygulama_tarihi && !alanlarHam.uygulama_tarihi) {
      girdi.uygulama_tarihi = doldurulmus.uygulama_tarihi
      girdi.alan_kaynaklari = {
        ...alanKaynaklari,
        uygulama_tarihi: {
          kaynak: 'dosyadan',
          alinti: 'doğumda — doğum tarihi kullanıldı',
        },
      }
    }

    const o = await oneriHazirla({
      ctx: { supabase, doktorId: user.id, hasta, brans, oneriId: '', bugunTRT: bugunTRT() },
      anahtar: eylemAnahtar,
      girdi,
      yuzey: 'ses',
      suzgec: { brans, hasta },
    })
    if (!o) return sesYanit('Bu kaydı bu hasta / branş için hazırlayamadım. Ekrandan deneyin.')

    const ozet = sesOzetMetni({
      etiket: o.etiket,
      hastaAd: hasta.ad,
      veri: o.veri,
      alanlar: o.alanlar,
      eksik: o.eksik_alanlar.filter((a) => o.zorunlu.includes(a)),
    })
    return sesYanit(ozet, {
      ok: true,
      oneriId: o.id,
      hastaId: hasta.id,
      eylemAnahtar: o.eylem_anahtar,
      eksik: o.eksik_alanlar,
      onayBekliyor: o.eksik_alanlar.filter((a) => o.zorunlu.includes(a)).length === 0,
    })
  }

  if (adim === 'onayla') {
    const onayMetni = String(body.onayMetni || body.metin || body.cevap || '').trim()
    if (!sesOnayMetniGecerliMi(onayMetni)) {
      return sesYanit('Onayı net duyamadım. “Evet” veya “Onaylıyorum” deyin; vazgeçmek için “Hayır”.')
    }

    let oneriId = String(body.oneriId || '').trim()
    const hastaId = String(body.hastaId || '').trim()

    if (!oneriId) {
      if (!hastaId) return sesYanit('Hangi kaydı onaylayacağımı bilmiyorum. Önce hazırlatın, sonra “Evet” deyin.')
      if (!(await hastaSahibiMi(supabase, user.id, hastaId))) return sesYanit('Hasta bulunamadı.', {}, 404)
      const { data: taslaklar } = await supabase
        .from('eylem_onerileri')
        .select('id, uyari_detay, eksik_alanlar, eylem_anahtar, veri')
        .eq('doctor_id', user.id)
        .eq('hasta_id', hastaId)
        .eq('durum', 'taslak')
        .eq('yuzey', 'ses')
        .order('created_at', { ascending: false })
        .limit(5)
      if (!taslaklar?.length) return sesYanit('Onay bekleyen ses kaydı yok. Önce kaydı hazırlatın.')
      if (taslaklar.length > 1) {
        return sesYanit('Birden fazla bekleyen kayıt var. Ekrandaki kartlardan birini seçin, ya da tek kayıt bırakıp tekrar “Evet” deyin.')
      }
      oneriId = String(taslaklar[0].id)
    }

    const { data: oneri } = await supabase
      .from('eylem_onerileri')
      .select('id, doctor_id, hasta_id, eylem_anahtar, veri, eksik_alanlar, uyari_detay, durum')
      .eq('id', oneriId)
      .eq('doctor_id', user.id)
      .maybeSingle()
    if (!oneri || oneri.durum !== 'taslak') return sesYanit('Bu öneri artık geçerli değil.', {}, 404)
    if (!(await hastaSahibiMi(supabase, user.id, oneri.hasta_id))) return sesYanit('Hasta bulunamadı.', {}, 404)

    const eylem = eylemBul(String(oneri.eylem_anahtar))
    if (!eylem) return sesYanit('Bu eylem artık tanımlı değil.')

    const ciddi = sesCiddiUyariEngeli((oneri.uyari_detay as IlacUyarisi[] | null) || [])
    if (ciddi) return sesYanit(ciddi)

    const eksik = sesEksikAlanEngeli(eylem.zorunlu, (oneri.veri || {}) as Record<string, unknown>, eylem.alanlar)
    if (eksik) return sesYanit(eksik)

    const s = await eylemOnayla({
      supabase,
      doktorId: user.id,
      oneriId,
      brans,
      // Spoken Evet is the deliberate ack for voice; serious warnings already blocked above.
      uyariGoruldu: false,
    })
    if (!s.ok) return sesYanit(s.hata, { uyarilar: s.uyarilar ?? null }, s.durum)
    return sesYanit(`Kaydedildi Hocam — ${s.etiket}.`, {
      ok: true,
      kayitId: s.kayitId,
      etiket: s.etiket,
      ilgiliSekme: s.sonuc.ilgiliSekme ?? null,
    })
  }

  if (adim === 'vazgec') {
    let oneriId = String(body.oneriId || '').trim()
    const hastaId = String(body.hastaId || '').trim()
    if (!oneriId && hastaId) {
      if (!(await hastaSahibiMi(supabase, user.id, hastaId))) return sesYanit('Hasta bulunamadı.', {}, 404)
      const { data: taslaklar } = await supabase
        .from('eylem_onerileri')
        .select('id')
        .eq('doctor_id', user.id)
        .eq('hasta_id', hastaId)
        .eq('durum', 'taslak')
        .eq('yuzey', 'ses')
        .order('created_at', { ascending: false })
        .limit(1)
      oneriId = taslaklar?.[0] ? String(taslaklar[0].id) : ''
    }
    if (!oneriId) return sesYanit('Vazgeçilecek bekleyen kayıt yok.')
    const oldu = await eylemVazgec(supabase, user.id, oneriId)
    if (!oldu) return sesYanit('Öneri bulunamadı.', {}, 404)
    return sesYanit('Tamam, vazgeçtim — dosyaya hiçbir şey yazılmadı.', { ok: true })
  }

  return sesYanit('Geçersiz adım. hazirla, onayla veya vazgec bekleniyor.', {}, 400)
}
