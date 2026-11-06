/**
 * AMELIYAT-NOTU-01 / KD-RAPOR-01 (Kaan, 2026-11-05) — the operation note (every surgical role), and the obstetric and
 * gynaecological ultrasound reports, the delivery discharge summary and the FIGO 2015 CTG classification (obstetrics
 * and gynaecology). Keys, fields and arithmetic only: every word, and every pre-filled paragraph (`sablonlar`), is the
 * pack's. They stand beside the Türkiye build's lib/doktor/ameliyatNotu.ts and specialties/kadin-dogum/engines/
 * (usgRaporu.ts, nstKtg.ts, dogumEpikrizi.ts) on main; that code is not imported (wall rule D7).
 *
 * Published sources of the arithmetic, each named on its tool:
 *   operation note    Royal College of Surgeons of England, Good Surgical Practice (2014), 1.3: what a note holds.
 *   obstetric USG     INTERGROWTH-21st fetal growth standards (Papageorghiou et al., Lancet 2014), the tables already in
 *                     lib/clinical/fetalBiyometri.ts; EFW Hadlock 3-parameter (1985); MCA-PSV median Mari et al., N Engl
 *                     J Med 2000 (e^(2.31 + 0.046 x GA), MoM >= 1.5); CPR (Gramellini et al., Obstet Gynecol 1992, cut-off
 *                     1.08); liquor SMFM Consult Series #46 (2018: AFI >= 24 cm or SDP >= 8 cm) and ACOG Committee
 *                     Opinion 831 (2021: AFI <= 5 cm or SDP < 2 cm); FHR baseline 110-160; NT >= 3.5 mm.
 *   gynaecological    prolate ellipsoid volume (L x AP x W x 0.523); postmenopausal endometrium > 4 mm (ACOG Committee
 *                     Opinion 734, 2018).
 *   CTG (FIGO)        Ayres-de-Campos D et al., FIGO consensus guidelines on intrapartum fetal monitoring:
 *                     cardiotocography, Int J Gynecol Obstet 2015;131:13-24.
 * A national classification (NICHD, NICE, RANZCOG, SOGC) is NOT here: it is the country's own tool, in its pack.
 */
import type { AracAlani, AracSonucu, AracTanimi, AracSayisi } from '../tipler'
import { BOS_SONUC, gunMu, isaret, metin, sayi, sayiMi, secim, tarih } from '../yardimci'
import { biyometriPersentil, hadlockEfw, type BiyometriParametre } from '@/lib/clinical/fetalBiyometri'

/** A paragraph field: a text area (`uzun`), optional unless the tool's arithmetic asks for it. */
const paragraf = (anahtar: string, ek: Partial<AracAlani> = {}): AracAlani => metin(anahtar, { uzun: true, ...ek })
const dolu = (x: unknown): boolean => typeof x === 'string' && x.trim().length > 0
const yuvarla = (n: number, b: number) => Math.round(n * 10 ** b) / 10 ** b
const say = (anahtar: string, deger: number, ondalik: number, birim?: string): AracSayisi => ({ anahtar, deger, ondalik, ...(birim ? { birim } : {}) })

// ───────────────────────── operation note ─────────────────────────

export const AMELIYAT_ANESTEZI = ['genel', 'spinal', 'epidural', 'kombine', 'rejyonel_blok', 'sedasyon', 'lokal'] as const
/** The fields of every operation note, in the order of the note. */
export const AMELIYAT_ALANLARI: readonly AracAlani[] = [
  tarih('tarih'), metin('saat'), secim('aciliyet', ['elektif', 'acil']),
  metin('preop_tani'), metin('postop_tani'), metin('islem'),
  metin('cerrah'), metin('asistanlar'), secim('anestezi', AMELIYAT_ANESTEZI), metin('anestezist'),
  paragraf('endikasyon'), paragraf('bulgular'), paragraf('teknik'),
  secim('patoloji', ['gonderildi', 'gonderilmedi']), metin('patoloji_materyal', { kosul: { alan: 'patoloji', degerler: ['gonderildi'] } }),
  sayi('kan_kaybi', 0, 20000, { tam: true, birim: 'mL' }), metin('sivi'), metin('drenler'), paragraf('komplikasyon'),
  paragraf('implantlar'), paragraf('kapanis'), metin('antibiyotik'), metin('vte'), paragraf('postop'),
]
/** What the note must hold before it is complete (RCS GSP 1.3); an anaesthetist unless the anaesthesia is local. */
export const AMELIYAT_ZORUNLU = ['aciliyet', 'preop_tani', 'postop_tani', 'islem', 'cerrah', 'anestezi', 'bulgular', 'teknik', 'patoloji', 'komplikasyon', 'kapanis', 'postop'] as const
export function ameliyatNotuHesapla(g: Readonly<Record<string, unknown>>): AracSonucu {
  if (!gunMu(g.tarih) || !sayiMi(g.kan_kaybi)) return BOS_SONUC
  for (const k of AMELIYAT_ZORUNLU) if (!dolu(g[k])) return BOS_SONUC
  if (g.anestezi !== 'lokal' && !dolu(g.anestezist)) return BOS_SONUC
  if (g.patoloji === 'gonderildi' && !dolu(g.patoloji_materyal)) return BOS_SONUC
  return { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'tarih', tarih: g.tarih as string }] }
}
// The items follow what surgical colleges list for an operation note (on main the Turkish shell, lib/doktor/ameliyatNotu.ts,
// cites them); no one country's college is named here, because the kit is every country's (a pack names its own).
const AMELIYAT_KAYNAK = null

/** CORE: the same shell for every surgical role. Printed on the doctor's letterhead. */
export const AMELIYAT_NOTU: AracTanimi = {
  anahtar: 'ameliyat-notu', tur: 'liste', yazdirilir: true,
  alanlar: AMELIYAT_ALANLARI,
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['tarih'] },
  kaynak: AMELIYAT_KAYNAK,
  hesapla: (g) => ameliyatNotuHesapla(g),
}

/** The obstetric and gynaecological operations whose standard steps a pack may pre-fill (`PaketAraci.sablonlar.sablon`). */
export const KD_AMELIYAT_SABLONLARI = ['sezaryen', 'tlh', 'tah', 'vajinal_histerektomi', 'lap_myomektomi', 'abdominal_myomektomi', 'tanisal_laparoskopi', 'lap_over_kistektomi', 'lap_endometriozis', 'histeroskopi', 'dc_kuretaj', 'vakum_aspirasyon', 'kolposkopi_leep', 'ria', 'labioplasti', 'perineoplasti'] as const
/**
 * GENITAL-ESTETIK-01 (2026-11-06): on this note — which has NO age gate, so that medically indicated surgery for a minor is
 * never blocked — labiaplasty and perineoplasty are MEDICALLY INDICATED ONLY: the note is complete only with the tick and
 * the reason. A cosmetic genital operation is written with the adult genital-aesthetics note (./genitalEstetik.ts), which
 * every pack gates at 18 or over.
 */
export const KD_GENITAL_SABLONLARI: readonly string[] = ['labioplasti', 'perineoplasti']
const KD_GENITAL_KOSUL = { alan: 'sablon', degerler: KD_GENITAL_SABLONLARI } as const
/** THE SAME NOTE, with the choice of an obstetric or gynaecological operation whose steps the pack pre-fills. O&G roles only. */
export const AMELIYAT_NOTU_KD: AracTanimi = {
  anahtar: 'ameliyat-notu-kd', tur: 'liste', yazdirilir: true,
  alanlar: [secim('sablon', KD_AMELIYAT_SABLONLARI, true), { anahtar: 'tibbi_endikasyon', tur: 'isaret', kosul: KD_GENITAL_KOSUL }, paragraf('tibbi_gerekce', { kosul: KD_GENITAL_KOSUL }), ...AMELIYAT_ALANLARI],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['tarih'] },
  kaynak: AMELIYAT_KAYNAK,
  hesapla: (g) => {
    if (typeof g.sablon === 'string' && KD_GENITAL_SABLONLARI.includes(g.sablon) && !(g.tibbi_endikasyon === true && dolu(g.tibbi_gerekce))) return BOS_SONUC
    return ameliyatNotuHesapla(g)
  },
}

// ───────────────────────── obstetric ultrasound ─────────────────────────

export const OBS_UYARILAR = ['afi_oligo', 'afi_poli', 'dvp_oligo', 'dvp_poli', 'mca_anemi', 'cpr_dusuk', 'ua_edf_yok', 'ua_edf_ters', 'fkh_dusuk', 'fkh_yuksek', 'nt_esik', 'biyometri_dusuk', 'biyometri_yuksek'] as const
export const USG_OBSTETRIK: AracTanimi = {
  anahtar: 'usg-obstetrik', tur: 'liste', yazdirilir: true,
  alanlar: [
    tarih('tarih'), sayi('hafta', 4, 44, { tam: true }), sayi('gun', 0, 6, { tam: true, istege: true }), sayi('fetus', 1, 6, { tam: true, istege: true }),
    sayi('crl', 1, 100, { birim: 'mm', istege: true }), sayi('bpd', 10, 120, { birim: 'mm', istege: true }), sayi('hc', 40, 420, { birim: 'mm', istege: true }),
    sayi('ac', 40, 450, { birim: 'mm', istege: true }), sayi('fl', 5, 90, { birim: 'mm', istege: true }),
    sayi('afi', 0, 60, { birim: 'cm', istege: true }), sayi('dvp', 0, 25, { birim: 'cm', istege: true }), metin('plasenta'),
    secim('prezentasyon', ['sefalik', 'makat', 'transvers', 'oblik', 'degisken'], true), sayi('fkh', 40, 240, { tam: true, istege: true }),
    sayi('ua_pi', 0, 5, { istege: true }), sayi('ua_ri', 0, 1.5, { istege: true }), secim('ua_edf', ['var', 'yok', 'ters'], true),
    sayi('mca_pi', 0, 5, { istege: true }), sayi('mca_psv', 5, 150, { birim: 'cm/s', istege: true }),
    sayi('ut_pi_sag', 0, 5, { istege: true }), sayi('ut_pi_sol', 0, 5, { istege: true }), sayi('nt', 0.1, 15, { birim: 'mm', istege: true }),
    paragraf('anatomi'), paragraf('sonuc'),
  ],
  cikti: { sayilar: ['bpd_p', 'hc_p', 'ac_p', 'fl_p', 'efw', 'mca_mom', 'cpr', 'ut_ort_pi'], bantlar: [], uyarilar: [...OBS_UYARILAR], tarihler: [] },
  kaynak: 'INTERGROWTH-21st fetal growth standards (Papageorghiou et al., Lancet 2014;384:869-79); Hadlock et al. 1985 (EFW from HC, AC, FL); Mari et al., N Engl J Med 2000;342:9-14 (MCA-PSV median); Gramellini et al., Obstet Gynecol 1992;79:416-20 (CPR); SMFM Consult Series #46 (2018) and ACOG Committee Opinion 831 (2021) (liquor).',
  hesapla: (g) => {
    if (!gunMu(g.tarih) || !sayiMi(g.hafta)) return BOS_SONUC
    const hafta = (g.hafta as number) + (sayiMi(g.gun) ? (g.gun as number) / 7 : 0)
    const sayilar: AracSayisi[] = []
    const uyarilar: string[] = []
    for (const p of ['bpd', 'hc', 'ac', 'fl'] as BiyometriParametre[]) {
      const mm = g[p]
      if (!sayiMi(mm)) continue
      const s = biyometriPersentil(p, mm, hafta)
      if (!s) continue
      sayilar.push(say(`${p}_p`, s.persentil, 0))
      if (s.durum === 'dusuk' && !uyarilar.includes('biyometri_dusuk')) uyarilar.push('biyometri_dusuk')
      if (s.durum === 'yuksek' && !uyarilar.includes('biyometri_yuksek')) uyarilar.push('biyometri_yuksek')
    }
    if (sayiMi(g.hc) && sayiMi(g.ac) && sayiMi(g.fl)) { const e = hadlockEfw(g.hc, g.ac, g.fl); if (e != null) sayilar.push(say('efw', Math.round(e), 0, 'g')) }
    if (sayiMi(g.mca_psv) && hafta >= 18 && hafta <= 40) {
      const mom = yuvarla((g.mca_psv as number) / Math.exp(2.31 + 0.046 * hafta), 2)
      sayilar.push(say('mca_mom', mom, 2))
      if (mom >= 1.5) uyarilar.push('mca_anemi')
    }
    if (sayiMi(g.mca_pi) && sayiMi(g.ua_pi) && (g.ua_pi as number) > 0) {
      const cpr = yuvarla((g.mca_pi as number) / (g.ua_pi as number), 2)
      sayilar.push(say('cpr', cpr, 2))
      if (cpr < 1.08) uyarilar.push('cpr_dusuk')
    }
    const ut = [g.ut_pi_sag, g.ut_pi_sol].filter(sayiMi) as number[]
    if (ut.length) sayilar.push(say('ut_ort_pi', yuvarla(ut.reduce((a, b) => a + b, 0) / ut.length, 2), 2))
    if (sayiMi(g.afi)) { if ((g.afi as number) <= 5) uyarilar.push('afi_oligo'); else if ((g.afi as number) >= 24) uyarilar.push('afi_poli') }
    if (sayiMi(g.dvp)) { if ((g.dvp as number) < 2) uyarilar.push('dvp_oligo'); else if ((g.dvp as number) >= 8) uyarilar.push('dvp_poli') }
    if (g.ua_edf === 'yok') uyarilar.push('ua_edf_yok')
    if (g.ua_edf === 'ters') uyarilar.push('ua_edf_ters')
    if (sayiMi(g.fkh)) { if ((g.fkh as number) < 110) uyarilar.push('fkh_dusuk'); else if ((g.fkh as number) > 160) uyarilar.push('fkh_yuksek') }
    if (sayiMi(g.nt) && (g.nt as number) >= 3.5) uyarilar.push('nt_esik')
    return { tamam: true, sayilar, bant: null, uyarilar, tarihler: [] }
  },
}

// ───────────────────────── gynaecological ultrasound ─────────────────────────

const elipsoid = (a: unknown, b: unknown, c: unknown): number | null => (sayiMi(a) && sayiMi(b) && sayiMi(c) ? yuvarla(((a as number) * (b as number) * (c as number) * 0.523) / 1000, 1) : null)
const mm = (k: string, enCok = 300) => sayi(k, 1, enCok, { birim: 'mm', istege: true })
export const USG_JINEKOLOJIK: AracTanimi = {
  anahtar: 'usg-jinekolojik', tur: 'liste', yazdirilir: true,
  alanlar: [
    tarih('tarih'), secim('yol', ['transvajinal', 'transabdominal', 'transrektal'], true), isaret('menopoz'),
    mm('uterus_u'), mm('uterus_ap'), mm('uterus_g'), metin('uterus_poz'), sayi('endometrium', 0, 60, { birim: 'mm', istege: true }),
    mm('over_sag_1'), mm('over_sag_2'), mm('over_sag_3'), metin('over_sag_not'),
    mm('over_sol_1'), mm('over_sol_2'), mm('over_sol_3'), metin('over_sol_not'),
    metin('lezyon_1'), mm('lezyon_1_boyut'), metin('lezyon_2'), mm('lezyon_2_boyut'), metin('serbest_sivi'), paragraf('sonuc'),
  ],
  cikti: { sayilar: ['uterus_hacim', 'over_sag_hacim', 'over_sol_hacim'], bantlar: [], uyarilar: ['endometrium_postmenopoz'], tarihler: [] },
  kaynak: 'Prolate ellipsoid volume (length x AP x width x 0.523); ACOG Committee Opinion 734 (2018): endometrium above 4 mm after menopause.',
  hesapla: (g) => {
    if (!gunMu(g.tarih)) return BOS_SONUC
    const olcu = ['uterus_u', 'uterus_ap', 'uterus_g', 'endometrium', 'over_sag_1', 'over_sol_1', 'lezyon_1_boyut'].some((k) => sayiMi(g[k])) || dolu(g.sonuc)
    if (!olcu) return BOS_SONUC
    const sayilar: AracSayisi[] = []
    const u = elipsoid(g.uterus_u, g.uterus_ap, g.uterus_g); if (u != null) sayilar.push(say('uterus_hacim', u, 1, 'mL'))
    const s = elipsoid(g.over_sag_1, g.over_sag_2, g.over_sag_3); if (s != null) sayilar.push(say('over_sag_hacim', s, 1, 'mL'))
    const l = elipsoid(g.over_sol_1, g.over_sol_2, g.over_sol_3); if (l != null) sayilar.push(say('over_sol_hacim', l, 1, 'mL'))
    const uyarilar = g.menopoz === true && sayiMi(g.endometrium) && (g.endometrium as number) > 4 ? ['endometrium_postmenopoz'] : []
    return { tamam: true, sayilar, bant: null, uyarilar, tarihler: [] }
  },
}

// ───────────────────────── delivery discharge summary ─────────────────────────

export const DOGUM_SEKILLERI = ['vajinal', 'mudahaleli', 'cs_elektif', 'cs_acil', 'vbac'] as const
/** The paragraph fields a pack pre-fills by the mode of birth (`PaketAraci.sablonlar.dogum_sekli`). */
export const DOGUM_EPIKRIZI: AracTanimi = {
  anahtar: 'dogum-epikrizi', tur: 'liste', yazdirilir: true,
  alanlar: [
    tarih('dogum_tarihi'), secim('dogum_sekli', DOGUM_SEKILLERI), sayi('hafta', 20, 44, { tam: true }), sayi('gun', 0, 6, { tam: true, istege: true }),
    secim('bebek_cinsiyet', ['kiz', 'erkek', 'belirsiz'], true), sayi('bebek_agirlik', 300, 7000, { tam: true, birim: 'g', istege: true }),
    sayi('apgar1', 0, 10, { tam: true, istege: true }), sayi('apgar5', 0, 10, { tam: true, istege: true }),
    sayi('kan_kaybi', 0, 20000, { tam: true, birim: 'mL', istege: true }), paragraf('endikasyon'), paragraf('komplikasyon'),
    paragraf('ilaclar'), isaret('emziriyor'), paragraf('talimatlar'), paragraf('kontrasepsiyon'), paragraf('tehlike'),
    tarih('kontrol', true),
  ],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['dogum_tarihi', 'kontrol'] },
  kaynak: null,
  hesapla: (g) => {
    if (!gunMu(g.dogum_tarihi) || typeof g.dogum_sekli !== 'string' || !sayiMi(g.hafta)) return BOS_SONUC
    const tarihler = [{ anahtar: 'dogum_tarihi', tarih: g.dogum_tarihi as string }, ...(gunMu(g.kontrol) ? [{ anahtar: 'kontrol', tarih: g.kontrol as string }] : [])]
    return { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler }
  },
}

// ───────────────────────── CTG: FIGO 2015 ─────────────────────────

/** The CTG features every classification reads (the same fields in every country's own classification tool). */
export const KTG_ALANLARI: readonly AracAlani[] = [
  tarih('tarih'), sayi('hafta', 20, 44, { tam: true, istege: true }), sayi('sure', 1, 240, { tam: true, birim: 'dk' }),
  sayi('bazal', 50, 240, { tam: true }), sayi('varyabilite', 0, 60, { tam: true }),
  sayi('azalmis_dk', 0, 240, { tam: true, birim: 'dk', istege: true }), sayi('artmis_dk', 0, 240, { tam: true, birim: 'dk', istege: true }),
  sayi('sinuzoidal_dk', 0, 240, { tam: true, birim: 'dk', istege: true }), sayi('tasikardi_dk', 0, 240, { tam: true, birim: 'dk', istege: true }),
  sayi('aksel_20dk', 0, 30, { tam: true, istege: true }),
  sayi('erken', 0, 60, { tam: true, istege: true }), sayi('gec', 0, 60, { tam: true, istege: true }), sayi('degisken', 0, 60, { tam: true, istege: true }),
  isaret('degisken_komplike'), sayi('uzamis', 0, 20, { tam: true, istege: true }), isaret('tekrarlayan'),
  sayi('tekrar_dk', 0, 240, { tam: true, birim: 'dk', istege: true }), sayi('en_uzun_des', 0, 60, { birim: 'dk', istege: true }),
  sayi('kontraksiyon', 0, 15, { tam: true, istege: true }), paragraf('sonuc'),
]
const n0 = (x: unknown): number => (sayiMi(x) ? x : 0)

/** FIGO 2015 (Table 4): normal / suspicious / pathological. */
export function figoKtg(g: Readonly<Record<string, unknown>>): { bant: 'normal' | 'supheli' | 'patolojik'; uyarilar: string[] } | null {
  if (!sayiMi(g.bazal) || !sayiMi(g.varyabilite)) return null
  const u: string[] = []
  const azalmis = (g.varyabilite as number) < 5
  if ((g.bazal as number) < 100) u.push('bazal_patolojik')
  if (n0(g.azalmis_dk) > 50 || n0(g.artmis_dk) > 30) u.push('varyabilite_patolojik')
  if (n0(g.sinuzoidal_dk) > 30) u.push('sinuzoidal')
  if (g.tekrarlayan === true && (n0(g.gec) > 0 || n0(g.uzamis) > 0) && n0(g.tekrar_dk) > (azalmis ? 20 : 30)) u.push('des_patolojik')
  if (n0(g.en_uzun_des) > 5) u.push('uzamis_des')
  const patolojik = u.length > 0
  if ((g.bazal as number) >= 100 && (g.bazal as number) < 110) u.push('bazal_dusuk')
  if ((g.bazal as number) > 160) u.push('bazal_yuksek')
  if (azalmis && !u.includes('varyabilite_patolojik')) u.push('varyabilite_azalmis')
  if ((g.varyabilite as number) > 25 && !u.includes('varyabilite_patolojik')) u.push('varyabilite_artmis')
  if (g.tekrarlayan === true && !u.includes('des_patolojik')) u.push('tekrarlayan_des')
  if (n0(g.kontraksiyon) > 5) u.push('tasisistoli')
  const normal = (g.bazal as number) >= 110 && (g.bazal as number) <= 160 && (g.varyabilite as number) >= 5 && (g.varyabilite as number) <= 25 && g.tekrarlayan !== true && n0(g.sinuzoidal_dk) === 0
  return { bant: patolojik ? 'patolojik' : normal ? 'normal' : 'supheli', uyarilar: u }
}
export const FIGO_UYARILARI = ['bazal_patolojik', 'varyabilite_patolojik', 'sinuzoidal', 'des_patolojik', 'uzamis_des', 'bazal_dusuk', 'bazal_yuksek', 'varyabilite_azalmis', 'varyabilite_artmis', 'tekrarlayan_des', 'tasisistoli'] as const
export const KTG_FIGO: AracTanimi = {
  anahtar: 'ktg-figo', tur: 'olcek', yazdirilir: true,
  alanlar: KTG_ALANLARI,
  cikti: { sayilar: [], bantlar: ['normal', 'supheli', 'patolojik'], uyarilar: [...FIGO_UYARILARI], tarihler: [] },
  kaynak: 'Ayres-de-Campos D, Spong CY, Chandraharan E; FIGO Intrapartum Fetal Monitoring Expert Consensus Panel. FIGO consensus guidelines on intrapartum fetal monitoring: Cardiotocography. Int J Gynecol Obstet 2015;131:13-24.',
  hesapla: (g) => {
    if (!gunMu(g.tarih) || !sayiMi(g.sure)) return BOS_SONUC
    const r = figoKtg(g)
    return r ? { tamam: true, sayilar: [], bant: r.bant, uyarilar: r.uyarilar, tarihler: [] } : BOS_SONUC
  },
}

export const KADIN_DOGUM_CERRAHI: readonly AracTanimi[] = [AMELIYAT_NOTU, AMELIYAT_NOTU_KD, USG_OBSTETRIK, USG_JINEKOLOJIK, DOGUM_EPIKRIZI, KTG_FIGO]
