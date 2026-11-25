/**
 * HASTA-ALANI-MARKA — the preview a messaging app shows for a patient's Sağlığım link: the doctor's mark (logo → photo →
 * monogram), his / the clinic's name, branş · clinic, "Sağlığım". Never the patient's name, never a Notya mark.
 */
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { portalMarkaKaydi } from '@/lib/portal/markaSunucu'
import { BILINMEYEN_MARKA } from '@/lib/portal/marka'
import { cizilebilirDataUrl, markaGorselBaytlari, markaOgCiz } from '@/lib/portal/markaCizim'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const alt = 'Doktorunuzun hasta alanı — Sağlığım'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { token: string } }) {
  const k = await portalMarkaKaydi(params.token)
  if (!k) return markaOgCiz(BILINMEYEN_MARKA, null)
  const dataUrl = cizilebilirDataUrl(await markaGorselBaytlari(servisSupabase(), k.doctorId, k.marka).catch(() => null))
  return markaOgCiz(k.marka, dataUrl)
}
