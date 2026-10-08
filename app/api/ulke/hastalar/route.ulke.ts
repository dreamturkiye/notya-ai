/**
 * NOTYA-UZ-MUAYENE-01 — /api/ulke/hastalar: the caller's own patients.
 *
 *   GET  ?q=…   200 { hastalar: Hasta[] }          every patient of the caller, by name; `q` narrows the list
 *   POST        200 { hasta: Hasta }                creates a patient FOR THE CALLER
 *               400 { code: 'GECERSIZ', alan }      name missing, impossible birth date, unknown sex or language
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)   500 { code: 'BASARISIZ' }
 *
 * PATIENT ISOLATION: the doctor is the authenticated account and nothing else. The body cannot name a doctor —
 * only the fields below are read from it — and no patient id is accepted here at all.
 * Fields: name, patronymic (optional, its own field), birth date, sex, phone, the patient's own language, and an
 * optional national identity number that is stored as typed (not validated). No Turkish identity number.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, metinAlani } from '@/lib/ulke/uygulama/cevap'
import { hastaGirdisiHatasi, hastalariListele, hastaOlustur, type HastaGirdisi } from '@/lib/ulke/uygulama/hastalar'

export const dynamic = 'force-dynamic'

export const GET = sinirda('hastalar GET', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const q = String(req.nextUrl.searchParams.get('q') ?? '').slice(0, 120)
  const hastalar = await hastalariListele(oturum.supabase, oturum.user.id, q)
  if (!hastalar) return KOD.basarisiz()
  return cevap({ hastalar })
})

export const POST = sinirda('hastalar POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const cinsiyet = metinAlani(g.cinsiyet, 10)
  const girdi: HastaGirdisi = {
    ad: metinAlani(g.ad, 160).replace(/\s+/g, ' '),
    otaIsmi: metinAlani(g.otaIsmi, 120).replace(/\s+/g, ' '),
    dogumTarihi: metinAlani(g.dogumTarihi, 10),
    cinsiyet: cinsiyet as HastaGirdisi['cinsiyet'],
    telefon: metinAlani(g.telefon, 40),
    dil: metinAlani(g.dil, 3),
    ulusalKimlik: metinAlani(g.ulusalKimlik, 40),
  }
  const hatali = hastaGirdisiHatasi(girdi)
  if (hatali) return KOD.gecersiz(hatali)
  const hasta = await hastaOlustur(oturum.supabase, oturum.user.id, girdi)
  if (!hasta) return KOD.basarisiz()
  return cevap({ hasta })
})
