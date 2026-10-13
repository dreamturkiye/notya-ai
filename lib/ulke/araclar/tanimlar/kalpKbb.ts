/**
 * NOTYA-ULKE-ARACLAR-01 — tools of cardiovascular surgery, cardiology and ear, nose and throat. Keys and rules only.
 * Each stands beside a tool of the pre-split application (named on the definition) and is compared with it, input
 * for input, in lib/ulke/araclar/esdegerlik.test.ts. Nothing of that application is imported here.
 */
import type { AracAlani, AracTanimi } from '../tipler'
import { BOS_SONUC, gunEkle, gunMu, isaretliler, kontrolListesi, sayi, sayiMi, secim, tarih } from '../yardimci'

const isaret = (anahtar: string): AracAlani => ({ anahtar, tur: 'isaret' })

/** Before a cardiovascular operation: what is done; the first three items still open come back as follow-ups. Stands beside specialties/kalp-damar-cerrahisi/engines/preop.ts → preopSkorla. */
export const KDC_PREOP_MADDELER = ['goruntu_hazir', 'anestezi_degerlendirme', 'kan_lab_hazir', 'eko_raporu_hekim', 'antikoag_sorgulandi', 'onam_konustu', 'sigara_sorgulandi', 'kardiyak_risk_hekim'] as const
export const KDC_PREOP: AracTanimi = kontrolListesi({ anahtar: 'kalp-damar-preop', maddeler: KDC_PREOP_MADDELER, uyarilar: KDC_PREOP_MADDELER, uyari: (secili) => KDC_PREOP_MADDELER.filter((k) => !secili.includes(k)).slice(0, 3) })

/** Graft, bypass or wound after a vascular operation: what, its state, the day, the next check. Stands beside specialties/kalp-damar-cerrahisi/engines/greftYara.ts → greftYaraSkorla. */
export const GREFT_TIPLERI = ['greft', 'yara', 'bypass', 'stent_graft'] as const
export const GREFT_DURUMLARI = ['izlemde', 'iyilesiyor', 'dikkat', 'kapandi'] as const
export const GREFT_YARA: AracTanimi = {
  anahtar: 'greft-yara-izlem',
  tur: 'takvim',
  alanlar: [secim('tip', GREFT_TIPLERI), secim('durum', GREFT_DURUMLARI), tarih('tarih'), tarih('sonraki_kontrol', true)],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['tarih', 'sonraki_kontrol'] },
  kaynak: null,
  hesapla: (g) => (typeof g.tip === 'string' && typeof g.durum === 'string' && gunMu(g.tarih)
    ? { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'tarih', tarih: g.tarih }, ...(gunMu(g.sonraki_kontrol) ? [{ anahtar: 'sonraki_kontrol', tarih: g.sonraki_kontrol }] : [])] }
    : BOS_SONUC),
}

/**
 * Follow-up days of an antithrombotic treatment: its class, the next check, the day the next laboratory test is due.
 * Days only: no medicine by name beyond its class, no dose, no target value.
 * Stands beside specialties/kalp-damar-cerrahisi/engines/antikoag.ts → antikoagSkorla.
 */
export const ANTIKOAG_SINIFLARI = ['warfarin', 'doac', 'lmwh', 'antiplatelet', 'diger'] as const
export const ANTIKOAG_VADELERI: AracTanimi = {
  anahtar: 'antikoagulan-vadeleri',
  tur: 'takvim',
  alanlar: [secim('sinif', ANTIKOAG_SINIFLARI), tarih('sonraki_kontrol', true), tarih('lab_vadesi', true)],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['sonraki_kontrol', 'lab_vadesi'] },
  kaynak: null,
  hesapla: (g) => {
    const tarihler = (['sonraki_kontrol', 'lab_vadesi'] as const).flatMap((k) => { const v = g[k]; return gunMu(v) ? [{ anahtar: k, tarih: v }] : [] })
    return typeof g.sinif === 'string' && tarihler.length ? { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler } : BOS_SONUC
  },
}

/**
 * Cardiology follow-up: what is followed, office blood pressure, weight, the functional class the doctor chose →
 * warnings and the days of the next checks. The pressure limits and every interval are the pack's numbers.
 * Stands beside specialties/kardiyoloji/engines/htKky.ts → izlemDegerlendir.
 */
export const KARDIYO_IZLEM: AracTanimi = {
  anahtar: 'kardiyo-izlem',
  tur: 'takvim',
  alanlar: [secim('tip', ['ht', 'kky', 'af', 'diger']), sayi('sbp', 50, 300, { birim: 'mmHg', istege: true }), sayi('dbp', 30, 200, { birim: 'mmHg', istege: true }), sayi('kilo', 2, 400, { olcu: 'agirlik', istege: true }), secim('nyha', ['I', 'II', 'III', 'IV'], true)],
  parametreler: ['sbp_dikkat', 'dbp_dikkat', 'gun_ht_kontrol', 'gun_ht_lab', 'gun_kky_kontrol', 'gun_kky_kilo', 'gun_af_kontrol', 'gun_af_lab', 'gun_diger_kontrol'],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['sbp_yuksek', 'dbp_yuksek', 'nyha_ileri'], tarihler: ['kontrol', 'lab', 'kilo'] },
  kaynak: null,
  hesapla: (g, { bugun, p }) => {
    if (typeof g.tip !== 'string' || !(sayiMi(g.sbp) || sayiMi(g.dbp) || sayiMi(g.kilo) || typeof g.nyha === 'string')) return BOS_SONUC
    const gun = (anahtar: string, n: number) => ({ anahtar, tarih: gunEkle(bugun, n) })
    const tarihler = g.tip === 'ht' ? [gun('kontrol', p.gun_ht_kontrol), gun('lab', p.gun_ht_lab)] : g.tip === 'kky' ? [gun('kontrol', p.gun_kky_kontrol), gun('kilo', p.gun_kky_kilo)] : g.tip === 'af' ? [gun('kontrol', p.gun_af_kontrol), gun('lab', p.gun_af_lab)] : [gun('kontrol', p.gun_diger_kontrol)]
    return { tamam: true, sayilar: [], bant: null, uyarilar: [...(sayiMi(g.sbp) && g.sbp >= p.sbp_dikkat ? ['sbp_yuksek'] : []), ...(sayiMi(g.dbp) && g.dbp >= p.dbp_dikkat ? ['dbp_yuksek'] : []), ...(g.tip === 'kky' && (g.nyha === 'III' || g.nyha === 'IV') ? ['nyha_ileri'] : [])], tarihler }
  },
}

/**
 * Pure-tone average of one ear: the mean of the air-conduction thresholds at 0.5, 1, 2 and 4 kHz, the degree of
 * hearing loss it falls in, the change against an earlier average and the difference from the other ear.
 * Degrees (Goodman A. Reference zero levels for pure-tone audiometers. ASHA 1965;7:262–263; Clark JG. Uses and abuses
 * of hearing loss classification. ASHA 1981;23:493–500). A change of 10 dB or more is flagged, as in the tool it
 * stands beside. Stands beside specialties/kulak-burun-bogaz/engines/odyometri.ts → skorla, degisim, asimetriNotu.
 *
 * ── NOTYA-ULKE-ARAC-DUZELTME-01, fault 6. Sources opened on 2026-10-10: ──
 *   [ASHA] American Speech-Language-Hearing Association, "Degree of Hearing Loss",
 *     https://asha.org/public/hearing/degree-of-hearing-loss — the table, "Source: Clark, J. G. (1981). Uses and
 *     abuses of hearing loss classification. Asha, 23, 493–500.": Normal –10 to 15; Slight 16 to 25; Mild 26 to 40;
 *     Moderate 41 to 55; Moderately severe 56 to 70; Severe 71 to 90; Profound 91+ (dB HL).
 *   [AAO-HNS] American Academy of Otolaryngology–Head and Neck Surgery, position statement "Red Flags-Warning of Ear
 *     Disease" ("Approved September 2002", "Reviewed July 2025"),
 *     https://www.entnet.org/resource/position-statement-red-flags-warning-of-ear-disease/ — "Unilateral or
 *     asymmetric hearing loss (a difference of greater than 15 dB Pure Tone Average between ears)".
 *
 *   THE GRADES ARE THE TABLE THE TOOL CITES, seven of them. The tool had six and called everything up to 25 dB
 *   "normal": the cited table ends "normal" at 15 dB and has a "slight" step from 16 to 25 dB (`hafifce`).
 *   THE DIFFERENCE BETWEEN THE EARS is flagged when it is GREATER THAN 15 dB ([AAO-HNS]); the tool flagged exactly
 *   15 dB. The difference itself is now a number of the result (`kulak_farki`), flagged or not.
 *
 *   ── WHAT A COUNTRY MAY SUPPLY (each replaces the kit's; none is supplied by any pack yet) ──
 *   ITS OWN FREQUENCIES   `uyarlama.alanlar.frekans`: which of 0.25, 0.5, 1, 2, 3, 4, 6 and 8 kHz are averaged (at
 *                         least two). The kit's own are 0.5, 1, 2 and 4 kHz.
 *   ITS OWN GRADE TABLE   `uyarlama.bantlar` over `pta` (`bantSerbest`: nothing else follows from the grade).
 *   ITS OWN ASYMMETRY RULE  one of two numbers it may state (`secimlikParametreler`): `asimetri_ustu` = flagged when
 *                         the averages differ by MORE than this many dB; `asimetri_en_az` = flagged when they differ
 *                         by this many dB OR MORE. Where a pack states one (or both: either is then enough), the
 *                         kit's rule above is not applied. A rule on single frequencies of both ears is not a rule
 *                         this tool can hold: the other ear is known here by its average only.
 *
 * ONE DELIBERATE DIFFERENCE FROM THE TOOL IT STANDS BESIDE (unchanged). That application's bands are written as
 * whole-number ranges (… 25, 26 …), so an average that falls between two of them — 25.5 dB — matches none and is
 * called "profound". The kit's bands have no gap: a value above one grade's upper limit is in the next grade
 * (25.5 dB is "mild", 15.5 dB "slight"). The comparison test states this case by case.
 */
export const PTA_TUM_FREKANSLAR = ['e025', 'e05', 'e1', 'e2', 'e3', 'e4', 'e6', 'e8'] as const
export const PTA_FREKANSLARI = ['e05', 'e1', 'e2', 'e4'] as const
export const PTA_BANTLARI = ['normal', 'hafifce', 'hafif', 'orta', 'orta_ileri', 'ileri', 'cok_ileri'] as const
export const ptaBandi = (pta: number): (typeof PTA_BANTLARI)[number] => (pta <= 15 ? 'normal' : pta <= 25 ? 'hafifce' : pta <= 40 ? 'hafif' : pta <= 55 ? 'orta' : pta <= 70 ? 'orta_ileri' : pta <= 90 ? 'ileri' : 'cok_ileri')
/** The difference between the two ears' averages above which the kit flags asymmetry ([AAO-HNS]: "greater than 15 dB"). */
export const PTA_ASIMETRI_USTU = 15
const bir = (x: number) => Math.round(x * 10) / 10
const esikAlani = (k: string): AracAlani => sayi(k, -10, 130, { birim: 'dB' })
export const ODYOMETRI: AracTanimi = {
  anahtar: 'odyometri-pta',
  tur: 'hesap',
  alanlar: [secim('kulak', ['sag', 'sol'], true), ...PTA_FREKANSLARI.map(esikAlani), sayi('onceki_pta', -10, 130, { birim: 'dB', istege: true }), sayi('karsi_pta', -10, 130, { birim: 'dB', istege: true })],
  alanGruplari: { frekans: { secenekler: PTA_TUM_FREKANSLAR.map(esikAlani), enAz: 2 } },
  secimlikParametreler: ['asimetri_ustu', 'asimetri_en_az'],
  cikti: { sayilar: ['pta', 'fark', 'kulak_farki'], bantlar: [...PTA_BANTLARI], uyarilar: ['esik_artisi', 'esik_azalisi', 'asimetri'], tarihler: [] },
  // Nothing else in the result follows from the grade: a country may state its own grade table over the average.
  bantSerbest: true,
  sonucBirimleri: ['dB'],
  kaynak: 'Goodman A. ASHA 1965;7:262-263. Clark JG. ASHA 1981;23:493-500.',
  hesapla: (g, { p, alanlar }) => {
    const frekanslar = alanlar?.frekans ?? PTA_FREKANSLARI
    const e = frekanslar.map((k) => g[k])
    if (!e.length || !e.every(sayiMi)) return BOS_SONUC
    const pta = bir((e as number[]).reduce((t, x) => t + x, 0) / e.length)
    const fark = sayiMi(g.onceki_pta) ? bir(pta - g.onceki_pta) : null
    const kulakFarki = sayiMi(g.karsi_pta) ? Math.abs(bir(pta - g.karsi_pta)) : null
    // The country's own rule where it states one; otherwise the kit's: greater than 15 dB.
    const kendiKurali = sayiMi(p.asimetri_ustu) || sayiMi(p.asimetri_en_az)
    const asimetri = kulakFarki !== null && (kendiKurali ? (sayiMi(p.asimetri_ustu) && kulakFarki > p.asimetri_ustu) || (sayiMi(p.asimetri_en_az) && kulakFarki >= p.asimetri_en_az) : kulakFarki > PTA_ASIMETRI_USTU)
    return {
      tamam: true,
      sayilar: [{ anahtar: 'pta', deger: pta, ondalik: 1, birim: 'dB' }, ...(fark !== null ? [{ anahtar: 'fark', deger: fark, ondalik: 1, birim: 'dB' }] : []), ...(kulakFarki !== null ? [{ anahtar: 'kulak_farki', deger: kulakFarki, ondalik: 1, birim: 'dB' }] : [])],
      bant: ptaBandi(pta),
      uyarilar: [...(fark !== null && fark >= 10 ? ['esik_artisi'] : []), ...(fark !== null && fark <= -10 ? ['esik_azalisi'] : []), ...(asimetri ? ['asimetri'] : [])],
      tarihler: [],
    }
  },
}

/**
 * Otoscopy note: for each ear what is seen in the canal and on the drum; a few further findings. Complete when both
 * ears have a finding. Findings that need a decision at this visit come back as warnings. No diagnosis.
 * Stands beside specialties/kulak-burun-bogaz/engines/otoskopi.ts → otoskopiNotu.
 */
export const KULAKLAR = ['sag', 'sol'] as const
export const DIS_KULAK = ['normal', 'buson', 'akinti', 'odem_hassasiyet', 'yabanci_cisim'] as const
export const KULAK_ZARI = ['sag_gorunum', 'hiperemik', 'matlasmis', 'retrakte', 'bombe', 'perforasyon', 'tup_var', 'seviye_hava_kabarcigi', 'degerlendirilemedi'] as const
export const OTOSKOPI_EK = ['ek_pnomatik', 'ek_weber', 'ek_rinne', 'ek_mastoid', 'ek_postaurikuler', 'ek_isitme_kaybi', 'ek_cinlama'] as const
const DIKKAT_ZAR = ['perforasyon', 'bombe', 'retrakte', 'degerlendirilemedi'], DIKKAT_DIS = ['akinti', 'yabanci_cisim', 'odem_hassasiyet']
export const otoAlani = (yan: string, grup: 'dis' | 'zar', k: string): string => `${yan}_${grup}_${k}`
export const OTOSKOPI: AracTanimi = {
  anahtar: 'otoskopi-notu',
  tur: 'liste',
  alanlar: [...KULAKLAR.flatMap((y) => [...DIS_KULAK.map((k) => isaret(otoAlani(y, 'dis', k))), ...KULAK_ZARI.map((k) => isaret(otoAlani(y, 'zar', k)))]), ...OTOSKOPI_EK.map(isaret)],
  cikti: { sayilar: [], bantlar: [], uyarilar: KULAKLAR.flatMap((y) => [...DIKKAT_ZAR.map((k) => otoAlani(y, 'zar', k)), ...DIKKAT_DIS.map((k) => otoAlani(y, 'dis', k))]), tarihler: [] },
  kaynak: null,
  hesapla: (g) => {
    const bulgu = (y: string) => [...DIS_KULAK.map((k) => otoAlani(y, 'dis', k)), ...KULAK_ZARI.map((k) => otoAlani(y, 'zar', k))].some((a) => g[a] === true)
    if (!KULAKLAR.every(bulgu)) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: null, uyarilar: KULAKLAR.flatMap((y) => [...DIKKAT_ZAR.map((k) => otoAlani(y, 'zar', k)), ...DIKKAT_DIS.map((k) => otoAlani(y, 'dis', k))].filter((a) => g[a] === true)), tarihler: [] }
  },
}

/**
 * Vertigo: the positional tests and manoeuvres done with their result, features of the nystagmus, signs that point
 * to a central cause, an accompanying ear symptom. With any central sign a repositioning manoeuvre is "not suitable"
 * and urgent assessment comes first; a positive test without a nystagmus feature is flagged as incomplete.
 * Stands beside specialties/kulak-burun-bogaz/engines/vertigo.ts → vertigoNotu.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01, fault 8 — THREE CENTRAL SIGNS WERE MISSING. The six signs named weakness and numbness
 * of the FACE only, and headache but not neck pain: a patient with a weak arm, or with neck pain, had no box, and
 * the result read "no sign of a central cause was marked". Source opened on 2026-10-10: Johns P, Quinn J. Clinical
 * diagnosis of benign paroxysmal positional vertigo and vestibular neuritis. CMAJ 2020;192(8):E182-6,
 * https://cmaj.ca/content/cmaj/192/8/e182.full.pdf — Figure 1, the features that point to a central cause: "Focal
 * weakness or paresthesia of face or limbs"; "Dysarthria, diplopia, dysphagia, dysmetria, dysphonia"; "Significant
 * headache or neck pain"; "Unable to stand unaided"; "Spontaneous vertical nystagmus".
 * Added, each a tick-box of its own: `santral_uzuv` (weakness or altered sensation of a limb), `santral_boyun_agrisi`
 * (significant neck pain), `santral_koordinasyon` (dysmetria). The rule itself is unchanged.
 */
export const MANEVRALAR = ['dix_hallpike', 'supine_roll', 'epley', 'barbecue', 'head_impulse', 'romberg'] as const
export const NISTAGMUS = ['nis_torsiyonel', 'nis_horizontal', 'nis_latans_var', 'nis_yorulabilir', 'nis_latans_yok', 'nis_yon_degistiren', 'nis_fiksasyon'] as const
export const SANTRAL = ['santral_cift_gorme', 'santral_yuz', 'santral_uzuv', 'santral_koordinasyon', 'santral_ayakta', 'santral_nistagmus', 'santral_fiksasyon', 'santral_bas_agrisi', 'santral_boyun_agrisi'] as const
export const VERTIGO: AracTanimi = {
  anahtar: 'vertigo-notu',
  tur: 'liste',
  alanlar: [...MANEVRALAR.map((k) => secim(k, ['pozitif', 'negatif', 'yapilamadi'], true)), ...NISTAGMUS.map(isaret), ...SANTRAL.map(isaret), isaret('kulak_belirtisi')],
  cikti: { sayilar: [], bantlar: ['manevra_uygun', 'manevra_uygun_degil'], uyarilar: ['santral_suphe', 'repozisyon_santral', 'nistagmus_eksik'], tarihler: [] },
  kaynak: null,
  hesapla: (g) => {
    const yapilan = MANEVRALAR.filter((k) => typeof g[k] === 'string')
    if (!yapilan.length) return BOS_SONUC
    const santral = isaretliler(g, SANTRAL).length > 0
    return {
      tamam: true, sayilar: [], bant: santral ? 'manevra_uygun_degil' : 'manevra_uygun',
      uyarilar: [...(santral ? ['santral_suphe'] : []), ...(santral && (yapilan.includes('epley') || yapilan.includes('barbecue')) ? ['repozisyon_santral'] : []), ...(yapilan.some((k) => g[k] === 'pozitif') && !isaretliler(g, NISTAGMUS).length ? ['nistagmus_eksik'] : [])],
      tarihler: [],
    }
  },
}

export const KALP_KBB: readonly AracTanimi[] = [KDC_PREOP, GREFT_YARA, ANTIKOAG_VADELERI, KARDIYO_IZLEM, ODYOMETRI, OTOSKOPI, VERTIGO]
