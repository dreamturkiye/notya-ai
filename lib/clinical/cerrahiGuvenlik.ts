/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — SURGICAL SAFETY, CORE FOR EVERY SURGICAL BRANCH: the WHO Surgical Safety Checklist,
 * the Caprini VTE risk score with its prophylaxis plan, and the ASA physical status. Pure, client-safe, country-neutral:
 * KEYS AND NUMBERS ONLY, never a sentence. The Türkiye build and every country pack write their own words and name their
 * own national guidance beside these (the same file is byte-identical on main and on every release branch).
 *
 * Published sources of what is computed here (each checked 2026-11-05; see docs/OPEN-COMMITMENTS.md KD-OPERATOR-01):
 *   WHO checklist   World Health Organization, Surgical Safety Checklist (first edition, 2009): Sign In / Time Out /
 *                   Sign Out. The items below are its items, keyed; the wording is each build's own.
 *   Caprini         Caprini JA. Thrombosis risk assessment as a guide to quality patient care. Dis Mon 2005;51:70-78
 *                   (the 2005 risk factor list and points). Risk groups and prophylaxis by group: Gould MK et al.
 *                   Prevention of VTE in nonorthopedic surgical patients. CHEST 2012;141(2 Suppl):e227S-e277S
 *                   (0 very low: early ambulation; 1-2 low: mechanical, preferably IPC; 3-4 moderate: LMWH or low-dose
 *                   heparin, mechanical if bleeding risk is high; 5 or more high: pharmacological plus mechanical;
 *                   abdominal or pelvic cancer surgery at high risk: extended 4-week LMWH).
 *   ASA             American Society of Anesthesiologists, ASA Physical Status Classification System (2020 amendment):
 *                   classes I to VI and the "E" (emergency) modifier.
 */

// ───────────────────────── WHO Surgical Safety Checklist ─────────────────────────

export const SSC_ASAMALARI = ['giris', 'mola', 'cikis'] as const
export type SscAsamasi = (typeof SSC_ASAMALARI)[number]

/** Item keys per phase, in the order of the WHO checklist. `na` = the item may be answered "not applicable". */
export const SSC_MADDELERI: Readonly<Record<SscAsamasi, readonly { anahtar: string; na?: boolean }[]>> = {
  // Sign In — before induction of anaesthesia
  giris: [
    { anahtar: 'kimlik_bolge_islem_onam' }, // patient has confirmed identity, site, procedure and consent
    { anahtar: 'bolge_isaretlendi', na: true }, // site marked / not applicable
    { anahtar: 'anestezi_kontrolu' }, // anaesthesia machine and medication check complete
    { anahtar: 'pulse_oksimetre' }, // pulse oximeter on the patient and functioning
    { anahtar: 'alerji_soruldu' }, // known allergy asked and recorded
    { anahtar: 'zor_hava_yolu_hazirlik', na: true }, // difficult airway / aspiration risk: equipment and assistance available
    { anahtar: 'kan_kaybi_hazirlik', na: true }, // risk of >500 mL blood loss (7 mL/kg in children): access and fluids planned
  ],
  // Time Out — before skin incision
  mola: [
    { anahtar: 'ekip_tanitildi' }, // all team members introduced by name and role
    { anahtar: 'hasta_islem_kesi_teyit' }, // patient name, procedure and incision site confirmed
    { anahtar: 'antibiyotik_60dk', na: true }, // antibiotic prophylaxis given within the last 60 minutes
    { anahtar: 'cerrah_kritik_adimlar' }, // surgeon: critical or non-routine steps, duration, anticipated blood loss
    { anahtar: 'anestezi_hasta_endiseleri' }, // anaesthesia team: patient-specific concerns
    { anahtar: 'hemsire_sterilite_ekipman' }, // nursing team: sterility confirmed, equipment issues or concerns
    { anahtar: 'goruntuleme_gosteriliyor', na: true }, // essential imaging displayed
  ],
  // Sign Out — before the patient leaves the operating room
  cikis: [
    { anahtar: 'islem_adi_kaydedildi' }, // name of the procedure recorded
    { anahtar: 'sayim_dogru', na: true }, // instrument, sponge and needle counts correct
    { anahtar: 'numune_etiketlendi', na: true }, // specimen labelled (with the patient's name)
    { anahtar: 'ekipman_sorunlari', na: true }, // equipment problems to be addressed
    { anahtar: 'iyilesme_plani' }, // key concerns for recovery and management reviewed by surgeon, anaesthetist and nurse
  ],
}

export type SscCevap = 'evet' | 'hayir' | 'na' | null
export type SscDurumu = {
  asamalar: Record<SscAsamasi, { tamam: boolean; eksik: string[]; hayir: string[] }>
  /** Every phase completed with every item answered "yes" or (where allowed) "not applicable". */
  tamam: boolean
}

/** Phase by phase: what is unanswered, what is answered "no". A "not applicable" where the item does not allow it counts as unanswered. */
export function sscDurumu(cevaplar: Readonly<Record<string, SscCevap | undefined>>): SscDurumu {
  const asamalar = {} as SscDurumu['asamalar']
  for (const a of SSC_ASAMALARI) {
    const eksik: string[] = []
    const hayir: string[] = []
    for (const m of SSC_MADDELERI[a]) {
      const c = cevaplar[m.anahtar]
      if (c === 'hayir') hayir.push(m.anahtar)
      else if (c === 'evet' || (c === 'na' && m.na)) continue
      else eksik.push(m.anahtar)
    }
    asamalar[a] = { tamam: eksik.length === 0 && hayir.length === 0, eksik, hayir }
  }
  return { asamalar, tamam: SSC_ASAMALARI.every((a) => asamalar[a].tamam) }
}

// ───────────────────────── Caprini (2005) ─────────────────────────

/** The 2005 list, keyed, with points. Age is not a tick: it comes from the patient's age (capriniYasPuani). */
export const CAPRINI_MADDELERI: readonly { anahtar: string; puan: 1 | 2 | 3 | 5 }[] = [
  // 1 point
  { anahtar: 'kucuk_cerrahi', puan: 1 },
  { anahtar: 'vki_25_ustu', puan: 1 },
  { anahtar: 'bacak_sislik', puan: 1 },
  { anahtar: 'varis', puan: 1 },
  { anahtar: 'gebelik_lohusalik', puan: 1 },
  { anahtar: 'aciklanamayan_gebelik_kaybi', puan: 1 },
  { anahtar: 'oks_hrt', puan: 1 },
  { anahtar: 'sepsis_1ay', puan: 1 },
  { anahtar: 'ciddi_akciger_hastaligi_1ay', puan: 1 },
  { anahtar: 'anormal_solunum_fonksiyonu', puan: 1 },
  { anahtar: 'akut_mi', puan: 1 },
  { anahtar: 'kalp_yetersizligi_1ay', puan: 1 },
  { anahtar: 'iltihabi_bagirsak_hastaligi', puan: 1 },
  { anahtar: 'yatak_istirahati_dahili', puan: 1 },
  // 2 points
  { anahtar: 'artroskopik_cerrahi', puan: 2 },
  { anahtar: 'buyuk_acik_cerrahi_45dk', puan: 2 },
  { anahtar: 'laparoskopik_cerrahi_45dk', puan: 2 },
  { anahtar: 'malignite', puan: 2 },
  { anahtar: 'yatak_72_saat', puan: 2 },
  { anahtar: 'alci_immobilizasyon', puan: 2 },
  { anahtar: 'santral_venoz_kateter', puan: 2 },
  // 3 points
  { anahtar: 'vte_oykusu', puan: 3 },
  { anahtar: 'ailede_vte', puan: 3 },
  { anahtar: 'faktor_v_leiden', puan: 3 },
  { anahtar: 'protrombin_20210a', puan: 3 },
  { anahtar: 'lupus_antikoagulani', puan: 3 },
  { anahtar: 'antikardiyolipin_antikoru', puan: 3 },
  { anahtar: 'yuksek_homosistein', puan: 3 },
  { anahtar: 'hit', puan: 3 },
  { anahtar: 'diger_trombofili', puan: 3 },
  // 5 points
  { anahtar: 'inme_1ay', puan: 5 },
  { anahtar: 'elektif_artroplasti', puan: 5 },
  { anahtar: 'kalca_pelvis_bacak_kirigi', puan: 5 },
  { anahtar: 'akut_omurilik_hasari_1ay', puan: 5 },
]

/** Age points of the 2005 score: 41-60 = 1, 61-74 = 2, 75 or over = 3, under 41 = 0. */
export function capriniYasPuani(yas: number): number {
  if (!Number.isFinite(yas) || yas < 0) return 0
  if (yas >= 75) return 3
  if (yas >= 61) return 2
  if (yas >= 41) return 1
  return 0
}

export const CAPRINI_BANTLARI = ['cok_dusuk', 'dusuk', 'orta', 'yuksek'] as const
export type CapriniBandi = (typeof CAPRINI_BANTLARI)[number]
/** CHEST 2012 (Gould) groups over the Caprini total: 0 / 1-2 / 3-4 / 5 or more. */
export function capriniBandi(toplam: number): CapriniBandi {
  return toplam <= 0 ? 'cok_dusuk' : toplam <= 2 ? 'dusuk' : toplam <= 4 ? 'orta' : 'yuksek'
}

/** The plan of CHEST 2012 for the group, as keys. Agent and dose are never written here. */
export const CAPRINI_PLANLARI = ['erken_mobilizasyon', 'mekanik_ipc', 'farmakolojik', 'mekanik_ek', 'mekanik_kanama_riski', 'uzatilmis_4_hafta'] as const
export type CapriniPlani = (typeof CAPRINI_PLANLARI)[number]
export function capriniPlani(bant: CapriniBandi, g: { kanamaRiskiYuksek?: boolean; kanserCerrahisi?: boolean } = {}): CapriniPlani[] {
  if (bant === 'cok_dusuk') return ['erken_mobilizasyon']
  if (bant === 'dusuk') return ['mekanik_ipc']
  if (g.kanamaRiskiYuksek) return ['mekanik_kanama_riski']
  if (bant === 'orta') return ['farmakolojik']
  return g.kanserCerrahisi ? ['farmakolojik', 'mekanik_ek', 'uzatilmis_4_hafta'] : ['farmakolojik', 'mekanik_ek']
}

export type CapriniSonucu = { toplam: number; yasPuani: number; bant: CapriniBandi; plan: CapriniPlani[]; bilinmeyen: string[] }
/** Total of the ticked items plus the age points. An unknown key is reported, never counted. */
export function capriniHesapla(g: { yas: number; secili: readonly string[]; kanamaRiskiYuksek?: boolean; kanserCerrahisi?: boolean }): CapriniSonucu {
  const puanlar = new Map(CAPRINI_MADDELERI.map((m) => [m.anahtar, m.puan]))
  const bilinmeyen: string[] = []
  let toplam = 0
  for (const k of new Set(g.secili)) {
    const p = puanlar.get(k)
    if (p == null) bilinmeyen.push(k)
    else toplam += p
  }
  const yasPuani = capriniYasPuani(g.yas)
  toplam += yasPuani
  const bant = capriniBandi(toplam)
  return { toplam, yasPuani, bant, plan: capriniPlani(bant, g), bilinmeyen }
}

// ───────────────────────── ASA physical status ─────────────────────────

export const ASA_SINIFLARI = ['1', '2', '3', '4', '5', '6'] as const
export type AsaSinifi = (typeof ASA_SINIFLARI)[number]
const ROMA: Record<AsaSinifi, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' }
/** "ASA III-E". The emergency modifier is not used with class VI (an organ donor). Null for an unknown class. */
export function asaEtiketi(sinif: string | null | undefined, acil = false): string | null {
  if (!sinif || !(ASA_SINIFLARI as readonly string[]).includes(sinif)) return null
  const s = sinif as AsaSinifi
  return `ASA ${ROMA[s]}${acil && s !== '6' ? '-E' : ''}`
}
