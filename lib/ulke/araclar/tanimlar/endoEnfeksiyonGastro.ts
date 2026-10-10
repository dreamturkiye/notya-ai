/**
 * NOTYA-ULKE-ARACLAR-01 — tools of endocrinology, infectious diseases and gastroenterology. Keys and rules only.
 *
 * Several tools here are FOLLOW-UP INTERVALS and BANDS: "above this value, check again in so many months". Those
 * numbers are local clinical guidance — the pre-split application takes them from its own country's societies — so
 * the kit holds NONE of them: each is a parameter the pack states (`parametreler`), and a country that has not been
 * given them by its clinical lead keeps the tool as a slot. The mechanism is compared with the pre-split
 * application's, given that application's own numbers, in lib/ulke/araclar/esdegerlik.test.ts.
 */
import type { AracTanimi } from '../tipler'
import { ayEkle, BOS_SONUC, gunEkle, gunMu, metin, sayi, sayiMi, secim, tarih } from '../yardimci'

const sonrakiVeGecikme = (sonraki: string, bugun: string) => ({ tarihler: [{ anahtar: 'sonraki', tarih: sonraki }], uyarilar: sonraki < bugun ? ['gecikti'] : [] })

/**
 * HbA1c or TSH: the band a value falls in and the month of the next check — every threshold and every interval the
 * pack's. Stands beside specialties/endokrinoloji/engines/labIzlem.ts → labSkorla, sonrakiIzlemTarihi.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01 (fault 12): HbA1c is the kit's quantity `hba1c` — typed in the pack's unit, per cent or
 * mmol/mol, and turned into per cent by the NGSP master equation (lib/ulke/araclar/birimler.ts; an HbA1c of 53
 * mmol/mol used to be refused as "above 20") — and the two HbA1c thresholds are LABORATORY VALUES: a pack states each
 * with its unit (`parametreOlculeri`). Each of the two tests has a field of its own, so each carries its own unit.
 * The accepted range of HbA1c is 3 to 20 per cent, as it was; in mmol/mol the screen states the same range converted.
 */
export const LAB_IZLEM: AracTanimi = {
  anahtar: 'lab-izlem',
  tur: 'hesap',
  alanlar: [secim('tur', ['hba1c', 'tsh']), sayi('hba1c', 3, 20, { lab: 'hba1c', kosul: { alan: 'tur', degerler: ['hba1c'] } }), sayi('tsh', 0.01, 100, { kosul: { alan: 'tur', degerler: ['tsh'] } }), tarih('tarih', true)],
  parametreler: ['hba1c_dikkat', 'hba1c_yuksek', 'tsh_alt', 'tsh_ust', 'tsh_dikkat_alt', 'tsh_dikkat_ust', 'ay_hba1c_hedef', 'ay_hba1c_dikkat', 'ay_hba1c_yuksek', 'ay_tsh_hedef', 'ay_tsh_dikkat', 'ay_tsh_yuksek'],
  parametreOlculeri: { hba1c_dikkat: 'hba1c', hba1c_yuksek: 'hba1c' },
  cikti: { sayilar: ['sonraki_ay'], bantlar: ['hedef_yakin', 'dikkat', 'yuksek'], uyarilar: [], tarihler: ['sonraki'] },
  sonucBirimleri: ['ay'],
  kaynak: null,
  hesapla: (g, { p }) => {
    if (g.tur !== 'hba1c' && g.tur !== 'tsh') return BOS_SONUC
    const v = g[g.tur]
    if (!sayiMi(v)) return BOS_SONUC
    if (g.tur === 'hba1c' && (v < 3 || v > 20)) return BOS_SONUC
    const bant = g.tur === 'hba1c'
      ? (v < p.hba1c_dikkat ? 'hedef_yakin' : v < p.hba1c_yuksek ? 'dikkat' : 'yuksek')
      : (v >= p.tsh_alt && v <= p.tsh_ust ? 'hedef_yakin' : (v > p.tsh_ust && v <= p.tsh_dikkat_ust) || (v >= p.tsh_dikkat_alt && v < p.tsh_alt) ? 'dikkat' : 'yuksek')
    const ay = p[`ay_${g.tur}_${bant === 'hedef_yakin' ? 'hedef' : bant}`]
    return { tamam: true, sayilar: [{ anahtar: 'sonraki_ay', deger: ay, ondalik: 0, birim: 'ay' }], bant, uyarilar: [], tarihler: gunMu(g.tarih) ? [{ anahtar: 'sonraki', tarih: ayEkle(g.tarih, ay) }] : [] }
  },
}

/**
 * Bone densitometry: the day of the last scan and the risk band the doctor chose → the day of the next one. The years
 * between two scans are the pack's. Stands beside specialties/endokrinoloji/engines/dxa.ts → dxaPlanla.
 */
export const DXA_TEKRAR: AracTanimi = {
  anahtar: 'dxa-tekrar',
  tur: 'takvim',
  alanlar: [tarih('son_dxa'), secim('risk', ['dusuk', 'orta', 'yuksek'])],
  parametreler: ['yil_dusuk', 'yil_orta', 'yil_yuksek'],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['gecikti'], tarihler: ['sonraki'] },
  kaynak: null,
  hesapla: (g, { bugun, p }) => (gunMu(g.son_dxa) && typeof g.risk === 'string' ? { tamam: true, sayilar: [], bant: null, ...sonrakiVeGecikme(ayEkle(g.son_dxa, p[`yil_${g.risk}`] * 12), bugun) } : BOS_SONUC),
}

/**
 * Regimen card: the start and the next check of an insulin regimen and of a thyroid regimen, as days. No dose, no
 * medicine. Stands beside specialties/endokrinoloji/engines/rejim.ts → rejimNormalize, rejimGorevleri.
 */
export const REJIM_TARIHLERI = ['insulin_baslangic', 'insulin_kontrol', 'tiroid_baslangic', 'tiroid_kontrol'] as const
export const REJIM_KARTI: AracTanimi = {
  anahtar: 'rejim-karti',
  tur: 'takvim',
  alanlar: REJIM_TARIHLERI.map((k) => tarih(k, true)),
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: [...REJIM_TARIHLERI] },
  kaynak: null,
  hesapla: (g) => {
    const tarihler = REJIM_TARIHLERI.flatMap((k) => { const v = g[k]; return gunMu(v) ? [{ anahtar: k, tarih: v }] : [] })
    return tarihler.length ? { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler } : BOS_SONUC
  },
}

/**
 * Antibiotic course: the first day and the number of days → the last day, and the day of the check (the doctor's, or
 * the last day). Date arithmetic only: no medicine, no dose, no recommended duration.
 * Stands beside specialties/enfeksiyon-hastaliklari/engines/atbSure.ts → atbHesapla.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01, fault 3 — THE FIRST DAY IS DAY 1. The tool added the number of days to the first day,
 * so a course of 7 days that starts on 1 October "ended" on 8 October: one day late. A day on which the medicine is
 * given is a day of the course, the first one included: 7 days from 1 October end on 7 October.
 * Source opened on 2026-10-10: Centers for Disease Control and Prevention, National Healthcare Safety Network,
 * "FAQs: Antimicrobial Use (AU) Option", https://www.cdc.gov/nhsn/faqs/faq-au.html — a medicine is counted "on the
 * day of administration", one "antimicrobial day" for each calendar day on which it is given (the page prints no
 * worked example; the one above is the audits').
 */
export const ANTIBIYOTIK_SURE: AracTanimi = {
  anahtar: 'antibiyotik-sure',
  tur: 'takvim',
  alanlar: [tarih('baslangic'), sayi('sure_gun', 1, 365, { tam: true, birim: 'gun' }), tarih('kontrol', true), metin('sinif')],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['bitis', 'kontrol'] },
  kaynak: null,
  hesapla: (g) => {
    if (!gunMu(g.baslangic) || !sayiMi(g.sure_gun)) return BOS_SONUC
    // the first day is day 1: the last day is (number of days − 1) after it
    const bitis = gunEkle(g.baslangic, g.sure_gun - 1)
    return { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'bitis', tarih: bitis }, { anahtar: 'kontrol', tarih: gunMu(g.kontrol) ? g.kontrol : bitis }] }
  },
}

/**
 * Follow-up of a chronic viral infection: which follow-up, the day of the last one → the day of the next. The months
 * between two are the pack's. Stands beside specialties/enfeksiyon-hastaliklari/engines/viralIzlem.ts → viralPlanla.
 */
export const VIRAL_TURLERI = ['hiv_cd4', 'hiv_viral', 'hbv', 'hcv', 'diger'] as const
export const VIRAL_IZLEM: AracTanimi = {
  anahtar: 'viral-izlem',
  tur: 'takvim',
  alanlar: [secim('tur', VIRAL_TURLERI), tarih('son_tarih')],
  parametreler: ['ay_hiv', 'ay_hepatit', 'ay_diger'],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['gecikti'], tarihler: ['sonraki'] },
  kaynak: null,
  hesapla: (g, { bugun, p }) => {
    if (!gunMu(g.son_tarih) || typeof g.tur !== 'string') return BOS_SONUC
    const ay = g.tur === 'hiv_cd4' || g.tur === 'hiv_viral' ? p.ay_hiv : g.tur === 'hbv' || g.tur === 'hcv' ? p.ay_hepatit : p.ay_diger
    return { tamam: true, sayilar: [], bant: null, ...sonrakiVeGecikme(ayEkle(g.son_tarih, ay), bugun) }
  },
}

/**
 * An activity index of inflammatory bowel disease or irritable bowel syndrome, entered as its TOTAL (the doctor
 * scores it): the band it falls in and the month of the next check. Every cut-off and interval is the pack's.
 * Stands beside specialties/gastroenteroloji/engines/ibdIbs.ts → skorHesapla.
 */
const IBD_UST: Readonly<Record<string, number>> = { mayo_kismi: 9, hbi: 40, ibs_sss: 500 }
export const IBD_SKOR: AracTanimi = {
  anahtar: 'ibd-skor',
  tur: 'hesap',
  alanlar: [secim('tur', ['mayo_kismi', 'hbi', 'ibs_sss']), sayi('skor', 0, 500), tarih('tarih', true)],
  parametreler: ['mayo_remisyon_ust', 'mayo_hafif_ust', 'mayo_orta_ust', 'hbi_remisyon_alti', 'hbi_hafif_ust', 'hbi_orta_ust', 'ibs_remisyon_alti', 'ibs_hafif_alti', 'ibs_orta_alti', 'ay_remisyon', 'ay_hafif', 'ay_orta', 'ay_siddetli'],
  cikti: { sayilar: ['sonraki_ay'], bantlar: ['remisyon', 'hafif', 'orta', 'siddetli'], uyarilar: [], tarihler: ['sonraki'] },
  sonucBirimleri: ['ay'],
  kaynak: null,
  hesapla: (g, { p }) => {
    if (!sayiMi(g.skor) || typeof g.tur !== 'string' || !(g.tur in IBD_UST) || g.skor > IBD_UST[g.tur]) return BOS_SONUC
    const v = g.skor
    const bant = g.tur === 'mayo_kismi' ? (v <= p.mayo_remisyon_ust ? 'remisyon' : v <= p.mayo_hafif_ust ? 'hafif' : v <= p.mayo_orta_ust ? 'orta' : 'siddetli')
      : g.tur === 'hbi' ? (v < p.hbi_remisyon_alti ? 'remisyon' : v <= p.hbi_hafif_ust ? 'hafif' : v <= p.hbi_orta_ust ? 'orta' : 'siddetli')
        : (v < p.ibs_remisyon_alti ? 'remisyon' : v < p.ibs_hafif_alti ? 'hafif' : v < p.ibs_orta_alti ? 'orta' : 'siddetli')
    const ay = p[`ay_${bant}`]
    return { tamam: true, sayilar: [{ anahtar: 'sonraki_ay', deger: ay, ondalik: 0, birim: 'ay' }], bant, uyarilar: [], tarihler: gunMu(g.tarih) ? [{ anahtar: 'sonraki', tarih: ayEkle(g.tarih, ay) }] : [] }
  },
}

/**
 * Hepatitis B or C follow-up: the follow-up band the doctor chose → the day of the next check, counted from today.
 * The months are the pack's. Stands beside specialties/gastroenteroloji/engines/hbvHcv.ts → hepatitPlanla.
 */
export const HEPATIT_IZLEM: AracTanimi = {
  anahtar: 'hepatit-izlem',
  tur: 'takvim',
  alanlar: [secim('tur', ['hbv', 'hcv', 'diger']), secim('bant', ['stabil', 'aktif_izlem', 'tedavi_degerlendirme'])],
  parametreler: ['ay_stabil', 'ay_aktif_izlem', 'ay_tedavi_degerlendirme'],
  cikti: { sayilar: ['sonraki_ay'], bantlar: [], uyarilar: [], tarihler: ['sonraki'] },
  sonucBirimleri: ['ay'],
  kaynak: null,
  hesapla: (g, { bugun, p }) => {
    if (typeof g.tur !== 'string' || typeof g.bant !== 'string') return BOS_SONUC
    const ay = p[`ay_${g.bant}`]
    return { tamam: true, sayilar: [{ anahtar: 'sonraki_ay', deger: ay, ondalik: 0, birim: 'ay' }], bant: null, uyarilar: [], tarihler: [{ anahtar: 'sonraki', tarih: ayEkle(bugun, ay) }] }
  },
}

export const ENDO_ENFEKSIYON_GASTRO: readonly AracTanimi[] = [LAB_IZLEM, DXA_TEKRAR, REJIM_KARTI, ANTIBIYOTIK_SURE, VIRAL_IZLEM, IBD_SKOR, HEPATIT_IZLEM]
