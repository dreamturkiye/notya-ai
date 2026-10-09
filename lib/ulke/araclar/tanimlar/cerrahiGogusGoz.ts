/**
 * NOTYA-ULKE-ARACLAR-01 — tools of general surgery, thoracic surgery, chest diseases and ophthalmology. Keys and
 * rules only. Each stands beside a tool of the pre-split application (named on the definition) and is compared with
 * it, input for input, in lib/ulke/araclar/esdegerlik.test.ts. Nothing of that application is imported here.
 */
import type { AracAlani, AracTanimi } from '../tipler'
import { ayEkle, BOS_SONUC, gunMu, isaretliler, kontrolListesi, metin, sayi, sayiMi, secim, tarih } from '../yardimci'

/**
 * Before an operation: what is done, a short label, the planned day. A list of the product's own. An untouched form
 * has no result. Stands beside specialties/genel-cerrahi/engines/preop.ts → preopSkorla.
 */
export const GENEL_PREOP_MADDELER = ['onam', 'laboratuvar', 'goruntu', 'anticoag_durdur', 'acil_kisi', 'anestezi_not'] as const
export const GENEL_PREOP: AracTanimi = {
  anahtar: 'genel-preop',
  tur: 'liste',
  alanlar: [...GENEL_PREOP_MADDELER.map((k): AracAlani => ({ anahtar: k, tur: 'isaret' })), metin('etiket'), tarih('ameliyat_tarihi', true)],
  cikti: { sayilar: ['tamamlanan'], bantlar: [], uyarilar: [], tarihler: ['ameliyat_tarihi'] },
  kaynak: null,
  hesapla: (g) => {
    const n = isaretliler(g, GENEL_PREOP_MADDELER).length
    if (!n && !gunMu(g.ameliyat_tarihi)) return BOS_SONUC
    return { tamam: true, sayilar: [{ anahtar: 'tamamlanan', deger: n, ondalik: 0, enCok: GENEL_PREOP_MADDELER.length }], bant: null, uyarilar: [], tarihler: gunMu(g.ameliyat_tarihi) ? [{ anahtar: 'ameliyat_tarihi', tarih: g.ameliyat_tarihi }] : [] }
  },
}

/**
 * Before a thoracic operation: what is done; the first three items still open come back as follow-ups.
 * Stands beside specialties/gogus-cerrahisi/engines/preop.ts → preopSkorla.
 */
export const TORAKS_PREOP_MADDELER = ['sft_yapildi', 'goruntu_hazir', 'anestezi_degerlendirme', 'sigara_sorgulandi', 'kan_lab_hazir', 'onam_konustu', 'kardiyak_risk_hekim'] as const
export const TORAKS_PREOP: AracTanimi = kontrolListesi({ anahtar: 'toraks-preop', maddeler: TORAKS_PREOP_MADDELER, uyarilar: TORAKS_PREOP_MADDELER, uyari: (secili) => TORAKS_PREOP_MADDELER.filter((k) => !secili.includes(k)).slice(0, 3) })

/**
 * Chest tube, wound or drain after a thoracic operation: what, its state as the doctor sees it, the day, the next
 * check. Stands beside specialties/gogus-cerrahisi/engines/tupYara.ts → tupYaraSkorla.
 */
export const TUP_YARA_TIPLERI = ['toraks_tup', 'yara', 'dren'] as const
export const TUP_YARA_DURUMLARI = ['izlemde', 'cikarildi', 'iyilesiyor', 'dikkat'] as const
export const TORAKS_TUP_YARA: AracTanimi = {
  anahtar: 'toraks-tup-yara',
  tur: 'takvim',
  alanlar: [secim('tip', TUP_YARA_TIPLERI), secim('durum', TUP_YARA_DURUMLARI), tarih('tarih'), tarih('sonraki_kontrol', true)],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['tarih', 'sonraki_kontrol'] },
  kaynak: null,
  hesapla: (g) => (typeof g.tip === 'string' && typeof g.durum === 'string' && gunMu(g.tarih)
    ? { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'tarih', tarih: g.tarih }, ...(gunMu(g.sonraki_kontrol) ? [{ anahtar: 'sonraki_kontrol', tarih: g.sonraki_kontrol }] : [])] }
    : BOS_SONUC),
}

/**
 * Inhaler technique: the device, six steps every device shares and the steps of that device. How many are done; and
 * the day of the next technique check when the doctor states the months (the other application assumes three months;
 * the kit assumes none). No medicine, no dose. Stands beside specialties/gogus-hastaliklari/engines/inhaler.ts → inhalerIzlem.
 */
export const INHALER_CIHAZLARI = ['odi', 'kti', 'soft_mist', 'nebul', 'diger'] as const
export const INHALER_ORTAK = ['ortak_hazirlik', 'ortak_ekspirasyon', 'ortak_dudak', 'ortak_nefes_tutma', 'ortak_agiz_calkalama', 'ortak_doz_sayaci'] as const
export const INHALER_CIHAZ_ADIMLARI: Readonly<Record<(typeof INHALER_CIHAZLARI)[number], readonly string[]>> = {
  odi: ['odi_inspirasyon', 'odi_ara_parca'], kti: ['kti_inspirasyon', 'kti_kapsul'], soft_mist: ['softmist_hazirlik', 'softmist_inspirasyon'], nebul: ['nebul_maske', 'nebul_sure'], diger: ['diger_adimlar'],
}
export const INHALER_TEKNIK: AracTanimi = {
  anahtar: 'inhaler-teknik',
  tur: 'liste',
  alanlar: [
    secim('cihaz', INHALER_CIHAZLARI),
    ...INHALER_ORTAK.map((k): AracAlani => ({ anahtar: k, tur: 'isaret' })),
    ...INHALER_CIHAZLARI.flatMap((c) => INHALER_CIHAZ_ADIMLARI[c].map((k): AracAlani => ({ anahtar: k, tur: 'isaret', kosul: { alan: 'cihaz', degerler: [c] } }))),
    sayi('kontrol_ay', 1, 24, { tam: true, birim: 'ay', istege: true }),
  ],
  cikti: { sayilar: ['tamamlanan'], bantlar: [], uyarilar: [], tarihler: ['sonraki'] },
  kaynak: null,
  hesapla: (g, { bugun }) => {
    if (typeof g.cihaz !== 'string' || !(g.cihaz in INHALER_CIHAZ_ADIMLARI)) return BOS_SONUC
    const liste = [...INHALER_ORTAK, ...INHALER_CIHAZ_ADIMLARI[g.cihaz as (typeof INHALER_CIHAZLARI)[number]]]
    return { tamam: true, sayilar: [{ anahtar: 'tamamlanan', deger: isaretliler(g, liste).length, ondalik: 0, enCok: liste.length }], bant: null, uyarilar: [], tarihler: sayiMi(g.kontrol_ay) ? [{ anahtar: 'sonraki', tarih: ayEkle(bugun, g.kontrol_ay) }] : [] }
  },
}

/**
 * Visual acuity: a decimal value or a Snellen fraction → logMAR (minus the decimal logarithm of the decimal acuity),
 * and between two measurements the change in letters (0.02 logMAR per letter; a positive number is a gain).
 * Sources: Bailey IL, Lovie JE. New design principles for visual acuity letter charts. Am J Optom Physiol Opt
 * 1976;53:740–745. Ferris FL, Kassoff A, Bresnick GH, Bailey I. New visual acuity charts for clinical research.
 * Am J Ophthalmol 1982;94:91–96. Stands beside specialties/goz-hastaliklari/engines/va.ts → vaCoz, harfFarki.
 */
const logmar = (ondalik: number): number => Math.round(-Math.log10(ondalik) * 100) / 100 + 0
const keskinlik = (g: Record<string, unknown>, on: string): number | null => {
  const d = g.bicim === 'ondalik' ? g[`${on}_ondalik`] : g.bicim === 'kesir' && sayiMi(g[`${on}_pay`]) && sayiMi(g[`${on}_payda`]) && (g[`${on}_payda`] as number) > 0 ? (g[`${on}_pay`] as number) / (g[`${on}_payda`] as number) : null
  return sayiMi(d) && d > 0 && d <= 2.5 ? d : null
}
const kosul = (deger: string) => ({ kosul: { alan: 'bicim', degerler: [deger] } })
export const GORME_KESKINLIGI: AracTanimi = {
  anahtar: 'gorme-keskinligi',
  tur: 'hesap',
  alanlar: [
    secim('goz', ['sag', 'sol'], true), secim('bicim', ['ondalik', 'kesir']),
    sayi('simdi_ondalik', 0.001, 2.5, kosul('ondalik')), sayi('onceki_ondalik', 0.001, 2.5, { istege: true, ...kosul('ondalik') }),
    sayi('simdi_pay', 0.1, 200, kosul('kesir')), sayi('simdi_payda', 0.1, 2000, kosul('kesir')),
    sayi('onceki_pay', 0.1, 200, { istege: true, ...kosul('kesir') }), sayi('onceki_payda', 0.1, 2000, { istege: true, ...kosul('kesir') }),
  ],
  cikti: { sayilar: ['logmar', 'onceki_logmar', 'harf_farki'], bantlar: [], uyarilar: [], tarihler: [] },
  kaynak: 'Bailey IL, Lovie JE. Am J Optom Physiol Opt 1976;53:740-745. Ferris FL, Kassoff A, Bresnick GH, Bailey I. Am J Ophthalmol 1982;94:91-96.',
  hesapla: (g) => {
    const simdi = keskinlik(g, 'simdi'), onceki = keskinlik(g, 'onceki')
    if (simdi === null) return BOS_SONUC
    const l = logmar(simdi)
    return {
      tamam: true,
      sayilar: [{ anahtar: 'logmar', deger: l, ondalik: 2 }, ...(onceki !== null ? [{ anahtar: 'onceki_logmar', deger: logmar(onceki), ondalik: 2 }, { anahtar: 'harf_farki', deger: Math.round(-50 * (l - logmar(onceki))) + 0, ondalik: 0 }] : [])],
      bant: null, uyarilar: [], tarihler: [],
    }
  },
}

export const CERRAHI_GOGUS_GOZ: readonly AracTanimi[] = [GENEL_PREOP, TORAKS_PREOP, TORAKS_TUP_YARA, INHALER_TEKNIK, GORME_KESKINLIGI]
