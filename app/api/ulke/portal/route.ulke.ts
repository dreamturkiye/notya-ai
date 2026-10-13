/**
 * NOTYA-ULKE-PORTAL-01 — GET /api/ulke/portal: what the signed-in PATIENT sees.
 *
 *   200 { dil, hasta: { ad }, hekim: { ad, rol }, randevular: [{ gun, saat, sureDk }] | null, saatDilimi,
 *         ozetler: [{ id, gun, metin }], istek: { gunler, son } | null, bitis }
 *   401 { code: 'OTURUM_YOK' }   no portal session: none, ended, its link withdrawn, locked or ended, or the page is
 *                                open for ANOTHER link than the session's (the session is then closed) — and ALSO a
 *                                doctor's session, which is not a portal session and is not looked at
 *   404 { code: 'NOT_FOUND' }    the feature is off
 *
 * TAKES NO ID FROM THE REQUEST. The country, the doctor and the patient are those of the session's own row; every
 * read is bound to all three (lib/ulke/portal/icerik.ts). Never the clinical note; only what the doctor shared.
 * Private, never stored, never indexed (lib/ulke/portal/rotaYardimcisi.ts).
 */
import { NextRequest } from 'next/server'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { portalAcik, portalCereziniSil, portalCikis, portalOturum } from '@/lib/ulke/portal/giris'
import { PORTAL_CEREZI } from '@/lib/ulke/portal/sabitler'
import { portalIcerigi } from '@/lib/ulke/portal/icerik'
import { PORTAL_KOD, portalCevabi, portalSinirinda } from '@/lib/ulke/portal/rotaYardimcisi'

export const dynamic = 'force-dynamic'

export const GET = portalSinirinda('portal GET', async (req: NextRequest) => {
  if (!portalAcik()) return PORTAL_KOD.yok()
  const oturum = await portalOturum(req)
  const icerik = oturum ? await portalIcerigi(oturum) : null
  if (!icerik) {
    // A cookie that came with a request it has no page for is put away — in the database too, not only in the
    // browser. On a shared phone, opening a second patient's link ENDS the first patient's session; it is never
    // left open behind the new page. (Nothing happens for a value that is not a session's key.)
    await portalCikis(ulkeServisSupabase(), req.cookies.get(PORTAL_CEREZI)?.value)
    const res = PORTAL_KOD.oturumYok()
    portalCereziniSil(req, res)
    return res
  }
  return portalCevabi(icerik)
})
