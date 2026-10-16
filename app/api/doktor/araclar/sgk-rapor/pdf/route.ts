/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — PDF indir / yazdır for the 6 existing Hasta Raporları
 * types (İş Göremezlik, İlaç Kullanım, Tıbbi Malzeme, Tek Hekim Durum, Sağlık Kurulu,
 * Muayenehane İstirahat Belgesi). Brings them onto the SAME unified visual standard and
 * the SAME doctor-profile pull as the 4 new Çocuk Hasta Raporları
 * (lib/doktor/raporPdfSablonu.tsx + lib/doktor/raporDoktorBlogu.ts) — no second system.
 *
 * Does not call the model again: the client already generated the draft via POST
 * /api/doktor/araclar/sgk-rapor and sends it back here unchanged. This route only
 * re-verifies ownership and re-reads the patient/doctor identity fields from the
 * database itself — it never trusts the client's hastaAdi/hekim copy for what goes on
 * the PDF.
 *
 * Not vault-stored (unlike the Çocuk Hasta Raporları): these 6 report types are not tied
 * to one encounter in the product today (the generator takes only hastaId, no visitId —
 * see app/api/doktor/araclar/sgk-rapor/route.ts), so there is no single encounter id to
 * link a stored PDF to yet. Live-generated, same as the existing aşı karnesi PDF route
 * (app/api/doktor/asilar/karne/pdf/route.ts) — a known scope boundary, not an oversight.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { decrypt } from '@/lib/security/encryption'
import {
  resolveRaporTipi,
  sgkRaporMetniBirlesik,
  sgkRaporUyariMetni,
  type SgkRaporDraft,
} from '@/lib/sgk/raporTipleri'
import { raporDoktorBlogu } from '@/lib/doktor/raporDoktorBlogu'
import { raporBelgesiModeliKur, raporDosyaAdi } from '@/lib/doktor/raporBelgesi'
import { raporBelgesiPdf } from '@/lib/doktor/raporPdfSablonu'
import { raporBelgeNoUret } from '@/lib/doktor/raporBelgeNo'
import { contentDispositionAd } from '@/lib/vault/validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

type Govde = { hastaId?: string; raporTipiId?: string; raporTipi?: string; rapor?: SgkRaporDraft; sure?: number }

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id

  const body = (await req.json().catch(() => ({}))) as Govde
  const hastaId = String(body.hastaId || '')
  const rapor = body.rapor
  if (!hastaId || !rapor) {
    return NextResponse.json({ error: 'hastaId ve rapor zorunludur.' }, { status: 400 })
  }
  if (!(await hastaSahibiMi(supabase, doktorId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const tip = resolveRaporTipi(String(body.raporTipi || body.raporTipiId || ''))
  const sure = Number(rapor.istirahat_suresi_gun ?? rapor.onerilen_sure_ay ?? body.sure) || 0

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

  const doktor = await raporDoktorBlogu(supabase, doktorId)
  const belgeNo = raporBelgeNoUret(tip.id, null)
  const klinikMetin = sgkRaporMetniBirlesik(tip, rapor, sure)
  const uyari = sgkRaporUyariMetni(tip, Boolean(doktor.diplomaTescilNo))

  const model = raporBelgesiModeliKur({
    ustBaslik: rapor.raporBasligi || tip.label,
    altBaslik: tip.kanal === 'sgk_medula' ? 'SGK / Medula rapor taslağı — canlı gönderim değildir' : 'Özel muayenehane klinik belge taslağı',
    belgeNo: tip.kanal === 'sgk_medula' ? 'Medula tarafından atanır' : belgeNo,
    // NOTYA-PROTOKOL-NO-01: null — these 6 report types are NOT tied to one muayene in the
    // product's data model today (see this route's header comment, a documented pre-existing
    // scope boundary, not new). Renders '—'; nothing is invented.
    protokolNo: null,
    hasta: { adSoyad, dogumTarihiIso, cinsiyetHam },
    pediatrikYasBicimi: false,
    klinikBaslik: 'KLİNİK / RAPOR İÇERİĞİ',
    klinikMetin: klinikMetin || '—',
    doktor,
    uyari,
    veliGorunsun: false,
  })

  let pdf: Buffer
  try {
    pdf = await raporBelgesiPdf(model)
  } catch (e) {
    console.error('[sgk-rapor] pdf', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'PDF oluşturulamadı.' }, { status: 500 })
  }
  const dosyaAdi = raporDosyaAdi(tip.label, tip.kanal === 'sgk_medula' ? belgeNo : belgeNo)
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; ${contentDispositionAd(dosyaAdi)}`,
      'Cache-Control': 'private, no-store',
    },
  })
}
