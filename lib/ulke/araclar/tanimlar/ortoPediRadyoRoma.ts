/**
 * NOTYA-ULKE-ARACLAR-01 — tools of orthopaedics, paediatrics, plastic surgery, radiology, rheumatology, sports
 * medicine and urology. Keys and rules only. Each stands beside a tool of the pre-split application (named on the
 * definition) and is compared with it, input for input, in lib/ulke/araclar/esdegerlik.test.ts. Nothing of that
 * application is imported here.
 */
import { LAB_BIRIMLERI } from '../birimler'
import { yazilanBirim } from '../girdi'
import type { AracAlani, AracSayisi, AracTanimi } from '../tipler'
import { ayEkle, BOS_SONUC, gunEkle, gunFarki, gunMu, isaretliler, kontrolListesi, metin, puan, sayi, sayiMi, secim, tarih } from '../yardimci'

const isaret = (anahtar: string): AracAlani => ({ anahtar, tur: 'isaret' })
const verilen = (g: Record<string, unknown>, anahtarlar: readonly string[]) => anahtarlar.flatMap((k) => { const v = g[k]; return gunMu(v) ? [{ anahtar: k, tarih: v }] : [] })

// ───────────────────────── orthopaedics ─────────────────────────

/**
 * Fracture, cast, brace or post-operative follow-up: what, where, the neurovascular state as the doctor records it,
 * the day the cast comes off and the day weight-bearing starts. Warnings: neurovascular threat; a planned day that
 * has passed. Stands beside specialties/ortopedi/engines/kirikAlci.ts → ozetle.
 */
export const KIRIK_BOLGELERI = ['omuz', 'dirsek', 'el', 'kalca', 'diz', 'ayak', 'omurga', 'diger'] as const
export const TARAFLAR = ['sag', 'sol', 'iki', 'belirtilmedi'] as const
export const NV_DURUMLARI = ['tam', 'parestezi', 'tehdit', 'degerlendirilmedi'] as const
export const KIRIK_ALCI: AracTanimi = {
  anahtar: 'kirik-alci-takip',
  tur: 'takvim',
  alanlar: [secim('tip', ['kirik', 'alci', 'ortez', 'op_sonrasi']), secim('bolge', KIRIK_BOLGELERI, true), secim('taraf', TARAFLAR, true), secim('nv', NV_DURUMLARI, true), tarih('baslangic', true), tarih('alci_alma', true), tarih('yuk_verme', true), isaret('goruntu_hazir')],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['nv_tehdit', 'alci_gecti', 'yuk_gecti', 'goruntu_kontrol', 'op_kontrol'], tarihler: ['baslangic', 'alci_alma', 'yuk_verme'] },
  kaynak: null,
  hesapla: (g, { bugun }) => {
    if (typeof g.tip !== 'string') return BOS_SONUC
    return {
      tamam: true, sayilar: [], bant: null,
      uyarilar: [...(g.nv === 'tehdit' ? ['nv_tehdit'] : []), ...(gunMu(g.alci_alma) && g.alci_alma < bugun ? ['alci_gecti'] : []), ...(gunMu(g.yuk_verme) && g.yuk_verme < bugun ? ['yuk_gecti'] : []), ...(g.goruntu_hazir === true ? ['goruntu_kontrol'] : []), ...(g.tip === 'op_sonrasi' && gunMu(g.baslangic) ? ['op_kontrol'] : [])],
      tarihler: verilen(g, ['baslangic', 'alci_alma', 'yuk_verme']),
    }
  },
}

/** After an orthopaedic operation: six points to go through. A list of the product's own. Stands beside the six items of specialties/ortopedi/engines/kirikAlci.ts → OP_PROTOKOL_MADDELERI (a list without a function). */
export const OP_PROTOKOL_MADDELERI = ['islem_kaydi', 'dikis_kontrol', 'yuk_kisit', 'goruntu_kontrol', 'ftr_sevk', 'kirmizi_bayrak'] as const
export const ORTOPEDI_OP_PROTOKOL: AracTanimi = kontrolListesi({ anahtar: 'ortopedi-op-protokol', maddeler: OP_PROTOKOL_MADDELERI, ek: [tarih('islem_tarihi', true)], tarihler: ['islem_tarihi'] })

/**
 * Pain and function: pain from 0 to 10 and four function items from 0 to 4 (walking, stairs, daily tasks, sleep).
 * The tool shows the two numbers and nothing else.
 * Stands beside specialties/ortopedi/engines/vasFonksiyon.ts → skorla.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01, fault 13 — NO SEVERITY WORD. The tool named a grade (mild, moderate, severe) from
 * "pain × 0.8 + the function total": a weighting the product invented, published nowhere. Pain of 5 out of 10 with
 * little loss of function read "mild pain and limitation of function". There is no source to correct it to, so
 * the grade is gone: the result is the pain score and the function total, as the doctor entered them. (The tool it
 * stands beside still names the grade; the comparison test states the difference.)
 */
export const FONKSIYON_MADDELERI = ['yurume', 'merdiven', 'gunluk', 'uyku'] as const
export const VAS_FONKSIYON: AracTanimi = {
  anahtar: 'vas-fonksiyon',
  tur: 'olcek',
  alanlar: [puan('vas', 0, 10), ...FONKSIYON_MADDELERI.map((k) => puan(k, 0, 4))],
  cikti: { sayilar: ['vas', 'fonksiyon'], bantlar: [], uyarilar: [], tarihler: [] },
  kaynak: null,
  hesapla: (g) => {
    if (!sayiMi(g.vas) || !FONKSIYON_MADDELERI.every((k) => sayiMi(g[k]))) return BOS_SONUC
    const toplam = FONKSIYON_MADDELERI.reduce((t, k) => t + (g[k] as number), 0)
    return { tamam: true, sayilar: [{ anahtar: 'vas', deger: g.vas, ondalik: 0, enCok: 10 }, { anahtar: 'fonksiyon', deger: toplam, ondalik: 0, enCok: 16 }], bant: null, uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── paediatrics ─────────────────────────

/**
 * Target height from the parents' heights (mid-parental height): (father + mother + 13 cm) / 2 for a boy,
 * (father + mother − 13 cm) / 2 for a girl. An estimate, never a promise.
 * Source: Tanner JM, Goldstein H, Whitehouse RH. Standards for children's height at ages 2–9 years allowing for
 * height of parents. Arch Dis Child 1970;45:755–762. Stands beside lib/clinical/hedefBoy.ts → hesaplaHedefBoy.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01, fault 11 — THE RANGE IS THE COUNTRY'S NUMBER, AND THE KIT HAS NONE. The tool showed a
 * range of 8.5 cm either side in every country. No single source states that figure for all of them, and the two
 * national sources opened on 2026-10-10 state others:
 *   - Barstow C, Rerucha C. Evaluation of short and tall stature in children. Am Fam Physician 2015;92(1):43-50,
 *     https://www.aafp.org/afp/2015/0701/p43.pdf — the formula as above (13 cm, or 5 in), and "Most children will
 *     have a projected adult height within 10 cm (4 in)" of the midparental height.
 *   - UK growth chart, boys 2–18 years (© RCPCH 2012), https://www.sign.ac.uk/media/1436/boys_2-18_years_growth_chart.pdf
 *     — "Four boys out of five will have an adult height within ±7 cm of this target height."
 * So the range is a number a country MAY state (`secimlikParametreler`: `aralik_cm`, in centimetres either side,
 * with its source in the pack). Where a pack states none — no pack does yet — the tool shows the target height and
 * NO range. The formula (the 13 cm correction) was confirmed by the audits and is unchanged.
 */
const ondaBir = (x: number) => Math.round(x * 10) / 10
export const HEDEF_BOY: AracTanimi = {
  anahtar: 'hedef-boy',
  tur: 'hesap',
  alanlar: [secim('cinsiyet', ['kiz', 'erkek']), sayi('anne', 130, 230, { olcu: 'boy' }), sayi('baba', 130, 230, { olcu: 'boy' })],
  secimlikParametreler: ['aralik_cm'],
  cikti: { sayilar: ['hedef', 'alt', 'ust'], bantlar: [], uyarilar: [], tarihler: [] },
  sonucOlculeri: ['boy'],
  kaynak: 'Tanner JM, Goldstein H, Whitehouse RH. Arch Dis Child 1970;45:755-762.',
  hesapla: (g, { p }) => {
    if (!sayiMi(g.anne) || !sayiMi(g.baba) || (g.cinsiyet !== 'kiz' && g.cinsiyet !== 'erkek')) return BOS_SONUC
    const hedef = ondaBir((ondaBir(g.baba) + ondaBir(g.anne) + (g.cinsiyet === 'erkek' ? 13 : -13)) / 2)
    // the range only where the country states it — and then it must be a real distance
    const aralik = sayiMi(p.aralik_cm) && p.aralik_cm > 0 ? p.aralik_cm : null
    const sayilar: AracSayisi[] = [{ anahtar: 'hedef', deger: hedef, ondalik: 1, olcu: 'boy' }, ...(aralik !== null ? [{ anahtar: 'alt', deger: ondaBir(hedef - aralik), ondalik: 1, olcu: 'boy' as const }, { anahtar: 'ust', deger: ondaBir(hedef + aralik), ondalik: 1, olcu: 'boy' as const }] : [])]
    return { tamam: true, sayilar, bant: null, uyarilar: [], tarihler: [] }
  },
}

/**
 * Dose arithmetic on numbers THE DOCTOR enters: weight × mg per kg (per day or per dose), divided over the doses of
 * a day; with a concentration, the volume per dose; with a ceiling the doctor states, the capped dose. The kit holds
 * no medicine, no recommended dose and no ceiling of its own.
 * Stands beside specialties/pediatri/engines/doz.ts → dozHesapla.
 *
 * ── NOTYA-ULKE-ARAC-DUZELTME-01, fault 1. ──
 *   THE VOLUME IS NOT ROUNDED. The tool rounded the volume of one dose to 0.1 mL and showed only the rounded figure:
 *   a baby of 4 kg at 2 mg/kg, liquid of 50 mg in 1 mL — 8 mg, 0.16 mL — was shown "0.2 mL", a quarter more, with no
 *   warning. No source read by the six audits or by this job states a step to round a calculated volume to; the one
 *   practice found (Alberta Health Services, Connect Care, "Decimal precision for oral medication measurements",
 *   2019-11-14, https://support.connect-care.ca/2019/11/14.html, read 2026-10-10: "two digit rounding for volumes of
 *   liquid oral medications <1ml; and one digit rounding for volumes >1ml") is one province's record system and is
 *   NOT adopted here. So the kit rounds to nothing: the volume is the arithmetic's result, written with at least
 *   two decimal places and at least three significant figures (./yazim.ts). 0.16 mL is written "0.16", never "0.2".
 *   TWO CAUTIONS, both visible in the result:
 *     ml_yuvarlanmadi   with every volume: it is a result of arithmetic, not rounded to any measuring device. (NCPDP,
 *                       "Standardize the Dosing Designations on Prescription Container Labels for Oral Liquid
 *                       Medications to Metric (mL) Only", https://www.fda.gov/media/88498/download, read 2026-10-10:
 *                       "Dosing devices should be of appropriate volume and graduated accuracy for the amount prescribed".)
 *     ml_kucuk          where the volume of one dose (or of the capped dose) is below 1 mL. The limit is the one the
 *                       practice cited above treats differently; it is a caution, not a rounding rule. (It used to
 *                       appear only below 0.1 mL, the step of the rounding that is gone.)
 *   HOW THE AMOUNTS ARE WRITTEN is the country's rule (`UlkeAraclari.dozYazimi`, required of a pack that switches the
 *   tool on): where a zero after the decimal mark is forbidden, 5 mL is written "5 mL" and 160 mg "160 mg"; where the
 *   national order itself writes "1,0", the decimals stand. Every amount of a medicine in the result is marked `doz`.
 *   A small amount is never written "0.00": at least three significant figures.
 */
/** The volume of one dose below which the result carries the small-volume caution, in mL. */
export const KUCUK_HACIM_ML = 1
const dozSayisi = (anahtar: string, deger: number, birim: string): AracSayisi => ({ anahtar, deger, ondalik: 2, anlamli: 3, birim, doz: true })
export const DOZ_HESABI: AracTanimi = {
  anahtar: 'doz-hesabi',
  tur: 'hesap',
  alanlar: [
    sayi('kilo', 0.3, 300, { olcu: 'agirlik' }), sayi('mg_kg', 0.001, 1000, { birim: 'mg/kg' }), secim('mod', ['gun', 'doz']), puan('doz_sayisi', 1, 6),
    sayi('kons_mg', 0.001, 100000, { birim: 'mg', istege: true }), sayi('kons_ml', 0.001, 10000, { birim: 'mL', istege: true }),
    sayi('tavan_doz_mg', 0.001, 100000, { birim: 'mg', istege: true }), sayi('tavan_gun_mg', 0.001, 100000, { birim: 'mg', istege: true }),
  ],
  cikti: { sayilar: ['doz_mg', 'gunluk_mg', 'aralik_saat', 'doz_ml', 'gunluk_ml', 'tavanli_doz_mg', 'tavanli_doz_ml'], bantlar: [], uyarilar: ['tavan_doz', 'tavan_gun', 'kilo_birim', 'ml_yuvarlanmadi', 'ml_kucuk'], tarihler: [] },
  sonucBirimleri: ['mg', 'mL', 'saat'],
  dozYazar: true,
  kaynak: null,
  hesapla: (g) => {
    if (!sayiMi(g.kilo) || !sayiMi(g.mg_kg) || !sayiMi(g.doz_sayisi) || (g.mod !== 'gun' && g.mod !== 'doz')) return BOS_SONUC
    const n = g.doz_sayisi
    const gunlukMg = g.mod === 'gun' ? g.kilo * g.mg_kg : g.kilo * g.mg_kg * n
    const dozMg = gunlukMg / n
    const mgPerMl = sayiMi(g.kons_mg) && sayiMi(g.kons_ml) ? g.kons_mg / g.kons_ml : null
    const ml = (mg: number) => (mgPerMl ? mg / mgPerMl : null)
    const tDoz = sayiMi(g.tavan_doz_mg) ? g.tavan_doz_mg : null, tGun = sayiMi(g.tavan_gun_mg) ? g.tavan_gun_mg : null
    const asim = Boolean((tDoz && dozMg > tDoz) || (tGun && gunlukMg > tGun))
    const sinir = asim ? Math.min(tDoz ?? Infinity, tGun ? tGun / n : Infinity, dozMg) : null
    const dozMl = ml(dozMg), sinirMl = sinir !== null ? ml(sinir) : null, gunlukMl = ml(gunlukMg)
    const kucuk = (dozMl !== null && dozMl < KUCUK_HACIM_ML) || (sinirMl !== null && sinirMl < KUCUK_HACIM_ML)
    return {
      tamam: true,
      sayilar: [
        dozSayisi('doz_mg', dozMg, 'mg'), dozSayisi('gunluk_mg', gunlukMg, 'mg'), { anahtar: 'aralik_saat', deger: 24 / n, ondalik: 1, birim: 'saat' },
        // THE ARITHMETIC'S OWN RESULT: no rounding to a step of any measuring device
        ...(dozMl !== null ? [dozSayisi('doz_ml', dozMl, 'mL')] : []), ...(gunlukMl !== null ? [dozSayisi('gunluk_ml', gunlukMl, 'mL')] : []),
        ...(sinir !== null ? [dozSayisi('tavanli_doz_mg', sinir, 'mg')] : []), ...(sinirMl !== null ? [dozSayisi('tavanli_doz_ml', sinirMl, 'mL')] : []),
      ],
      bant: null,
      uyarilar: [...(tDoz && dozMg > tDoz ? ['tavan_doz'] : []), ...(tGun && gunlukMg > tGun ? ['tavan_gun'] : []), ...(g.kilo > 150 ? ['kilo_birim'] : []), ...(dozMl !== null ? ['ml_yuvarlanmadi'] : []), ...(kucuk ? ['ml_kucuk'] : [])],
      tarihler: [],
    }
  },
}

// ───────────────────────── plastic surgery ─────────────────────────

/**
 * Wound, graft or flap follow-up: what, where, the day of the procedure, of the next dressing and of suture removal.
 * The other application proposes "three days after the procedure" for a graft or a flap; the kit proposes nothing.
 * Stands beside specialties/plastik-cerrahi/engines/yara.ts → yaraSkorla, yaraGorevleri.
 */
export const PLASTIK_YARA_TIPLERI = ['yara', 'greft', 'flep', 'dikis', 'pansiyel', 'diger'] as const
export const PLASTIK_YARA: AracTanimi = {
  anahtar: 'plastik-yara-greft',
  tur: 'takvim',
  alanlar: [secim('tip', PLASTIK_YARA_TIPLERI), metin('bolge', { istege: false }), metin('taraf'), tarih('islem', true), tarih('pansuman', true), tarih('dikis_alma', true)],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['islem', 'pansuman', 'dikis_alma'] },
  kaynak: null,
  hesapla: (g) => (typeof g.tip === 'string' && typeof g.bolge === 'string' && g.bolge ? { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: verilen(g, ['islem', 'pansuman', 'dikis_alma']) } : BOS_SONUC),
}

// ───────────────────────── radiology ─────────────────────────

/** One examination on the worklist: modality, priority, where it stands, its day; what comes next follows from where it stands. Stands beside specialties/radyoloji/engines/kuyruk.ts → kuyrukSkorla. */
export const RADYO_MODALITELER = ['xray', 'us', 'bt', 'mri', 'mamografi', 'pet', 'diger'] as const
export const RADYO_ONCELIKLER = ['acil', 'ayni_gun', 'rutin', 'kontrol'] as const
export const RADYO_DURUMLAR = ['bekliyor', 'cekildi', 'rapor_hazir', 'arsiv'] as const
export const TETKIK_KUYRUGU: AracTanimi = {
  anahtar: 'tetkik-kuyrugu',
  tur: 'liste',
  alanlar: [secim('modalite', RADYO_MODALITELER), secim('oncelik', RADYO_ONCELIKLER), secim('durum', RADYO_DURUMLAR), tarih('tarih', true)],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['kuyrukta', 'rapor_bekliyor', 'rapor_klinisyen'], tarihler: ['tarih'] },
  kaynak: null,
  hesapla: (g) => {
    if (typeof g.modalite !== 'string' || typeof g.oncelik !== 'string' || typeof g.durum !== 'string') return BOS_SONUC
    return { tamam: true, sayilar: [], bant: null, uyarilar: g.durum === 'bekliyor' ? ['kuyrukta'] : g.durum === 'cekildi' ? ['rapor_bekliyor'] : g.durum === 'rapor_hazir' ? ['rapor_klinisyen'] : [], tarihler: verilen(g, ['tarih']) }
  },
}

/**
 * Structured report draft: the assessment category the radiologist chose (BI-RADS 0 to 6, or a general report) and
 * the sections the report has. The tool writes no finding and chooses no category.
 * Category names: American College of Radiology. ACR BI-RADS Atlas, 5th ed. Reston, VA: ACR; 2013.
 * Stands beside specialties/radyoloji/engines/rapor.ts → raporSkorla.
 */
export const RAPOR_KATEGORILERI = ['0', '1', '2', '3', '4', '5', '6', 'genel'] as const
export const RAPOR_BOLUMLERI = ['endikasyon', 'teknik', 'bulgular_yapilandirilmis', 'karsilastirma', 'sonuc_ozet', 'onerilen_izlem', 'klinisyen_bildirim'] as const
export const RAPOR_TASLAGI: AracTanimi = kontrolListesi({
  anahtar: 'rapor-taslagi', maddeler: RAPOR_BOLUMLERI, ek: [secim('kategori', RAPOR_KATEGORILERI)],
  kural: (_s, g) => typeof g.kategori === 'string',
  bantlar: RAPOR_KATEGORILERI, bant: (_s, g) => g.kategori as string,
  uyarilar: ['rapor_izlem', 'klinisyen_bildirim'],
  uyari: (s, g) => [...(s.includes('onerilen_izlem') ? ['rapor_izlem'] : []), ...(s.includes('klinisyen_bildirim') || g.kategori === '4' || g.kategori === '5' ? ['klinisyen_bildirim'] : [])],
  kaynak: 'American College of Radiology. ACR BI-RADS Atlas, 5th ed. Reston, VA: ACR; 2013.',
})

// ───────────────────────── rheumatology ─────────────────────────

/**
 * DAS28 with CRP or with ESR: tender and swollen joints of 28, the patient's global assessment (0 to 100 mm) and
 * the inflammatory marker. DAS28-CRP = 0.56·√TJC + 0.28·√SJC + 0.36·ln(CRP + 1) + 0.014·PGA + 0.96;
 * DAS28-ESR = 0.56·√TJC + 0.28·√SJC + 0.70·ln(ESR) + 0.014·PGA. Bands: below 2.6 remission, below 3.2 low,
 * up to 5.1 moderate, above high.
 *
 * THE UNIT OF C-REACTIVE PROTEIN IS STATED, NEVER ASSUMED (NOTYA-ULKE-ARAC-DUZELTME-01, fault 12). The formula takes
 * CRP in mg/L (the developers' calculator labels the field "CRP (mg/l)":
 * https://www.das-score.nl/das28/DAScalculators/DAS28_CRP_4VAR.html, read 2026-10-10). The field is now the kit's
 * quantity `crp`: each pack says which unit its laboratories report (mg/L, mg/dL, or both — then the doctor chooses
 * beside the field, and a number without its unit gives no result). A result of 10 mg/L typed as "1.0" in a mg/L
 * field gave 3.43 where the score is 4.04; typed as 1.0 with "mg/dL" chosen it is 4.04.
 * The formulas and the four bands were checked by the audits and are unchanged.
 * Sources: Prevoo MLL, van 't Hof MA, Kuper HH, et al. Arthritis Rheum 1995;38:44–48. Fransen J, van Riel PLCM.
 * Clin Exp Rheumatol 2005;23(Suppl 39):S93–S99. Stands beside specialties/romatoloji/engines/das28Basdai.ts → das28Skorla.
 */
export const DAS28: AracTanimi = {
  anahtar: 'das28',
  tur: 'hesap',
  alanlar: [secim('varyant', ['crp', 'esr']), sayi('tjc', 0, 28, { tam: true }), sayi('sjc', 0, 28, { tam: true }), sayi('pga', 0, 100, { birim: 'mm' }), sayi('crp', 0, 500, { lab: 'crp', kosul: { alan: 'varyant', degerler: ['crp'] } }), sayi('esr', 1, 200, { birim: 'mm/saat', kosul: { alan: 'varyant', degerler: ['esr'] } })],
  cikti: { sayilar: ['das28'], bantlar: ['remisyon', 'dusuk', 'orta', 'yuksek'], uyarilar: [], tarihler: [] },
  // Nothing else in the result follows from the band: a country may state its own bands over the score.
  bantSerbest: true,
  kaynak: 'Prevoo MLL, van \'t Hof MA, Kuper HH, et al. Arthritis Rheum 1995;38:44-48. Fransen J, van Riel PLCM. Clin Exp Rheumatol 2005;23(Suppl 39):S93-S99.',
  hesapla: (g) => {
    if (!sayiMi(g.tjc) || !sayiMi(g.sjc) || !sayiMi(g.pga)) return BOS_SONUC
    const ortak = 0.56 * Math.sqrt(g.tjc) + 0.28 * Math.sqrt(g.sjc) + 0.014 * g.pga
    const ham = g.varyant === 'crp' && sayiMi(g.crp) ? ortak + 0.36 * Math.log(g.crp + 1) + 0.96 : g.varyant === 'esr' && sayiMi(g.esr) ? ortak + 0.70 * Math.log(Math.max(g.esr, 1)) : null
    if (ham === null) return BOS_SONUC
    const v = Math.round(ham * 100) / 100
    return { tamam: true, sayilar: [{ anahtar: 'das28', deger: v, ondalik: 2 }], bant: v < 2.6 ? 'remisyon' : v < 3.2 ? 'dusuk' : v <= 5.1 ? 'orta' : 'yuksek', uyarilar: [], tarihler: [] }
  },
}

/** The 28-joint count: which joints are tender and which are swollen → the two counts DAS28 takes. Stands beside specialties/romatoloji/engines/eklemHaritasi.ts → eklemSay. */
export const EKLEM_28 = ['sag_omuz', 'sol_omuz', 'sag_dirsek', 'sol_dirsek', 'sag_el_bilegi', 'sol_el_bilegi', ...['sag', 'sol'].flatMap((y) => [1, 2, 3, 4, 5].map((n) => `${y}_mcp${n}`)), ...['sag', 'sol'].flatMap((y) => [1, 2, 3, 4, 5].map((n) => `${y}_pip${n}`)), 'sag_diz', 'sol_diz'] as readonly string[]
export const EKLEM_SAYIMI: AracTanimi = {
  anahtar: 'eklem-28',
  tur: 'liste',
  alanlar: [isaret('degerlendirildi'), ...EKLEM_28.map((e) => isaret(`h_${e}`)), ...EKLEM_28.map((e) => isaret(`s_${e}`))],
  cikti: { sayilar: ['tjc', 'sjc'], bantlar: [], uyarilar: [], tarihler: [] },
  kaynak: 'Prevoo MLL, van \'t Hof MA, Kuper HH, et al. Arthritis Rheum 1995;38:44-48.',
  hesapla: (g) => (g.degerlendirildi === true
    ? { tamam: true, sayilar: [{ anahtar: 'tjc', deger: isaretliler(g, EKLEM_28.map((e) => `h_${e}`)).length, ondalik: 0, enCok: 28 }, { anahtar: 'sjc', deger: isaretliler(g, EKLEM_28.map((e) => `s_${e}`)).length, ondalik: 0, enCok: 28 }], bant: null, uyarilar: [], tarihler: [] }
    : BOS_SONUC),
}

/**
 * CRP or ESR follow-up: the band a value falls in and the month of the next check — every threshold and interval
 * the pack's. Stands beside specialties/romatoloji/engines/labIzlem.ts → labSkorla, sonrakiIzlemTarihi.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01 (fault 12): the value has a field of its own for each marker, so that each carries its
 * unit — C-reactive protein is the kit's quantity `crp` (typed in the pack's unit), the sedimentation rate is in
 * mm/h — and the two CRP thresholds are LABORATORY VALUES: a pack states each with its unit (`parametreOlculeri`).
 */
export const ILTIHAP_LAB_IZLEM: AracTanimi = {
  anahtar: 'iltihap-lab-izlem',
  tur: 'hesap',
  alanlar: [secim('tur', ['crp', 'esr']), sayi('crp', 0, 500, { lab: 'crp', kosul: { alan: 'tur', degerler: ['crp'] } }), sayi('esr', 0, 500, { birim: 'mm/saat', kosul: { alan: 'tur', degerler: ['esr'] } }), tarih('tarih', true)],
  parametreler: ['crp_dikkat', 'crp_yuksek', 'esr_dikkat', 'esr_yuksek', 'ay_hedef', 'ay_dikkat', 'ay_yuksek'],
  parametreOlculeri: { crp_dikkat: 'crp', crp_yuksek: 'crp' },
  cikti: { sayilar: ['sonraki_ay'], bantlar: ['hedef_yakin', 'dikkat', 'yuksek'], uyarilar: [], tarihler: ['sonraki'] },
  sonucBirimleri: ['ay'],
  kaynak: null,
  hesapla: (g, { p }) => {
    if (g.tur !== 'crp' && g.tur !== 'esr') return BOS_SONUC
    const deger = g[g.tur]
    if (!sayiMi(deger)) return BOS_SONUC
    const bant = deger < p[`${g.tur}_dikkat`] ? 'hedef_yakin' : deger < p[`${g.tur}_yuksek`] ? 'dikkat' : 'yuksek'
    const ay = p[`ay_${bant === 'hedef_yakin' ? 'hedef' : bant}`]
    return { tamam: true, sayilar: [{ anahtar: 'sonraki_ay', deger: ay, ondalik: 0, birim: 'ay' }], bant, uyarilar: [], tarihler: gunMu(g.tarih) ? [{ anahtar: 'sonraki', tarih: ayEkle(g.tarih, ay) }] : [] }
  },
}

// ───────────────────────── sports medicine ─────────────────────────

/**
 * Return to sport after an injury: the day of the injury, the days since it, and — WHERE THE COUNTRY HAS SUPPLIED ITS
 * OWN STEPS — the step the athlete is on, as the doctor decides, held against that step's earliest day.
 * Stands beside specialties/spor-hekimligi/engines/rtp.ts → rtpDegerlendir (which has a staging of its own; the kit
 * has none, and the comparison test says so).
 *
 * ── NOTYA-ULKE-ARAC-DUZELTME-01, fault 7 — THE KIT HOLDS NO STAGING. ──
 *   The tool offered six stages numbered 0 to 5, beginning with "rest and control of symptoms", in every country. They
 *   match no country's guideline read by the audits: each one numbers its steps 1 to 6, names them otherwise, and
 *   several set earliest days counted from the injury (the United Kingdom, Australia and New Zealand: competition not
 *   before day 21), so that "stage 5: return to competition" could be recorded on day 3 without a word. Opened here on
 *   2026-10-10, as one example of the mismatch: Centers for Disease Control and Prevention, HEADS UP, "Returning to
 *   Sports", https://www.cdc.gov/heads-up/guidelines/returning-to-sports.html — six steps, 1 "Back to regular
 *   activities" to 6 "Competition", each of which "typically takes a minimum of 24 hours".
 *   So the made-up staging is gone, and THE STEPS ARE A TABLE THE COUNTRY SUPPLIES (`tablolar.basamaklar`, a table it
 *   may supply): one row per step, in order —
 *       basamak        the step's key (the pack names it: it is an option of the field `basamak` and the band)
 *       en_erken_gun   the earliest day of that step, in whole days AFTER the day of the injury (the day of the
 *                      injury is day 0); 0 = the country's guideline sets no earliest day for the step
 *   WITH THE COUNTRY'S STEPS: the doctor enters the day of the injury and chooses the step; the result shows the day
 *   count, the step, its earliest day as a date, and a warning when today is before it (`erken`).
 *   WITHOUT THEM — every pack today — the field `basamak` is not there: the result is the number of days since the
 *   injury, and a line that says no steps have been set for this country (`basamak_tanimsiz`). No stage is shown.
 *   What a table of earliest days cannot hold (a minimum time AT each step; days free of symptoms; medical clearance
 *   between two steps) is not built: a country that needs it brings a tool of its own.
 */
export const RTP_BASAMAK: AracTanimi = {
  anahtar: 'rtp-basamak',
  tur: 'takvim',
  alanlar: [tarih('yaralanma'), { anahtar: 'basamak', tur: 'secim', secenekler: [], tablodan: { tablo: 'basamaklar', sutun: 'basamak' } }],
  tablolar: [{ anahtar: 'basamaklar', istege: true, sutunlar: [{ anahtar: 'basamak', tur: 'anahtar' }, { anahtar: 'en_erken_gun', tur: 'sayi' }] }],
  bantAlani: 'basamak',
  cikti: { sayilar: ['gun'], bantlar: [], uyarilar: ['basamak_tanimsiz', 'erken'], tarihler: ['en_erken'] },
  sonucBirimleri: ['gun'],
  kaynak: null,
  hesapla: (g, { bugun, t }) => {
    if (!gunMu(g.yaralanma)) return BOS_SONUC
    const gun = gunFarki(g.yaralanma, bugun)
    // an injury that has not happened yet is not an injury
    if (gun < 0) return BOS_SONUC
    const gunSayisi: AracSayisi = { anahtar: 'gun', deger: gun, ondalik: 0, birim: 'gun' }
    const satirlar = t?.basamaklar
    if (!satirlar || !satirlar.length) return { tamam: true, sayilar: [gunSayisi], bant: null, uyarilar: ['basamak_tanimsiz'], tarihler: [] }
    // THE COUNTRY HAS STEPS: the doctor chooses one, and there is no result until one is chosen.
    const satir = typeof g.basamak === 'string' ? satirlar.find((x) => x.basamak === g.basamak) : undefined
    if (!satir || !sayiMi(satir.en_erken_gun) || !Number.isInteger(satir.en_erken_gun) || satir.en_erken_gun < 0) return BOS_SONUC
    const enErken = satir.en_erken_gun
    return { tamam: true, sayilar: [gunSayisi], bant: g.basamak as string, uyarilar: gun < enErken ? ['erken'] : [], tarihler: enErken > 0 ? [{ anahtar: 'en_erken', tarih: gunEkle(g.yaralanma, enErken) }] : [] }
  },
}

/**
 * Injury log: where, how, how severe, where it stands; and from the minutes of load in the last seven days and the
 * earlier weekly average their ratio, held against the two figures of the paper it cites.
 * Source: Gabbett TJ. The training–injury prevention paradox. Br J Sports Med 2016;50:273–280.
 * Stands beside specialties/spor-hekimligi/engines/sakatlik.ts → sakatlikDegerlendir, yuklenmeUyariHesapla.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01, fault 10 — A RATIO OF EXACTLY 1.3 IS INSIDE THE PAPER'S LOW-RISK RANGE. The tool warned
 * from 1.3 inclusive: 390 minutes this week against a usual 300 (ratio 1.3) "needs attention". Source opened on
 * 2026-10-10, https://bjsm.bmj.com/content/50/5/273: "acute:chronic workload ratios within the range of 0.8–1.3 could
 * be considered the training ‘sweet spot’" and "acute:chronic workload ratios ≥1.5 represent the ‘danger zone’".
 * Now: `yuklenme_yuksek` at 1.5 or above (the paper's "danger zone"); `yuklenme_dikkat` ABOVE 1.3 and below 1.5 — the
 * paper states no risk for that stretch, and the pack's words say only that the ratio is above the range the paper
 * calls the sweet spot. Exactly 1.3 raises nothing. The two comparisons are made on hundredths of a minute, so that
 * a ratio that is exactly 1.3 or 1.5 is never moved across its limit by the division.
 * STILL TRUE, and said in the pack's description: the paper's load is effort multiplied by minutes ("RPE units×minutes")
 * and its chronic load "the rolling average of the most recent 3–6 weeks"; this tool divides minutes by minutes.
 */
export const SAKATLIK_BOLGELERI = ['diz', 'ayak_bilegi', 'kalca', 'omuz', 'dirsek', 'el_bilegi', 'bel', 'boyun', 'kas_bacak', 'kas_govde', 'kas_ust', 'bas_boyun', 'diger'] as const
export const SAKATLIK_MEKANIZMALARI = ['temas', 'temassiz', 'asiri_kullanim', 'asiri_gerilme', 'bilinmiyor'] as const
/** Which of the cited paper's two figures a ratio of `dk7` to `dkOnceki` is past: at or above 1.5; above 1.3; neither. */
export function yuklenmeDuzeyi(dk7: number, dkOnceki: number): 'yuklenme_yuksek' | 'yuklenme_dikkat' | null {
  const a = Math.round(dk7 * 100), b = Math.round(dkOnceki * 100)
  return a * 2 >= b * 3 ? 'yuklenme_yuksek' : a * 10 > b * 13 ? 'yuklenme_dikkat' : null
}
export const SAKATLIK_GUNLUGU: AracTanimi = {
  anahtar: 'sakatlik-gunlugu',
  tur: 'liste',
  alanlar: [secim('bolge', SAKATLIK_BOLGELERI), secim('mekanizma', SAKATLIK_MEKANIZMALARI, true), secim('siddet', ['hafif', 'orta', 'agir'], true), secim('durum', ['aktif', 'iyilesiyor', 'kapandi'], true), sayi('dk_7gun', 0, 10000, { birim: 'dk', istege: true }), sayi('dk_onceki', 0, 10000, { birim: 'dk', istege: true })],
  cikti: { sayilar: ['yuklenme_orani'], bantlar: [], uyarilar: ['yuklenme_yuksek', 'yuklenme_dikkat'], tarihler: [] },
  kaynak: 'Gabbett TJ. Br J Sports Med 2016;50:273-280.',
  hesapla: (g) => {
    if (typeof g.bolge !== 'string') return BOS_SONUC
    const olculdu = sayiMi(g.dk_7gun) && sayiMi(g.dk_onceki) && g.dk_onceki > 0
    const duzey = olculdu ? yuklenmeDuzeyi(g.dk_7gun as number, g.dk_onceki as number) : null
    // two places: 1.26 and 1.34 are not both "1.3"
    return { tamam: true, sayilar: olculdu ? [{ anahtar: 'yuklenme_orani', deger: (g.dk_7gun as number) / (g.dk_onceki as number), ondalik: 2 }] : [], bant: null, uyarilar: duzey ? [duzey] : [], tarihler: [] }
  },
}

// ───────────────────────── urology ─────────────────────────

/**
 * PSA velocity: two values with their days → the change per year (the difference divided by the years between).
 * No band and no threshold: those are the country's guidance. Stands beside specialties/uroloji/engines/psa.ts → skorlaSeri.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01, fault 14.
 *   THE UNIT IS THE PACK'S. The two values are the kit's quantity `psa`: a pack that switches the tool on says which
 *   unit its laboratories print (`labBirimleri.psa`: "ng/mL" or "ug/L" — the same amount written two ways, so the
 *   number is not changed, only its label), and the yearly change is written in that unit (`sonucLabEkleri`). The
 *   fields used to carry "ng/mL" for every country, and a country that writes µg/L could only rename the code.
 *   THE CAUTION ABOUT A SHORT INTERVAL CAN BE TURNED OFF OR MOVED by a country: `kisa_aralik_gun` (a number it may
 *   state) = the caution appears when the two measurements are fewer than this many days apart; 0 = never. Where a
 *   pack states nothing the limit is 90 days, AS IT WAS. That figure is the pre-split tool's own: no source for it
 *   was found, and it was left because nothing read says what else it should be — a national guideline that asks
 *   for a repeat test after 6 to 12 weeks (New Zealand's, per its audit) makes the caution appear on every repeat it
 *   asks for, and that country can now turn it off.
 */
export const PSA_KISA_ARALIK_GUN = 90
export const PSA_HIZI: AracTanimi = {
  anahtar: 'psa-hizi',
  tur: 'hesap',
  alanlar: [sayi('onceki_deger', 0, 1000, { lab: 'psa' }), tarih('onceki_tarih'), sayi('son_deger', 0, 1000, { lab: 'psa' }), tarih('son_tarih')],
  secimlikParametreler: ['kisa_aralik_gun'],
  cikti: { sayilar: ['hiz', 'gun'], bantlar: [], uyarilar: ['kisa_aralik'], tarihler: [] },
  sonucBirimleri: ['gun'],
  sonucLabEkleri: { psa: '/yil' },
  kaynak: null,
  hesapla: (g, { p }) => {
    if (!sayiMi(g.onceki_deger) || !sayiMi(g.son_deger) || !gunMu(g.onceki_tarih) || !gunMu(g.son_tarih)) return BOS_SONUC
    const gun = gunFarki(g.onceki_tarih, g.son_tarih)
    if (gun <= 0) return BOS_SONUC
    const esik = sayiMi(p.kisa_aralik_gun) ? p.kisa_aralik_gun : PSA_KISA_ARALIK_GUN
    // the yearly change is written in the unit the latest value was typed in (the two units are the same amount)
    const birim = `${yazilanBirim(g, 'son_deger', LAB_BIRIMLERI.psa.kanonik)}/yil`
    return { tamam: true, sayilar: [{ anahtar: 'hiz', deger: Math.round(((g.son_deger - g.onceki_deger) / (gun / 365)) * 100) / 100 + 0, ondalik: 2, birim }, { anahtar: 'gun', deger: gun, ondalik: 0, birim: 'gun' }], bant: null, uyarilar: gun < esik ? ['kisa_aralik'] : [], tarihler: [] }
  },
}

export const ORTO_PEDI_RADYO_ROMA: readonly AracTanimi[] = [KIRIK_ALCI, ORTOPEDI_OP_PROTOKOL, VAS_FONKSIYON, HEDEF_BOY, DOZ_HESABI, PLASTIK_YARA, TETKIK_KUYRUGU, RAPOR_TASLAGI, DAS28, EKLEM_SAYIMI, ILTIHAP_LAB_IZLEM, RTP_BASAMAK, SAKATLIK_GUNLUGU, PSA_HIZI]
