/**
 * NOTYA-ULKE-OZEL-01 — THE TEST COUNTRY "xx": the MECHANISMS of the tools only it has. TESTS ONLY.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * NOTHING HERE IS CLINICAL CONTENT. Every limit, band, table and conversion below is INVENTED so that a test can
 * tell one case from another. No number is taken from a guideline, no formula is a published one, and the
 * two-scale conversion is deliberately not a real one. Never copy anything from this folder into a country.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * A real country writes such a file in its OWN folder (countries/<code>/…), where no other country can reach it
 * (wall rule D3), and gives every key its own code in front ("ca-…"). This folder stands in for such a country so
 * that every extension point has a user without any real country changing.
 */
import type { AracTanimi, OlcuTanimi, UlkeOlcusu } from '../../araclar/tipler'
import { BOS_SONUC, puan, sayi, sayiMi, secim } from '../../araclar/yardimci'

/** The code of the test country. Not a country of the product: lib/ulke/tipler.ts does not list it. */
export const XX = 'xx'

/**
 * A QUANTITY ONLY THIS COUNTRY'S TOOL READS, with two scales that do not share their zero: typed × 0.5 + 10 turns
 * the second scale into the first. INVENTED: it stands for any pair of scales of one measurement.
 */
export const XX_OLCULER: Readonly<Record<UlkeOlcusu, OlcuTanimi>> = {
  'xx-olcek': { kanonik: 'xx-a', birimler: { 'xx-a': 1, 'xx-b': { carpan: 0.5, kaydirma: 10 } } },
}

/**
 * 1. A SCORED SCALE of the country's own. Three items of 0 to 3 are added up. The definition states three bands and
 * marks that NOTHING ELSE FOLLOWS FROM THE BAND (`bantSerbest`) — so a pack may restate the bands, their number
 * included. The field "ortam" is only repeated in the summary (`secenekSerbest`): a pack may restate its options.
 */
export const XX_ERKEN_UYARI: AracTanimi = {
  anahtar: 'xx-erken-uyari',
  tur: 'olcek',
  alanlar: [
    { ...secim('ortam', ['a', 'b', 'c'], true), secenekSerbest: true },
    puan('solunum', 0, 3), puan('nabiz', 0, 3), puan('bilinc', 0, 3),
  ],
  cikti: { sayilar: ['toplam'], bantlar: ['dusuk', 'orta', 'yuksek'], uyarilar: [], tarihler: [] },
  bantSerbest: true,
  kaynak: null,
  hesapla: (g) => {
    const p = [g.solunum, g.nabiz, g.bilinc]
    if (!p.every(sayiMi)) return BOS_SONUC
    const toplam = (p as number[]).reduce((a, b) => a + b, 0)
    return { tamam: true, sayilar: [{ anahtar: 'toplam', deger: toplam, ondalik: 0, enCok: 9 }], bant: toplam < 3 ? 'dusuk' : toplam < 6 ? 'orta' : 'yuksek', uyarilar: [], tarihler: [] }
  },
}

/**
 * 2. A LABORATORY VALUE AGAINST A LIMIT THE COUNTRY STATES. The value is a haemoglobin (the kit's quantity: typed in
 * the unit the country accepts, or in one of several), the limit is the country's number and IS A LABORATORY VALUE
 * (`parametreOlculeri`) — stated with its unit, converted by the kit, compared in one unit. The second, OPTIONAL
 * field reads the country's own quantity against a second limit.
 */
export const XX_KANSIZLIK: AracTanimi = {
  anahtar: 'xx-kansizlik',
  tur: 'hesap',
  alanlar: [sayi('hb', 2, 25, { lab: 'hemoglobin' }), sayi('ikinci', 0, 200, { lab: 'xx-olcek', istege: true })],
  parametreler: ['hb_alt', 'ikinci_ust'],
  parametreOlculeri: { hb_alt: 'hemoglobin', ikinci_ust: 'xx-olcek' },
  sayiOlculeri: { hb: 'hemoglobin' },
  cikti: { sayilar: ['hb'], bantlar: ['altinda', 'ustunde'], uyarilar: ['ikinci_yuksek'], tarihler: [] },
  sonucBirimleri: ['g/dL'],
  kaynak: null,
  hesapla: (g, { p }) => {
    if (!sayiMi(g.hb) || !sayiMi(p.hb_alt) || !sayiMi(p.ikinci_ust)) return BOS_SONUC
    return { tamam: true, sayilar: [{ anahtar: 'hb', deger: g.hb, ondalik: 1, birim: 'g/dL' }], bant: g.hb < p.hb_alt ? 'altinda' : 'ustunde', uyarilar: sayiMi(g.ikinci) && g.ikinci > p.ikinci_ust ? ['ikinci_yuksek'] : [], tarihler: [] }
  },
}

/**
 * 3. A TABLE THE COUNTRY SUPPLIES. The tool reads a ratio (the kit's quantity) and finds its category in the country's
 * table: each row a lower limit — a laboratory value, in the unit the table states — and the category from there on.
 * The rows are handed over already in the unit the arithmetic uses. No row for a value = no result.
 */
export const XX_IZGARA: AracTanimi = {
  anahtar: 'xx-izgara',
  tur: 'hesap',
  alanlar: [sayi('oran', 0, 5000, { lab: 'albuminKreatinin' })],
  tablolar: [{ anahtar: 'kategoriler', sutunlar: [{ anahtar: 'alt', tur: 'sayi', lab: 'albuminKreatinin' }, { anahtar: 'bant', tur: 'anahtar' }] }],
  cikti: { sayilar: [], bantlar: ['k1', 'k2', 'k3'], uyarilar: [], tarihler: [] },
  kaynak: null,
  hesapla: (g, { t }) => {
    const satirlar = t?.kategoriler
    if (!sayiMi(g.oran) || !satirlar?.length) return BOS_SONUC
    let bant: string | null = null
    for (const s of satirlar) if (sayiMi(s.alt) && typeof s.bant === 'string' && g.oran >= s.alt) bant = s.bant
    return bant === null ? BOS_SONUC : { tamam: true, sayilar: [], bant, uyarilar: [], tarihler: [] }
  },
}

export const XX_TANIMLAR: readonly AracTanimi[] = [XX_ERKEN_UYARI, XX_KANSIZLIK, XX_IZGARA]
