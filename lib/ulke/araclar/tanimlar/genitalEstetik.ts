/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — COSMETIC GYNAECOLOGY / GENITAL AESTHETICS in the country kit. Keys, fields and
 * arithmetic only: every word, every pre-filled paragraph and every source line is the pack's. The arithmetic is the shared
 * engine lib/clinical/genitalEstetik.ts, byte-identical with the Turkish build on main, so the same record is valid or
 * refused in every country for the same reason.
 *
 * Obstetrics and gynaecology; the SURGICAL part (the adult genital-aesthetics operation note, the photo consent, the COPS-L
 * item slot and a consent form of the four operations, `onam-formu-genital`) also for plastic and aesthetic surgery (owner's
 * decision, 2026-11-06; the roles are the pack's). WHICH TOOL EACH COUNTRY OFFERS is the country's decision under its own law and
 * regulator (the regulatory recognition gate, .cursor/skills/ulke-paritesi-duzeltme): a tool a country does not permit
 * is kept as a slot (`kapali`) with its legal source; a template or a site a country does not permit is taken off the
 * options (`uyarlama.secenekler`, fields marked `secenekSerbest`).
 *
 * THE UNDER-18 BLOCK: every tool here that can record a COSMETIC procedure is given a patient gate by the pack (18 or over,
 * female): the kit's own rule then holds on the screen AND on the server, and an unknown birth date never passes
 * (./hastaKapisi.ts). Medically indicated surgery for a minor is NEVER blocked: it is written with the ordinary O&G
 * operation note (`ameliyat-notu-kd`), whose labiaplasty and perineoplasty templates now ask for the medical indication
 * and its reason (./kadinDogumCerrahi.ts).
 *
 * NO ITEM OF A PUBLISHED QUESTIONNAIRE: the outcome-measure tool records the TOTAL of an instrument the clinician
 * administered on the authorised form; item-level entry is a slot until a licence is recorded (lib/clinical/genitalEstetik.ts
 * GE_OLCEK_LISANSLARI). A COPS-L total of 40 or more raises a prompt to consider referral; it blocks nothing.
 * INTIMATE PHOTOS are not stored by the country kit yet: the photo-consent tool records the separate consent and the
 * standard views planned (docs/OPEN-COMMITMENTS.md GENITAL-ESTETIK-01, the photo store of the country builds).
 */
import type { AracAlani, AracSonucu, AracTanimi } from '../tipler'
import { BOS_SONUC, gunMu, metin, sayi, sayiMi, secim, tarih } from '../yardimci'
import { AMELIYAT_ALANLARI, ameliyatNotuHesapla } from './kadinDogumCerrahi'
import { ONAM_FORMU } from './kdOperator'
import {
  GE_ADVERS, GE_BEYAZLATMA_BOLGE, GE_BEYAZLATMA_YONTEM, GE_ENERJI_AMAC, GE_ENERJI_BOLGE, GE_ENERJI_MODALITE, GE_ENJEKSIYON_BOLGE, GE_ENJEKSIYON_TEKNIK,
  GE_ENJEKSIYON_URUN, GE_FOTO_GORUNUMLERI, GE_REAKSIYON, GE_MEDIKAL_GEREKCE, GE_OLCEKLER, COPS_L_KESIM,
  beyazlatmaDogrula, enerjiSeansiDogrula, enjeksiyonDogrula, geKapi, olcekToplamDegerlendir, type GeIslemTuru, type GeOlcek,
} from '@/lib/clinical/genitalEstetik'

const paragraf = (anahtar: string, ek: Partial<AracAlani> = {}): AracAlani => metin(anahtar, { uzun: true, ...ek })
const isaretAlani = (anahtar: string, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'isaret', ...ek })
const n = (x: unknown): number | null => (sayiMi(x) ? x : null)
const MEDIKAL = { alan: 'endikasyon_sinifi', degerler: ['medikal'] } as const

/** The indication block of every procedure tool: cosmetic or medically indicated, and for a medical one the reason and words. */
export const GE_ENDIKASYON_ALANLARI: readonly AracAlani[] = [
  secim('endikasyon_sinifi', ['kozmetik', 'medikal']),
  { ...secim('medikal_gerekce', GE_MEDIKAL_GEREKCE), kosul: MEDIKAL },
  paragraf('medikal_aciklama', { kosul: MEDIKAL }),
]
/** The shared engine's shape of the indication from the kit's form. */
const endikasyon = (g: Readonly<Record<string, unknown>>) => ({ endikasyon: g.endikasyon_sinifi, medikalGerekce: g.medikal_gerekce, medikalAciklama: g.medikal_aciklama })
/**
 * The gate's medical half (lib/clinical/genitalEstetik.ts → geKapi): a medical record needs a structured reason and the
 * doctor's words, and is impossible for a procedure that is cosmetic only. The AGE half is the pack's patient gate (18+),
 * held by the kit on the screen and on the server.
 */
function medikalGecerli(g: Readonly<Record<string, unknown>>, tur: GeIslemTuru, alt?: { urun?: string; bolge?: string }): boolean {
  if (g.endikasyon_sinifi === 'kozmetik') return true
  if (g.endikasyon_sinifi !== 'medikal') return false
  return geKapi({ dogumTarihi: null, gun: '2000-01-01', endikasyon: 'medikal', medikalGerekce: g.medikal_gerekce, medikalAciklama: g.medikal_aciklama, tur, alt }).izin
}

// ───────────────────────── the adult genital-aesthetics operation note ─────────────────────────

/** The operations of the package. A country may offer fewer (`secenekSerbest`: the arithmetic never reads which one). */
export const GE_SABLONLARI = ['labioplasti', 'labioplasti_klitoral', 'vajinoplasti', 'perineoplasti'] as const
export const GE_NOT_UYARILARI = ['bdd_tarama_yok', 'cops_l_pozitif'] as const

export const AMELIYAT_NOTU_GENITAL: AracTanimi = {
  anahtar: 'ameliyat-notu-genital', tur: 'liste', yazdirilir: true,
  alanlar: [
    { ...secim('sablon', GE_SABLONLARI, true), secenekSerbest: true },
    ...GE_ENDIKASYON_ALANLARI,
    secim('bdd_tarama', ['yapildi', 'yapilmadi']),
    sayi('cops_l_toplam', 0, 72, { tam: true, istege: true, kosul: { alan: 'bdd_tarama', degerler: ['yapildi'] } }),
    ...AMELIYAT_ALANLARI,
  ],
  cikti: { sayilar: [], bantlar: [], uyarilar: [...GE_NOT_UYARILARI], tarihler: ['tarih'] },
  kaynak: null,
  hesapla: (g): AracSonucu => {
    const temel = ameliyatNotuHesapla(g)
    if (!temel.tamam) return BOS_SONUC
    if (!medikalGecerli(g, 'cerrahi')) return BOS_SONUC
    const uyarilar: string[] = []
    if (g.endikasyon_sinifi === 'kozmetik' && g.bdd_tarama !== 'yapildi') uyarilar.push('bdd_tarama_yok')
    if (sayiMi(g.cops_l_toplam) && g.cops_l_toplam >= COPS_L_KESIM) uyarilar.push('cops_l_pozitif')
    return { ...temel, uyarilar }
  },
}

// ───────────────────────── energy-based session ─────────────────────────

const ENERJI_BOLGE_ALANLARI = GE_ENERJI_BOLGE.map((b) => isaretAlani(`bolge_${b}`))
export const ENERJI_SEANSI: AracTanimi = {
  anahtar: 'genital-enerji-seansi', tur: 'liste', yazdirilir: true,
  alanlar: [
    tarih('tarih'), ...GE_ENDIKASYON_ALANLARI,
    secim('modalite', GE_ENERJI_MODALITE), metin('cihaz', { istege: false }),
    sayi('dalga_boyu', 100, 20000, { istege: true, kosul: { alan: 'modalite', degerler: ['diger'] } }),
    { ...secim('amac', GE_ENERJI_AMAC), secenekSerbest: true },
    ...ENERJI_BOLGE_ALANLARI,
    sayi('guc_w', 0, 200, { istege: true }), sayi('enerji_mj', 0, 1000, { istege: true }), sayi('yogunluk', 0, 100, { istege: true }),
    sayi('aralik_um', 0, 5000, { istege: true }), sayi('darbe_ms', 0, 1000, { istege: true }), sayi('sicaklik_c', 30, 60, { istege: true }), sayi('yigma', 1, 10, { tam: true, istege: true }),
    sayi('gecis', 1, 10, { tam: true }), sayi('seans_no', 1, 12, { tam: true }), sayi('seri_toplam', 1, 12, { tam: true }), sayi('aralik_gun', 14, 90, { tam: true, istege: true }),
    secim('advers', GE_ADVERS), paragraf('advers_aciklama'),
  ],
  cikti: { sayilar: ['dalga_boyu'], bantlar: [], uyarilar: ['advers_var'], tarihler: ['tarih', 'sonraki_seans'] },
  kaynak: null,
  hesapla: (g): AracSonucu => {
    if (!medikalGecerli(g, 'enerji')) return BOS_SONUC
    const d = enerjiSeansiDogrula({
      tarih: g.tarih, ...endikasyon(g), modalite: g.modalite, cihaz: g.cihaz, dalgaBoyuNm: g.dalga_boyu, amac: g.amac,
      bolgeler: GE_ENERJI_BOLGE.filter((b) => g[`bolge_${b}`] === true),
      ayarlar: { gucW: n(g.guc_w), enerjiMj: n(g.enerji_mj), yogunlukYuzde: n(g.yogunluk), aralikMikron: n(g.aralik_um), darbeSuresiMs: n(g.darbe_ms), hedefSicaklikC: n(g.sicaklik_c), yigma: n(g.yigma) },
      gecis: g.gecis, seansNo: g.seans_no, seriToplam: g.seri_toplam, aralikGun: g.aralik_gun,
      advers: typeof g.advers === 'string' ? [g.advers] : [], adversAciklama: g.advers_aciklama,
    })
    if (!d.ok) return BOS_SONUC
    const v = d.veri
    return {
      tamam: true,
      sayilar: v.dalgaBoyuNm === null ? [] : [{ anahtar: 'dalga_boyu', deger: v.dalgaBoyuNm, ondalik: 0 }],
      bant: null,
      uyarilar: v.advers.some((a) => a !== 'yok') ? ['advers_var'] : [],
      tarihler: [{ anahtar: 'tarih', tarih: v.tarih }, ...(v.sonrakiTarih ? [{ anahtar: 'sonraki_seans', tarih: v.sonrakiTarih }] : [])],
    }
  },
}

// ───────────────────────── injection log ─────────────────────────

export const ENJEKSIYON_KAYDI: AracTanimi = {
  anahtar: 'genital-enjeksiyon', tur: 'liste', yazdirilir: true,
  alanlar: [
    tarih('tarih'), ...GE_ENDIKASYON_ALANLARI,
    secim('urun', GE_ENJEKSIYON_URUN), metin('urun_adi', { istege: false }), metin('lot', { istege: false, enCok: 40 }), tarih('son_kullanma'),
    sayi('hacim', 0.01, 20),
    { ...secim('bolge', GE_ENJEKSIYON_BOLGE), secenekSerbest: true },
    secim('teknik', GE_ENJEKSIYON_TEKNIK), metin('igne'),
    sayi('kontrol_gun', 1, 180, { tam: true }),
    secim('advers', GE_ADVERS), paragraf('advers_aciklama'),
  ],
  cikti: { sayilar: ['hacim'], bantlar: [], uyarilar: ['advers_var'], tarihler: ['tarih', 'kontrol'] },
  kaynak: null,
  hesapla: (g): AracSonucu => {
    if (!medikalGecerli(g, 'enjeksiyon', { urun: typeof g.urun === 'string' ? g.urun : undefined, bolge: typeof g.bolge === 'string' ? g.bolge : undefined })) return BOS_SONUC
    const d = enjeksiyonDogrula({
      tarih: g.tarih, ...endikasyon(g), urun: g.urun, urunAdi: g.urun_adi, lot: g.lot, sonKullanma: g.son_kullanma, hacimMl: g.hacim,
      bolge: g.bolge, teknik: g.teknik, igneKanul: g.igne, kontrolGun: g.kontrol_gun,
      advers: typeof g.advers === 'string' ? [g.advers] : [], adversAciklama: g.advers_aciklama,
    })
    // an expired product (or any other refusal) keeps nothing: the record is incomplete
    if (!d.ok) return BOS_SONUC
    const v = d.veri
    return {
      tamam: true, sayilar: [{ anahtar: 'hacim', deger: v.hacimMl, ondalik: 2 }], bant: null,
      uyarilar: v.advers.some((a) => a !== 'yok') ? ['advers_var'] : [],
      tarihler: [{ anahtar: 'tarih', tarih: v.tarih }, { anahtar: 'kontrol', tarih: v.kontrolTarihi }],
    }
  },
}

// ───────────────────────── whitening session ─────────────────────────

const BEYAZLATMA_BOLGE_ALANLARI = GE_BEYAZLATMA_BOLGE.map((b) => isaretAlani(`bolge_${b}`))
const AJANLI = { alan: 'yontem', degerler: ['kimyasal_peeling', 'topikal'] } as const
export const BEYAZLATMA_SEANSI: AracTanimi = {
  anahtar: 'genital-beyazlatma', tur: 'liste', yazdirilir: true,
  alanlar: [
    tarih('tarih'), secim('yontem', GE_BEYAZLATMA_YONTEM),
    metin('ajan', { kosul: AJANLI }), sayi('konsantrasyon', 0.1, 100, { istege: true, kosul: AJANLI }),
    sayi('temas_dk', 0, 60, { istege: true, kosul: AJANLI }), sayi('kat', 1, 10, { tam: true, istege: true, kosul: AJANLI }),
    metin('cihaz', { kosul: { alan: 'yontem', degerler: ['lazer'] } }),
    ...BEYAZLATMA_BOLGE_ALANLARI,
    secim('reaksiyon', GE_REAKSIYON), paragraf('reaksiyon_aciklama'),
    sayi('kontrol_gun', 1, 180, { tam: true, istege: true }),
  ],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['reaksiyon_var'], tarihler: ['tarih', 'kontrol'] },
  kaynak: null,
  hesapla: (g): AracSonucu => {
    const d = beyazlatmaDogrula({
      tarih: g.tarih, endikasyon: 'kozmetik', yontem: g.yontem, ajan: g.ajan, konsantrasyonYuzde: g.konsantrasyon, temasSuresiDk: g.temas_dk, katSayisi: g.kat, cihaz: g.cihaz,
      bolgeler: GE_BEYAZLATMA_BOLGE.filter((b) => g[`bolge_${b}`] === true), reaksiyon: typeof g.reaksiyon === 'string' ? [g.reaksiyon] : [], reaksiyonAciklama: g.reaksiyon_aciklama, kontrolGun: g.kontrol_gun,
    })
    if (!d.ok) return BOS_SONUC
    const v = d.veri
    return {
      tamam: true, sayilar: [], bant: null,
      uyarilar: v.reaksiyon.some((r) => r !== 'yok') ? ['reaksiyon_var'] : [],
      tarihler: [{ anahtar: 'tarih', tarih: v.tarih }, ...(v.kontrolTarihi ? [{ anahtar: 'kontrol', tarih: v.kontrolTarihi }] : [])],
    }
  },
}

// ───────────────────────── outcome measures (totals only) ─────────────────────────

// The Vaginal Laxity Questionnaire was removed on 2026-11-06 (owner's decision): not formally validated.
export const GE_OLCEK_BANTLARI = ['fsfi_kesim_alti', 'fsfi_kesim_ustu', 'cops_l_pozitif', 'cops_l_negatif'] as const
export const SONUC_OLCEGI: AracTanimi = {
  anahtar: 'genital-sonuc-olcegi', tur: 'liste',
  alanlar: [tarih('tarih'), secim('olcek', GE_OLCEKLER), secim('asama', ['oncesi', 'sonrasi', 'izlem']), sayi('toplam', 0, 72)],
  cikti: { sayilar: ['toplam'], bantlar: [...GE_OLCEK_BANTLARI], uyarilar: ['cops_l_pozitif'], tarihler: ['tarih'] },
  kaynak: null,
  hesapla: (g): AracSonucu => {
    if (!gunMu(g.tarih) || !(GE_OLCEKLER as readonly unknown[]).includes(g.olcek) || typeof g.asama !== 'string') return BOS_SONUC
    const d = olcekToplamDegerlendir(g.olcek as GeOlcek, g.toplam)
    if (!d.gecerli) return BOS_SONUC
    return {
      tamam: true, sayilar: [{ anahtar: 'toplam', deger: d.toplam, ondalik: g.olcek === 'fsfi' ? 2 : 0 }], bant: d.bant,
      uyarilar: d.yonlendirmeOner ? ['cops_l_pozitif'] : [], tarihler: [{ anahtar: 'tarih', tarih: g.tarih as string }],
    }
  },
}

// ───────────────────────── separate photo consent ─────────────────────────

const GORUNUM_ALANLARI = GE_FOTO_GORUNUMLERI.map((v) => isaretAlani(`gorunum_${v}`))
export const FOTO_ONAMI: AracTanimi = {
  anahtar: 'genital-foto-onam', tur: 'liste', yazdirilir: true,
  alanlar: [tarih('tarih'), isaretAlani('belgeleme'), isaretAlani('egitim_yayin'), ...GORUNUM_ALANLARI, paragraf('not')],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['egitim_yayin_onayi'], tarihler: ['tarih'] },
  kaynak: null,
  hesapla: (g): AracSonucu => {
    if (!gunMu(g.tarih) || g.belgeleme !== true) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: null, uyarilar: g.egitim_yayin === true ? ['egitim_yayin_onayi'] : [], tarihler: [{ anahtar: 'tarih', tarih: g.tarih as string }] }
  },
}

// ───────────────────────── consent form of the four operations (plastic and aesthetic surgery) ─────────────────────────

/**
 * GENITAL-ESTETIK-01c (2026-11-06): the O&G procedure consent form (./kdOperator.ts ONAM_FORMU, same arithmetic and
 * paragraphs) narrowed to the four genital-aesthetic operations, so a plastic or aesthetic surgeon has the consent of the
 * operations they write without receiving every gynaecological operation. Obstetrics and gynaecology keeps its own full form.
 * A country may offer fewer operations (`secenekSerbest`), as on the operation note.
 */
export const ONAM_FORMU_GENITAL: AracTanimi = {
  ...ONAM_FORMU,
  anahtar: 'onam-formu-genital',
  alanlar: ONAM_FORMU.alanlar.map((a) => (a.anahtar === 'islem' ? { ...secim('islem', GE_SABLONLARI), secenekSerbest: true } : a)),
}

export const GENITAL_ESTETIK_ARACLARI: readonly AracTanimi[] = [AMELIYAT_NOTU_GENITAL, ENERJI_SEANSI, ENJEKSIYON_KAYDI, BEYAZLATMA_SEANSI, SONUC_OLCEGI, FOTO_ONAMI, ONAM_FORMU_GENITAL]
/** The tools that can record a COSMETIC procedure: every pack gives each a patient gate of 18 or over (female). */
export const GE_KOZMETIK_ARACLARI: readonly string[] = ['ameliyat-notu-genital', 'genital-enerji-seansi', 'genital-enjeksiyon', 'genital-beyazlatma', 'onam-formu-genital']
