/**
 * ACIL-TIP-KDIGO-AKI-01 — akut böbrek hasarı (AKI) EVRELEMESİ, ayrı kaynaktan, CKD aracıyla karıştırılmadan.
 *
 * Why acil tıp gets this tool (sourced, not assumed): KDIGO AKI staging is the standard definition/severity tool
 * for acute kidney injury presenting to or developing in the emergency department — confirmed this session
 * (2026-10-13) across secondary clinical references (Merck Manuals "Staging Criteria for Acute Kidney Injury
 * (KDIGO 2012)"; emergency.unboundmedicine.com "Kidney Injury, Acute") that all reproduce the same KDIGO 2012
 * staging table for ED/acute-care use. This is NOT the CKD eGFR/ACR tool (`kbh-risk-kategorisi` / this chapter's
 * sibling files in endokrinoloji/kardiyoloji) — AKI uses a DIFFERENT KDIGO guideline (2012, acute) with DIFFERENT
 * criteria (serum creatinine rise + urine output, not eGFR category × albuminuria category). The two are never
 * conflated here.
 *
 * `dahiliye/engines/ckd.ts` and `nefroloji/engines/egfr.ts` carry the (separately flagged) CKD tool with KDIGO's
 * own colour legend; this file is unrelated to both — a fresh AKI tool, no colour at all (the AKI staging table
 * itself has no colour legend in the guideline, so there is nothing to avoid reproducing there — plain stage
 * numbers only, same restraint as the CKD tools' redesign).
 *
 * OPEN FACTS REPRODUCED (read as TEXT from the primary guideline, opened this session, 2026-10-13):
 *   [KDIGO-AKI-2012] Table 2, p. 19 (also p. 8, Summary of Recommendations):
 *     Stage 1: SCr 1.5–1.9× baseline, OR ≥0.3 mg/dL (≥26.5 µmol/L) increase · UO <0.5 mL/kg/h for 6–12h
 *     Stage 2: SCr 2.0–2.9× baseline · UO <0.5 mL/kg/h for ≥12h
 *     Stage 3: SCr ≥3.0× baseline, OR increase to ≥4.0 mg/dL (≥353.6 µmol/L), OR initiation of RRT
 *              (the guideline's <18y eGFR<35 sub-criterion is NOT reproduced here — this tool is adult-only, see
 *              `yas` guard below) · UO <0.3 mL/kg/h for ≥24h, or anuria for ≥12h
 *   [KDIGO-AKI-2012] p. 21, body text: "patients should be staged according to the criteria that give them the
 *     highest stage" — when the creatinine-based stage and the urine-output-based stage differ, THE WORSE (higher)
 *     ONE is used. Reproduced as `akiEvreDegerlendir`'s combine step below.
 * NOT reproduced: any colour, chart or figure — the 2012 guideline's AKI table is plain text/numbers already.
 *
 * Standing kilitler (same as the rest of this chapter): tanı kilidi hekimde; Notya doz/sıvı resüsitasyon önerisi
 * üretmez; bu evre bir karar desteğidir, laboratuvar/klinik değerlendirmenin kendisi değildir.
 *
 * PEDIATRI DIŞI: this tool assumes an adult patient. KDIGO's own paediatric AKI sub-criterion (eGFR <35 for
 * Stage 3 in patients <18y) uses an age-based equation this tool does not implement — `yas` below guards against
 * silently applying the adult creatinine-fold-rise criteria to a child.
 *
 * NOT ADDED to `lib/doktor/doktorAraclari.ts` (the Doktor Araçları tile catalog) by this change — off for every
 * doctor until a clinician reviews and signs off the tile copy and visibility, same ship pattern as
 * `lib/ulke/araclar/tanimlar/kbhRiskKategorisi.ts` (country-pack kit, same day): engine + tests land first,
 * pending review, no route/tile wiring yet.
 *
 * SOURCES, opened this session (2026-10-13):
 *   [KDIGO-AKI-2012] KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int. Suppl. 2012;2:19-36 —
 *     https://confluence.cornell.edu/download/attachments/344131056/KDIGO%20Guidelines%202012.pdf (mirror of the
 *     primary guideline; Table 2, p. 19, and the worse-stage rule, p. 21, read directly).
 *   Cross-check (secondary, same numbers): https://www.merckmanuals.com/professional/multimedia/table/staging-criteria-for-acute-kidney-injury-kdigo-2012
 *     and https://ebm.one/en/node/2147 ("Table 11.1-1").
 */
import type { Dipnot } from './acilTip'

export const AKI_EVRELERI = ['evre1', 'evre2', 'evre3'] as const
export type AkiEvresi = (typeof AKI_EVRELERI)[number]

export interface AkiGirdi {
  /** Hasta yaşı (yıl). 18 altı için bu araç kullanılmaz (bkz. dosya başlığı). */
  yas: number | null
  /** Güncel serum kreatinin, mg/dL. */
  krea: number | null
  /** Bazal (bilinen en iyi / son stabil) serum kreatinin, mg/dL. */
  kreaBazal: number | null
  /** Son 48 saatte mutlak kreatinin artışı, mg/dL (bazal bilinmese de Evre 1 tetikleyebilir). */
  kreaArtis48Saat: number | null
  /** İdrar çıkışı, mL/kg/saat (ortalama, aşağıdaki süre boyunca). */
  idrarMlKgSaat: number | null
  /** idrarMlKgSaat'in gözlendiği süre, saat. */
  idrarSuresiSaat: number | null
  /** Anüri süresi, saat (ayrı, daha katı bir Evre 3 ölçütü). */
  anuriSuresiSaat: number | null
  /** Renal replasman tedavisi (diyaliz) başlandı mı — tek başına Evre 3. */
  rrtBaslandi: boolean
}

export interface AkiSonuc {
  tamamMi: boolean
  evre: AkiEvresi | null
  kreaEvre: AkiEvresi | null
  idrarEvre: AkiEvresi | null
  ozet: string
  uyarilar: string[]
  dipnot: Dipnot
}

const DIPNOT: Dipnot = {
  ref: 'KDIGO_2012_AKI',
  not: 'KDIGO 2012 AKI evrelemesi (kreatinin + idrar çıkışı, en kötü evre esas) — karar desteğidir; tanı ve tedavi (sıvı, RRT) kararı hekimindir',
}

function kreaEvresi(g: AkiGirdi): AkiEvresi | null {
  if (g.rrtBaslandi) return 'evre3'
  if (g.krea != null && g.krea >= 4.0 && g.kreaArtis48Saat != null && g.kreaArtis48Saat > 0) return 'evre3'
  if (g.krea != null && g.kreaBazal != null && g.kreaBazal > 0) {
    const oran = g.krea / g.kreaBazal
    if (oran >= 3.0) return 'evre3'
    if (oran >= 2.0) return 'evre2'
    if (oran >= 1.5) return 'evre1'
  }
  if (g.kreaArtis48Saat != null && g.kreaArtis48Saat >= 0.3) return 'evre1'
  return null
}

function idrarEvresi(g: AkiGirdi): AkiEvresi | null {
  if (g.anuriSuresiSaat != null && g.anuriSuresiSaat >= 12) return 'evre3'
  if (g.idrarMlKgSaat == null || g.idrarSuresiSaat == null) return null
  if (g.idrarMlKgSaat < 0.3 && g.idrarSuresiSaat >= 24) return 'evre3'
  if (g.idrarMlKgSaat < 0.5 && g.idrarSuresiSaat >= 12) return 'evre2'
  if (g.idrarMlKgSaat < 0.5 && g.idrarSuresiSaat >= 6) return 'evre1'
  return null
}

const EVRE_SIRA: Record<AkiEvresi, number> = { evre1: 1, evre2: 2, evre3: 3 }

function enKotu(a: AkiEvresi | null, b: AkiEvresi | null): AkiEvresi | null {
  if (!a) return b
  if (!b) return a
  return EVRE_SIRA[a] >= EVRE_SIRA[b] ? a : b
}

/**
 * Yetişkin hasta. Kreatinin VE idrar çıkışı ölçütleri ayrı hesaplanır; KDIGO'nun kendi kuralı ("the criteria that
 * give them the highest stage", [KDIGO-AKI-2012] s.21) uygulanır — ikisi farklı evre verirse DAHA KÖTÜ olan esas.
 */
export function akiEvreDegerlendir(g: AkiGirdi): AkiSonuc {
  const uyarilar: string[] = []
  if (g.yas != null && g.yas < 18) {
    return {
      tamamMi: false, evre: null, kreaEvre: null, idrarEvre: null,
      ozet: 'Bu araç yetişkin hasta için tasarlandı — 18 yaş altında KDIGO pediatrik ölçütleri (farklı eGFR eşiği) gerekir, burada uygulanmaz',
      uyarilar: ['pediatrik_disi'], dipnot: DIPNOT,
    }
  }
  const kreaEvre = kreaEvresi(g)
  const idrarEvre = idrarEvresi(g)
  const evre = enKotu(kreaEvre, idrarEvre)
  if (!evre) {
    if (g.krea == null && g.idrarMlKgSaat == null && !g.rrtBaslandi) {
      return { tamamMi: false, evre: null, kreaEvre: null, idrarEvre: null, ozet: 'Kreatinin veya idrar çıkışı verisi yok — evre verilmez', uyarilar: ['veri_yok'], dipnot: DIPNOT }
    }
    return { tamamMi: true, evre: null, kreaEvre: null, idrarEvre: null, ozet: 'Girilen değerlerle KDIGO AKI evre eşiği karşılanmıyor', uyarilar: [], dipnot: DIPNOT }
  }
  if (kreaEvre && idrarEvre && kreaEvre !== idrarEvre) uyarilar.push('kreatinin_idrar_farkli_evre')
  return {
    tamamMi: true,
    evre,
    kreaEvre,
    idrarEvre,
    ozet: `KDIGO AKI ${evre} (kreatinin: ${kreaEvre ?? '—'} · idrar: ${idrarEvre ?? '—'} · en kötü esas). Karar desteğidir; sıvı/RRT kararı hekimindir.`,
    uyarilar,
    dipnot: DIPNOT,
  }
}
