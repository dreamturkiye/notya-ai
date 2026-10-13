/**
 * NOTYA-ULKE-OZEL-01 — THE TEST COUNTRY "xx": the tools it has BEYOND the shared English set, in the kit's own shape,
 * and the placeholders only it has. TESTS ONLY — see ./tanimlar.ts: nothing here is clinical content, and every
 * licence state, rights holder and address below is INVENTED for the tests.
 *
 *   xx-erken-uyari    a scale of its own; its own FOUR bands over the total (the definition has three) and its own
 *                     FOUR options (the definition has three); only for patients aged 16 and over; a rights
 *                     holder's notice under every result
 *   xx-kansizlik      a laboratory value against the country's limit, the limit stated in the country's unit
 *   xx-izgara         a category read from the country's own table, the table stated in the country's unit
 *   xx-kirik-riski    a link-out tile: nothing but a link to an official calculator elsewhere
 *   dxa-tekrar        a tool OF THE KIT that the shared set has not written: the country brings its words and its
 *                     three numbers, and the set's placeholder for it leaves the list
 *   xx-odeme-formu    a placeholder: a form of the country's payer — its licence is unclear, so it cannot be a tool
 *   xx-triyaj         a placeholder: a triage scale whose owner must first permit its use
 */
import type { AracYuvasi, PaketAraci } from '../../araclar/tipler'

const D = 'en-GB'
const m = (metin: string) => ({ [D]: metin })
const NOT = 'TEST DATA: not a clinical tool.'

export const XX_EK_ARACLAR: readonly PaketAraci[] = [
  {
    anahtar: 'xx-erken-uyari',
    // every DOCTOR role of the country, and no allied profession: filled in by ./ayarlar.ts (hekimRolleri)
    roller: [], sinif: 'hekimler',
    metin: {
      ad: m('Early warning total (test)'),
      aciklama: m('Three observations, each scored 0 to 3, added up.'),
      alanlar: { ortam: m('Setting'), solunum: m('Breathing'), nabiz: m('Pulse'), bilinc: m('Consciousness') },
      // FOUR options where the definition has three: the country's own list
      secenekler: { ortam: { ward: m('Ward'), clinic: m('Clinic'), home: m('Home visit'), other: m('Elsewhere') } },
      sayilar: { toplam: m('Total') },
      // FOUR bands where the definition has three: the country's own table
      bantlar: { sifir: m('Level 0'), bir: m('Level 1'), iki: m('Level 2'), uc: m('Level 3') },
      not: m(NOT),
      hastaKapisi: m('This tool is for patients aged 16 and over.'),
    },
    uyarlama: {
      secenekler: { ortam: ['ward', 'clinic', 'home', 'other'] },
      bantlar: { sayi: 'toplam', satirlar: [{ ust: 1, bant: 'sifir' }, { ust: 4, dahil: true, bant: 'bir' }, { ust: 7, bant: 'iki' }, { ust: null, bant: 'uc' }] },
    },
    hasta: { enAzYas: 16 },
    lisans: { durum: 'izin-alindi', hakSahibi: 'The Test Scale Society (invented)', kaynak: 'letter of 2026-01-01 (invented)', bildirim: m('Test Scale © The Test Scale Society. Used with permission.') },
  },
  {
    anahtar: 'xx-kansizlik',
    roller: ['xx-geriatrics', 'internal-medicine'],
    metin: {
      ad: m('Haemoglobin against the local limit (test)'),
      aciklama: m('Compares a haemoglobin with the limit this country states.'),
      alanlar: { hb: m('Haemoglobin'), ikinci: m('Second value (optional)') },
      sayilar: { hb: m('Haemoglobin') },
      bantlar: { altinda: m('Below the limit'), ustunde: m('At or above the limit') },
      uyarilar: { ikinci_yuksek: m('The second value is above its limit.') },
      not: m(NOT),
    },
    // THE COUNTRY'S NUMBERS, EACH IN THE COUNTRY'S OWN UNIT: 110 g/L is 11 g/dL to the arithmetic; 100 on the second scale is 60 on the first.
    parametreler: { hb_alt: { deger: 110, birim: 'g/L' }, ikinci_ust: { deger: 100, birim: 'xx-b' } },
    lisans: { durum: 'serbest' },
  },
  {
    anahtar: 'xx-izgara',
    roller: ['nephrology'],
    metin: {
      ad: m('Category from the local table (test)'),
      aciklama: m('Finds the category of a ratio in the table this country states.'),
      alanlar: { oran: m('Albumin-to-creatinine ratio') },
      bantlar: { k1: m('Category 1'), k2: m('Category 2'), k3: m('Category 3') },
      not: m(NOT),
    },
    // THE COUNTRY'S TABLE, in the country's unit (mg/mmol); the arithmetic works in mg/g.
    tablolar: { kategoriler: { birimler: { alt: 'mg/mmol' }, satirlar: [{ alt: 0, bant: 'k1' }, { alt: 3, bant: 'k2' }, { alt: 30, bant: 'k3' }] } },
    lisans: { durum: 'serbest' },
  },
  {
    anahtar: 'xx-kirik-riski',
    roller: ['xx-geriatrics', 'family-medicine'],
    metin: {
      ad: m('Fracture risk calculator (link, test)'),
      aciklama: m('Opens the official calculator on its own site.'),
      alanlar: {},
      not: m('This opens another site in a new tab. Nothing from the patient file is sent to it.'),
      baglanti: m('Open the official calculator'),
    },
    baglanti: { adres: 'https://example.org/calculator' },
    lisans: { durum: 'serbest' },
  },
  {
    // A TOOL OF THE KIT that the shared set has not written: the country brings its words and its numbers.
    anahtar: 'dxa-tekrar',
    roller: ['endocrinology', 'xx-geriatrics'],
    metin: {
      ad: m('Next bone density scan (test)'),
      aciklama: m('Works out the day of the next scan from the last one and the risk group.'),
      alanlar: { son_dxa: m('Date of the last scan'), risk: m('Risk group') },
      secenekler: { risk: { dusuk: m('Low'), orta: m('Medium'), yuksek: m('High') } },
      uyarilar: { gecikti: m('The next scan is overdue.') },
      tarihler: { sonraki: m('Next scan') },
      not: m(NOT),
    },
    parametreler: { yil_dusuk: 5, yil_orta: 3, yil_yuksek: 1 },
    lisans: { durum: 'serbest' },
  },
]

export const XX_EK_YUVALAR: readonly AracYuvasi[] = [
  { anahtar: 'xx-odeme-formu', acik: false, icerik: null, mekanizmaHazir: false, eksik: 'TEST: the claim form of this country\'s payer, its fields and its rules.', kimden: 'TEST: a lawyer of the country', roller: null, lisans: { durum: 'belirsiz', hakSahibi: 'The payer of the test country (invented)' } },
  { anahtar: 'xx-triyaj', acik: false, icerik: null, mekanizmaHazir: false, eksik: 'TEST: the national triage scale; its owner reserves all rights.', kimden: 'TEST: the owner of the scale, through the owner of the product', roller: ['emergency-medicine'], lisans: { durum: 'izin-gerekli', hakSahibi: 'The College of the test country (invented)' } },
]

/** Every key that is the test country's alone: none may be named by a real pack, a language set or the kit. */
export const XX_OZEL_ARACLAR: readonly string[] = ['xx-erken-uyari', 'xx-izgara', 'xx-kansizlik', 'xx-kirik-riski', 'xx-odeme-formu', 'xx-triyaj']
