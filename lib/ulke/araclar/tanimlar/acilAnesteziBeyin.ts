/**
 * NOTYA-ULKE-ARACLAR-01 — tools of emergency medicine, anaesthesiology and neurosurgery. Keys and rules only.
 *
 * Each list holds the same items, under the same keys, as the tool of the pre-split application it stands beside
 * (named on each definition); lib/ulke/araclar/esdegerlik.test.ts runs both on the same inputs and compares.
 * The other application's functions are NOT imported here: they return sentences in their own language, and a
 * country build must not carry another country's text. What is shared is the arithmetic, proven equal by test.
 */
import type { AracTanimi } from '../tipler'
import { BOS_SONUC, isaretliler, kontrolListesi, puan, secim, tarih } from '../yardimci'

/**
 * Emergency Severity Index: the level is the DOCTOR's choice (1 to 5); the tool records it with the resources
 * expected, and refuses level 1 without "immediate life-saving intervention". It does not work the level out.
 * Source of the scale: Emergency Severity Index (ESI) Implementation Handbook, Emergency Nurses Association.
 * Stands beside specialties/acil-tip/engines/esi.ts → esiSkorla.
 */
const ESI_KAYNAKLAR = ['resus_hemen', 'yuksek_risk', 'siddetli_agri_distress', 'coklu_kaynak', 'tek_kaynak', 'kaynak_yok'] as const
export const ESI: AracTanimi = {
  anahtar: 'esi-triyaj',
  tur: 'liste',
  alanlar: [secim('seviye', ['1', '2', '3', '4', '5']), ...ESI_KAYNAKLAR.map((k) => ({ anahtar: k, tur: 'isaret' as const }))],
  cikti: { sayilar: [], bantlar: ['esi1', 'esi2', 'esi3', 'esi4', 'esi5'], uyarilar: ['yeniden_degerlendirme', 'resus_takip'], tarihler: [] },
  kaynak: 'Emergency Severity Index (ESI) Implementation Handbook. Emergency Nurses Association.',
  hesapla: (g) => {
    const seviye = Number(g.seviye)
    if (![1, 2, 3, 4, 5].includes(seviye)) return BOS_SONUC
    if (seviye === 1 && g.resus_hemen !== true) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: `esi${seviye}`, uyarilar: [...(seviye <= 2 ? ['yeniden_degerlendirme'] : []), ...(seviye === 1 ? ['resus_takip'] : [])], tarihler: [] }
  },
}
export const ESI_KAYNAK_ANAHTARLARI: readonly string[] = ESI_KAYNAKLAR

/**
 * Critical pathway checklist: which pathway flags are raised and which list items are done. Complete with at least
 * one of each. A list of the product's own — no protocol of any authority is reproduced.
 * Stands beside specialties/acil-tip/engines/kritikYol.ts → kritikYolSkorla.
 */
export const KRITIK_YOLLAR = ['stemi', 'inme', 'travma', 'sepsis', 'hava_yolu'] as const
export const KRITIK_MADDELER = ['saat_kaydi', 'ekg_10dk', 'noroloji_skala', 'goruntu_plan', 'travma_primer', 'kan_kultur', 'hava_yolu_hazir', 'hekim_yonlendirme'] as const
export const KRITIK_YOL: AracTanimi = {
  anahtar: 'kritik-yol',
  tur: 'liste',
  alanlar: [...KRITIK_YOLLAR, ...KRITIK_MADDELER].map((k) => ({ anahtar: k, tur: 'isaret' as const })),
  cikti: { sayilar: ['yol', 'madde'], bantlar: [], uyarilar: [], tarihler: [] },
  kaynak: null,
  hesapla: (g) => {
    const yollar = isaretliler(g, KRITIK_YOLLAR), maddeler = isaretliler(g, KRITIK_MADDELER)
    if (!yollar.length || !maddeler.length) return BOS_SONUC
    return { tamam: true, sayilar: [{ anahtar: 'yol', deger: yollar.length, ondalik: 0, enCok: KRITIK_YOLLAR.length }, { anahtar: 'madde', deger: maddeler.length, ondalik: 0, enCok: KRITIK_MADDELER.length }], bant: null, uyarilar: [], tarihler: [] }
  },
}

/**
 * Pre-anaesthesia checklist with the ASA physical status class as the doctor records it.
 * Source of the classes: American Society of Anesthesiologists, ASA Physical Status Classification System.
 * Stands beside specialties/anestezi/engines/asa.ts → asaSkorla.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01, fault 4. Source opened on 2026-10-10: American Society of Anesthesiologists, "Statement
 * on ASA Physical Status Classification System" ("Last approved by the ASA House of Delegates on October 15, 2014"),
 * https://asahq.org/resources/clinical-information/asa-physical-status-classification-system — SIX classes, ASA I
 * to ASA VI, and: "The addition of "E" denotes Emergency surgery".
 *   THE CLASSES ARE I TO VI. The tool offered I to V and "E" as a sixth class: class VI could not be recorded, and
 *   choosing E gave "ASA E" with no class at all.
 *   "E" IS A MARK ADDED TO A CLASS, a tick of its own (`asa_acil`) that is there only once a class is chosen; the
 *   result repeats the class as its band and the mark beside it (`asa_acil`).
 *   THE SOCIETY'S OWN DEFINITIONS OF THE CLASSES ARE NOT IN THE PRODUCT, by the owner's instruction: the classes are
 *   named by their numerals only (the society's terms forbid reproducing its content without written consent).
 */
export const ASA_MADDELER = ['anamnez_tamam', 'asa_siniflandirma', 'acil_lab_goruntu', 'aclik_onam', 'alerji_ilac_listesi', 'hava_yolu_degerlendirme', 'kardiyopulmoner_risk', 'kontrol_randevu'] as const
export const ASA_SINIFLARI = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const
const ASA_TAKIP = ['kontrol_randevu', 'acil_lab_goruntu', 'hava_yolu_degerlendirme', 'alerji_ilac_listesi']
const asaSinifiMi = (x: unknown): x is (typeof ASA_SINIFLARI)[number] => typeof x === 'string' && (ASA_SINIFLARI as readonly string[]).includes(x)
const ASA_LISTESI: AracTanimi = kontrolListesi({
  anahtar: 'asa-preop',
  maddeler: ASA_MADDELER,
  ek: [secim('asa_sinif', ASA_SINIFLARI, true)],
  bantlar: ASA_SINIFLARI,
  bant: (_s, g) => (asaSinifiMi(g.asa_sinif) ? g.asa_sinif : null),
  uyarilar: [...ASA_TAKIP, 'asa_acil'],
  // the mark stands only beside a class: without a class there is nothing it could be added to
  uyari: (s, g) => [...(g.asa_acil === true && asaSinifiMi(g.asa_sinif) ? ['asa_acil'] : []), ...s.filter((k) => ASA_TAKIP.includes(k))],
  kaynak: 'American Society of Anesthesiologists. ASA Physical Status Classification System.',
})
/** The class, then the emergency mark (there only once a class is chosen), then the items of the list. */
export const ASA: AracTanimi = {
  ...ASA_LISTESI,
  alanlar: [ASA_LISTESI.alanlar[0], { anahtar: 'asa_acil', tur: 'isaret', kosul: { alan: 'asa_sinif', degerler: ASA_SINIFLARI } }, ...ASA_LISTESI.alanlar.slice(1)],
}

/** Airway note: flags and the day of the next check. Stands beside specialties/anestezi/engines/havaYolu.ts → havaYoluSkorla. */
export const HAVA_YOLU_BAYRAKLARI = ['mallampati_kaydi', 'zor_hava_yolu_bayrak', 'boyun_hareket_kisit', 'dis_protez_notu', 'obezite_osahs', 'onceki_zor_entubasyon'] as const
export const HAVA_YOLU: AracTanimi = kontrolListesi({ anahtar: 'hava-yolu-notu', maddeler: HAVA_YOLU_BAYRAKLARI, ek: [tarih('tarih', true)], tarihler: ['tarih'] })

/**
 * Post-operative pain follow-up: flags, a pain score from 0 to 10 (numeric rating scale) and the day of the next
 * check. No analgesic and no dose. Stands beside specialties/anestezi/engines/agri.ts → agriSkorla.
 */
export const AGRI_BAYRAKLARI = ['agri_skala_kaydi', 'bolgesel_agri', 'bulanti_kusma', 'sedasyon_izlem', 'analjezi_plan_hatirlat', 'kontrol_agri_randevu'] as const
export const AGRI: AracTanimi = kontrolListesi({ anahtar: 'postop-agri', maddeler: AGRI_BAYRAKLARI, ek: [puan('agri_skor', 0, 10, { istege: true }), tarih('tarih', true)], sayilar: ['agri_skor'], tarihler: ['tarih'] })

/** Neurosurgical post-operative checklist. Stands beside specialties/beyin-cerrahisi/engines/postop.ts → postopSkorla. */
export const NORO_POSTOP_MADDELER = ['yara_kontrol', 'norolojik_muayene', 'agri_skalasi', 'dvt_profilaksi_hatirlat', 'steroid_azaltma_izlem', 'goruntu_kontrol', 'taburcu_egitim', 'kontrol_randevu'] as const
const NORO_POSTOP_TAKIP = ['goruntu_kontrol', 'kontrol_randevu', 'yara_kontrol']
export const NORO_POSTOP: AracTanimi = kontrolListesi({ anahtar: 'noro-postop', maddeler: NORO_POSTOP_MADDELER, uyarilar: NORO_POSTOP_TAKIP, uyari: (s) => s.filter((k) => NORO_POSTOP_TAKIP.includes(k)) })

/** Seizure and consciousness follow-up: flags and a day. Stands beside specialties/beyin-cerrahisi/engines/bilinc.ts → bilincSkorla. */
export const BILINC_BAYRAKLARI = ['nobet_gozlemi', 'bilinc_degisikligi', 'glasgow_kaydi', 'pupil_asimetri', 'yeni_fokal_bulgu', 'ilac_uyumu_hatirlat'] as const
export const BILINC: AracTanimi = kontrolListesi({ anahtar: 'nobet-bilinc', maddeler: BILINC_BAYRAKLARI, ek: [tarih('tarih', true)], tarihler: ['tarih'] })

export const ACIL_ANESTEZI_BEYIN: readonly AracTanimi[] = [ESI, KRITIK_YOL, ASA, HAVA_YOLU, AGRI, NORO_POSTOP, BILINC]
