/**
 * NOTYA-ULKE-ARACLAR-01 — tools of orthopaedics, paediatrics, plastic surgery, radiology, rheumatology, sports
 * medicine and urology. Keys and rules only. Each stands beside a tool of the pre-split application (named on the
 * definition) and is compared with it, input for input, in lib/ulke/araclar/esdegerlik.test.ts. Nothing of that
 * application is imported here.
 */
import type { AracAlani, AracTanimi } from '../tipler'
import { ayEkle, BOS_SONUC, gunFarki, gunMu, isaretliler, kontrolListesi, metin, puan, sayi, sayiMi, secim, tarih } from '../yardimci'

const isaret = (anahtar: string): AracAlani => ({ anahtar, tur: 'isaret' })
const verilen = (g: Record<string, unknown>, anahtarlar: readonly string[]) => anahtarlar.flatMap((k) => { const v = g[k]; return gunMu(v) ? [{ anahtar: k, tarih: v }] : [] })

// ───────────────────────── orthopaedics ─────────────────────────

/**
 * Fracture, cast, brace or post-operative follow-up: what, where, the neurovascular state as the doctor records it,
 * the day the cast comes off and the day weight-bearing starts. Warnings: neurovascular threat; a planned day that
 * has passed. Stands beside specialties/ortopedi/engines/kirikAlci.ts → ozetle.
 */
export const KIRIK_BOLGELERI = ['omuz', 'dirsek', 'el', 'kalca', 'diz', 'ayak', 'omurga', 'diger'] as const
export const TARAFLAR = ['sag', 'sol', 'iki', 'belirtilmedi'] as const
export const NV_DURUMLARI = ['tam', 'parestezi', 'tehdit', 'degerlendirilmedi'] as const
export const KIRIK_ALCI: AracTanimi = {
  anahtar: 'kirik-alci-takip',
  tur: 'takvim',
  alanlar: [secim('tip', ['kirik', 'alci', 'ortez', 'op_sonrasi']), secim('bolge', KIRIK_BOLGELERI, true), secim('taraf', TARAFLAR, true), secim('nv', NV_DURUMLARI, true), tarih('baslangic', true), tarih('alci_alma', true), tarih('yuk_verme', true), isaret('goruntu_hazir')],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['nv_tehdit', 'alci_gecti', 'yuk_gecti', 'goruntu_kontrol', 'op_kontrol'], tarihler: ['baslangic', 'alci_alma', 'yuk_verme'] },
  kaynak: null,
  hesapla: (g, { bugun }) => {
    if (typeof g.tip !== 'string') return BOS_SONUC
    return {
      tamam: true, sayilar: [], bant: null,
      uyarilar: [...(g.nv === 'tehdit' ? ['nv_tehdit'] : []), ...(gunMu(g.alci_alma) && g.alci_alma < bugun ? ['alci_gecti'] : []), ...(gunMu(g.yuk_verme) && g.yuk_verme < bugun ? ['yuk_gecti'] : []), ...(g.goruntu_hazir === true ? ['goruntu_kontrol'] : []), ...(g.tip === 'op_sonrasi' && gunMu(g.baslangic) ? ['op_kontrol'] : [])],
      tarihler: verilen(g, ['baslangic', 'alci_alma', 'yuk_verme']),
    }
  },
}

/** After an orthopaedic operation: six points to go through. A list of the product's own. Stands beside the six items of specialties/ortopedi/engines/kirikAlci.ts → OP_PROTOKOL_MADDELERI (a list without a function). */
export const OP_PROTOKOL_MADDELERI = ['islem_kaydi', 'dikis_kontrol', 'yuk_kisit', 'goruntu_kontrol', 'ftr_sevk', 'kirmizi_bayrak'] as const
export const ORTOPEDI_OP_PROTOKOL: AracTanimi = kontrolListesi({ anahtar: 'ortopedi-op-protokol', maddeler: OP_PROTOKOL_MADDELERI, ek: [tarih('islem_tarihi', true)], tarihler: ['islem_tarihi'] })

/**
 * Pain and function: pain from 0 to 10 and four function items from 0 to 4 (walking, stairs, daily tasks, sleep).
 * The band is the product's own composite (pain × 0.8 + function total: up to 6, up to 12, above), not a published
 * instrument, and the same as in the tool it stands beside: specialties/ortopedi/engines/vasFonksiyon.ts → skorla.
 */
export const FONKSIYON_MADDELERI = ['yurume', 'merdiven', 'gunluk', 'uyku'] as const
export const VAS_FONKSIYON: AracTanimi = {
  anahtar: 'vas-fonksiyon',
  tur: 'olcek',
  alanlar: [puan('vas', 0, 10), ...FONKSIYON_MADDELERI.map((k) => puan(k, 0, 4))],
  cikti: { sayilar: ['vas', 'fonksiyon'], bantlar: ['hafif', 'orta', 'siddetli'], uyarilar: [], tarihler: [] },
  kaynak: null,
  hesapla: (g) => {
    if (!sayiMi(g.vas) || !FONKSIYON_MADDELERI.every((k) => sayiMi(g[k]))) return BOS_SONUC
    const toplam = FONKSIYON_MADDELERI.reduce((t, k) => t + (g[k] as number), 0)
    const birlesik = g.vas * 0.8 + toplam
    return { tamam: true, sayilar: [{ anahtar: 'vas', deger: g.vas, ondalik: 0, enCok: 10 }, { anahtar: 'fonksiyon', deger: toplam, ondalik: 0, enCok: 16 }], bant: birlesik <= 6 ? 'hafif' : birlesik <= 12 ? 'orta' : 'siddetli', uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── paediatrics ─────────────────────────

/**
 * Target height from the parents' heights (mid-parental height): (father + mother + 13 cm) / 2 for a boy,
 * (father + mother − 13 cm) / 2 for a girl; the range is 8.5 cm either side. An estimate, never a promise.
 * Source: Tanner JM, Goldstein H, Whitehouse RH. Standards for children's height at ages 2–9 years allowing for
 * height of parents. Arch Dis Child 1970;45:755–762. Stands beside lib/clinical/hedefBoy.ts → hesaplaHedefBoy.
 */
const ondaBir = (x: number) => Math.round(x * 10) / 10
export const HEDEF_BOY: AracTanimi = {
  anahtar: 'hedef-boy',
  tur: 'hesap',
  alanlar: [secim('cinsiyet', ['kiz', 'erkek']), sayi('anne', 130, 230, { olcu: 'boy' }), sayi('baba', 130, 230, { olcu: 'boy' })],
  cikti: { sayilar: ['hedef', 'alt', 'ust'], bantlar: [], uyarilar: [], tarihler: [] },
  sonucOlculeri: ['boy'],
  kaynak: 'Tanner JM, Goldstein H, Whitehouse RH. Arch Dis Child 1970;45:755-762.',
  hesapla: (g) => {
    if (!sayiMi(g.anne) || !sayiMi(g.baba) || (g.cinsiyet !== 'kiz' && g.cinsiyet !== 'erkek')) return BOS_SONUC
    const hedef = ondaBir((ondaBir(g.baba) + ondaBir(g.anne) + (g.cinsiyet === 'erkek' ? 13 : -13)) / 2)
    return { tamam: true, sayilar: [{ anahtar: 'hedef', deger: hedef, ondalik: 1, olcu: 'boy' }, { anahtar: 'alt', deger: ondaBir(hedef - 8.5), ondalik: 1, olcu: 'boy' }, { anahtar: 'ust', deger: ondaBir(hedef + 8.5), ondalik: 1, olcu: 'boy' }], bant: null, uyarilar: [], tarihler: [] }
  },
}

/**
 * Dose arithmetic on numbers THE DOCTOR enters: weight × mg per kg (per day or per dose), divided over the doses of
 * a day; with a concentration, the volume per dose rounded to 0.1 mL; with a ceiling the doctor states, the capped
 * dose. The kit holds no medicine, no recommended dose and no ceiling of its own.
 * Stands beside specialties/pediatri/engines/doz.ts → dozHesapla.
 */
const ML_ADIMI = 0.1
const adimaYuvarla = (n: number) => Math.round(n / ML_ADIMI) * ML_ADIMI
export const DOZ_HESABI: AracTanimi = {
  anahtar: 'doz-hesabi',
  tur: 'hesap',
  alanlar: [
    sayi('kilo', 0.3, 300, { olcu: 'agirlik' }), sayi('mg_kg', 0.001, 1000, { birim: 'mg/kg' }), secim('mod', ['gun', 'doz']), puan('doz_sayisi', 1, 6),
    sayi('kons_mg', 0.001, 100000, { birim: 'mg', istege: true }), sayi('kons_ml', 0.001, 10000, { birim: 'mL', istege: true }),
    sayi('tavan_doz_mg', 0.001, 100000, { birim: 'mg', istege: true }), sayi('tavan_gun_mg', 0.001, 100000, { birim: 'mg', istege: true }),
  ],
  cikti: { sayilar: ['doz_mg', 'gunluk_mg', 'aralik_saat', 'doz_ml', 'gunluk_ml', 'tavanli_doz_mg', 'tavanli_doz_ml'], bantlar: [], uyarilar: ['tavan_doz', 'tavan_gun', 'kilo_birim', 'ml_kucuk'], tarihler: [] },
  sonucBirimleri: ['mg', 'mL', 'saat'],
  kaynak: null,
  hesapla: (g) => {
    if (!sayiMi(g.kilo) || !sayiMi(g.mg_kg) || !sayiMi(g.doz_sayisi) || (g.mod !== 'gun' && g.mod !== 'doz')) return BOS_SONUC
    const n = g.doz_sayisi
    const gunlukMg = g.mod === 'gun' ? g.kilo * g.mg_kg : g.kilo * g.mg_kg * n
    const dozMg = gunlukMg / n
    const mgPerMl = sayiMi(g.kons_mg) && sayiMi(g.kons_ml) ? g.kons_mg / g.kons_ml : null
    const ml = (mg: number) => (mgPerMl ? mg / mgPerMl : null)
    const tDoz = sayiMi(g.tavan_doz_mg) ? g.tavan_doz_mg : null, tGun = sayiMi(g.tavan_gun_mg) ? g.tavan_gun_mg : null
    const asim = Boolean((tDoz && dozMg > tDoz) || (tGun && gunlukMg > tGun))
    const sinir = asim ? Math.min(tDoz ?? Infinity, tGun ? tGun / n : Infinity, dozMg) : null
    const dozMl = ml(dozMg), sinirMl = sinir !== null ? ml(sinir) : null, gunlukMl = ml(gunlukMg)
    return {
      tamam: true,
      sayilar: [
        { anahtar: 'doz_mg', deger: dozMg, ondalik: 2, birim: 'mg' }, { anahtar: 'gunluk_mg', deger: gunlukMg, ondalik: 2, birim: 'mg' }, { anahtar: 'aralik_saat', deger: 24 / n, ondalik: 1, birim: 'saat' },
        ...(dozMl !== null ? [{ anahtar: 'doz_ml', deger: adimaYuvarla(dozMl), ondalik: 1, birim: 'mL' }] : []), ...(gunlukMl !== null ? [{ anahtar: 'gunluk_ml', deger: gunlukMl, ondalik: 2, birim: 'mL' }] : []),
        ...(sinir !== null ? [{ anahtar: 'tavanli_doz_mg', deger: sinir, ondalik: 2, birim: 'mg' }] : []), ...(sinirMl !== null ? [{ anahtar: 'tavanli_doz_ml', deger: adimaYuvarla(sinirMl), ondalik: 1, birim: 'mL' }] : []),
      ],
      bant: null,
      uyarilar: [...(tDoz && dozMg > tDoz ? ['tavan_doz'] : []), ...(tGun && gunlukMg > tGun ? ['tavan_gun'] : []), ...(g.kilo > 150 ? ['kilo_birim'] : []), ...(dozMl !== null && dozMl < ML_ADIMI ? ['ml_kucuk'] : [])],
      tarihler: [],
    }
  },
}

// ───────────────────────── plastic surgery ─────────────────────────

/**
 * Wound, graft or flap follow-up: what, where, the day of the procedure, of the next dressing and of suture removal.
 * The other application proposes "three days after the procedure" for a graft or a flap; the kit proposes nothing.
 * Stands beside specialties/plastik-cerrahi/engines/yara.ts → yaraSkorla, yaraGorevleri.
 */
export const PLASTIK_YARA_TIPLERI = ['yara', 'greft', 'flep', 'dikis', 'pansiyel', 'diger'] as const
export const PLASTIK_YARA: AracTanimi = {
  anahtar: 'plastik-yara-greft',
  tur: 'takvim',
  alanlar: [secim('tip', PLASTIK_YARA_TIPLERI), metin('bolge', { istege: false }), metin('taraf'), tarih('islem', true), tarih('pansuman', true), tarih('dikis_alma', true)],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['islem', 'pansuman', 'dikis_alma'] },
  kaynak: null,
  hesapla: (g) => (typeof g.tip === 'string' && typeof g.bolge === 'string' && g.bolge ? { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: verilen(g, ['islem', 'pansuman', 'dikis_alma']) } : BOS_SONUC),
}

// ───────────────────────── radiology ─────────────────────────

/** One examination on the worklist: modality, priority, where it stands, its day; what comes next follows from where it stands. Stands beside specialties/radyoloji/engines/kuyruk.ts → kuyrukSkorla. */
export const RADYO_MODALITELER = ['xray', 'us', 'bt', 'mri', 'mamografi', 'pet', 'diger'] as const
export const RADYO_ONCELIKLER = ['acil', 'ayni_gun', 'rutin', 'kontrol'] as const
export const RADYO_DURUMLAR = ['bekliyor', 'cekildi', 'rapor_hazir', 'arsiv'] as const
export const TETKIK_KUYRUGU: AracTanimi = {
  anahtar: 'tetkik-kuyrugu',
  tur: 'liste',
  alanlar: [secim('modalite', RADYO_MODALITELER), secim('oncelik', RADYO_ONCELIKLER), secim('durum', RADYO_DURUMLAR), tarih('tarih', true)],
  cikti: { sayilar: [], bantlar: [], uyarilar: ['kuyrukta', 'rapor_bekliyor', 'rapor_klinisyen'], tarihler: ['tarih'] },
  kaynak: null,
  hesapla: (g) => {
    if (typeof g.modalite !== 'string' || typeof g.oncelik !== 'string' || typeof g.durum !== 'string') return BOS_SONUC
    return { tamam: true, sayilar: [], bant: null, uyarilar: g.durum === 'bekliyor' ? ['kuyrukta'] : g.durum === 'cekildi' ? ['rapor_bekliyor'] : g.durum === 'rapor_hazir' ? ['rapor_klinisyen'] : [], tarihler: verilen(g, ['tarih']) }
  },
}

/**
 * Structured report draft: the assessment category the radiologist chose (BI-RADS 0 to 6, or a general report) and
 * the sections the report has. The tool writes no finding and chooses no category.
 * Category names: American College of Radiology. ACR BI-RADS Atlas, 5th ed. Reston, VA: ACR; 2013.
 * Stands beside specialties/radyoloji/engines/rapor.ts → raporSkorla.
 */
export const RAPOR_KATEGORILERI = ['0', '1', '2', '3', '4', '5', '6', 'genel'] as const
export const RAPOR_BOLUMLERI = ['endikasyon', 'teknik', 'bulgular_yapilandirilmis', 'karsilastirma', 'sonuc_ozet', 'onerilen_izlem', 'klinisyen_bildirim'] as const
export const RAPOR_TASLAGI: AracTanimi = kontrolListesi({
  anahtar: 'rapor-taslagi', maddeler: RAPOR_BOLUMLERI, ek: [secim('kategori', RAPOR_KATEGORILERI)],
  kural: (_s, g) => typeof g.kategori === 'string',
  bantlar: RAPOR_KATEGORILERI, bant: (_s, g) => g.kategori as string,
  uyarilar: ['rapor_izlem', 'klinisyen_bildirim'],
  uyari: (s, g) => [...(s.includes('onerilen_izlem') ? ['rapor_izlem'] : []), ...(s.includes('klinisyen_bildirim') || g.kategori === '4' || g.kategori === '5' ? ['klinisyen_bildirim'] : [])],
  kaynak: 'American College of Radiology. ACR BI-RADS Atlas, 5th ed. Reston, VA: ACR; 2013.',
})

// ───────────────────────── rheumatology ─────────────────────────

/**
 * DAS28 with CRP or with ESR: tender and swollen joints of 28, the patient's global assessment (0 to 100 mm) and
 * the inflammatory marker. DAS28-CRP = 0.56·√TJC + 0.28·√SJC + 0.36·ln(CRP + 1) + 0.014·PGA + 0.96;
 * DAS28-ESR = 0.56·√TJC + 0.28·√SJC + 0.70·ln(ESR) + 0.014·PGA. Bands: below 2.6 remission, below 3.2 low,
 * up to 5.1 moderate, above high.
 * Sources: Prevoo MLL, van 't Hof MA, Kuper HH, et al. Arthritis Rheum 1995;38:44–48. Fransen J, van Riel PLCM.
 * Clin Exp Rheumatol 2005;23(Suppl 39):S93–S99. Stands beside specialties/romatoloji/engines/das28Basdai.ts → das28Skorla.
 */
export const DAS28: AracTanimi = {
  anahtar: 'das28',
  tur: 'hesap',
  alanlar: [secim('varyant', ['crp', 'esr']), sayi('tjc', 0, 28, { tam: true }), sayi('sjc', 0, 28, { tam: true }), sayi('pga', 0, 100, { birim: 'mm' }), sayi('crp', 0, 500, { birim: 'mg/L', kosul: { alan: 'varyant', degerler: ['crp'] } }), sayi('esr', 1, 200, { birim: 'mm/saat', kosul: { alan: 'varyant', degerler: ['esr'] } })],
  cikti: { sayilar: ['das28'], bantlar: ['remisyon', 'dusuk', 'orta', 'yuksek'], uyarilar: [], tarihler: [] },
  kaynak: 'Prevoo MLL, van \'t Hof MA, Kuper HH, et al. Arthritis Rheum 1995;38:44-48. Fransen J, van Riel PLCM. Clin Exp Rheumatol 2005;23(Suppl 39):S93-S99.',
  hesapla: (g) => {
    if (!sayiMi(g.tjc) || !sayiMi(g.sjc) || !sayiMi(g.pga)) return BOS_SONUC
    const ortak = 0.56 * Math.sqrt(g.tjc) + 0.28 * Math.sqrt(g.sjc) + 0.014 * g.pga
    const ham = g.varyant === 'crp' && sayiMi(g.crp) ? ortak + 0.36 * Math.log(g.crp + 1) + 0.96 : g.varyant === 'esr' && sayiMi(g.esr) ? ortak + 0.70 * Math.log(Math.max(g.esr, 1)) : null
    if (ham === null) return BOS_SONUC
    const v = Math.round(ham * 100) / 100
    return { tamam: true, sayilar: [{ anahtar: 'das28', deger: v, ondalik: 2 }], bant: v < 2.6 ? 'remisyon' : v < 3.2 ? 'dusuk' : v <= 5.1 ? 'orta' : 'yuksek', uyarilar: [], tarihler: [] }
  },
}

/** The 28-joint count: which joints are tender and which are swollen → the two counts DAS28 takes. Stands beside specialties/romatoloji/engines/eklemHaritasi.ts → eklemSay. */
export const EKLEM_28 = ['sag_omuz', 'sol_omuz', 'sag_dirsek', 'sol_dirsek', 'sag_el_bilegi', 'sol_el_bilegi', ...['sag', 'sol'].flatMap((y) => [1, 2, 3, 4, 5].map((n) => `${y}_mcp${n}`)), ...['sag', 'sol'].flatMap((y) => [1, 2, 3, 4, 5].map((n) => `${y}_pip${n}`)), 'sag_diz', 'sol_diz'] as readonly string[]
export const EKLEM_SAYIMI: AracTanimi = {
  anahtar: 'eklem-28',
  tur: 'liste',
  alanlar: [isaret('degerlendirildi'), ...EKLEM_28.map((e) => isaret(`h_${e}`)), ...EKLEM_28.map((e) => isaret(`s_${e}`))],
  cikti: { sayilar: ['tjc', 'sjc'], bantlar: [], uyarilar: [], tarihler: [] },
  kaynak: 'Prevoo MLL, van \'t Hof MA, Kuper HH, et al. Arthritis Rheum 1995;38:44-48.',
  hesapla: (g) => (g.degerlendirildi === true
    ? { tamam: true, sayilar: [{ anahtar: 'tjc', deger: isaretliler(g, EKLEM_28.map((e) => `h_${e}`)).length, ondalik: 0, enCok: 28 }, { anahtar: 'sjc', deger: isaretliler(g, EKLEM_28.map((e) => `s_${e}`)).length, ondalik: 0, enCok: 28 }], bant: null, uyarilar: [], tarihler: [] }
    : BOS_SONUC),
}

/**
 * CRP or ESR follow-up: the band a value falls in and the month of the next check — every threshold and interval
 * the pack's. Stands beside specialties/romatoloji/engines/labIzlem.ts → labSkorla, sonrakiIzlemTarihi.
 */
export const ILTIHAP_LAB_IZLEM: AracTanimi = {
  anahtar: 'iltihap-lab-izlem',
  tur: 'hesap',
  alanlar: [secim('tur', ['crp', 'esr']), sayi('deger', 0, 500), tarih('tarih', true)],
  parametreler: ['crp_dikkat', 'crp_yuksek', 'esr_dikkat', 'esr_yuksek', 'ay_hedef', 'ay_dikkat', 'ay_yuksek'],
  cikti: { sayilar: ['sonraki_ay'], bantlar: ['hedef_yakin', 'dikkat', 'yuksek'], uyarilar: [], tarihler: ['sonraki'] },
  sonucBirimleri: ['ay'],
  kaynak: null,
  hesapla: (g, { p }) => {
    if (!sayiMi(g.deger) || (g.tur !== 'crp' && g.tur !== 'esr')) return BOS_SONUC
    const bant = g.deger < p[`${g.tur}_dikkat`] ? 'hedef_yakin' : g.deger < p[`${g.tur}_yuksek`] ? 'dikkat' : 'yuksek'
    const ay = p[`ay_${bant === 'hedef_yakin' ? 'hedef' : bant}`]
    return { tamam: true, sayilar: [{ anahtar: 'sonraki_ay', deger: ay, ondalik: 0, birim: 'ay' }], bant, uyarilar: [], tarihler: gunMu(g.tarih) ? [{ anahtar: 'sonraki', tarih: ayEkle(g.tarih, ay) }] : [] }
  },
}

// ───────────────────────── sports medicine ─────────────────────────

/** Return to play: the step the athlete is on, 0 to 5, as the doctor decides. The tool records the step; it proposes no day. Stands beside specialties/spor-hekimligi/engines/rtp.ts → rtpDegerlendir. */
export const RTP_BASAMAK: AracTanimi = {
  anahtar: 'rtp-basamak',
  tur: 'liste',
  alanlar: [secim('basamak', ['0', '1', '2', '3', '4', '5'])],
  cikti: { sayilar: [], bantlar: ['b0', 'b1', 'b2', 'b3', 'b4', 'b5'], uyarilar: [], tarihler: [] },
  kaynak: null,
  hesapla: (g) => (typeof g.basamak === 'string' ? { tamam: true, sayilar: [], bant: `b${g.basamak}`, uyarilar: [], tarihler: [] } : BOS_SONUC),
}

/**
 * Injury log: where, how, how severe, where it stands; and from the minutes of load in the last seven days and the
 * earlier weekly average their ratio, flagged from 1.3 (caution) and from 1.5 (high).
 * Source of the two limits: Gabbett TJ. The training–injury prevention paradox. Br J Sports Med 2016;50:273–280.
 * Stands beside specialties/spor-hekimligi/engines/sakatlik.ts → sakatlikDegerlendir, yuklenmeUyariHesapla.
 */
export const SAKATLIK_BOLGELERI = ['diz', 'ayak_bilegi', 'kalca', 'omuz', 'dirsek', 'el_bilegi', 'bel', 'boyun', 'kas_bacak', 'kas_govde', 'kas_ust', 'bas_boyun', 'diger'] as const
export const SAKATLIK_MEKANIZMALARI = ['temas', 'temassiz', 'asiri_kullanim', 'asiri_gerilme', 'bilinmiyor'] as const
export const SAKATLIK_GUNLUGU: AracTanimi = {
  anahtar: 'sakatlik-gunlugu',
  tur: 'liste',
  alanlar: [secim('bolge', SAKATLIK_BOLGELERI), secim('mekanizma', SAKATLIK_MEKANIZMALARI, true), secim('siddet', ['hafif', 'orta', 'agir'], true), secim('durum', ['aktif', 'iyilesiyor', 'kapandi'], true), sayi('dk_7gun', 0, 10000, { birim: 'dk', istege: true }), sayi('dk_onceki', 0, 10000, { birim: 'dk', istege: true })],
  cikti: { sayilar: ['yuklenme_orani'], bantlar: [], uyarilar: ['yuklenme_yuksek', 'yuklenme_dikkat'], tarihler: [] },
  kaynak: 'Gabbett TJ. Br J Sports Med 2016;50:273-280.',
  hesapla: (g) => {
    if (typeof g.bolge !== 'string') return BOS_SONUC
    const oran = sayiMi(g.dk_7gun) && sayiMi(g.dk_onceki) && g.dk_onceki > 0 ? g.dk_7gun / g.dk_onceki : null
    return { tamam: true, sayilar: oran !== null ? [{ anahtar: 'yuklenme_orani', deger: oran, ondalik: 1 }] : [], bant: null, uyarilar: oran !== null && oran >= 1.5 ? ['yuklenme_yuksek'] : oran !== null && oran >= 1.3 ? ['yuklenme_dikkat'] : [], tarihler: [] }
  },
}

// ───────────────────────── urology ─────────────────────────

/**
 * PSA velocity: two values with their days → the change per year (the difference divided by the years between).
 * An interval shorter than 90 days is flagged, as in the tool it stands beside. No band and no threshold: those are
 * the country's guidance. Stands beside specialties/uroloji/engines/psa.ts → skorlaSeri.
 */
export const PSA_HIZI: AracTanimi = {
  anahtar: 'psa-hizi',
  tur: 'hesap',
  alanlar: [sayi('onceki_deger', 0, 1000, { birim: 'ng/mL' }), tarih('onceki_tarih'), sayi('son_deger', 0, 1000, { birim: 'ng/mL' }), tarih('son_tarih')],
  cikti: { sayilar: ['hiz', 'gun'], bantlar: [], uyarilar: ['kisa_aralik'], tarihler: [] },
  sonucBirimleri: ['ng/mL/yil', 'gun'],
  kaynak: null,
  hesapla: (g) => {
    if (!sayiMi(g.onceki_deger) || !sayiMi(g.son_deger) || !gunMu(g.onceki_tarih) || !gunMu(g.son_tarih)) return BOS_SONUC
    const gun = gunFarki(g.onceki_tarih, g.son_tarih)
    if (gun <= 0) return BOS_SONUC
    return { tamam: true, sayilar: [{ anahtar: 'hiz', deger: Math.round(((g.son_deger - g.onceki_deger) / (gun / 365)) * 100) / 100 + 0, ondalik: 2, birim: 'ng/mL/yil' }, { anahtar: 'gun', deger: gun, ondalik: 0, birim: 'gun' }], bant: null, uyarilar: gun < 90 ? ['kisa_aralik'] : [], tarihler: [] }
  },
}

export const ORTO_PEDI_RADYO_ROMA: readonly AracTanimi[] = [KIRIK_ALCI, ORTOPEDI_OP_PROTOKOL, VAS_FONKSIYON, HEDEF_BOY, DOZ_HESABI, PLASTIK_YARA, TETKIK_KUYRUGU, RAPOR_TASLAGI, DAS28, EKLEM_SAYIMI, ILTIHAP_LAB_IZLEM, RTP_BASAMAK, SAKATLIK_GUNLUGU, PSA_HIZI]
