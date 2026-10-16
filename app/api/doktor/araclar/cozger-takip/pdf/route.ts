/**
 * NOTYA-COZGER-TAKIP-01 — ÇÖZGER sürecine yönlendirme/bilgilendirme notu (PDF). AİLEYE VERİLECEK bir
 * yönlendirme/bilgilendirme notudur; resmi ÇÖZGER raporu DEĞİLDİR (lib/doktor/cozgerTakip.ts
 * COZGER_UYARI_METNI — model.uyari alanında sabit basılır, aynı lib/doktor/raporPdfSablonu.tsx
 * uyarıKutu deseni).
 *
 * Aynı birleşik görsel standart + hekim/klinik bloğu (raporBelgesiModeliKur / raporDoktorBlogu /
 * raporBelgesiPdf) — paralel bir sistem başlatılmaz (brief).
 *
 * Vault'a YÜKLENMEZ: bu süreç belirli bir muayeneye (visitId) bağlı değildir — 6 eski SGK/Medula
 * rapor türü + sgk-rapor/pdf route'u ile AYNI, belgelenmiş kapsam sınırı (bkz. o rotanın başlık
 * yorumu); canlı üretilir, aşı karnesi PDF'i gibi.
 *
 * HASTA-IZOLASYON-01: hastaSahibiMi(doktorId, hastaId) → 404 before any read. Hasta ad/doğum tarihi
 * doğrudan şifreli patients satırından okunur, istemciden GELEN veri asla güvenilmez. Takip
 * kaydı (durum/kurum/heyet tarihi) de doctor_id+patient_id ile kapsanmış aynı sorgudan okunur.
 *
 * Branş kapısı: Çocuk Hasta Raporları ile AYNI gate (cocukHastaRaporuBransiMi).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { decrypt } from '@/lib/security/encryption'
import { cocukHastaRaporuBransiMi } from '@/lib/doktor/belgeTurleri'
import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'
import { COZGER_DURUMLARI, COZGER_UYARI_METNI, cozgerYonlendirmeNotuMetni, type CozgerDurum } from '@/lib/doktor/cozgerTakip'
import { raporDoktorBlogu } from '@/lib/doktor/raporDoktorBlogu'
import { raporBelgesiModeliKur, raporDosyaAdi } from '@/lib/doktor/raporBelgesi'
import { raporBelgesiPdf } from '@/lib/doktor/raporPdfSablonu'
import { raporBelgeNoUret } from '@/lib/doktor/raporBelgeNo'
import { contentDispositionAd } from '@/lib/vault/validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

type Govde = { hastaId?: string }

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id

  const brans = await hekimBransi(supabase, doktorId)
  if (!cocukHastaRaporuBransiMi(brans)) {
    return NextResponse.json({ error: 'Bu araç branşınızda kullanılamaz.' }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as Govde
  const hastaId = String(body.hastaId || '')
  if (!hastaId) return NextResponse.json({ error: 'hastaId zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const { data: hastaRow } = await supabase
    .from('patients')
    .select('name_encrypted, dob_encrypted, gender_encrypted')
    .eq('id', hastaId)
    .eq('doctor_id', doktorId)
    .maybeSingle()

  let adSoyad = 'Hasta'
  try {
    if (hastaRow?.name_encrypted) {
      const p = JSON.parse(decrypt(hastaRow.name_encrypted))
      adSoyad = `${p.ad || ''} ${p.soyad || ''}`.trim() || 'Hasta'
    }
  } catch { /* varsayılan kalır */ }
  let dogumTarihiIso: string | null = null
  try {
    if (hastaRow?.dob_encrypted) dogumTarihiIso = decrypt(hastaRow.dob_encrypted).slice(0, 10)
  } catch { dogumTarihiIso = null }
  let cinsiyetHam: string | null = null
  try {
    if (hastaRow?.gender_encrypted) cinsiyetHam = decrypt(hastaRow.gender_encrypted)
  } catch { cinsiyetHam = null }

  const { data: takip } = await supabase
    .from('cozger_takip')
    .select('durum, kurum_adi, heyet_tarihi')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .maybeSingle()

  const durum: CozgerDurum =
    takip?.durum && COZGER_DURUMLARI.some((d) => d.id === takip.durum) ? (takip.durum as CozgerDurum) : 'hazirlik'

  const notMetni = cozgerYonlendirmeNotuMetni(
    { adSoyad, dogumTarihiIso },
    { durum, kurumAdi: takip?.kurum_adi ?? null, heyetTarihi: takip?.heyet_tarihi ?? null }
  )

  const doktor = await raporDoktorBlogu(supabase, doktorId)
  const bugunIso = new Date().toISOString().slice(0, 10)
  const belgeNo = raporBelgeNoUret('COZGER', bugunIso)

  const model = raporBelgesiModeliKur({
    ustBaslik: 'ÇÖZGER Sürecine Yönlendirme Notu',
    altBaslik: 'Hasta Raporları — Çocuk Hasta Raporları',
    belgeNo,
    tarihIso: bugunIso,
    hasta: { adSoyad, dogumTarihiIso, cinsiyetHam },
    pediatrikYasBicimi: true,
    klinikBaslik: 'BİLGİLENDİRME',
    klinikMetin: notMetni,
    doktor,
    uyari: COZGER_UYARI_METNI,
    veliGorunsun: veliOnamGerekliMi(dogumTarihiIso),
  })

  let pdf: Buffer
  try {
    pdf = await raporBelgesiPdf(model)
  } catch (e) {
    console.error('[cozger-takip] pdf', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'PDF oluşturulamadı.' }, { status: 500 })
  }

  const dosyaAdi = raporDosyaAdi(model.ustBaslik, belgeNo)
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; ${contentDispositionAd(dosyaAdi)}`,
      'Cache-Control': 'private, no-store',
    },
  })
}
