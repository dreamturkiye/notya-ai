/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — the HYSTEROSCOPY FLUID-DEFICIT MONITOR and the ERAS CHECKLISTS (gynaecological /
 * gynaecological-oncology surgery, caesarean birth). Obstetrics and gynaecology only. Pure, country-neutral.
 *
 *   Fluid deficit   AAGL Practice Report: Practice guidelines for the management of hysteroscopic distending media.
 *                   Munro MG, Storz K, et al. J Minim Invasive Gynecol 2013;20:137-148. Maximum deficit: hypotonic media
 *                   1000 mL in a healthy woman, 750 mL in an elderly woman or one with comorbidity; isotonic (saline)
 *                   2500 mL in a healthy woman, 750 mL with cardiovascular disease; deficit worked out at least every 15
 *                   minutes; stop when approaching the limit. Read 2026-11-05 through a clinical summary citing the AAGL
 *                   report; the BSGE/ESGE 2016 guideline could not be opened (OPEN-COMMITMENTS KD-OPERATOR-01). These are
 *                   the INTERNATIONAL limits; a build may state its own (`p`).
 *   ERAS            ERAS Society: Nelson G et al. Guidelines for perioperative care in gynecologic/oncology: ERAS Society
 *                   recommendations, 2019 update. Int J Gynecol Cancer 2019;29:651-668. Caesarean: Wilson RD et al.
 *                   (part 1) Am J Obstet Gynecol 2018;219:523.e1-15; Caughey AB et al. (part 2) 2018;219:533-544;
 *                   Macones GA et al. (part 3) 2019;221:247.e1-9. Item keys only; not re-opened in this session.
 */

export const SIVI_ORTAMLARI = ['hipotonik', 'izotonik'] as const
export type SiviOrtami = (typeof SIVI_ORTAMLARI)[number]
export const SIVI_SINIRLARI_AAGL = { hipotonik_saglikli: 1000, hipotonik_riskli: 750, izotonik_saglikli: 2500, izotonik_riskli: 750 } as const
export type SiviSinirlari = Partial<Record<keyof typeof SIVI_SINIRLARI_AAGL, number>>

export type SiviOlcumu = { zaman: string; girenMl: number; cikanMl: number }
export const SIVI_BANTLARI = ['sinir_alti', 'sinira_yakin', 'sinir_asildi'] as const
/**
 * Cumulative readings (inflow and outflow totals so far). The deficit is the last reading's inflow minus outflow; each
 * reading gets its own deficit so the trend can be seen. `sinira_yakin` = at or above three quarters of the limit (the
 * guideline's "approaching", made visible; the limit itself is the guideline's).
 */
export function siviAcigi(g: { ortam: SiviOrtami; riskli: boolean; olcumler: readonly SiviOlcumu[] }, p: SiviSinirlari = {}): { acikMl: number; sinirMl: number; yuzde: number; bant: (typeof SIVI_BANTLARI)[number]; seyir: { zaman: string; acikMl: number }[] } | null {
  const ok = g.olcumler.filter((o) => Number.isFinite(o.girenMl) && Number.isFinite(o.cikanMl) && o.girenMl >= 0 && o.cikanMl >= 0)
  if (!ok.length || !(SIVI_ORTAMLARI as readonly string[]).includes(g.ortam)) return null
  const anahtar = `${g.ortam}_${g.riskli ? 'riskli' : 'saglikli'}` as keyof typeof SIVI_SINIRLARI_AAGL
  const sinirMl = typeof p[anahtar] === 'number' ? (p[anahtar] as number) : SIVI_SINIRLARI_AAGL[anahtar]
  const seyir = ok.map((o) => ({ zaman: o.zaman, acikMl: Math.round(o.girenMl - o.cikanMl) }))
  const acikMl = seyir[seyir.length - 1].acikMl
  const yuzde = Math.round((acikMl / sinirMl) * 100)
  const bant = acikMl >= sinirMl ? 'sinir_asildi' : acikMl >= sinirMl * 0.75 ? 'sinira_yakin' : 'sinir_alti'
  return { acikMl, sinirMl, yuzde, bant, seyir }
}

export const ERAS_LISTELERI = {
  jinekolojik: [
    'preop_bilgilendirme', 'sigara_alkol_birakma', 'anemi_degerlendirme', 'kati_6s_sivi_2s', 'karbonhidrat_yukleme', 'rutin_bagirsak_hazirligi_yok',
    'uzun_etkili_sedatif_yok', 'vte_profilaksisi', 'antibiyotik_ve_klorheksidin_alkol', 'bulanti_kusma_profilaksisi', 'kisa_etkili_anestezi',
    'normotermi', 'hedefe_yonelik_sivi', 'minimal_invaziv_tercih', 'rutin_nazogastrik_ve_dren_yok', 'opioid_koruyucu_multimodal_analjezi',
    'erken_beslenme_24s', 'glukoz_kontrolu', 'erken_sonda_cikarma_24s', 'erken_mobilizasyon', 'uyum_denetimi',
  ],
  sezaryen: [
    'antenatal_bilgilendirme', 'kati_6s_sivi_2s', 'karbonhidrat_icecegi', 'antibiyotik_insizyon_oncesi', 'klorheksidin_alkol_cilt',
    'eylemde_vajinal_hazirlik', 'normotermi', 'normovolemi', 'rejyonel_anestezi', 'bulanti_kusma_profilaksisi', 'gecikmis_kordon_klempi',
    'ten_tene_temas', 'erken_oral_alim', 'glukoz_kontrolu', 'opioid_koruyucu_multimodal_analjezi', 'erken_sonda_cikarma',
    'erken_mobilizasyon', 'vte_risk_degerlendirmesi', 'taburculuk_planlamasi',
  ],
} as const
export type ErasListesi = keyof typeof ERAS_LISTELERI
export function erasDurumu(liste: ErasListesi, tamam: readonly string[]): { yapilan: number; toplam: number; yuzde: number; eksik: string[] } {
  const maddeler = ERAS_LISTELERI[liste] as readonly string[]
  const s = new Set(tamam)
  const eksik = maddeler.filter((m) => !s.has(m))
  const yapilan = maddeler.length - eksik.length
  return { yapilan, toplam: maddeler.length, yuzde: Math.round((yapilan / maddeler.length) * 100), eksik }
}
