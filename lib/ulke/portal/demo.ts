/**
 * ULKE-BRANS-DERINLIK-09 (Kaan, 2026-11-08) — THE PORTAL DEMO FIXTURE of a country build: what the patient page looks like
 * for the doctor's role, built from EXAMPLE DATA only (Türkiye has the same for its specialty portals: lib/portal/demoData.ts,
 * /portal/demo-*). The doctor opens it from the patient-access card ("preview the patient page") before giving a link.
 *
 * NO PATIENT AND NO DATABASE: the name and the summary are the pack's example words (`uygulama.portal.demo`), the chapter is
 * the role's own chapter (./bolum.ts) with two example follow-up days, the appointment is an example one. Nothing is read
 * from a request, nothing is stored, nothing is sent. `ornek: true` marks it so a screen can never confuse it with a real page.
 * Pure (the day is passed in).
 */
import { gunEkle } from '../araclar/yardimci'
import type { DilKodu, PortalDemoMetni } from '../tipler'
import { ozellikAcik, ulkePaketi } from '../ulke'
import { portalBolumu } from './bolum'
import type { PortalIcerigi } from './tipler'

/** The pack's demo words for a form, or null (then the preview is not offered). */
export function portalDemoMetni(dil: DilKodu): PortalDemoMetni | null {
  return ulkePaketi().uygulama?.portal?.demo?.[dil] ?? null
}

/** The example page for `rol` in `dil`. null = the pack brings no demo words for that form. */
export function portalDemoIcerigi(g: { rol: string | null; dil: DilKodu; hekimAdi: string; rolAdi: string; bugun: string }): PortalIcerigi | null {
  const m = portalDemoMetni(g.dil)
  if (!m) return null
  const bolum = portalBolumu(g.rol, g.bugun, [gunEkle(g.bugun, 3), gunEkle(g.bugun, 30)], g.dil)
  return {
    dil: g.dil,
    ornek: true,
    hasta: { ad: m.hastaAdi },
    hekim: { ad: g.hekimAdi, rol: g.rolAdi },
    ...(bolum ? { bolum } : {}),
    randevular: ozellikAcik('randevu') ? [{ gun: gunEkle(g.bugun, 7), saat: '10:00', sureDk: 20 }] : null,
    saatDilimi: null,
    ozetler: [{ id: 'ornek', gun: gunEkle(g.bugun, -7), metin: m.ozet }],
    istek: null,
    bitis: `${gunEkle(g.bugun, 1)}T00:00:00.000Z`,
  }
}
