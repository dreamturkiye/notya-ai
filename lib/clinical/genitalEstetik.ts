/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — COSMETIC GYNAECOLOGY / GENITAL AESTHETICS: the shared, country-neutral engine.
 * Obstetrics and gynaecology only (the Turkish build's KD branch; each country build's O&G role). Pure and client-safe.
 * KEYS AND NUMBERS ONLY: every word a doctor or a patient reads is the build's own (Turkish build:
 * specialties/kadin-dogum/engines/genitalEstetikMetinleri.ts; country builds: their packs). Byte-identical on every branch.
 *
 * What is here:
 *   1. the INDICATION GATE  every procedure of the package carries an explicit indication: cosmetic or medically indicated
 *                           (reconstructive / functional, with a structured reason and the doctor's own words). A cosmetic
 *                           procedure is HARD-BLOCKED for a patient under 18, and for a patient whose birth date is not
 *                           recorded (a missing fact never opens the gate). A medically indicated procedure is never blocked
 *                           by age: surgery a minor needs must not be stopped by mistake.
 *   2. RECORDS              the energy-based session note (CO2 / Er:YAG laser, radiofrequency), the injection log (HA filler,
 *                           PRP, other) with LOT NUMBERS kept in a recall-searchable form, and the genital whitening record.
 *                           Validators return error KEYS, never sentences. The engine proposes NO setting, NO dose and NO
 *                           volume: it records what the clinician used (the derm and medikal-estetik rule: parameters are the
 *                           clinician's).
 *   3. OUTCOME MEASURES     FSFI (Rosen et al., J Sex Marital Ther 2000;26:191-208; domain factors and ranges as printed in the
 *                           published scoring appendix; cut-off 26.55, Wiegel et al., J Sex Marital Ther 2005;31:1-20), FGSIS
 *                           (Herbenick & Reece, J Sex Med 2010; 7 items on a 4-point scale, total 7-28, no cut-off) and COPS-L (Veale et al.,
 *                           J Psychosom Obstet Gynaecol 2013;34:46-52; total 0-72, 40 or more = likely body dysmorphic
 *                           disorder, the COPS cut-off of Veale et al. 2012/2013). NO ITEM TEXT IS HERE OR ANYWHERE IN THE
 *                           PRODUCT: the wording belongs to the authors and their permission for commercial software is not
 *                           settled (GE_OLCEK_LISANSLARI). The clinician administers the authorised form and records the
 *                           TOTAL; item-level entry stays closed until a licence is recorded.
 *                           A POSITIVE COPS-L PROMPTS the clinician to consider referral. It never blocks, never diagnoses.
 *   4. PHOTO DOCUMENTATION  the standard views, the photo-consent check and the fixed handling rules of intimate photos:
 *                           no thumbnail, blurred until clicked, every view audited, never sent to any model, never in an
 *                           export unless the clinician includes them explicitly.
 *
 * Hymenoplasty is NOT part of this package and never will be by default (AMELIYAT-NOTU-HIMENOPLASTI-01).
 *
 * REUSE (never duplicate): the session-interval rule (14-90 days) is the one the derm laser studio already used; the lot
 * check is the one the medikal-estetik lot tool now calls (specialties/medikal-estetik/engines/estetik.ts -> lotNoDogrula).
 */

// ───────────────────────── catalogue ─────────────────────────

/** The four kinds of record of the package. */
export const GE_ISLEM_TURLERI = ['cerrahi', 'enerji', 'enjeksiyon', 'beyazlatma'] as const
export type GeIslemTuru = (typeof GE_ISLEM_TURLERI)[number]

/** Operations with an operation-note template (labioplasty and perineoplasty existed; the hood variant and vaginoplasty are new). */
export const GE_CERRAHI = ['labioplasti', 'labioplasti_klitoral', 'vajinoplasti', 'perineoplasti'] as const
export type GeCerrahi = (typeof GE_CERRAHI)[number]

/** Energy-based modalities. A laser's nominal wavelength is physics, not a setting (GE_DALGA_BOYU_NM). */
export const GE_ENERJI_MODALITE = ['co2_lazer', 'erbiyum_yag_lazer', 'rf_monopolar', 'rf_bipolar', 'rf_fraksiyonel', 'diger'] as const
export type GeEnerjiModalite = (typeof GE_ENERJI_MODALITE)[number]
/** CO2 10 600 nm; Er:YAG 2 940 nm. Radiofrequency has no wavelength. */
export const GE_DALGA_BOYU_NM: Readonly<Partial<Record<GeEnerjiModalite, number>>> = { co2_lazer: 10600, erbiyum_yag_lazer: 2940 }
export const GE_LAZER: readonly GeEnerjiModalite[] = ['co2_lazer', 'erbiyum_yag_lazer']
export const GE_RF: readonly GeEnerjiModalite[] = ['rf_monopolar', 'rf_bipolar', 'rf_fraksiyonel']
/** What the session is for. */
export const GE_ENERJI_AMAC = ['vajinal_laksite', 'gsm', 'stres_inkontinans', 'liken_skleroz', 'genital_beyazlatma', 'diger'] as const
export const GE_ENERJI_BOLGE = ['vajinal_kanal', 'introitus', 'vulva_labia', 'perine', 'periuretral'] as const

export const GE_ENJEKSIYON_URUN = ['ha_dolgu', 'prp', 'diger'] as const
export type GeEnjeksiyonUrun = (typeof GE_ENJEKSIYON_URUN)[number]
export const GE_ENJEKSIYON_BOLGE = ['g_noktasi_on_vajinal_duvar', 'vajinal_duvar', 'introitus', 'labia_majora', 'labia_minora', 'klitoral_baslik', 'periuretral', 'perine', 'mons_pubis'] as const
export type GeEnjeksiyonBolge = (typeof GE_ENJEKSIYON_BOLGE)[number]
export const GE_ENJEKSIYON_TEKNIK = ['lineer_retrograd', 'bolus', 'yelpaze', 'mikro_damla', 'diger'] as const

export const GE_BEYAZLATMA_YONTEM = ['kimyasal_peeling', 'topikal', 'lazer'] as const
export type GeBeyazlatmaYontem = (typeof GE_BEYAZLATMA_YONTEM)[number]
export const GE_BEYAZLATMA_BOLGE = ['labia_majora', 'labia_minora', 'perine', 'perianal', 'inguinal', 'mons_pubis'] as const

/** Adverse events of a session or an injection (one list, so a trend across records reads the same keys). */
export const GE_ADVERS = ['yok', 'agri', 'kanama', 'yanik', 'skar', 'enfeksiyon', 'disparoni', 'vaskuler_tikanma_suphesi', 'nodul', 'asimetri', 'alerjik_reaksiyon', 'diger'] as const
/** Skin reactions of a whitening session. */
export const GE_REAKSIYON = ['yok', 'eritem', 'odem', 'yanma_hissi', 'hiperpigmentasyon', 'hipopigmentasyon', 'vezikul_bul', 'enfeksiyon', 'diger'] as const

/**
 * EXTERNAL GENITAL PARTS NAMED BY FGM LAWS (labia majora, labia minora, clitoris and its prepuce/hood): where a procedure
 * touches one of them, a country whose law makes the cosmetic version an offence or legally uncertain keeps only the
 * medically indicated version (the pack decides, with its legal source; this list only says which keys are concerned).
 */
export const GE_DIS_GENITAL_ANAHTARLARI: readonly string[] = ['labioplasti', 'labioplasti_klitoral', 'labia_majora', 'labia_minora', 'klitoral_baslik', 'vulva_labia']

// ───────────────────────── 1. the indication gate ─────────────────────────

export const GE_ENDIKASYONLAR = ['kozmetik', 'medikal'] as const
export type GeEndikasyon = (typeof GE_ENDIKASYONLAR)[number]
/** The structured reason of a medically indicated procedure (the doctor adds their own words as well). */
export const GE_MEDIKAL_GEREKCE = ['konjenital_anomali', 'travma_onarimi', 'obstetrik_hasar_onarimi', 'lezyon_eksizyonu', 'belgelenmis_fonksiyonel_yakinma', 'prolapsus', 'fgm_sonrasi_rekonstruksiyon', 'gsm_tedavisi', 'liken_skleroz', 'diger_tibbi'] as const
export type GeMedikalGerekce = (typeof GE_MEDIKAL_GEREKCE)[number]
export const GE_YAS_SINIRI = 18
/** The doctor's own words of a medical reason: at least this many characters. */
export const GE_GEREKCE_EN_AZ = 10

/** Whole years from the birth date to `gun` (YYYY-MM-DD). null = missing, malformed, or born after `gun`. */
export function geTamYas(dogumTarihi: string | null | undefined, gun: string | null | undefined): number | null {
  const R = /^(\d{4})-(\d{2})-(\d{2})/
  const d = R.exec(String(dogumTarihi ?? '')), g = R.exec(String(gun ?? ''))
  if (!d || !g) return null
  let yil = Number(g[1]) - Number(d[1])
  if (Number(g[2]) < Number(d[2]) || (Number(g[2]) === Number(d[2]) && Number(g[3]) < Number(d[3]))) yil -= 1
  return yil >= 0 ? yil : null
}

/** Whether a procedure CAN be medically indicated at all. Whitening and a G-spot filler are cosmetic only. */
export function geMedikalOlabilir(tur: GeIslemTuru, alt?: { urun?: string; bolge?: string; yontem?: string }): boolean {
  if (tur === 'beyazlatma') return false
  if (tur === 'enjeksiyon' && alt?.urun === 'ha_dolgu' && alt.bolge === 'g_noktasi_on_vajinal_duvar') return false
  return true
}

export type GeKapiGirdisi = {
  dogumTarihi: string | null | undefined
  /** The day of the procedure (YYYY-MM-DD). */
  gun: string
  endikasyon: unknown
  medikalGerekce?: unknown
  medikalAciklama?: unknown
  tur: GeIslemTuru
  alt?: { urun?: string; bolge?: string; yontem?: string }
}
export type GeKapiNedeni = 'endikasyon_yok' | 'yas_18_alti' | 'dogum_tarihi_yok' | 'medikal_gerekce_yok' | 'medikal_bu_islemde_yok'
export type GeKapiSonucu = { izin: true; endikasyon: GeEndikasyon; yas: number | null } | { izin: false; neden: GeKapiNedeni; yas: number | null }

/**
 * THE ONE DECISION, on the screen and again on the server before anything is written. Cosmetic: 18 or over, birth date
 * known. Medically indicated: any age, with a structured reason and the doctor's words; never for whitening or a G-spot filler.
 */
export function geKapi(g: GeKapiGirdisi): GeKapiSonucu {
  const yas = geTamYas(g.dogumTarihi, g.gun)
  if (g.endikasyon !== 'kozmetik' && g.endikasyon !== 'medikal') return { izin: false, neden: 'endikasyon_yok', yas }
  if (g.endikasyon === 'medikal') {
    if (!geMedikalOlabilir(g.tur, g.alt)) return { izin: false, neden: 'medikal_bu_islemde_yok', yas }
    const gerekceTamam = (GE_MEDIKAL_GEREKCE as readonly unknown[]).includes(g.medikalGerekce)
    const aciklama = typeof g.medikalAciklama === 'string' ? g.medikalAciklama.trim() : ''
    if (!gerekceTamam || aciklama.length < GE_GEREKCE_EN_AZ) return { izin: false, neden: 'medikal_gerekce_yok', yas }
    return { izin: true, endikasyon: 'medikal', yas }
  }
  if (yas === null) return { izin: false, neden: 'dogum_tarihi_yok', yas }
  if (yas < GE_YAS_SINIRI) return { izin: false, neden: 'yas_18_alti', yas }
  return { izin: true, endikasyon: 'kozmetik', yas }
}

// ───────────────────────── 2. records ─────────────────────────

const GUN_RE = /^\d{4}-\d{2}-\d{2}$/
export const geGunMu = (s: unknown): s is string => typeof s === 'string' && GUN_RE.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s
export function geGunEkle(gun: string, n: number): string {
  const d = new Date(`${gun}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const metin = (v: unknown, azami: number): string | null => {
  if (v == null) return ''
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length > azami ? null : t
}
const sayiOku = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}
const listeOku = <T extends string>(v: unknown, izinli: readonly T[]): T[] | null => {
  if (v == null) return []
  if (!Array.isArray(v)) return null
  const out: T[] = []
  for (const x of v) { if (!(izinli as readonly unknown[]).includes(x)) return null; if (!out.includes(x as T)) out.push(x as T) }
  return out
}
export const GE_KISA_AZAMI = 160
export const GE_UZUN_AZAMI = 2000

/** THE SESSION INTERVAL the clinician chooses: 14-90 days (the derm laser studio's rule). The due day, or an error key. */
export const GE_SEANS_ARALIK = { enAz: 14, enCok: 90 } as const
export function seansVadesi(sonGun: string, aralikGun: number): { due: string } | { hata: 'gun_gecersiz' | 'aralik_gecersiz' } {
  if (!geGunMu(sonGun)) return { hata: 'gun_gecersiz' }
  if (!Number.isInteger(aralikGun) || aralikGun < GE_SEANS_ARALIK.enAz || aralikGun > GE_SEANS_ARALIK.enCok) return { hata: 'aralik_gecersiz' }
  return { due: geGunEkle(sonGun, aralikGun) }
}

/** A LOT NUMBER as it is kept for a recall: upper case, no spaces; letters, digits and - / . only, 2-40 characters. */
export function lotNoDogrula(ham: unknown): { lot: string } | { hata: 'lot_yok' | 'lot_gecersiz' | 'lot_doz_iceriyor' } {
  if (typeof ham !== 'string' || !ham.trim()) return { hata: 'lot_yok' }
  if (/\d+\s*(ml|unite|\u00fcnite|units?\b|iu\b)/i.test(ham)) return { hata: 'lot_doz_iceriyor' }
  const lot = ham.trim().toUpperCase().replace(/\s+/g, '')
  if (!/^[A-Z0-9][A-Z0-9\-/.]{1,39}$/.test(lot)) return { hata: 'lot_gecersiz' }
  return { lot }
}
/** The key a recall search compares: the kept form of a lot number (case and spaces do not matter). */
export const lotAnahtari = (ham: string): string => ham.trim().toUpperCase().replace(/\s+/g, '')

/** Expiry as printed on a product: YYYY-MM (end of that month) or YYYY-MM-DD. The last valid day, or null. */
export function sonKullanmaGunu(ham: unknown): string | null {
  if (typeof ham !== 'string') return null
  const t = ham.trim()
  if (geGunMu(t)) return t
  const m = /^(\d{4})-(\d{2})$/.exec(t)
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null
  return new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).toISOString().slice(0, 10)
}

export type GeHata = { ok: false; hata: string; alan: string }
type Ortak = { tarih: string; endikasyon: GeEndikasyon; medikalGerekce: GeMedikalGerekce | null; medikalAciklama: string }
function ortakOku(g: Record<string, unknown>): Ortak | GeHata {
  if (!geGunMu(g.tarih)) return { ok: false, hata: 'tarih_gecersiz', alan: 'tarih' }
  if (g.endikasyon !== 'kozmetik' && g.endikasyon !== 'medikal') return { ok: false, hata: 'endikasyon_yok', alan: 'endikasyon' }
  const aciklama = metin(g.medikalAciklama, GE_UZUN_AZAMI)
  if (aciklama === null) return { ok: false, hata: 'metin_uzun', alan: 'medikalAciklama' }
  const gerekce = (GE_MEDIKAL_GEREKCE as readonly unknown[]).includes(g.medikalGerekce) ? (g.medikalGerekce as GeMedikalGerekce) : null
  return { tarih: g.tarih, endikasyon: g.endikasyon, medikalGerekce: g.endikasyon === 'medikal' ? gerekce : null, medikalAciklama: g.endikasyon === 'medikal' ? aciklama : '' }
}
const hataMi = (x: unknown): x is GeHata => !!x && typeof x === 'object' && (x as GeHata).ok === false

export type EnerjiSeansi = Ortak & {
  modalite: GeEnerjiModalite; cihaz: string; dalgaBoyuNm: number | null
  /** What the clinician set, as the device displays it; every number optional, each within a sanity range. */
  ayarlar: { gucW: number | null; enerjiMj: number | null; yogunlukYuzde: number | null; aralikMikron: number | null; darbeSuresiMs: number | null; hedefSicaklikC: number | null; yigma: number | null }
  amac: (typeof GE_ENERJI_AMAC)[number]; bolgeler: (typeof GE_ENERJI_BOLGE)[number][]; gecis: number
  seansNo: number; seriToplam: number; advers: (typeof GE_ADVERS)[number][]; adversAciklama: string
  /** The interval the clinician chose; null = no next session (the series is complete, or none planned). */
  aralikGun: number | null; sonrakiTarih: string | null
}
/** Sanity ranges: a value outside is a typing error, refused; they say nothing about what is appropriate. */
export const GE_AYAR_ARALIKLARI = { gucW: [0, 200], enerjiMj: [0, 1000], yogunlukYuzde: [0, 100], aralikMikron: [0, 5000], darbeSuresiMs: [0, 1000], hedefSicaklikC: [30, 60], yigma: [1, 10] } as const
export const GE_SERI_AZAMI = 12
export const GE_GECIS_AZAMI = 10

export function enerjiSeansiDogrula(ham: unknown): { ok: true; veri: EnerjiSeansi } | GeHata {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const o = ortakOku(g); if (hataMi(o)) return o
  if (!(GE_ENERJI_MODALITE as readonly unknown[]).includes(g.modalite)) return { ok: false, hata: 'modalite_yok', alan: 'modalite' }
  const modalite = g.modalite as GeEnerjiModalite
  const cihaz = metin(g.cihaz, GE_KISA_AZAMI)
  if (cihaz === null || !cihaz) return { ok: false, hata: 'cihaz_yok', alan: 'cihaz' }
  let dalgaBoyuNm: number | null = GE_DALGA_BOYU_NM[modalite] ?? null
  if (modalite === 'diger') { const d = sayiOku(g.dalgaBoyuNm); if (Number.isNaN(d) || (d !== null && (d < 100 || d > 20000))) return { ok: false, hata: 'sayi_aralik_disi', alan: 'dalgaBoyuNm' }; dalgaBoyuNm = d }
  const ayarlarHam = (g.ayarlar && typeof g.ayarlar === 'object' ? g.ayarlar : {}) as Record<string, unknown>
  const ayarlar = {} as EnerjiSeansi['ayarlar']
  for (const [k, [a, b]] of Object.entries(GE_AYAR_ARALIKLARI) as [keyof EnerjiSeansi['ayarlar'], readonly [number, number]][]) {
    const n = sayiOku(ayarlarHam[k])
    if (Number.isNaN(n) || (n !== null && (n < a || n > b))) return { ok: false, hata: 'sayi_aralik_disi', alan: `ayarlar.${k}` }
    ayarlar[k] = n
  }
  if (!(GE_ENERJI_AMAC as readonly unknown[]).includes(g.amac)) return { ok: false, hata: 'amac_yok', alan: 'amac' }
  const bolgeler = listeOku(g.bolgeler, GE_ENERJI_BOLGE)
  if (!bolgeler || !bolgeler.length) return { ok: false, hata: 'bolge_yok', alan: 'bolgeler' }
  const gecis = sayiOku(g.gecis)
  if (gecis === null || Number.isNaN(gecis) || !Number.isInteger(gecis) || gecis < 1 || gecis > GE_GECIS_AZAMI) return { ok: false, hata: 'sayi_aralik_disi', alan: 'gecis' }
  const seansNo = sayiOku(g.seansNo), seriToplam = sayiOku(g.seriToplam)
  if (seansNo === null || Number.isNaN(seansNo) || !Number.isInteger(seansNo) || seansNo < 1 || seansNo > GE_SERI_AZAMI) return { ok: false, hata: 'sayi_aralik_disi', alan: 'seansNo' }
  if (seriToplam === null || Number.isNaN(seriToplam) || !Number.isInteger(seriToplam) || seriToplam < seansNo || seriToplam > GE_SERI_AZAMI) return { ok: false, hata: 'seri_gecersiz', alan: 'seriToplam' }
  const advers = listeOku(g.advers, GE_ADVERS)
  if (!advers) return { ok: false, hata: 'liste_gecersiz', alan: 'advers' }
  const adversAciklama = metin(g.adversAciklama, GE_UZUN_AZAMI)
  if (adversAciklama === null) return { ok: false, hata: 'metin_uzun', alan: 'adversAciklama' }
  if (advers.some((a) => a !== 'yok') && !adversAciklama) return { ok: false, hata: 'advers_aciklama_yok', alan: 'adversAciklama' }
  let aralikGun: number | null = null, sonrakiTarih: string | null = null
  const ar = sayiOku(g.aralikGun)
  if (Number.isNaN(ar)) return { ok: false, hata: 'aralik_gecersiz', alan: 'aralikGun' }
  if (seansNo < seriToplam) {
    if (ar === null) return { ok: false, hata: 'aralik_gerekli', alan: 'aralikGun' }
    const v = seansVadesi(o.tarih, ar)
    if ('hata' in v) return { ok: false, hata: v.hata, alan: 'aralikGun' }
    aralikGun = ar; sonrakiTarih = v.due
  }
  return { ok: true, veri: { ...o, modalite, cihaz, dalgaBoyuNm, ayarlar, amac: g.amac as EnerjiSeansi['amac'], bolgeler, gecis, seansNo, seriToplam, advers: advers.length ? advers : ['yok'], adversAciklama, aralikGun, sonrakiTarih } }
}

export type EnjeksiyonKaydi = Ortak & {
  urun: GeEnjeksiyonUrun; urunAdi: string; lot: string; sonKullanma: string; hacimMl: number
  bolge: GeEnjeksiyonBolge; teknik: (typeof GE_ENJEKSIYON_TEKNIK)[number]; igneKanul: string
  advers: (typeof GE_ADVERS)[number][]; adversAciklama: string; kontrolGun: number; kontrolTarihi: string
}
export const GE_HACIM_ML = { enAz: 0.01, enCok: 20 } as const
export const GE_KONTROL_GUN = { enAz: 1, enCok: 180 } as const

/** An injection kept for traceability: product, LOT (kept recall-searchable), expiry (an expired product is refused), volume, site, technique, adverse events, follow-up day. */
export function enjeksiyonDogrula(ham: unknown): { ok: true; veri: EnjeksiyonKaydi } | GeHata {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const o = ortakOku(g); if (hataMi(o)) return o
  if (!(GE_ENJEKSIYON_URUN as readonly unknown[]).includes(g.urun)) return { ok: false, hata: 'urun_yok', alan: 'urun' }
  const urunAdi = metin(g.urunAdi, GE_KISA_AZAMI)
  if (urunAdi === null || !urunAdi) return { ok: false, hata: 'urun_adi_yok', alan: 'urunAdi' }
  const lot = lotNoDogrula(g.lot)
  if ('hata' in lot) return { ok: false, hata: lot.hata, alan: 'lot' }
  const sk = sonKullanmaGunu(g.sonKullanma)
  if (!sk) return { ok: false, hata: 'son_kullanma_gecersiz', alan: 'sonKullanma' }
  if (sk < o.tarih) return { ok: false, hata: 'urun_suresi_gecmis', alan: 'sonKullanma' }
  const hacim = sayiOku(g.hacimMl)
  if (hacim === null || Number.isNaN(hacim) || hacim < GE_HACIM_ML.enAz || hacim > GE_HACIM_ML.enCok) return { ok: false, hata: 'sayi_aralik_disi', alan: 'hacimMl' }
  if (!(GE_ENJEKSIYON_BOLGE as readonly unknown[]).includes(g.bolge)) return { ok: false, hata: 'bolge_yok', alan: 'bolge' }
  if (!(GE_ENJEKSIYON_TEKNIK as readonly unknown[]).includes(g.teknik)) return { ok: false, hata: 'teknik_yok', alan: 'teknik' }
  const igneKanul = metin(g.igneKanul, GE_KISA_AZAMI)
  if (igneKanul === null) return { ok: false, hata: 'metin_uzun', alan: 'igneKanul' }
  const advers = listeOku(g.advers, GE_ADVERS)
  if (!advers) return { ok: false, hata: 'liste_gecersiz', alan: 'advers' }
  const adversAciklama = metin(g.adversAciklama, GE_UZUN_AZAMI)
  if (adversAciklama === null) return { ok: false, hata: 'metin_uzun', alan: 'adversAciklama' }
  if (advers.some((a) => a !== 'yok') && !adversAciklama) return { ok: false, hata: 'advers_aciklama_yok', alan: 'adversAciklama' }
  const kg = sayiOku(g.kontrolGun)
  if (kg === null || Number.isNaN(kg) || !Number.isInteger(kg) || kg < GE_KONTROL_GUN.enAz || kg > GE_KONTROL_GUN.enCok) return { ok: false, hata: 'sayi_aralik_disi', alan: 'kontrolGun' }
  return { ok: true, veri: { ...o, urun: g.urun as GeEnjeksiyonUrun, urunAdi, lot: lot.lot, sonKullanma: sk, hacimMl: Math.round(hacim * 100) / 100, bolge: g.bolge as GeEnjeksiyonBolge, teknik: g.teknik as EnjeksiyonKaydi['teknik'], igneKanul, advers: advers.length ? advers : ['yok'], adversAciklama, kontrolGun: kg, kontrolTarihi: geGunEkle(o.tarih, kg) } }
}

export type BeyazlatmaKaydi = Ortak & {
  yontem: GeBeyazlatmaYontem; ajan: string; konsantrasyonYuzde: number | null; temasSuresiDk: number | null; katSayisi: number | null
  cihaz: string; bolgeler: (typeof GE_BEYAZLATMA_BOLGE)[number][]; reaksiyon: (typeof GE_REAKSIYON)[number][]; reaksiyonAciklama: string
  kontrolGun: number | null; kontrolTarihi: string | null
}
/** Genital whitening: cosmetic only (never medically indicated). Agent and concentration for a peel or a topical; the device for a laser. */
export function beyazlatmaDogrula(ham: unknown): { ok: true; veri: BeyazlatmaKaydi } | GeHata {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const o = ortakOku(g); if (hataMi(o)) return o
  if (o.endikasyon !== 'kozmetik') return { ok: false, hata: 'medikal_bu_islemde_yok', alan: 'endikasyon' }
  if (!(GE_BEYAZLATMA_YONTEM as readonly unknown[]).includes(g.yontem)) return { ok: false, hata: 'yontem_yok', alan: 'yontem' }
  const yontem = g.yontem as GeBeyazlatmaYontem
  const ajan = metin(g.ajan, GE_KISA_AZAMI), cihaz = metin(g.cihaz, GE_KISA_AZAMI)
  if (ajan === null || cihaz === null) return { ok: false, hata: 'metin_uzun', alan: 'ajan' }
  const kons = sayiOku(g.konsantrasyonYuzde), temas = sayiOku(g.temasSuresiDk), kat = sayiOku(g.katSayisi)
  if (yontem !== 'lazer') {
    if (!ajan) return { ok: false, hata: 'ajan_yok', alan: 'ajan' }
    if (kons === null || Number.isNaN(kons) || kons <= 0 || kons > 100) return { ok: false, hata: 'sayi_aralik_disi', alan: 'konsantrasyonYuzde' }
  } else if (!cihaz) return { ok: false, hata: 'cihaz_yok', alan: 'cihaz' }
  if (Number.isNaN(temas) || (temas !== null && (temas < 0 || temas > 60))) return { ok: false, hata: 'sayi_aralik_disi', alan: 'temasSuresiDk' }
  if (Number.isNaN(kat) || (kat !== null && (!Number.isInteger(kat) || kat < 1 || kat > 10))) return { ok: false, hata: 'sayi_aralik_disi', alan: 'katSayisi' }
  const bolgeler = listeOku(g.bolgeler, GE_BEYAZLATMA_BOLGE)
  if (!bolgeler || !bolgeler.length) return { ok: false, hata: 'bolge_yok', alan: 'bolgeler' }
  const reaksiyon = listeOku(g.reaksiyon, GE_REAKSIYON)
  if (!reaksiyon) return { ok: false, hata: 'liste_gecersiz', alan: 'reaksiyon' }
  const reaksiyonAciklama = metin(g.reaksiyonAciklama, GE_UZUN_AZAMI)
  if (reaksiyonAciklama === null) return { ok: false, hata: 'metin_uzun', alan: 'reaksiyonAciklama' }
  if (reaksiyon.some((r) => r !== 'yok') && !reaksiyonAciklama) return { ok: false, hata: 'advers_aciklama_yok', alan: 'reaksiyonAciklama' }
  const kg = sayiOku(g.kontrolGun)
  if (Number.isNaN(kg) || (kg !== null && (!Number.isInteger(kg) || kg < GE_KONTROL_GUN.enAz || kg > GE_KONTROL_GUN.enCok))) return { ok: false, hata: 'sayi_aralik_disi', alan: 'kontrolGun' }
  return { ok: true, veri: { ...o, yontem, ajan, konsantrasyonYuzde: yontem === 'lazer' ? null : kons, temasSuresiDk: temas, katSayisi: kat, cihaz, bolgeler, reaksiyon: reaksiyon.length ? reaksiyon : ['yok'], reaksiyonAciklama, kontrolGun: kg, kontrolTarihi: kg === null ? null : geGunEkle(o.tarih, kg) } }
}

// ───────────────────────── 3. outcome measures ─────────────────────────

// The Vaginal Laxity Questionnaire was removed on the owner's decision (Kaan, 2026-11-06): one item, not a formally
// validated instrument (Polland et al., Sex Med 2021;9:100443), no validated translation.
export const GE_OLCEKLER = ['fsfi', 'fgsis', 'cops_l'] as const
export type GeOlcek = (typeof GE_OLCEKLER)[number]

/**
 * LICENCE / TRANSLATION STATE of each instrument for COMMERCIAL software, as read on 2026-11-06 (GENITAL-ESTETIK-01,
 * docs/OPEN-COMMITMENTS.md). Same five states as the country kit (lib/ulke/araclar/tipler.ts LISANS_DURUMLARI). Only
 * 'serbest' or 'izin-alindi' opens ITEM-LEVEL entry; nothing here ever ships item wording.
 */
export const GE_OLCEK_LISANSLARI: Readonly<Record<GeOlcek, { durum: 'serbest' | 'izin-gerekli' | 'ucretli' | 'belirsiz' | 'izin-alindi'; hakSahibi: string; dogrulanmis: boolean }>> = {
  // The published form directs users to the author for the full questionnaire and scoring algorithm.
  fsfi: { durum: 'izin-gerekli', hakSahibi: 'Raymond C. Rosen (FSFI)', dogrulanmis: true },
  // Terms for commercial software not found.
  fgsis: { durum: 'belirsiz', hakSahibi: 'Debby Herbenick, Michael Reece', dogrulanmis: true },
  // Copyright D. Veale (2009); translations are made with the copyright holders' permission.
  cops_l: { durum: 'izin-gerekli', hakSahibi: 'David Veale', dogrulanmis: true },
}
export const geMaddeGirisiAcik = (o: GeOlcek): boolean => GE_OLCEK_LISANSLARI[o].durum === 'serbest' || GE_OLCEK_LISANSLARI[o].durum === 'izin-alindi'

/** The range of a TOTAL as each instrument defines it. */
export const GE_OLCEK_ARALIK: Readonly<Record<GeOlcek, { enAz: number; enCok: number; ondalik: number }>> = {
  fsfi: { enAz: 2, enCok: 36, ondalik: 2 },
  fgsis: { enAz: 7, enCok: 28, ondalik: 0 },
  cops_l: { enAz: 0, enCok: 72, ondalik: 0 },
}
/** FSFI total at or below this = in the range of female sexual dysfunction (Wiegel et al. 2005). */
export const FSFI_KESIM = 26.55
/** COPS-L total at or above this = likely body dysmorphic disorder: a prompt to consider referral, never a diagnosis. */
export const COPS_L_KESIM = 40

/** The FSFI's six domains: item numbers (1-based), the lowest item score, the factor (Rosen et al. 2000, scoring appendix). */
export const FSFI_ALANLARI = [
  { alan: 'istek', maddeler: [1, 2], carpan: 0.6 },
  { alan: 'uyarilma', maddeler: [3, 4, 5, 6], carpan: 0.3 },
  { alan: 'lubrikasyon', maddeler: [7, 8, 9, 10], carpan: 0.3 },
  { alan: 'orgazm', maddeler: [11, 12, 13], carpan: 0.4 },
  { alan: 'doyum', maddeler: [14, 15, 16], carpan: 0.4 },
  { alan: 'agri', maddeler: [17, 18, 19], carpan: 0.4 },
] as const
/** Items scored 1-5 (all others 0-5): items 1 and 2, and 15 and 16 (item 14 allows 0, "no sexual activity"). */
export const FSFI_BIRDEN_BASLAYAN: readonly number[] = [1, 2, 15, 16]

const yuvarla = (n: number, b: number) => Math.round(n * 10 ** b) / 10 ** b

/** FSFI item scores (19 numbers, in order) -> domain scores and the full-scale total. null = a score is missing or out of range. */
export function fsfiPuanla(maddeler: readonly unknown[]): { alanlar: Record<(typeof FSFI_ALANLARI)[number]['alan'], number>; toplam: number } | null {
  if (!Array.isArray(maddeler) || maddeler.length !== 19) return null
  const p: number[] = []
  for (let i = 0; i < 19; i++) {
    const v = maddeler[i]
    const enAz = FSFI_BIRDEN_BASLAYAN.includes(i + 1) ? 1 : 0
    if (typeof v !== 'number' || !Number.isInteger(v) || v < enAz || v > 5) return null
    p.push(v)
  }
  const alanlar = {} as Record<(typeof FSFI_ALANLARI)[number]['alan'], number>
  let toplam = 0
  for (const a of FSFI_ALANLARI) {
    const d = yuvarla(a.maddeler.reduce((s, m) => s + p[m - 1], 0) * a.carpan, 1)
    alanlar[a.alan] = d
    toplam += d
  }
  return { alanlar, toplam: yuvarla(toplam, 1) }
}

/** FGSIS: 7 items, each 1-4 -> total 7-28 (higher = more positive genital self-image). No cut-off exists. */
export function fgsisPuanla(maddeler: readonly unknown[]): number | null {
  if (!Array.isArray(maddeler) || maddeler.length !== 7) return null
  let t = 0
  for (const v of maddeler) { if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 4) return null; t += v }
  return t
}

export type GeOlcekBandi = 'fsfi_kesim_alti' | 'fsfi_kesim_ustu' | 'cops_l_pozitif' | 'cops_l_negatif' | null
/**
 * A recorded TOTAL, checked against the instrument's range, with its band. COPS-L at or above the cut-off sets
 * `yonlendirmeOner`: the screen shows the clinician a prompt to consider referral. It blocks nothing.
 */
export function olcekToplamDegerlendir(olcek: GeOlcek, ham: unknown): { gecerli: false } | { gecerli: true; toplam: number; bant: GeOlcekBandi; yonlendirmeOner: boolean } {
  const r = GE_OLCEK_ARALIK[olcek]
  if (!r) return { gecerli: false }
  const n = sayiOku(ham)
  if (n === null || Number.isNaN(n) || n < r.enAz || n > r.enCok) return { gecerli: false }
  if (r.ondalik === 0 && !Number.isInteger(n)) return { gecerli: false }
  const toplam = yuvarla(n, r.ondalik)
  if (olcek === 'fsfi') return { gecerli: true, toplam, bant: toplam <= FSFI_KESIM ? 'fsfi_kesim_alti' : 'fsfi_kesim_ustu', yonlendirmeOner: false }
  if (olcek === 'cops_l') { const poz = toplam >= COPS_L_KESIM; return { gecerli: true, toplam, bant: poz ? 'cops_l_pozitif' : 'cops_l_negatif', yonlendirmeOner: poz } }
  return { gecerli: true, toplam, bant: null, yonlendirmeOner: false }
}

/** BEFORE / AFTER: the recorded totals of one instrument, oldest first, with the change from the first (baseline) to the last. */
export function olcekTrendi(kayitlar: readonly { tarih: string; toplam: number }[]): { noktalar: { tarih: string; toplam: number }[]; ilk: number | null; son: number | null; degisim: number | null; yon: 'artis' | 'azalis' | 'ayni' | null } {
  const noktalar = kayitlar.filter((k) => geGunMu(k.tarih) && Number.isFinite(k.toplam)).slice().sort((a, b) => (a.tarih < b.tarih ? -1 : a.tarih > b.tarih ? 1 : 0))
  if (!noktalar.length) return { noktalar, ilk: null, son: null, degisim: null, yon: null }
  const ilk = noktalar[0].toplam, son = noktalar[noktalar.length - 1].toplam
  const degisim = yuvarla(son - ilk, 1)
  return { noktalar, ilk, son, degisim, yon: noktalar.length < 2 ? null : degisim > 0 ? 'artis' : degisim < 0 ? 'azalis' : 'ayni' }
}

export type OlcekKaydi = { tarih: string; olcek: GeOlcek; toplam: number; asama: 'oncesi' | 'sonrasi' | 'izlem'; bant: GeOlcekBandi; yonlendirmeOner: boolean }
export function olcekKaydiDogrula(ham: unknown): { ok: true; veri: OlcekKaydi } | GeHata {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  if (!geGunMu(g.tarih)) return { ok: false, hata: 'tarih_gecersiz', alan: 'tarih' }
  if (!(GE_OLCEKLER as readonly unknown[]).includes(g.olcek)) return { ok: false, hata: 'olcek_yok', alan: 'olcek' }
  if (g.asama !== 'oncesi' && g.asama !== 'sonrasi' && g.asama !== 'izlem') return { ok: false, hata: 'asama_yok', alan: 'asama' }
  const d = olcekToplamDegerlendir(g.olcek as GeOlcek, g.toplam)
  if (!d.gecerli) return { ok: false, hata: 'sayi_aralik_disi', alan: 'toplam' }
  return { ok: true, veri: { tarih: g.tarih, olcek: g.olcek as GeOlcek, toplam: d.toplam, asama: g.asama, bant: d.bant, yonlendirmeOner: d.yonlendirmeOner } }
}

// ───────────────────────── 4. photo documentation ─────────────────────────

/** The standard views of the package (the product's own set; every view is optional, the set keeps series comparable). */
export const GE_FOTO_GORUNUMLERI = ['on_ayakta', 'litotomi_istirahat', 'litotomi_ayrilmis', 'perine', 'yakin_plan'] as const
export type GeFotoGorunumu = (typeof GE_FOTO_GORUNUMLERI)[number]

/** THE FIXED HANDLING OF INTIMATE PHOTOS. Not settings: tests hold every route and screen to them. */
export const GE_FOTO_KURALLARI = Object.freeze({
  kucukResim: false,
  varsayilanBulanik: true,
  herGoruntulemeDenetlenir: true,
  yapayZekayaGonderilir: false,
  disaAktarimVarsayilan: false,
  ayriOnamGerekli: true,
  azamiBayt: 3_000_000,
  mime: ['image/jpeg', 'image/png'] as readonly string[],
})

export type FotoOnami = { tarih: string; belgeleme: boolean; egitimYayin: boolean; geriCekildi: string | null }
export function fotoOnamiDogrula(ham: unknown): { ok: true; veri: FotoOnami } | GeHata {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  if (!geGunMu(g.tarih)) return { ok: false, hata: 'tarih_gecersiz', alan: 'tarih' }
  if (g.belgeleme !== true) return { ok: false, hata: 'foto_onam_kapsam_yok', alan: 'belgeleme' }
  return { ok: true, veri: { tarih: g.tarih, belgeleme: true, egitimYayin: g.egitimYayin === true, geriCekildi: null } }
}
/** A photo may be taken on `gun` only under a SEPARATE, explicit photo consent given that day or before and not withdrawn. */
export function fotoOnamiGecerli(onamlar: readonly FotoOnami[], gun: string): boolean {
  return onamlar.some((o) => o.belgeleme === true && geGunMu(o.tarih) && o.tarih <= gun && (!o.geriCekildi || o.geriCekildi > gun))
}
