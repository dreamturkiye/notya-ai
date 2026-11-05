/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — THE OPERATING SURGEON'S TOOLS. Keys, fields and arithmetic only: every word, every
 * pre-filled paragraph and every national number is the pack's. The arithmetic is the shared engines in lib/clinical/
 * (cerrahiGuvenlik.ts, antibiyotikProfilaksi.ts, adneksKitle.ts, jinekolojikSiniflama.ts, dogumSalonu.ts,
 * histeroskopiEras.ts, onamProsedurleri.ts), byte-identical with the Türkiye build on main: the same tool computes the
 * same answer in every country.
 *
 * CORE FOR EVERY SURGICAL ROLE: the WHO Surgical Safety Checklist, the Caprini score with its prophylaxis plan, the ASA
 * physical status. OBSTETRICS AND GYNAECOLOGY ONLY: weight-based antibiotic prophylaxis, IOTA Simple Rules, RMI I,
 * FIGO PALM-COEIN with the leiomyoma types and a myomectomy planning summary, revised ASRM, #Enzian, the Bishop score,
 * the Robson group, caesarean urgency, measured blood loss with the shock index, the hysteroscopy fluid deficit, the ERAS
 * checklists and the procedure consent form.
 *
 * NUMBERS A COUNTRY STATES (`secimlikParametreler`): antibiotic agents and doses, the RMI cut-off, the Bishop cut-off, the
 * caesarean urgency targets, the haemorrhage thresholds. None is the kit's: a pack that states none gets no dose, no
 * cut-off and no target, and the screen says so. O-RADS US is NOT here: the American College of Radiology's terms for
 * its reporting systems in commercial software were not settled (the same block as BI-RADS; docs/OPEN-COMMITMENTS.md
 * KD-OPERATOR-01). ADNEX and the VBAC calculator are not computed here (their published equations were not read).
 */
import type { AracAlani, AracSayisi, AracTanimi } from '../tipler'
import { BOS_SONUC, gunMu, isaret, isaretliler, metin, sayi, sayiMi, secim, tarih } from '../yardimci'
import { ASA_SINIFLARI, CAPRINI_BANTLARI, CAPRINI_MADDELERI, CAPRINI_PLANLARI, SSC_ASAMALARI, SSC_MADDELERI, capriniHesapla, sscDurumu, type SscCevap } from '@/lib/clinical/cerrahiGuvenlik'
import { PROFILAKSI_ISLEMLERI, PROFILAKSI_UYARILARI, profilaksiHesapla, type ProfilaksiIslemi, type ProfilaksiParametreleri } from '@/lib/clinical/antibiyotikProfilaksi'
import { IOTA_B, IOTA_M, RMI_USG_OZELLIKLERI, iotaBasitKurallar, rmi1 } from '@/lib/clinical/adneksKitle'
import { ASRM_BOYUT, ASRM_DOUGLAS, ASRM_YAPISIKLIK, ENZIAN_DERECE, ENZIAN_F, ENZIAN_YONTEM, FIGO_MYOM_TIPLERI, asrmEvre, myomOzeti, palmCoeinKodu, type AsrmGirdi } from '@/lib/clinical/jinekolojikSiniflama'
import { ACILIYET_KATEGORILERI, BISHOP_BILESENLERI, KANAMA_PAKETI, bishopSkoru, kanKaybi, kanamaEvresi, robsonSiniflandir, sezaryenAciliyeti, sokIndeksi } from '@/lib/clinical/dogumSalonu'
import { ERAS_LISTELERI, SIVI_ORTAMLARI, siviAcigi } from '@/lib/clinical/histeroskopiEras'
import { ONAM_PROSEDURLERI } from '@/lib/clinical/onamProsedurleri'

const say = (anahtar: string, deger: number, ondalik: number, ek: Partial<AracSayisi> = {}): AracSayisi => ({ anahtar, deger, ondalik, ...ek })
const paragraf = (anahtar: string, ek: Partial<AracAlani> = {}): AracAlani => metin(anahtar, { uzun: true, ...ek })
const dolu = (x: unknown): boolean => typeof x === 'string' && x.trim().length > 0
const s = (x: unknown): string => (typeof x === 'string' ? x : '')

// ───────────────────────── WHO Surgical Safety Checklist (core, every surgical role) ─────────────────────────

const SSC_ALANLARI: AracAlani[] = SSC_ASAMALARI.flatMap((a) => SSC_MADDELERI[a].map((m) => secim(m.anahtar, m.na ? ['evet', 'hayir', 'na'] : ['evet', 'hayir'], true)))
export const CERRAHI_GUVENLIK: AracTanimi = {
  anahtar: 'cerrahi-guvenlik-listesi', tur: 'liste', yazdirilir: true,
  alanlar: [tarih('tarih'), metin('islem'), ...SSC_ALANLARI, paragraf('not')],
  cikti: { sayilar: SSC_ASAMALARI.map((a) => `${a}_tamam`), bantlar: ['tamam', 'eksik', 'hayir_var'], uyarilar: SSC_ASAMALARI.map((a) => `${a}_eksik`), tarihler: ['tarih'] },
  kaynak: 'World Health Organization. Surgical Safety Checklist, first edition (2009): Sign In, Time Out, Sign Out.',
  hesapla: (g) => {
    if (!gunMu(g.tarih)) return BOS_SONUC
    const d = sscDurumu(g as Readonly<Record<string, SscCevap | undefined>>)
    const sayilar = SSC_ASAMALARI.map((a) => say(`${a}_tamam`, SSC_MADDELERI[a].length - d.asamalar[a].eksik.length - d.asamalar[a].hayir.length, 0, { enCok: SSC_MADDELERI[a].length }))
    const hayir = SSC_ASAMALARI.some((a) => d.asamalar[a].hayir.length > 0)
    return { tamam: true, sayilar, bant: d.tamam ? 'tamam' : hayir ? 'hayir_var' : 'eksik', uyarilar: SSC_ASAMALARI.filter((a) => d.asamalar[a].eksik.length > 0).map((a) => `${a}_eksik`), tarihler: [{ anahtar: 'tarih', tarih: g.tarih as string }] }
  },
}

// ───────────────────────── Caprini (core) ─────────────────────────

export const CAPRINI_ARACI: AracTanimi = {
  anahtar: 'caprini', tur: 'olcek', yazdirilir: true,
  alanlar: [sayi('yas', 0, 120, { tam: true }), ...CAPRINI_MADDELERI.map((m) => isaret(m.anahtar)), isaret('kanama_riski_yuksek'), isaret('kanser_cerrahisi')],
  cikti: { sayilar: ['toplam', 'yas_puani'], bantlar: [...CAPRINI_BANTLARI], uyarilar: [...CAPRINI_PLANLARI], tarihler: [] },
  kaynak: 'Caprini JA. Thrombosis risk assessment as a guide to quality patient care. Dis Mon 2005;51:70-78. Risk groups and prophylaxis: Gould MK et al. CHEST 2012;141(2 Suppl):e227S-e277S.',
  hesapla: (g) => {
    if (!sayiMi(g.yas)) return BOS_SONUC
    const r = capriniHesapla({ yas: g.yas, secili: isaretliler(g, CAPRINI_MADDELERI.map((m) => m.anahtar)), kanamaRiskiYuksek: g.kanama_riski_yuksek === true, kanserCerrahisi: g.kanser_cerrahisi === true })
    return { tamam: true, sayilar: [say('toplam', r.toplam, 0), say('yas_puani', r.yasPuani, 0, { enCok: 3 })], bant: r.bant, uyarilar: r.plan, tarihler: [] }
  },
}

// ───────────────────────── ASA physical status (core) ─────────────────────────

export const ASA_ARACI: AracTanimi = {
  anahtar: 'asa-siniflamasi', tur: 'olcek',
  alanlar: [secim('sinif', ASA_SINIFLARI), isaret('acil')],
  cikti: { sayilar: [], bantlar: [...ASA_SINIFLARI], uyarilar: ['acil'], tarihler: [] },
  kaynak: 'American Society of Anesthesiologists. ASA Physical Status Classification System (amended 2020): classes I to VI and the emergency modifier "E".',
  hesapla: (g) => {
    if (typeof g.sinif !== 'string' || !(ASA_SINIFLARI as readonly string[]).includes(g.sinif)) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: g.sinif, uyarilar: g.acil === true && g.sinif !== '6' ? ['acil'] : [], tarihler: [] }
  },
}

// ───────────────────────── antibiotic prophylaxis (O&G) ─────────────────────────

const PROF_PARAMETRELERI = ['sefazolin_g', 'sefazolin_yuksek_g', 'kilo_esigi_kg', 'kilo_esigi_dahil', 'kilo_esigi_yalniz_sezaryen', 'azitromisin_mg', 'klindamisin_mg', 'gentamisin_mg_kg', 'metronidazol_mg', 'tekrar_saat', 'tekrar_kan_ml'] as const
export const ANTIBIYOTIK_PROFILAKSI: AracTanimi = {
  anahtar: 'antibiyotik-profilaksi-kd', tur: 'hesap', dozYazar: true,
  alanlar: [
    secim('islem', PROFILAKSI_ISLEMLERI), sayi('kilo', 1, 400, { birim: 'kg' }), // in kilograms in every country: an amount by weight is never worked out from pounds
    isaret('eylemde_zar_acik'), isaret('betalaktam_alerjisi'),
    sayi('gecen_saat', 0, 24, { birim: 'saat', istege: true }), sayi('kan_kaybi', 0, 20000, { tam: true, birim: 'mL', istege: true }),
  ],
  secimlikParametreler: PROF_PARAMETRELERI,
  cikti: { sayilar: ['sefazolin', 'azitromisin', 'klindamisin', 'gentamisin', 'metronidazol'], bantlar: [], uyarilar: [...PROFILAKSI_UYARILARI], tarihler: [] },
  sonucBirimleri: ['g', 'mg'],
  kaynak: null,
  hesapla: (g, o) => {
    if (typeof g.islem !== 'string' || !sayiMi(g.kilo)) return BOS_SONUC
    const p: ProfilaksiParametreleri = Object.fromEntries(PROF_PARAMETRELERI.filter((k) => sayiMi(o.p[k])).map((k) => [k, o.p[k]]))
    const r = profilaksiHesapla({ islem: g.islem as ProfilaksiIslemi, kiloKg: g.kilo, eylemdeVeyaZarAcik: g.islem === 'sezaryen' && g.eylemde_zar_acik === true, siddetliBetaLaktamAlerjisi: g.betalaktam_alerjisi === true, gecenSaat: sayiMi(g.gecen_saat) ? g.gecen_saat : null, kanKaybiMl: sayiMi(g.kan_kaybi) ? g.kan_kaybi : null }, p)
    if (!r.tamam) return BOS_SONUC
    return { tamam: true, sayilar: r.dozlar.map((d) => say(d.ilac, d.miktar, d.birim === 'g' ? 1 : 0, { birim: d.birim, doz: true })), bant: null, uyarilar: r.uyarilar, tarihler: [] }
  },
}

// ───────────────────────── adnexal mass: IOTA Simple Rules, RMI I (O&G) ─────────────────────────

export const IOTA_ARACI: AracTanimi = {
  anahtar: 'iota-basit-kurallar', tur: 'olcek',
  alanlar: [...IOTA_B.map(isaret), ...IOTA_M.map(isaret)],
  cikti: { sayilar: ['b', 'm'], bantlar: ['benign', 'malign', 'belirsiz'], uyarilar: [], tarihler: [] },
  kaynak: 'Timmerman D et al. Simple ultrasound-based rules for the diagnosis of ovarian cancer. Ultrasound Obstet Gynecol 2008;31:681-690.',
  hesapla: (g) => {
    const secili = isaretliler(g, [...IOTA_B, ...IOTA_M])
    if (!secili.length) return BOS_SONUC
    const r = iotaBasitKurallar(secili)
    return { tamam: true, sayilar: [say('b', r.b, 0, { enCok: 5 }), say('m', r.m, 0, { enCok: 5 })], bant: r.sonuc, uyarilar: [], tarihler: [] }
  },
}

export const RMI_ARACI: AracTanimi = {
  anahtar: 'rmi', tur: 'hesap',
  alanlar: [...RMI_USG_OZELLIKLERI.map(isaret), isaret('postmenopozal'), sayi('ca125', 0, 100000, { birim: 'U/mL' })],
  secimlikParametreler: ['esik'],
  cikti: { sayilar: ['rmi', 'u', 'm'], bantlar: ['esik_ustu', 'esik_alti'], uyarilar: [], tarihler: [] },
  kaynak: 'Jacobs I et al. A risk of malignancy index incorporating CA 125, ultrasound and menopausal status for the accurate preoperative diagnosis of ovarian cancer. Br J Obstet Gynaecol 1990;97:922-929 (RMI I = U x M x CA-125).',
  hesapla: (g, o) => {
    const r = rmi1({ usg: isaretliler(g, RMI_USG_OZELLIKLERI), postmenopozal: g.postmenopozal === true, ca125: sayiMi(g.ca125) ? g.ca125 : null }, sayiMi(o.p.esik) ? o.p.esik : null)
    if (!r) return BOS_SONUC
    return { tamam: true, sayilar: [say('rmi', r.rmi, 1), say('u', r.u, 0), say('m', r.m, 0)], bant: r.esikUstu == null ? null : r.esikUstu ? 'esik_ustu' : 'esik_alti', uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── PALM-COEIN with leiomyoma types; myomectomy summary (O&G) ─────────────────────────

export const MYOM_SAYISI = 6
const MYOM_BAYRAKLARI = ['kavite_ile_iliskili', 'endometriuma_temas', 'transmural_hibrit', 'sapli_subseroz', 'servikal_veya_parazitik', 'tipi_bilinmeyen_var'] as const
const PALM_ALANLARI = ['P', 'A', 'L', 'M'] as const
const COEIN_ALANLARI = ['C', 'O', 'E', 'I', 'N'] as const
export const PALM_COEIN: AracTanimi = {
  anahtar: 'palm-coein', tur: 'liste', yazdirilir: true,
  alanlar: [
    ...PALM_ALANLARI.map((k) => isaret(`palm_${k.toLowerCase()}`)), ...COEIN_ALANLARI.map((k) => isaret(`coein_${k.toLowerCase()}`)),
    ...Array.from({ length: MYOM_SAYISI }, (_, i) => [secim(`myom${i + 1}_tip`, FIGO_MYOM_TIPLERI, true), sayi(`myom${i + 1}_mm`, 1, 400, { birim: 'mm', istege: true }), metin(`myom${i + 1}_konum`)]).flat(),
    paragraf('not'),
  ],
  cikti: { sayilar: [...PALM_ALANLARI, ...COEIN_ALANLARI, 'myom_sayisi', 'en_buyuk', 'submukoz', 'intramural', 'subseroz', 'hibrit', 'diger'], bantlar: ['l_sm', 'l_o'], uyarilar: [...MYOM_BAYRAKLARI], tarihler: [] },
  sonucBirimleri: ['mm'],
  kaynak: 'Munro MG et al. FIGO classification system (PALM-COEIN) for causes of abnormal uterine bleeding. Int J Gynecol Obstet 2011;113:3-13; 2018 revisions, Int J Gynecol Obstet 2018;143:393-408 (leiomyoma types 0-8 and hybrids).',
  hesapla: (g) => {
    const palm = PALM_ALANLARI.filter((k) => g[`palm_${k.toLowerCase()}`] === true)
    const coein = COEIN_ALANLARI.filter((k) => g[`coein_${k.toLowerCase()}`] === true)
    const myomlar = Array.from({ length: MYOM_SAYISI }, (_, i) => i + 1).filter((i) => typeof g[`myom${i}_tip`] === 'string' || sayiMi(g[`myom${i}_mm`])).map((i) => ({ tip: s(g[`myom${i}_tip`]), boyutMm: sayiMi(g[`myom${i}_mm`]) ? (g[`myom${i}_mm`] as number) : null }))
    if (!palm.length && !coein.length && !myomlar.length) return BOS_SONUC
    const kod = palmCoeinKodu({ palm, coein, myomTipleri: myomlar.map((m) => m.tip).filter(Boolean) })
    const harf = (k: string) => (kod.match(new RegExp(`\\b${k}(\\d)`))?.[1] === '1' ? 1 : 0)
    const o = myomOzeti(myomlar)
    const sayilar: AracSayisi[] = [...PALM_ALANLARI, ...COEIN_ALANLARI].map((k) => say(k, harf(k), 0))
    if (myomlar.length) sayilar.push(say('myom_sayisi', o.sayi, 0), ...(o.enBuyukMm != null ? [say('en_buyuk', o.enBuyukMm, 0, { birim: 'mm' })] : []), say('submukoz', o.submukoz, 0), say('intramural', o.intramural, 0), say('subseroz', o.subseroz, 0), say('hibrit', o.hibrit, 0), say('diger', o.diger, 0))
    const bant = kod.includes('L1(SM)') ? 'l_sm' : kod.includes('L1(O)') ? 'l_o' : null
    return { tamam: true, sayilar, bant, uyarilar: o.bayraklar, tarihler: [] }
  },
}

// ───────────────────────── revised ASRM and #Enzian (O&G) ─────────────────────────

const ASRM_ALANLARI: AracAlani[] = [
  secim('periton_yuzeyel', ASRM_BOYUT, true), secim('periton_derin', ASRM_BOYUT, true),
  ...(['sag', 'sol'] as const).flatMap((t) => [secim(`over_${t}_yuzeyel`, ASRM_BOYUT, true), secim(`over_${t}_derin`, ASRM_BOYUT, true), secim(`over_${t}_film`, ASRM_YAPISIKLIK, true), secim(`over_${t}_yogun`, ASRM_YAPISIKLIK, true), secim(`tup_${t}_film`, ASRM_YAPISIKLIK, true), secim(`tup_${t}_yogun`, ASRM_YAPISIKLIK, true), isaret(`fimbria_${t}_kapali`)]),
  secim('douglas', ASRM_DOUGLAS, true),
]
export const RASRM: AracTanimi = {
  anahtar: 'rasrm-endometriozis', tur: 'olcek', yazdirilir: true,
  alanlar: ASRM_ALANLARI,
  cikti: { sayilar: ['puan'], bantlar: ['I', 'II', 'III', 'IV'], uyarilar: [], tarihler: [] },
  kaynak: 'American Society for Reproductive Medicine. Revised American Society for Reproductive Medicine classification of endometriosis: 1996. Fertil Steril 1997;67:817-821.',
  hesapla: (g) => {
    const r = asrmEvre(g as unknown as AsrmGirdi)
    if (r.evre == null) return BOS_SONUC
    return { tamam: true, sayilar: [say('puan', r.puan, 0)], bant: r.evre, uyarilar: [], tarihler: [] }
  },
}

const ENZIAN_BOLMELERI = ['p', 'o_sol', 'o_sag', 't_sol', 't_sag', 'a', 'b_sol', 'b_sag', 'c'] as const
const fk = (f: string) => `f_${f.toLowerCase()}`
export const ENZIAN: AracTanimi = {
  anahtar: 'enzian', tur: 'olcek', yazdirilir: true,
  alanlar: [secim('yontem', ENZIAN_YONTEM), ...ENZIAN_BOLMELERI.map((k) => secim(k, ENZIAN_DERECE, true)), ...ENZIAN_F.map((f) => isaret(fk(f)))],
  cikti: { sayilar: [...ENZIAN_BOLMELERI], bantlar: [...ENZIAN_YONTEM], uyarilar: ['degerlendirilemeyen', ...ENZIAN_F.map(fk)], tarihler: [] },
  kaynak: 'Keckstein J et al. The #Enzian classification: a comprehensive non-invasive and surgical description system for endometriosis. Acta Obstet Gynecol Scand 2021;100:1165-1175.',
  hesapla: (g) => {
    if (typeof g.yontem !== 'string' || !(ENZIAN_YONTEM as readonly string[]).includes(g.yontem)) return BOS_SONUC
    const sayilar = ENZIAN_BOLMELERI.flatMap((k) => { const v = typeof g[k] === 'string' ? (g[k] as string) : '0'; return v === 'x' ? [] : [say(k, Number(v), 0, { enCok: 3 })] })
    const uyarilar = [...(ENZIAN_BOLMELERI.some((k) => g[k] === 'x') ? ['degerlendirilemeyen'] : []), ...ENZIAN_F.filter((f) => g[fk(f)] === true).map(fk)]
    return { tamam: true, sayilar, bant: g.yontem, uyarilar, tarihler: [] }
  },
}

// ───────────────────────── delivery suite (O&G) ─────────────────────────

export const BISHOP: AracTanimi = {
  anahtar: 'bishop', tur: 'olcek',
  alanlar: (Object.keys(BISHOP_BILESENLERI) as (keyof typeof BISHOP_BILESENLERI)[]).map((k) => secim(k, BISHOP_BILESENLERI[k])),
  secimlikParametreler: ['esik'],
  cikti: { sayilar: ['toplam'], bantlar: ['uygun', 'uygun_degil'], uyarilar: [], tarihler: [] },
  kaynak: 'Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol 1964;24:266-268.',
  hesapla: (g, o) => {
    const r = bishopSkoru(g as Record<string, string>, sayiMi(o.p.esik) ? o.p.esik : null)
    if (r.toplam == null) return BOS_SONUC
    return { tamam: true, sayilar: [say('toplam', r.toplam, 0, { enCok: 13 })], bant: r.uygun == null ? null : r.uygun ? 'uygun' : 'uygun_degil', uyarilar: [], tarihler: [] }
  },
}

export const ROBSON: AracTanimi = {
  anahtar: 'robson', tur: 'hesap',
  alanlar: [secim('parite', ['nullipar', 'multipar']), isaret('onceki_sezaryen'), secim('fetus', ['tekil', 'cogul']), secim('prezentasyon', ['bas', 'makat', 'transvers']), sayi('hafta', 20, 44, { tam: true }), secim('eylem', ['spontan', 'induksiyon', 'eylem_oncesi_sezaryen'])],
  cikti: { sayilar: ['grup'], bantlar: ['a', 'b'], uyarilar: [], tarihler: [] },
  kaynak: 'World Health Organization. Robson Classification: Implementation Manual (2017). Robson MS. Classification of caesarean sections. Fetal Matern Med Rev 2001;12:23-39.',
  hesapla: (g) => {
    const r = robsonSiniflandir({ parite: (s(g.parite) || null) as never, oncekiSezaryen: g.onceki_sezaryen === true, fetus: (s(g.fetus) || null) as never, prezentasyon: (s(g.prezentasyon) || null) as never, hafta: sayiMi(g.hafta) ? g.hafta : null, eylem: (s(g.eylem) || null) as never })
    if (r.grup == null) return BOS_SONUC
    return { tamam: true, sayilar: [say('grup', r.grup, 0)], bant: r.alt ?? null, uyarilar: [], tarihler: [] }
  },
}

/** Minutes between two clock times of the same record ("HH:MM"); a time earlier than the decision is the next day. */
const saatDk = (x: unknown): number | null => { const m = /^(\d{1,2}):(\d{2})$/.exec(s(x).trim()); return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : null }
export const SEZARYEN_ACILIYETI: AracTanimi = {
  anahtar: 'sezaryen-aciliyeti', tur: 'hesap', yazdirilir: true,
  alanlar: [tarih('tarih'), secim('kategori', ACILIYET_KATEGORILERI), metin('karar_saati'), metin('dogum_saati'), paragraf('not')],
  secimlikParametreler: ['hedef_1_dk', 'hedef_2_dk'],
  cikti: { sayilar: ['gecen_dk', 'hedef_dk'], bantlar: ['hedef_icinde', 'hedef_asildi'], uyarilar: ['saat_gecersiz'], tarihler: ['tarih'] },
  sonucBirimleri: ['dk'],
  kaynak: 'Lucas DN et al. Urgency of caesarean section: a new classification. J R Soc Med 2000;93:346-350 (categories 1 to 4).',
  hesapla: (g, o) => {
    if (!gunMu(g.tarih) || typeof g.kategori !== 'string') return BOS_SONUC
    const hedef = g.kategori === '1' ? o.p.hedef_1_dk : g.kategori === '2' ? o.p.hedef_2_dk : undefined
    const k = saatDk(g.karar_saati), d = saatDk(g.dogum_saati)
    const uyarilar = (dolu(g.karar_saati) && k == null) || (dolu(g.dogum_saati) && d == null) ? ['saat_gecersiz'] : []
    const karar = k == null ? null : `${g.tarih}T${s(g.karar_saati).trim().padStart(5, '0')}`
    const dogum = k == null || d == null ? null : new Date(Date.parse(`${karar}:00Z`) + (((d - k) + 1440) % 1440) * 60000).toISOString().slice(0, 16)
    const r = sezaryenAciliyeti({ kategori: g.kategori, kararZamani: karar ? `${karar}:00Z` : null, dogumZamani: dogum ? `${dogum}:00Z` : null }, sayiMi(hedef) ? hedef : null)
    const sayilar = [...(r.gecenDk != null ? [say('gecen_dk', r.gecenDk, 0, { birim: 'dk' })] : []), ...(sayiMi(hedef) ? [say('hedef_dk', hedef, 0, { birim: 'dk' })] : [])]
    return { tamam: true, sayilar, bant: r.asildi == null ? null : r.asildi ? 'hedef_asildi' : 'hedef_icinde', uyarilar, tarihler: [{ anahtar: 'tarih', tarih: g.tarih as string }] }
  },
}

export const KANAMA_IZLEM: AracTanimi = {
  anahtar: 'kanama-izlem', tur: 'hesap', yazdirilir: true,
  alanlar: [
    sayi('islak_g', 0, 20000, { tam: true, birim: 'g', istege: true }), sayi('kuru_g', 0, 20000, { tam: true, birim: 'g', istege: true }),
    sayi('kanister_ml', 0, 20000, { tam: true, birim: 'mL', istege: true }), sayi('amniyon_ml', 0, 5000, { tam: true, birim: 'mL', istege: true }),
    sayi('tahmini_ml', 0, 20000, { tam: true, birim: 'mL', istege: true }), sayi('nabiz', 20, 250, { tam: true, istege: true }), sayi('sistolik', 30, 260, { tam: true, birim: 'mmHg', istege: true }),
    ...KANAMA_PAKETI.map(isaret),
  ],
  secimlikParametreler: ['esik_1_ml', 'esik_2_ml', 'esik_3_ml'],
  cikti: { sayilar: ['kan_kaybi', 'sok_indeksi', 'evre'], bantlar: ['normal', 'esik_0_9', 'esik_1_4', 'esik_1_7'], uyarilar: ['olculmedi_tahmin'], tarihler: [] },
  sonucBirimleri: ['mL'],
  kaynak: 'Quantitative blood loss: weighed swabs (1 g = 1 mL) and collected volume minus amniotic fluid. Shock index = heart rate / systolic blood pressure, thresholds 0.9, 1.4 and 1.7 (El Ayadi AM, Nathan HL et al., PLoS ONE 2016;11(2):e0148729).',
  hesapla: (g, o) => {
    const k = kanKaybi({ islakGram: sayiMi(g.islak_g) ? g.islak_g : null, kuruGram: sayiMi(g.kuru_g) ? g.kuru_g : null, kanisterMl: sayiMi(g.kanister_ml) ? g.kanister_ml : null, amniyonMl: sayiMi(g.amniyon_ml) ? g.amniyon_ml : null, tahminiMl: sayiMi(g.tahmini_ml) ? g.tahmini_ml : null })
    const si = sokIndeksi(sayiMi(g.nabiz) ? g.nabiz : null, sayiMi(g.sistolik) ? g.sistolik : null)
    if (k.ml == null && !si) return BOS_SONUC
    const esikler = ['esik_1_ml', 'esik_2_ml', 'esik_3_ml'].map((x) => o.p[x]).filter(sayiMi)
    const evre = kanamaEvresi(k.ml, esikler)
    const sayilar = [...(k.ml != null ? [say('kan_kaybi', k.ml, 0, { birim: 'mL' })] : []), ...(si ? [say('sok_indeksi', si.si, 2)] : []), ...(evre != null ? [say('evre', evre, 0, { enCok: esikler.length })] : [])]
    return { tamam: true, sayilar, bant: si?.bant ?? null, uyarilar: k.ml != null && !k.olculdu ? ['olculmedi_tahmin'] : [], tarihler: [] }
  },
}

// ───────────────────────── hysteroscopy fluid deficit; ERAS (O&G) ─────────────────────────

export const OLCUM_SAYISI = 6
export const HISTEROSKOPI_SIVI: AracTanimi = {
  anahtar: 'histeroskopi-sivi', tur: 'hesap', yazdirilir: true,
  alanlar: [secim('ortam', SIVI_ORTAMLARI), isaret('riskli'), ...Array.from({ length: OLCUM_SAYISI }, (_, i) => [metin(`o${i + 1}_saat`), sayi(`o${i + 1}_giren`, 0, 50000, { tam: true, birim: 'mL', istege: true }), sayi(`o${i + 1}_cikan`, 0, 50000, { tam: true, birim: 'mL', istege: true })]).flat()],
  secimlikParametreler: ['hipotonik_saglikli', 'hipotonik_riskli', 'izotonik_saglikli', 'izotonik_riskli'],
  cikti: { sayilar: ['acik', 'sinir', 'yuzde'], bantlar: ['sinir_alti', 'sinira_yakin', 'sinir_asildi'], uyarilar: [], tarihler: [] },
  sonucBirimleri: ['mL', '%'],
  kaynak: 'AAGL Practice Report: Practice Guidelines for the Management of Hysteroscopic Distending Media. J Minim Invasive Gynecol 2013;20:137-148 (hypotonic 1000 mL, isotonic 2500 mL; 750 mL in the elderly or with comorbidity).',
  hesapla: (g, o) => {
    if (typeof g.ortam !== 'string') return BOS_SONUC
    const olcumler = Array.from({ length: OLCUM_SAYISI }, (_, i) => i + 1).filter((i) => sayiMi(g[`o${i}_giren`]) && sayiMi(g[`o${i}_cikan`])).map((i) => ({ zaman: s(g[`o${i}_saat`]), girenMl: g[`o${i}_giren`] as number, cikanMl: g[`o${i}_cikan`] as number }))
    const r = siviAcigi({ ortam: g.ortam as 'hipotonik' | 'izotonik', riskli: g.riskli === true, olcumler }, Object.fromEntries(Object.entries(o.p).filter(([, v]) => sayiMi(v))))
    if (!r) return BOS_SONUC
    return { tamam: true, sayilar: [say('acik', r.acikMl, 0, { birim: 'mL' }), say('sinir', r.sinirMl, 0, { birim: 'mL' }), say('yuzde', r.yuzde, 0, { birim: '%' })], bant: r.bant, uyarilar: [], tarihler: [] }
  },
}

const ERAS_MADDELERI = [...new Set([...ERAS_LISTELERI.jinekolojik, ...ERAS_LISTELERI.sezaryen])]
export const ERAS_ARACI: AracTanimi = {
  anahtar: 'eras-kd', tur: 'liste', yazdirilir: true,
  alanlar: [secim('liste', ['jinekolojik', 'sezaryen']), ...ERAS_MADDELERI.map((m) => ({ ...isaret(m), kosul: { alan: 'liste', degerler: (['jinekolojik', 'sezaryen'] as const).filter((l) => (ERAS_LISTELERI[l] as readonly string[]).includes(m)) } }))],
  cikti: { sayilar: ['yapilan'], bantlar: [], uyarilar: [], tarihler: [] },
  kaynak: 'ERAS Society: Nelson G et al., Guidelines for perioperative care in gynecologic/oncology: 2019 update, Int J Gynecol Cancer 2019;29:651-668; Wilson RD, Caughey AB et al., Guidelines for antenatal and preoperative care in cesarean delivery (Am J Obstet Gynecol 2018;219:523.e1-e15) and the intra- and postoperative parts (2018-2019).',
  hesapla: (g) => {
    if (g.liste !== 'jinekolojik' && g.liste !== 'sezaryen') return BOS_SONUC
    const maddeler = ERAS_LISTELERI[g.liste] as readonly string[]
    return { tamam: true, sayilar: [say('yapilan', isaretliler(g, maddeler).length, 0, { enCok: maddeler.length })], bant: null, uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── procedure consent form (O&G) ─────────────────────────

/** The paragraphs of the form: each pre-filled by the pack for the chosen operation (`sablonlar.islem`), every word editable. */
export const ONAM_PARAGRAFLARI = ['aciklama', 'yararlar', 'alternatifler', 'riskler', 'ek_islemler', 'anestezi', 'imzalar'] as const
export const ONAM_FORMU: AracTanimi = {
  anahtar: 'onam-formu-kd', tur: 'liste', yazdirilir: true,
  alanlar: [tarih('tarih'), secim('islem', ONAM_PROSEDURLERI), ...ONAM_PARAGRAFLARI.map((k) => paragraf(k)), paragraf('konusulanlar'), isaret('yazili_bilgi'), isaret('sorular_yanitlandi'), isaret('tercuman')],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['yazili_bilgi_yok', 'sorular_bekliyor'], tarihler: ['tarih'] },
  kaynak: null,
  hesapla: (g) => {
    if (!gunMu(g.tarih) || typeof g.islem !== 'string' || !dolu(g.aciklama) || !dolu(g.riskler)) return BOS_SONUC
    const uyarilar = [...(g.yazili_bilgi === true ? [] : ['yazili_bilgi_yok']), ...(g.sorular_yanitlandi === true ? [] : ['sorular_bekliyor'])]
    return { tamam: true, sayilar: [], bant: null, uyarilar, tarihler: [{ anahtar: 'tarih', tarih: g.tarih as string }] }
  },
}

export const KD_OPERATOR_ARACLARI: readonly AracTanimi[] = [CERRAHI_GUVENLIK, CAPRINI_ARACI, ASA_ARACI, ANTIBIYOTIK_PROFILAKSI, IOTA_ARACI, RMI_ARACI, PALM_COEIN, RASRM, ENZIAN, BISHOP, ROBSON, SEZARYEN_ACILIYETI, KANAMA_IZLEM, HISTEROSKOPI_SIVI, ERAS_ARACI, ONAM_FORMU]
