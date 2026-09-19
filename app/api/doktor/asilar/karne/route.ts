/**
 * ASI-KARNESI-01 — aşı karnesi okuma + hekim toplu onayı.
 *
 * Karne dosyası MEVCUT Kasa yolundan yüklenir (POST /api/doktor/documents, category 'Aşı karnesi' — şifreli
 * medical_documents). Bu rota yeni bir saklama yolu açmaz; yalnız Kasa'daki belgeyi okur.
 *
 * POST { adim: 'oku', belgeId }
 *   → Kasa belgesi (hekime kapsanmış) modele gider: görev 'goruntu-inceleme' (GÜÇLÜ — lib/ai/modeller.ts; görsel
 *     olduğu için cagir.ts de yükseltir). Dönen satırlar TASLAKTIR: `asilar`a HİÇBİR ŞEY yazılmaz.
 * POST { adim: 'onayla', belgeId, hekimOnayi: true, satirlar: [{ asiAdi, dozNo, uygulamaTarihi, okunamadi?, hekimDuzeltti? }] }
 *   → yalnız hekim (sekreter değil), yalnız açık onayla; hekimin düzelttiği değerler aynen, kaynak='beyan',
 *     belge_id + hekim_onay_at kanıt iziyle yazılır. Kural ihlalinde hiçbir satır yazılmaz.
 *
 * HASTA-IZOLASYON-01: dışarıdan gelen tek kimlik belgeId — getDocumentMeta onu doktor_id ile çözer; hasta kimliği
 * belgeden türetilir ve hastaSahibiMi ile yeniden doğrulanır.
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { getDocumentMeta, downloadDocument } from '@/lib/vault/service'
import { decrypt } from '@/lib/security/encryption'
import { aiCagir, yanitMetni } from '@/lib/ai/cagir'
import { aiKotaKullan, KOTA_MESAJI } from '@/lib/doktor/hizLimiti'
import {
  KARNE_SISTEM, KARNE_KULLANICI_METNI, KARNE_NOT_ONEKI, KarneOkumaHatasi,
  karneYanitiniCoz, karneKimlikUyarisi, takvimEslestir, onaySatirlariniDogrula, karneKategorisi,
} from '@/lib/asi/karneOkuma'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const GORSEL_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  // Karne okuma ve onayı klinik karardır — sekreter yükleyebilir (Kasa) ama okutup onaylayamaz.
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { supabase, doktorId } = oturum

  const body = (await req.json().catch(() => null)) as { adim?: string; belgeId?: string; hekimOnayi?: unknown; satirlar?: unknown } | null
  if (!body?.adim || !body.belgeId) return NextResponse.json({ error: 'adim ve belgeId zorunludur.' }, { status: 400 })

  let meta
  try { meta = await getDocumentMeta({ supabase }, doktorId, String(body.belgeId)) } catch { return NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 }) }
  if (!(await hastaSahibiMi(supabase, doktorId, meta.patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const { data: hasta } = await supabase.from('patients').select('dob_encrypted').eq('id', meta.patientId).eq('doctor_id', doktorId).maybeSingle()
  let dogumIso: string | null = null
  try { dogumIso = hasta?.dob_encrypted ? decrypt(String(hasta.dob_encrypted)).slice(0, 10) : null } catch { dogumIso = null }
  if (dogumIso && !/^\d{4}-\d{2}-\d{2}$/.test(dogumIso)) dogumIso = null
  const bugunIso = bugunTr()

  if (body.adim === 'oku') {
    const pdfMi = meta.fileType === 'application/pdf'
    if (!pdfMi && !GORSEL_MIME.includes(meta.fileType)) return NextResponse.json({ error: 'Karne fotoğraf (JPEG/PNG/WebP) ya da PDF olmalı.' }, { status: 400 })
    const kota = await aiKotaKullan(supabase, doktorId, 'konsult')
    if (!kota.izin) return NextResponse.json({ error: KOTA_MESAJI }, { status: 429 })

    let bytes: Buffer
    try { ({ bytes } = await downloadDocument({ supabase }, doktorId, meta.id)) } catch { return NextResponse.json({ error: 'Belge açılamadı.' }, { status: 404 }) }
    const blok = pdfMi
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: bytes.toString('base64') } }
      : { type: 'image', source: { type: 'base64', media_type: meta.fileType, data: bytes.toString('base64') } }

    let sonuc
    try {
      // NOTYA-MALIYET-01: görüntü/belge okuma — istisnasız GÜÇLÜ ('goruntu-inceleme'). HIZLI'ya alınmaz.
      const y = await aiCagir({
        istemci: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
        gorev: 'goruntu-inceleme',
        system: [{ metin: KARNE_SISTEM, onbellek: true }],
        messages: [{ role: 'user', content: [blok, { type: 'text', text: KARNE_KULLANICI_METNI }] }],
        temperature: 0,
        doctorId: doktorId,
      })
      // ASI-KARNESI-FIX: yanit token tavaninda kesildiyse bunu SESSIZCE "okunamadi"ya dusurme —
      // sebebi farkli (karne okunmadi degil, cevap sigmadi) ve hekime verilecek tavsiye de farkli.
      const kesildi = (y as { stopReason?: string | null })?.stopReason === 'max_tokens'
      if (kesildi) {
        console.error('[asi-karnesi] yanit token tavaninda kesildi (goruntu inceleme gorevi)')
        return NextResponse.json(
          { error: 'Karne çok uzun geldi ve okuma yarıda kesildi. Karneyi iki parça hâlinde (ör. sol/sağ sayfa) ayrı ayrı yükleyin ya da aşıları elle girin.' },
          { status: 422 },
        )
      }
      sonuc = karneYanitiniCoz(yanitMetni(y as { content?: unknown }, '\n'), { bugunIso, dogumIso })
    } catch (e) {
      // 422 yolunda hicbir sey loglanmiyordu — nedeni gormeden teshis edilemiyordu.
      if (e instanceof KarneOkumaHatasi) {
        console.error('[asi-karnesi] yanit ayristirilamadi (JSON bozuk/eksik)')
        return NextResponse.json({ error: 'Karne okunamadı. Daha net bir fotoğrafla yeniden deneyin ya da aşıları elle girin.' }, { status: 422 })
      }
      console.error('[asi-karnesi] okuma', e instanceof Error ? e.message : e)
      return NextResponse.json({ error: 'Karne şu an okunamadı. Birazdan yeniden deneyin ya da aşıları elle girin.' }, { status: 502 })
    }

    return NextResponse.json({
      belgeId: meta.id,
      taslak: true,
      okunabilirlik: sonuc.okunabilirlik,
      asiKarnesiMi: sonuc.asiKarnesiMi,
      not: sonuc.not,
      kimlikUyarisi: karneKimlikUyarisi(sonuc.karneDogumTarihi, dogumIso),
      satirlar: sonuc.satirlar.map((s) => ({ ...s, eslesme: takvimEslestir(s.asiAdi) })),
    })
  }

  if (body.adim === 'onayla') {
    // Hiçbir satır onaysız kaydedilmez — istemci atlasa da sunucu açık hekim onayı ister.
    if (body.hekimOnayi !== true) return NextResponse.json({ error: 'Hekim onayı olmadan karne satırı kaydedilmez.' }, { status: 400 })
    const d = onaySatirlariniDogrula(body.satirlar, { bugunIso, dogumIso })
    if ('hata' in d) return NextResponse.json({ error: d.hata }, { status: 400 })

    const onayAt = new Date().toISOString()
    const satirlar = d.satirlar.map((s) => ({
      doktor_id: doktorId,
      patient_id: meta.patientId,
      asi_adi: s.asiAdi,
      doz_no: s.dozNo,
      kategori: karneKategorisi(dogumIso, s.uygulamaTarihi, bugunIso, s.asiAdi),
      uygulama_tarihi: s.uygulamaTarihi,
      kaynak: 'beyan',
      notlar: KARNE_NOT_ONEKI,
      belge_id: meta.id,
      hekim_onay_at: onayAt,
    }))
    let { data, error } = await supabase.from('asilar').insert(satirlar).select()
    // 084 migration henüz uygulanmamış ortam: kanıt izi notlar önekinde kalır (asiKaynakTuru onu da okur).
    if (error && /belge_id|hekim_onay_at|column/i.test(String(error.message || ''))) {
      ;({ data, error } = await supabase.from('asilar').insert(satirlar.map(({ belge_id: _b, hekim_onay_at: _h, ...r }) => r)).select())
    }
    if (error) return NextResponse.json({ error: 'Aşı kayıtları kaydedilemedi.' }, { status: 500 })
    return NextResponse.json({ kaydedilen: (data || []).length, asilar: data || [] })
  }

  return NextResponse.json({ error: 'Geçersiz adım.' }, { status: 400 })
}
