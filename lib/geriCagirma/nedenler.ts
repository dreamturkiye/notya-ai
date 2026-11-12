/**
 * GERI-CAGIRMA-01 — WHICH EXISTING TOOL ANSWERS "who is due or overdue" FOR WHICH BRANŞ, and which of that tool's
 * flags are recall reasons. Pure and client-safe (the kohort pages' "Bu listeyi geri çağır" link reads the routes).
 *
 * NOTHING IS COMPUTED HERE. Every reason below is a flag an existing kohort engine already raises with its own,
 * already-reviewed logic (specialties/<branş>/engines/kohort.ts via app/api/doktor/<branş>/_kohort.ts). This file adds
 * no interval, no threshold and no formula. The loaders are in ./yukleyiciler.ts (server only).
 *
 * WHAT IS A RECALL REASON AND WHAT IS NOT. Only a flag that says "a visit, a test or a screening is due or
 * overdue" is listed. A flag that describes the patient's clinical STATE or an open safety concern (HbA1c >9, eGFR
 * <45, "risk açık", PHQ-9 yüksek, ESI 1–2, an overdue chemotherapy day, an open critical finding …) is deliberately
 * NOT a one-tap recall reason: that patient needs the doctor's own judgement and usually a phone call, not a generic
 * bulk message. The doctor still sees those patients in the branş's own kohort panel. Which flags are recallable is
 * on the clinician-review list (docs/OPEN-COMMITMENTS.md GERI-CAGIRMA-01).
 *
 * BRANŞ GATE. A reason key is `${brans}:${flag}` and is produced only when the signed-in doctor's own branş is
 * `brans` (lib/geriCagirma/kaynak.ts asks ONE loader: the doctor's own). Tested both ways in geriCagirma.test.ts.
 */

export type KohortKaynagi = {
  /** SpecialtyKey of the branş that owns the tool (lib/doktor/doktorAraclari.ts `branslar`). */
  brans: string
  /** Stable key of the source tool; also the `kaynak` filter the kohort page passes to the recall screen. */
  kaynak: string
  /** The kohort panel's own route. */
  rota: string
  /** The engine's flags that mean "due / overdue". Each must exist in the engine (tested). */
  nedenler: readonly string[]
}

export const KOHORT_KAYNAKLARI: readonly KohortKaynagi[] = [
  { brans: 'acil-tip', kaynak: 'acil-kohort', rota: '/doktor-tools/acil-kohort', nedenler: ['gecikmis_kontrol'] },
  { brans: 'aile-hekimligi', kaynak: 'aile-kohort', rota: '/doktor-tools/aile-kohort', nedenler: ['gecikmis_kontrol', 'asi_tarama_gecikmis', 'kronik_gecikmis'] },
  { brans: 'anestezi', kaynak: 'anestezi-kohort', rota: '/doktor-tools/anestezi-kohort', nedenler: ['gecikmis_kontrol'] },
  { brans: 'beyin-cerrahisi', kaynak: 'bc-kohort', rota: '/doktor-tools/bc-kohort', nedenler: ['gecikmis_kontrol'] },
  { brans: 'cocuk-cerrahisi', kaynak: 'cc-kohort', rota: '/doktor-tools/cc-kohort', nedenler: ['gecikmis_kontrol', 'yara_gecikmis'] },
  { brans: 'dahiliye', kaynak: 'dahiliye-kohort', rota: '/doktor-tools/dahiliye-kohort', nedenler: ['gecikmis_lab', 'gecikmis_asi', 'gecikmis_tarama', 'gecikmis_izlem', 'vizit_6ay'] },
  { brans: 'dermatoloji', kaynak: 'derm-kohort', rota: '/doktor-tools/derm-kohort', nedenler: ['tbse_gecikti', 'fototerapi_seans', 'beta_hcg', 'biyolojik_lab'] },
  { brans: 'endokrinoloji', kaynak: 'endo-kohort', rota: '/doktor-tools/endo-kohort', nedenler: ['gecikmis_kontrol', 'lab_izlem_gecikmis', 'dxa_gecikmis'] },
  { brans: 'enfeksiyon-hastaliklari', kaynak: 'enfeksiyon-kohort', rota: '/doktor-tools/enfeksiyon-kohort', nedenler: ['gecikmis_kontrol', 'viral_izlem_gecikmis'] },
  { brans: 'fizik-tedavi', kaynak: 'ftr-kohort', rota: '/doktor-tools/ftr-kohort', nedenler: ['gecikmis_kontrol', 'seans_gecikmis'] },
  { brans: 'gastroenteroloji', kaynak: 'gastro-kohort', rota: '/doktor-tools/gastro-kohort', nedenler: ['gecikmis_kontrol', 'skor_izlem_gecikmis', 'hepatit_izlem_gecikmis', 'endoskopi_gecikmis', 'rejim_gecikmis'] },
  { brans: 'kadin-hastaliklari-dogum', kaynak: 'kd-kohort', rota: '/doktor-tools/kd-kohort', nedenler: ['serviks_tarama', 'izlem_gecikti', 'lohusa_1hf', 'lohusa_6hf', 'tarama_kapaniyor', 'ogtt_zamani', 'anti_d_zamani', 'gbs_zamani'] },
  { brans: 'genel-cerrahi', kaynak: 'gc-kohort', rota: '/doktor-tools/gc-kohort', nedenler: ['gecikmis_kontrol', 'yara_gecikmis'] },
  { brans: 'gogus-cerrahisi', kaynak: 'gogus-cerrahi-kohort', rota: '/doktor-tools/gogus-cerrahi-kohort', nedenler: ['gecikmis_kontrol'] },
  { brans: 'gogus-hastaliklari', kaynak: 'gogus-kohort', rota: '/doktor-tools/gogus-kohort', nedenler: ['gecikmis_kontrol', 'spirometri_gecikmis'] },
  { brans: 'goz-hastaliklari', kaynak: 'goz-kohort', rota: '/doktor-tools/goz-kohort', nedenler: ['ga_oct_gecikti', 'ivt_gecikti', 'dr_tarama', 'kontrol_gecikti'] },
  { brans: 'kalp-damar-cerrahisi', kaynak: 'kdc-kohort', rota: '/doktor-tools/kdc-kohort', nedenler: ['gecikmis_kontrol', 'antikoag_vade'] },
  { brans: 'kardiyoloji', kaynak: 'kardio-kohort', rota: '/doktor-tools/kardio-kohort', nedenler: ['gecikmis_kontrol', 'lab_ekg_gecikmis', 'yuksek_risk_izlem'] },
  { brans: 'kulak-burun-bogaz', kaynak: 'kbb-kohort', rota: '/doktor-tools/kbb-kohort', nedenler: ['gecikmis_kontrol', 'odyo_gecikmis'] },
  { brans: 'nefroloji', kaynak: 'nef-kohort', rota: '/doktor-tools/nef-kohort', nedenler: ['gecikmis_kontrol', 'egfr_izlem_gecikmis', 'anemi_izlem_gecikmis'] },
  { brans: 'noroloji', kaynak: 'noro-kohort', rota: '/doktor-tools/noro-kohort', nedenler: ['gecikmis_kontrol', 'ilac_izlem_gecikmis'] },
  { brans: 'onkoloji', kaynak: 'onko-kohort', rota: '/doktor-tools/onko-kohort', nedenler: ['gecikmis_kontrol'] },
  { brans: 'ortopedi', kaynak: 'orto-kohort', rota: '/doktor-tools/orto-kohort', nedenler: ['gecikmis_kontrol', 'alci_gecikmis'] },
  { brans: 'pediatri', kaynak: 'pedi-kohort', rota: '/doktor-tools/pedi-kohort', nedenler: ['asi_gecikti', 'izlem_kacti', 'tarama_gecikti'] },
  { brans: 'plastik-cerrahi', kaynak: 'plastik-kohort', rota: '/doktor-tools/plastik-kohort', nedenler: ['gecikmis_kontrol'] },
  { brans: 'psikiyatri', kaynak: 'psik-kohort', rota: '/doktor-tools/psik-kohort', nedenler: ['gecikmis_kontrol', 'li_duzey_gecikmis'] },
  { brans: 'radyoloji', kaynak: 'radyo-kohort', rota: '/doktor-tools/radyo-kohort', nedenler: ['gecikmis_kontrol'] },
  { brans: 'romatoloji', kaynak: 'roma-kohort', rota: '/doktor-tools/roma-kohort', nedenler: ['gecikmis_kontrol', 'lab_izlem_gecikmis'] },
  { brans: 'spor-hekimligi', kaynak: 'spor-kohort', rota: '/doktor-tools/spor-kohort', nedenler: ['gecikmis_kontrol', 'rtp_gecikmis'] },
  { brans: 'uroloji', kaynak: 'uro-kohort', rota: '/doktor-tools/uro-kohort', nedenler: ['gecikmis_kontrol', 'psa_gecikmis'] },
]

/**
 * The 10 Özel Branşlar have no clinical kohort engine of this kind; their plans carry the practitioner's own dated
 * follow-up items ("vadeler", ozel_brans_plan). A passed item is the reason, in the branch's own wording
 * (specialties/<dal>/engines/kohort.ts vadeKohort). The reason key carries the branch slug, so it is gated the same way.
 */
export const OZEL_BRANS_KAYNAGI = 'ozel-vade'
export const OZEL_BRANS_NEDENI = 'vade'

export const nedenAnahtari = (brans: string, bayrak: string): string => `${brans}:${bayrak}`

/** The branş a reason key belongs to, or null for the universal one. */
export function nedeninBransi(anahtar: string): string | null {
  const i = anahtar.indexOf(':')
  return i > 0 ? anahtar.slice(0, i) : null
}

export function kohortKaynagi(brans: string | null | undefined): KohortKaynagi | null {
  return brans ? KOHORT_KAYNAKLARI.find((k) => k.brans === brans) ?? null : null
}

/** The `kaynak` filter a kohort page passes to the recall screen, or null when the page is not a due/overdue panel. */
export function rotaninKaynagi(yol: string | null | undefined): string | null {
  const y = String(yol || '').replace(/\/+$/, '')
  const k = KOHORT_KAYNAKLARI.find((x) => x.rota === y)
  if (k) return k.kaynak
  return /^\/ozel-branslar\/[a-z-]+-kohort$/.test(y) ? OZEL_BRANS_KAYNAGI : null
}
