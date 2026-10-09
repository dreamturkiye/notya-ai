/**
 * NOTYA-ULKE-ARACLAR-01 — tools of paediatric surgery, internal medicine and dermatology. Keys and rules only.
 * Each stands beside a tool of the pre-split application (named on the definition) and is compared with it, input
 * for input, in lib/ulke/araclar/esdegerlik.test.ts. Nothing of that application is imported here.
 */
import type { AracAlani, AracTanimi } from '../tipler'
import { BOS_SONUC, gunEkle, gunMu, isaretliler, metin, puan, sayi, sayiMi, secim, tarih } from '../yardimci'

const isaretKosullu = (anahtar: string, deger: string): AracAlani => ({ anahtar, tur: 'isaret', kosul: { alan: 'tip', degerler: [deger] } })

/**
 * Before and after an operation on a child: which list (before / after), what is done, the day of the operation.
 * A list of the product's own. The other application also derives two reminder days from the operation day (three
 * days before, seven days after); the kit derives none — an interval is clinical guidance, and the doctor books
 * the follow-up on the calendar. Stands beside specialties/cocuk-cerrahisi/engines/prepost.ts → prepostSkorla.
 */
export const PREOP_MADDELER = ['onam', 'laboratuvar', 'goruntu', 'acil_kisi', 'anestezi_not'] as const
export const POSTOP_MADDELER = ['postop_yara', 'postop_agri', 'postop_beslenme', 'kontrol_plan', 'postop_acil_yol'] as const
export const COCUK_PREPOST: AracTanimi = {
  anahtar: 'cocuk-prepost-op',
  tur: 'liste',
  alanlar: [secim('tip', ['preop', 'postop']), ...PREOP_MADDELER.map((k) => isaretKosullu(k, 'preop')), ...POSTOP_MADDELER.map((k) => isaretKosullu(k, 'postop')), metin('etiket'), tarih('ameliyat_tarihi', true)],
  cikti: { sayilar: ['tamamlanan'], bantlar: [], uyarilar: [], tarihler: ['ameliyat_tarihi'] },
  kaynak: null,
  hesapla: (g) => {
    if (g.tip !== 'preop' && g.tip !== 'postop') return BOS_SONUC
    const liste = g.tip === 'preop' ? PREOP_MADDELER : POSTOP_MADDELER
    return { tamam: true, sayilar: [{ anahtar: 'tamamlanan', deger: isaretliler(g, liste).length, ondalik: 0, enCok: liste.length }], bant: null, uyarilar: [], tarihler: gunMu(g.ameliyat_tarihi) ? [{ anahtar: 'ameliyat_tarihi', tarih: g.ameliyat_tarihi }] : [] }
  },
}

/**
 * Wound, drain and suture follow-up: what is followed, where, on which day, the next check, and for a drain the
 * output in millilitres as the doctor records it. The other application proposes "ten days later" for suture
 * removal when no next check is given; the kit proposes nothing. Stands beside
 * specialties/cocuk-cerrahisi/engines/yaraDren.ts → yaraSkorla, yaraGorevleri.
 */
export const YARA_TIPLERI = ['yara', 'dren', 'dikis', 'taburcu_kontrol'] as const
export const YARA_DREN: AracTanimi = {
  anahtar: 'yara-dren-izlem',
  tur: 'takvim',
  alanlar: [secim('tip', YARA_TIPLERI), metin('bolge'), tarih('tarih'), tarih('sonraki_kontrol', true), sayi('dren_cikis_ml', 0, 5000, { tam: true, birim: 'mL', istege: true, kosul: { alan: 'tip', degerler: ['dren'] } })],
  cikti: { sayilar: ['dren_cikis_ml'], bantlar: [], uyarilar: [], tarihler: ['tarih', 'sonraki_kontrol'] },
  sonucBirimleri: ['mL'],
  kaynak: null,
  hesapla: (g) => {
    if (typeof g.tip !== 'string' || !gunMu(g.tarih)) return BOS_SONUC
    return {
      tamam: true,
      sayilar: g.tip === 'dren' && sayiMi(g.dren_cikis_ml) ? [{ anahtar: 'dren_cikis_ml', deger: g.dren_cikis_ml, ondalik: 0, birim: 'mL' }] : [],
      bant: null, uyarilar: [],
      tarihler: [{ anahtar: 'tarih', tarih: g.tarih }, ...(gunMu(g.sonraki_kontrol) ? [{ anahtar: 'sonraki_kontrol', tarih: g.sonraki_kontrol }] : [])],
    }
  },
}

/**
 * Chronic kidney disease: the GFR category (G1 to G5), the albuminuria category (A1 to A3) and the risk cell they
 * fall in, with the referral flags that follow from the cell itself. The other application also writes a plan and a
 * monitoring interval; the kit classifies and stops there.
 * Source: KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.
 * Kidney Int. 2024;105(4S):S117–S314 (the GFR and albuminuria categories and the risk grid).
 * Stands beside specialties/dahiliye/engines/ckd.ts → gEvre, aEvre, kdigoRenk, ckdDegerlendir.
 */
export const KDIGO_G = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'] as const
export const KDIGO_A = ['A1', 'A2', 'A3'] as const
export const kdigoG = (egfr: number): (typeof KDIGO_G)[number] => (egfr >= 90 ? 'G1' : egfr >= 60 ? 'G2' : egfr >= 45 ? 'G3a' : egfr >= 30 ? 'G3b' : egfr >= 15 ? 'G4' : 'G5')
export const kdigoA = (uacrMgG: number): (typeof KDIGO_A)[number] => (uacrMgG < 30 ? 'A1' : uacrMgG <= 300 ? 'A2' : 'A3')
export function kdigoRisk(g: (typeof KDIGO_G)[number], a: (typeof KDIGO_A)[number] | null): 'yesil' | 'sari' | 'turuncu' | 'kirmizi' {
  const gi = KDIGO_G.indexOf(g), ai = a ? KDIGO_A.indexOf(a) : 0
  if (gi >= 4) return 'kirmizi'
  if (gi === 3) return ai === 0 ? 'turuncu' : 'kirmizi'
  if (gi === 2) return ai === 0 ? 'sari' : ai === 1 ? 'turuncu' : 'kirmizi'
  return ai === 0 ? 'yesil' : ai === 1 ? 'sari' : 'turuncu'
}
export const KDIGO: AracTanimi = {
  anahtar: 'kdigo-evre',
  tur: 'hesap',
  alanlar: [sayi('egfr', 1, 200, { birim: 'mL/min/1.73m2' }), sayi('uacr', 0, 10000, { lab: 'albuminKreatinin', istege: true }), sayi('egfr_bir_yil_once', 1, 200, { birim: 'mL/min/1.73m2', istege: true })],
  cikti: { sayilar: [], bantlar: ['yesil', 'sari', 'turuncu', 'kirmizi'], uyarilar: [...KDIGO_G, ...KDIGO_A, 'hizli_dusus', 'sevk_egfr30', 'sevk_a3', 'sevk_hizli_dusus', 'sevk_cok_yuksek_risk'], tarihler: [] },
  kaynak: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.',
  hesapla: (g) => {
    if (!sayiMi(g.egfr)) return BOS_SONUC
    const gk = kdigoG(g.egfr), ak = sayiMi(g.uacr) ? kdigoA(g.uacr) : null, risk = kdigoRisk(gk, ak)
    const hizli = sayiMi(g.egfr_bir_yil_once) && g.egfr < g.egfr_bir_yil_once * 0.75
    const sevk = gk === 'G4' || gk === 'G5' ? 'sevk_egfr30' : ak === 'A3' ? 'sevk_a3' : hizli ? 'sevk_hizli_dusus' : risk === 'kirmizi' ? 'sevk_cok_yuksek_risk' : null
    return { tamam: true, sayilar: [], bant: risk, uyarilar: [gk, ...(ak ? [ak] : []), ...(hizli ? ['hizli_dusus'] : []), ...(sevk ? [sevk] : [])], tarihler: [] }
  },
}

// ── dermatology: three published indices, each scored by the doctor ──

export const DERI_BOLGELERI = ['bas', 'ust', 'govde', 'alt'] as const
const AGIRLIK: Readonly<Record<(typeof DERI_BOLGELERI)[number], number>> = { bas: 0.1, ust: 0.2, govde: 0.3, alt: 0.4 }
const n0 = (x: unknown): number => (sayiMi(x) ? x : 0)
const bir = (x: number) => Math.round(x * 10) / 10
const ucBant = (v: number, orta: number, siddetli: number): string => (v < orta ? 'hafif' : v < siddetli ? 'orta' : 'siddetli')

/**
 * PASI: four regions, each with erythema, induration and desquamation (0 to 4) and the area involved (0 to 6);
 * weights 0.1 / 0.2 / 0.3 / 0.4; total 0 to 72. A field left empty counts as 0; with nothing entered there is no result.
 * Source: Fredriksson T, Pettersson U. Severe psoriasis — oral therapy with a new retinoid. Dermatologica 1978;157:238–244.
 * Stands beside specialties/dermatoloji/engines/score-calculator.ts → pasi, pasiBandi.
 */
export const PASI: AracTanimi = {
  anahtar: 'pasi',
  tur: 'olcek',
  alanlar: DERI_BOLGELERI.flatMap((b) => [puan(`${b}_e`, 0, 4), puan(`${b}_i`, 0, 4), puan(`${b}_d`, 0, 4), puan(`${b}_a`, 0, 6)]),
  cikti: { sayilar: ['pasi'], bantlar: ['hafif', 'orta', 'siddetli'], uyarilar: [], tarihler: [] },
  kaynak: 'Fredriksson T, Pettersson U. Dermatologica 1978;157:238-244.',
  hesapla: (g) => {
    if (!DERI_BOLGELERI.some((b) => ['e', 'i', 'd', 'a'].some((k) => sayiMi(g[`${b}_${k}`])))) return BOS_SONUC
    const v = bir(DERI_BOLGELERI.reduce((t, b) => t + AGIRLIK[b] * (n0(g[`${b}_e`]) + n0(g[`${b}_i`]) + n0(g[`${b}_d`])) * n0(g[`${b}_a`]), 0))
    return { tamam: true, sayilar: [{ anahtar: 'pasi', deger: v, ondalik: 1, enCok: 72 }], bant: ucBant(v, 10, 20), uyarilar: [], tarihler: [] }
  },
}

/**
 * EASI: four regions, each with erythema, oedema / papulation, excoriation and lichenification (0 to 3) and the area
 * involved (0 to 6); the weights of a patient aged 8 or older (0.1 / 0.2 / 0.3 / 0.4); total 0 to 72.
 * Source: Hanifin JM, Thurston M, Omoto M, et al. The eczema area and severity index (EASI). Exp Dermatol 2001;10:11–18.
 * Stands beside specialties/dermatoloji/engines/score-calculator.ts → easi, easiBandi.
 */
export const EASI: AracTanimi = {
  anahtar: 'easi',
  tur: 'olcek',
  alanlar: DERI_BOLGELERI.flatMap((b) => [puan(`${b}_e`, 0, 3), puan(`${b}_i`, 0, 3), puan(`${b}_d`, 0, 3), puan(`${b}_l`, 0, 3), puan(`${b}_a`, 0, 6)]),
  cikti: { sayilar: ['easi'], bantlar: ['hafif', 'orta', 'siddetli'], uyarilar: [], tarihler: [] },
  kaynak: 'Hanifin JM, Thurston M, Omoto M, et al. Exp Dermatol 2001;10:11-18.',
  hesapla: (g) => {
    if (!DERI_BOLGELERI.some((b) => ['e', 'i', 'd', 'l', 'a'].some((k) => sayiMi(g[`${b}_${k}`])))) return BOS_SONUC
    const v = bir(DERI_BOLGELERI.reduce((t, b) => t + AGIRLIK[b] * (n0(g[`${b}_e`]) + n0(g[`${b}_i`]) + n0(g[`${b}_d`]) + n0(g[`${b}_l`])) * n0(g[`${b}_a`]), 0))
    return { tamam: true, sayilar: [{ anahtar: 'easi', deger: v, ondalik: 1, enCok: 72 }], bant: ucBant(v, 7, 21), uyarilar: [], tarihler: [] }
  },
}

/**
 * SCORAD = A / 5 + 7 × B / 2 + C: A the extent in per cent of body surface (0 to 100), B six intensity items (0 to 3
 * each), C itch and sleep loss as the patient rates them (0 to 10 each). Total 0 to 103.
 * Source: European Task Force on Atopic Dermatitis. Severity scoring of atopic dermatitis: the SCORAD index.
 * Dermatology 1993;186:23–31. Stands beside specialties/dermatoloji/engines/score-calculator.ts → scorad, scoradBandi.
 */
export const SCORAD_SIDDET = ['eritem', 'odem', 'sizinti', 'ekskoriasyon', 'likenifikasyon', 'kuruluk'] as const
export const SCORAD: AracTanimi = {
  anahtar: 'scorad',
  tur: 'olcek',
  alanlar: [sayi('yayginlik', 0, 100, { birim: '%' }), ...SCORAD_SIDDET.map((k) => puan(k, 0, 3)), puan('kasinti', 0, 10), puan('uykusuzluk', 0, 10)],
  cikti: { sayilar: ['scorad', 'a', 'b', 'c'], bantlar: ['hafif', 'orta', 'siddetli'], uyarilar: [], tarihler: [] },
  kaynak: 'European Task Force on Atopic Dermatitis. Dermatology 1993;186:23-31.',
  hesapla: (g) => {
    if (!sayiMi(g.yayginlik)) return BOS_SONUC
    const a = g.yayginlik, b = SCORAD_SIDDET.reduce((t, k) => t + n0(g[k]), 0), c = n0(g.kasinti) + n0(g.uykusuzluk)
    const v = bir(a / 5 + 3.5 * b + c)
    return { tamam: true, sayilar: [{ anahtar: 'scorad', deger: v, ondalik: 1, enCok: 103 }, { anahtar: 'a', deger: a, ondalik: 1, enCok: 100 }, { anahtar: 'b', deger: b, ondalik: 0, enCok: 18 }, { anahtar: 'c', deger: c, ondalik: 0, enCok: 20 }], bant: ucBant(v, 25, 50), uyarilar: [], tarihler: [] }
  },
}

/**
 * Patch test: the day the patches were applied → the two reading days, day 2 and day 4.
 * Source: Johansen JD, Aalto-Korte K, Agner T, et al. European Society of Contact Dermatitis guideline for diagnostic
 * patch testing. Contact Dermatitis 2015;73:195–221. The series of allergens is not in the kit.
 * Stands beside specialties/dermatoloji/engines/patch-calendar.ts → plannedReads.
 */
export const YAMA_OKUMA: AracTanimi = {
  anahtar: 'yama-okuma',
  tur: 'takvim',
  alanlar: [tarih('uygulama')],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['d2', 'd4'] },
  kaynak: 'Johansen JD, Aalto-Korte K, Agner T, et al. Contact Dermatitis 2015;73:195-221.',
  hesapla: (g) => (gunMu(g.uygulama) ? { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'd2', tarih: gunEkle(g.uygulama, 2) }, { anahtar: 'd4', tarih: gunEkle(g.uygulama, 4) }] } : BOS_SONUC),
}

export const CERRAHI_DAHILIYE_DERM: readonly AracTanimi[] = [COCUK_PREPOST, YARA_DREN, KDIGO, PASI, EASI, SCORAD, YAMA_OKUMA]
