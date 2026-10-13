/**
 * NOTYA-ULKE-ARACLAR-01 — structural tools for specialties and clinic roles whose grids had no tool of their own.
 * Keys, fields and arithmetic only. No sentence a doctor reads is here.
 *
 * Each one RECORDS what the clinician enters, or repeats a reminder day this product already uses. None of them
 * states a national schedule, a dose, a diagnosis, a payer rule or an emergency number. A pack that has no role for
 * a tool keeps the tool as a slot; a pack that has closed a tool does not list it.
 *
 * The pre-split counterparts return sentences, unsourced bands, default months, or a payer note. They are named in
 * lib/ulke/araclar/esdegerlik.test.ts (`KARSILIKSIZ`) and are not imported here.
 */
import type { AracGirdisi, AracTanimi } from '../tipler'
import { BOS_SONUC, gunEkle, gunFarki, gunMu, isaret, isaretliler, metin, sayi, sayiMi, secim, tarih } from '../yardimci'

/** A day the product reminds the clinician of, counted from a start day the clinician enters. */
const VADE = [
  { anahtar: 'sac-bakim-vade', gunler: [1, 3, 10, 14] },
  { anahtar: 'estetik-cerrahi-vade', gunler: [1, 7, 14, 42] },
  { anahtar: 'estetik-islem-vade', gunler: [1, 14, 28] },
  { anahtar: 'akne-vade', gunler: [14, 42, 84] },
] as const

const gunAnahtar = (gun: number): string => `gun_${gun}`

function vadeAraci(anahtar: string, gunler: readonly number[]): AracTanimi {
  const anahtarlar = gunler.map(gunAnahtar)
  return {
    anahtar,
    tur: 'takvim',
    alanlar: [tarih('baslangic')],
    cikti: { sayilar: [], bantlar: [], uyarilar: anahtarlar.map((k) => `gecikti_${k}`), tarihler: ['baslangic', ...anahtarlar] },
    kaynak: null,
    hesapla: (g, ortam) => {
      if (!gunMu(g.baslangic)) return BOS_SONUC
      const baslangic = g.baslangic
      const tarihler = [{ anahtar: 'baslangic', tarih: baslangic }, ...gunler.map((gun) => ({ anahtar: gunAnahtar(gun), tarih: gunEkle(baslangic, gun) }))]
      const bugun = gunMu(ortam.bugun) ? ortam.bugun : null
      const uyarilar = bugun ? gunler.filter((gun) => bugun > gunEkle(baslangic, gun)).map((gun) => `gecikti_${gunAnahtar(gun)}`) : []
      return { tamam: true, sayilar: [], bant: null, uyarilar, tarihler }
    },
  }
}

/**
 * Signs the clinician ticks. `yok` means none of them. Complete when either `yok` alone or one or more signs.
 * `yok` together with a sign is not a result. A sign raises `uyari`; `yok` raises none. No number is named.
 */
function bayrak(anahtar: string, isaretler: readonly string[], uyari: string): AracTanimi {
  return {
    anahtar,
    tur: 'liste',
    alanlar: [...isaretler.map(isaret), isaret('yok')],
    cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: [uyari], tarihler: [] },
    kaynak: null,
    hesapla: (g) => {
      const secili = isaretliler(g, isaretler)
      const yok = g.yok === true
      if ((yok && secili.length > 0) || (!yok && secili.length === 0)) return BOS_SONUC
      return { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: isaretler.length }], bant: null, uyarilar: secili.length ? [uyari] : [], tarihler: [] }
    },
  }
}

const sonraki = (g: AracGirdisi): { anahtar: string; tarih: string }[] => (gunMu(g.sonraki) ? [{ anahtar: 'sonraki', tarih: g.sonraki }] : [])

/** Endoscopy record: type and date the clinician enters, optional ticks, optional next date. No default month. */
const ENDOSKOPI_TIPLERI = ['ust', 'kolonoskopi', 'sigmoidoskopi', 'ercp', 'diger'] as const
const KRONIK_TIPLERI = ['ht', 'dm', 'kkh', 'koah', 'diger'] as const
const KARDIYO_TIPLERI = ['ht', 'kky', 'af', 'diger'] as const
const NYHA = ['i', 'ii', 'iii', 'iv'] as const
const icinde = (liste: readonly string[], x: unknown): x is string => typeof x === 'string' && liste.includes(x)
const ENDOSKOPI_ISARET = ['rapor', 'biyopsi', 'bilgilendirme'] as const
const ENDOSKOPI_KAYDI: AracTanimi = {
  anahtar: 'endoskopi-kaydi',
  tur: 'liste',
  alanlar: [secim('tip', ENDOSKOPI_TIPLERI), tarih('tarih'), ...ENDOSKOPI_ISARET.map(isaret), tarih('sonraki', true)],
  cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: [], tarihler: ['tarih', 'sonraki'] },
  kaynak: null,
  hesapla: (g) => {
    if (!icinde(ENDOSKOPI_TIPLERI, g.tip) || !gunMu(g.tarih)) return BOS_SONUC
    const secili = isaretliler(g, ENDOSKOPI_ISARET)
    return { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: ENDOSKOPI_ISARET.length }], bant: null, uyarilar: [], tarihler: [{ anahtar: 'tarih', tarih: g.tarih }, ...sonraki(g)] }
  },
}

/** Chronic-condition record: the kind, optional ticks, optional next date. No 3-month or 6-month default. */
const KRONIK_ISARET = ['ilac', 'olcum', 'gorusme'] as const
const KRONIK_IZLEM: AracTanimi = {
  anahtar: 'kronik-izlem-kaydi',
  tur: 'liste',
  alanlar: [secim('tip', KRONIK_TIPLERI), ...KRONIK_ISARET.map(isaret), tarih('sonraki', true)],
  cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: [], tarihler: ['sonraki'] },
  kaynak: null,
  hesapla: (g) => {
    if (!icinde(KRONIK_TIPLERI, g.tip)) return BOS_SONUC
    const secili = isaretliler(g, KRONIK_ISARET)
    return { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: KRONIK_ISARET.length }], bant: null, uyarilar: [], tarihler: sonraki(g) }
  },
}

const BIRINCI_ACIL = bayrak('birinci-acil-bayrak', ['inme', 'gogus', 'nefes', 'kanama', 'bilinc', 'anafilaksi'], 'acil')
const INME_BAYRAK = bayrak('inme-bayraklari', ['yuz', 'kol', 'konusma', 'ani_bas'], 'acil')
const PSIKIYATRI_GUVENLIK = bayrak('psikiyatri-guvenlik', ['intihar', 'kendine', 'siddet', 'psikoz'], 'guvenlik')

/** Session plan: region, at least one modality, session count 1–60, times per week 1–7. No payer cap. */
const SEANS_MODALITE = ['isi', 'soguk', 'tens', 'ultrason', 'diyatermi', 'egzersiz', 'manuel', 'traksiyon', 'hidro', 'ortez'] as const
const SEANS_PLANI: AracTanimi = {
  anahtar: 'seans-plani',
  tur: 'liste',
  alanlar: [metin('bolge'), ...SEANS_MODALITE.map(isaret), sayi('seans', 1, 60, { tam: true }), sayi('haftalik', 1, 7, { tam: true }), tarih('sonraki', true)],
  cikti: { sayilar: ['isaretli', 'seans', 'haftalik'], bantlar: [], uyarilar: [], tarihler: ['sonraki'] },
  kaynak: null,
  hesapla: (g) => {
    const secili = isaretliler(g, SEANS_MODALITE)
    if (!secili.length || !sayiMi(g.seans) || !sayiMi(g.haftalik)) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [
        { anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: SEANS_MODALITE.length },
        { anahtar: 'seans', deger: g.seans, ondalik: 0 },
        { anahtar: 'haftalik', deger: g.haftalik, ondalik: 0 },
      ],
      bant: null, uyarilar: [], tarihler: sonraki(g),
    }
  },
}

/** Functioning summary: the four domains, and the physician's plan must be on file. No scale wording. */
const ICF_ALAN = ['vucut', 'aktivite', 'katilim', 'cevre'] as const
const ICF_OZET: AracTanimi = {
  anahtar: 'icf-ozet',
  tur: 'liste',
  alanlar: [...ICF_ALAN.map(isaret), isaret('hekim_plani'), tarih('sonraki', true)],
  cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: [], tarihler: ['sonraki'] },
  kaynak: null,
  hesapla: (g) => {
    if (g.hekim_plani !== true) return BOS_SONUC
    const secili = isaretliler(g, ICF_ALAN)
    return { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: ICF_ALAN.length }], bant: null, uyarilar: [], tarihler: sonraki(g) }
  },
}

/**
 * Graft count: area × density, rounded to a whole number. Entry bounds only (area above 0 and at most 400;
 * density 1 to 120). No band.
 */
const GREFT_TAHMINI: AracTanimi = {
  anahtar: 'greft-tahmini',
  tur: 'hesap',
  alanlar: [sayi('alan', 0.1, 400, { birim: 'cm2' }), sayi('yogunluk', 1, 120, { tam: true, birim: '1/cm2' })],
  cikti: { sayilar: ['greft'], bantlar: [], uyarilar: [], tarihler: [] },
  kaynak: null,
  hesapla: (g) => {
    if (!sayiMi(g.alan) || !sayiMi(g.yogunluk) || g.alan <= 0 || g.alan > 400 || g.yogunluk < 1 || g.yogunluk > 120) return BOS_SONUC
    return { tamam: true, sayilar: [{ anahtar: 'greft', deger: Math.round(g.alan * g.yogunluk), ondalik: 0 }], bant: null, uyarilar: [], tarihler: [] }
  },
}

const SAC_BAKIM = vadeAraci('sac-bakim-vade', VADE[0].gunler)
const ESTETIK_CERRAHI = vadeAraci('estetik-cerrahi-vade', VADE[1].gunler)
const ESTETIK_ISLEM = vadeAraci('estetik-islem-vade', VADE[2].gunler)
const AKNE_VADE = vadeAraci('akne-vade', VADE[3].gunler)

/** Laser interval: the clinician chooses 14 to 90 days. The tool does not propose a day of its own. */
const LAZER_VADE: AracTanimi = {
  anahtar: 'lazer-vade',
  tur: 'takvim',
  alanlar: [tarih('baslangic'), sayi('aralik_gun', 14, 90, { tam: true, birim: 'gun' })],
  cikti: { sayilar: ['aralik_gun'], bantlar: [], uyarilar: ['gecikti'], tarihler: ['baslangic', 'sonraki'] },
  kaynak: null,
  hesapla: (g, ortam) => {
    if (!gunMu(g.baslangic) || !sayiMi(g.aralik_gun) || g.aralik_gun < 14 || g.aralik_gun > 90) return BOS_SONUC
    const sonrakiGun = gunEkle(g.baslangic, g.aralik_gun)
    return {
      tamam: true,
      sayilar: [{ anahtar: 'aralik_gun', deger: g.aralik_gun, ondalik: 0, birim: 'gun' }],
      bant: null,
      uyarilar: gunMu(ortam.bugun) && ortam.bugun > sonrakiGun ? ['gecikti'] : [],
      tarihler: [{ anahtar: 'baslangic', tarih: g.baslangic }, { anahtar: 'sonraki', tarih: sonrakiGun }],
    }
  },
}

/** Infusion safety ticks. The physician's plan must be on file. No mixture, no dose, no emergency number. */
const INFUZYON_GUVENLIK: AracTanimi = {
  anahtar: 'infuzyon-guvenlik',
  tur: 'liste',
  alanlar: [isaret('lot'), isaret('alerji'), isaret('hekim_plani'), tarih('sonraki', true)],
  cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: ['alerji'], tarihler: ['sonraki'] },
  kaynak: null,
  hesapla: (g) => {
    if (g.hekim_plani !== true) return BOS_SONUC
    const secili = isaretliler(g, ['lot', 'alerji', 'hekim_plani'])
    return { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: 3 }], bant: null, uyarilar: g.alerji === true ? ['alerji'] : [], tarihler: sonraki(g) }
  },
}

/**
 * Intake record: the clinician's own kilocalories and grams of protein, and an optional next date.
 * No weight, no multiplier and no band. A pack that measures weight in pounds cannot show a body weight on a shared tool.
 */
const MAKRO_KAYDI: AracTanimi = {
  anahtar: 'makro-kaydi',
  tur: 'liste',
  alanlar: [sayi('kcal', 1, 20000, { tam: true, birim: 'kcal' }), sayi('protein', 1, 500, { tam: true, birim: 'g' }), tarih('sonraki', true)],
  cikti: { sayilar: ['kcal', 'protein'], bantlar: [], uyarilar: [], tarihler: ['sonraki'] },
  sonucBirimleri: ['kcal', 'g'],
  kaynak: null,
  hesapla: (g) => {
    if (!sayiMi(g.kcal) || !sayiMi(g.protein)) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [
        { anahtar: 'kcal', deger: g.kcal, ondalik: 0, birim: 'kcal' },
        { anahtar: 'protein', deger: g.protein, ondalik: 0, birim: 'g' },
      ],
      bant: null, uyarilar: [], tarihler: sonraki(g),
    }
  },
}

/** This session's date and the next date the clinician enters. No proposed gap. */
const SONRAKI_SEANS: AracTanimi = {
  anahtar: 'sonraki-seans',
  tur: 'takvim',
  alanlar: [tarih('tarih'), tarih('sonraki')],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['tarih', 'sonraki'] },
  kaynak: null,
  hesapla: (g) => {
    if (!gunMu(g.tarih) || !gunMu(g.sonraki) || g.sonraki < g.tarih) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'tarih', tarih: g.tarih }, { anahtar: 'sonraki', tarih: g.sonraki }] }
  },
}

/**
 * Cardiology note: the kind, and at least one of pressure or class. Entry bounds on pressure are limits of
 * the field, not diagnostic cut-points: the tool raises no warning from a number. No body weight: a pack that
 * measures weight in pounds cannot show one on a shared tool.
 */
const KARDIYO_NOT: AracTanimi = {
  anahtar: 'kardiyo-not',
  tur: 'liste',
  alanlar: [secim('tip', KARDIYO_TIPLERI), sayi('sistol', 40, 260, { tam: true, birim: 'mmHg', istege: true }), sayi('diyastol', 20, 200, { tam: true, birim: 'mmHg', istege: true }), secim('nyha', NYHA, true), tarih('sonraki', true)],
  cikti: { sayilar: ['sistol', 'diyastol'], bantlar: [], uyarilar: [], tarihler: ['sonraki'] },
  sonucBirimleri: ['mmHg'],
  kaynak: null,
  hesapla: (g) => {
    if (!icinde(KARDIYO_TIPLERI, g.tip)) return BOS_SONUC
    const nyha = icinde(NYHA, g.nyha)
    if (!sayiMi(g.sistol) && !sayiMi(g.diyastol) && !nyha) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [
        ...(sayiMi(g.sistol) ? [{ anahtar: 'sistol', deger: g.sistol, ondalik: 0, birim: 'mmHg' }] : []),
        ...(sayiMi(g.diyastol) ? [{ anahtar: 'diyastol', deger: g.diyastol, ondalik: 0, birim: 'mmHg' }] : []),
      ],
      bant: null, uyarilar: [], tarihler: sonraki(g),
    }
  },
}

/**
 * Days and whole weeks since the last menstrual period the clinician typed, plus an expected date the clinician
 * typed, echoed and not worked out. An entry bound of 0 to 315 days keeps a date from years ago from being read as
 * a current pregnancy. It is not a due-date rule.
 */
const GEBELIK_GUN_AZAMI = 315
const GEBELIK_GUN: AracTanimi = {
  anahtar: 'gebelik-gun',
  tur: 'takvim',
  alanlar: [tarih('sat'), tarih('tahmini', true)],
  cikti: { sayilar: ['gun', 'hafta'], bantlar: [], uyarilar: [], tarihler: ['sat', 'tahmini'] },
  sonucBirimleri: ['gun', 'hafta'],
  kaynak: null,
  hesapla: (g, ortam) => {
    if (!gunMu(g.sat) || !gunMu(ortam.bugun)) return BOS_SONUC
    const gun = gunFarki(g.sat, ortam.bugun)
    if (gun < 0 || gun > GEBELIK_GUN_AZAMI) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [{ anahtar: 'gun', deger: gun, ondalik: 0, birim: 'gun' }, { anahtar: 'hafta', deger: Math.floor(gun / 7), ondalik: 0, birim: 'hafta' }],
      bant: null, uyarilar: [],
      tarihler: [{ anahtar: 'sat', tarih: g.sat }, ...(gunMu(g.tahmini) ? [{ anahtar: 'tahmini', tarih: g.tahmini }] : [])],
    }
  },
}

export const BOSLUK_ARACLARI: readonly AracTanimi[] = [
  ENDOSKOPI_KAYDI, KRONIK_IZLEM, BIRINCI_ACIL, GEBELIK_GUN, KARDIYO_NOT, INME_BAYRAK, PSIKIYATRI_GUVENLIK,
  SEANS_PLANI, ICF_OZET, GREFT_TAHMINI, SAC_BAKIM, ESTETIK_CERRAHI, ESTETIK_ISLEM, AKNE_VADE, LAZER_VADE,
  INFUZYON_GUVENLIK, MAKRO_KAYDI, SONRAKI_SEANS,
]
