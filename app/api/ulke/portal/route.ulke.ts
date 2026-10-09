/**
 * NOTYA-ULKE-PORTAL-01 — GET /api/ulke/portal: what the signed-in PATIENT sees.
 *
 *   200 { dil, hasta: { ad }, hekim: { ad, rol }, randevular: [{ gun, saat, sureDk }] | null, saatDilimi,
 *         ozetler: [{ id, gun, metin }], istek: { gunler, son } | null, bitis }
 *   401 { code: 'OTURUM_YOK' }   no portal session: none, ended, its link withdrawn, locked or ended — and ALSO a
 *                                doctor's session, which is not a portal session and is not looked at
 *   404 { code: 'NOT_FOUND' }    the feature is off
 *
 * TAKES NO ID FROM THE REQUEST. The country, the doctor and the patient are those of the session's own row; every
 * read is bound to all three (lib/ulke/portal/icerik.ts). Never the clinical note; only what the doctor shared.
 * Private, never stored, never indexed (lib/ulke/portal/rotaYardimcisi.ts).
 */
import { NextRequest } from 'next/server'
import { portalAcik, portalCereziniSil, portalOturum } from '@/lib/ulke/portal/giris'
import { portalIcerigi } from '@/lib/ulke/portal/icerik'
import { PORTAL_KOD, portalCevabi, portalSinirinda } from '@/lib/ulke/portal/rotaYardimcisi'

export const dynamic = 'force-dynamic'

export const GET = portalSinirinda('portal GET', async (req: NextRequest) => {
  if (!portalAcik()) return PORTAL_KOD.yok()
  const oturum = await portalOturum(req)
  const icerik = oturum ? await portalIcerigi(oturum) : null
  if (!icerik) {
    const res = PORTAL_KOD.oturumYok()
    portalCereziniSil(req, res)
    return res
  }
  return portalCevabi(icerik)
})
