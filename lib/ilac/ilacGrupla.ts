/**
 * NOTYA-ILAC-05 — search results grouped by brand (moved out of app/api/doktor/ilac-ara/route.ts so the grouping
 * can be tested without the route).
 *
 * Results are GROUPED BY BRAND rather than returned flat. SGK lists every pack separately, so a
 * flat search for "largopen" returns five identical-looking rows (1 GR 16 TB, 125 MG/5 ML SUSP,
 * 200 MG kuru toz, 250 MG/5 ML SUSP, 500 MG 16 TB). A doctor picking from that list cannot tell
 * them apart at a glance and has no reason to prefer one. Grouping gives the real workflow:
 * choose the drug, then choose the presentation — which is also how e-reçete works, where the
 * chosen product's BARCODE is what enters the system.
 *
 * NOTYA-SUT-RAPOR-01i (2026-10-10): reimbursement is a property of the PACK, like the ingredient and the licence
 * suspension. The catalogue now keeps products that are passive on SGK's list or no longer on it, marked
 * `sgk: false` (SUT 4.1.9(1): a product not on EK-4/A is not paid under any condition. Source: SGK güncel SUT,
 * 02.10.2026 (RG 33388) işlenmiş hali). A brand is shown as paid when at least one of its packs is; each pack that
 * is not paid carries `sgk: false` so the picker can say so at the moment of choice.
 */
import type { IlacKaydi } from './ilacArama'

export interface SunumSecenegi {
  ad: string
  barkod: string
  esdegerGrubu?: string
  /**
   * NOTYA-ILAC-07: the ingredient belongs to the PACK, not the brand. Brands are not molecules:
   * A-FERİN sells a parasetamol + klorfeniramin pack and a parasetamol + klorfeniramin + kodein
   * pack under the same name. Recording the group-level ingredient for the codeine pack would put
   * the wrong molecule in the patient's record and blind the interaction check to an opioid.
   * Absent when the catalogue has no ingredient for the pack yet (new on the SGK list).
   */
  etkenMadde?: string
  atc?: string
  /**
   * NOTYA-ILAC-09: TİTCK licence suspension code (1 = madde-23, 3 = madde-22). 62 SGK-reimbursed
   * products carry it — including fentanyl (ABSTRAL) and common OTC brands (ACTIFED). The flag
   * has been in the data since NOTYA-ILAC-07 but was never surfaced, so a doctor could pick a
   * suspended product with no indication anything was wrong. Suspension is per PACK (per barcode),
   * like the ingredient — it travels on the sunum, not the brand.
   */
  ruhsatAskida?: number
  /** false = SGK does not pay for THIS pack (passive on EK-4/A, or no longer on it). Absent when it is paid. */
  sgk?: false
  sgkDurum?: 'pasif' | 'cikarildi'
}
export interface GruplanmisIlac {
  marka: string
  etkenMadde?: string
  /** true when at least one pack of the brand is paid by SGK. */
  sgk: boolean
  /** NOTYA-ILAC-09: true only when EVERY pack of the brand is suspended — a partial suspension
   * badge on the brand row would wrongly taint the packs that are still licensed. */
  ruhsatAskida?: boolean
  sunumlar: SunumSecenegi[]
}

export function ilaclariGrupla(kayitlar: IlacKaydi[]): GruplanmisIlac[] {
  const gruplar = new Map<string, GruplanmisIlac>()
  for (const k of kayitlar) {
    const anahtar = (k.marka || k.ad).toLocaleUpperCase('tr')
    let g = gruplar.get(anahtar)
    if (!g) {
      g = { marka: k.marka || k.ad, etkenMadde: k.etkenMadde, sgk: false, sunumlar: [] }
      gruplar.set(anahtar, g)
    }
    // The group carries the first pack's ingredient for display; a pack without one does not blank it.
    if (!g.etkenMadde && k.etkenMadde) g.etkenMadde = k.etkenMadde
    if (!g.sunumlar.some((s) => s.barkod === k.barkod)) {
      const odenmiyor = k.sgk === false
      g.sunumlar.push({
        ad: k.ad, barkod: k.barkod || '', esdegerGrubu: k.esdegerGrubu, etkenMadde: k.etkenMadde, atc: k.atc, ruhsatAskida: k.ruhsatAskida,
        ...(odenmiyor ? { sgk: false as const, sgkDurum: k.sgkDurum } : {}),
      })
      if (!odenmiyor) g.sgk = true
    }
  }
  return [...gruplar.values()].map((g) => ({
    ...g,
    ruhsatAskida: g.sunumlar.length > 0 && g.sunumlar.every((s) => !!s.ruhsatAskida),
    // Paid packs first, then by name: the pack SGK does not pay for is never the first thing offered.
    sunumlar: g.sunumlar.sort((a, b) => Number(a.sgk === false) - Number(b.sgk === false) || a.ad.localeCompare(b.ad, 'tr')),
  }))
}
