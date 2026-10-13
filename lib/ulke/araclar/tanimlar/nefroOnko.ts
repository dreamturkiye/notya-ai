/**
 * NOTYA-ULKE-ARACLAR-01 — tools of nephrology and oncology. Keys and rules only. Each stands beside a tool of the
 * pre-split application (named on the definition) and is compared with it, input for input, in
 * lib/ulke/araclar/esdegerlik.test.ts. Nothing of that application is imported here.
 */
import type { AracTanimi } from '../tipler'
import { ayEkle, BOS_SONUC, gunMu, kontrolListesi, metin, sayi, sayiMi, secim, tarih } from '../yardimci'
import { KDIGO_A, KDIGO_G, kdigoSinifla } from './cerrahiDahiliyeDerm'

/**
 * The KDIGO grid for a nephrologist: GFR category, albuminuria category, risk cell. No referral flag (the reader is
 * the specialist) and no interval. Source: KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management
 * of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117–S314.
 * Stands beside specialties/nefroloji/engines/egfr.ts → egfrSkorla.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01 (fault 5), as for the internal-medicine tool (./cerrahiDahiliyeDerm.ts, where the
 * sources are cited): NO RISK CELL WITHOUT A URINE ALBUMIN RESULT, and the albuminuria limits are the guideline's own
 * for the unit the ratio was typed in.
 */
export const KDIGO_SERIT: AracTanimi = {
  anahtar: 'kdigo-serit',
  tur: 'hesap',
  alanlar: [sayi('egfr', 2, 200, { birim: 'mL/min/1.73m2' }), sayi('uacr', 0, 10000, { lab: 'albuminKreatinin', istege: true })],
  cikti: { sayilar: [], bantlar: ['yesil', 'sari', 'turuncu', 'kirmizi'], uyarilar: [...KDIGO_G, ...KDIGO_A, 'uacr_yok'], tarihler: [] },
  kaynak: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.',
  hesapla: (g) => {
    const s = kdigoSinifla(g)
    if (!s) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: s.risk, uyarilar: [s.gk, ...(s.ak ? [s.ak] : ['uacr_yok'])], tarihler: [] }
  },
}

/** Dialysis: the modality, the day of the session, the day of the next. No machine setting. Stands beside specialties/nefroloji/engines/diyaliz.ts → diyalizSkorla, diyalizGorevleri. */
export const DIYALIZ_MODALITELERI = ['hd', 'pd', 'hdf', 'diger'] as const
export const DIYALIZ_SEANS: AracTanimi = {
  anahtar: 'diyaliz-seans',
  tur: 'takvim',
  alanlar: [secim('modalite', DIYALIZ_MODALITELERI), tarih('tarih'), tarih('sonraki_seans', true)],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['tarih', 'sonraki_seans'] },
  kaynak: null,
  hesapla: (g) => (typeof g.modalite === 'string' && gunMu(g.tarih)
    ? { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'tarih', tarih: g.tarih }, ...(gunMu(g.sonraki_seans) ? [{ anahtar: 'sonraki_seans', tarih: g.sonraki_seans }] : [])] }
    : BOS_SONUC),
}

/**
 * Anaemia in chronic kidney disease: the band a haemoglobin value falls in and the month of the next check. The
 * target range, the lower limit and every interval are the pack's numbers. Haemoglobin is entered in the unit the
 * country's laboratories report; the arithmetic is in g/dL.
 * NOTYA-ULKE-ARAC-DUZELTME-01 (fault 12): the three haemoglobin limits are LABORATORY VALUES — a pack states each WITH
 * ITS UNIT (`{ deger: 100, birim: 'g/L' }`) and the kit converts it before anything is compared. A bare number is
 * refused: limits typed as 100 and 120 were compared in g/dL, and 110 g/L (11.0 g/dL) read "low".
 * Stands beside specialties/nefroloji/engines/anemi.ts → anemiSkorla, anemiSonrakiTarih.
 */
export const ANEMI_IZLEM: AracTanimi = {
  anahtar: 'anemi-izlem',
  tur: 'hesap',
  alanlar: [sayi('hb', 3, 22, { lab: 'hemoglobin' }), tarih('tarih', true)],
  parametreler: ['hb_hedef_alt', 'hb_hedef_ust', 'hb_dusuk_alti', 'ay_hedef', 'ay_dikkat', 'ay_dusuk'],
  parametreOlculeri: { hb_hedef_alt: 'hemoglobin', hb_hedef_ust: 'hemoglobin', hb_dusuk_alti: 'hemoglobin' },
  cikti: { sayilar: ['sonraki_ay'], bantlar: ['hedef_yakin', 'dikkat', 'dusuk'], uyarilar: [], tarihler: ['sonraki'] },
  sonucBirimleri: ['ay'],
  kaynak: null,
  hesapla: (g, { p }) => {
    if (!sayiMi(g.hb)) return BOS_SONUC
    const bant = g.hb >= p.hb_hedef_alt && g.hb <= p.hb_hedef_ust ? 'hedef_yakin' : g.hb < p.hb_dusuk_alti ? 'dusuk' : 'dikkat'
    const ay = p[`ay_${bant === 'hedef_yakin' ? 'hedef' : bant}`]
    return { tamam: true, sayilar: [{ anahtar: 'sonraki_ay', deger: ay, ondalik: 0, birim: 'ay' }], bant, uyarilar: [], tarihler: gunMu(g.tarih) ? [{ anahtar: 'sonraki', tarih: ayEkle(g.tarih, ay) }] : [] }
  },
}

/**
 * Treatment cycles: which cycle of how many, the day of the last and of the next. A counter: no protocol, no medicine,
 * no dose, and no interval of the kit's own. Stands beside specialties/onkoloji/engines/kur.ts → kurSkorla, kurGorevleri.
 */
export const KUR_SAYACI: AracTanimi = {
  anahtar: 'kur-sayaci',
  tur: 'takvim',
  alanlar: [metin('protokol'), sayi('mevcut_kur', 0, 200, { tam: true }), sayi('toplam_kur', 0, 200, { tam: true, istege: true }), tarih('son_kur', true), tarih('sonraki_kur', true)],
  cikti: { sayilar: ['kur'], bantlar: [], uyarilar: [], tarihler: ['son_kur', 'sonraki_kur'] },
  kaynak: null,
  hesapla: (g) => {
    if (!sayiMi(g.mevcut_kur) || (sayiMi(g.toplam_kur) && g.mevcut_kur > g.toplam_kur)) return BOS_SONUC
    return {
      tamam: true, sayilar: [{ anahtar: 'kur', deger: g.mevcut_kur, ondalik: 0, ...(sayiMi(g.toplam_kur) ? { enCok: g.toplam_kur } : {}) }], bant: null, uyarilar: [],
      tarihler: (['son_kur', 'sonraki_kur'] as const).flatMap((k) => { const v = g[k]; return gunMu(v) ? [{ anahtar: k, tarih: v }] : [] }),
    }
  },
}

/** Side effects to follow during treatment: which are present. A list; no grade, no dose change. Stands beside specialties/onkoloji/engines/toksisite.ts → toksisiteSkorla. */
export const TOKSISITE_MADDELERI = ['bulanti_kusma', 'ishal', 'mukozit', 'notropeni_risk', 'anemi_halsizlik', 'noropati', 'deri_reaksiyon', 'kardiyak_belirti', 'bobrek_lab', 'infeksiyon'] as const
export const TOKSISITE: AracTanimi = kontrolListesi({ anahtar: 'toksisite-listesi', maddeler: TOKSISITE_MADDELERI })

export const NEFRO_ONKO: readonly AracTanimi[] = [KDIGO_SERIT, DIYALIZ_SEANS, ANEMI_IZLEM, KUR_SAYACI, TOKSISITE]
