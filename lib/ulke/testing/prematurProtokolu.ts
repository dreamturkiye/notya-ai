/**
 * PREMATUR-ULKE-01 — TEST FIXTURES: a follow-up table and early-birth thresholds that carry the SAME numbers as the
 * Türkiye module (lib/clinical/prematur/protokolTR.ts, specialties/kadin-dogum/engines/erkenDogum.ts), in plain English
 * words. They belong to NO country: a test uses them to hold the country engine equal to Türkiye's, and a pack never
 * imports them (tests and lib/ulke/testing are the only places that may name them).
 */
import type { ErkenDogumProtokolu } from '../prematur/erkenDogum'
import type { Kaynak, KriterKosulu, PrematurKural, PrematurProtokol } from '../prematur/tipler'
import { URUN_PARAMETRELERI } from '../prematur/tipler'

const m = (s: string) => ({ en: s })
const kay = (kisa: string, durum: Kaynak['durum']): Kaynak => ({ kisa, tam: `${kisa} (test citation, long enough to count)`, durum, ...(durum === 'birincil-okundu' ? {} : { not: m('Read in a summary (test).') }) })
const g = (alan: KriterKosulu['alan'], op: KriterKosulu['op'], deger: number | undefined, etiket: string): KriterKosulu => ({ alan, op, ...(deger === undefined ? {} : { deger }), etiket: m(etiket) })

const KURALLAR: PrematurKural[] = [
  {
    kod: 'rop', kategori: 'goz', baslik: m('ROP screening'), aciklama: m('Retinopathy of prematurity screening window.'),
    kriter: { herhangiBiri: [[g('gestasyonHafta', '<=', 32, 'gestation <= 32 weeks')], [g('dogumKiloGr', '<=', 1500, 'birth weight <= 1500 g')], [g('ropSecili', 'dogru', undefined, 'clinician: risk')]] },
    zamanlamalar: [
      { kod: 'ilk-pma', etiket: m('First exam: PMA week 30-31'), kosul: [g('gestasyonHafta', '<', 27, 'gestation < 27')], bas: { tur: 'pma-hafta', hafta: 30 }, son: { tur: 'pma-hafta', hafta: 31 } },
      { kod: 'ilk-4hf', etiket: m('First exam: postnatal week 4'), kosul: [g('gestasyonHafta', '>=', 27, 'gestation >= 27')], bilinmiyorsa: 'dahil', bas: { tur: 'dogumdan-hafta', hafta: 4 } },
    ],
    kaynaklar: [kay('Test ROP A', 'birincil-okundu'), kay('Test ROP B', 'birincil-okundu')],
  },
  {
    kod: 'cranial-us', kategori: 'beyin', baslik: m('Cranial ultrasound'), aciklama: m('Routine cranial ultrasound times.'),
    kriter: { herhangiBiri: [[g('gestasyonHafta', '<=', 30, 'gestation <= 30 weeks')]] },
    zamanlamalar: [
      { kod: 'first', etiket: m('Day 7-10'), bas: { tur: 'dogumdan-gun', gun: 7 }, son: { tur: 'dogumdan-gun', gun: 10 } },
      { kod: 'repeat', etiket: m('Week 4-6'), bas: { tur: 'dogumdan-hafta', hafta: 4 }, son: { tur: 'dogumdan-hafta', hafta: 6 } },
      { kod: 'term', etiket: m('PMA week 36-40'), bas: { tur: 'pma-hafta', hafta: 36 }, son: { tur: 'pma-hafta', hafta: 40 } },
    ],
    kaynaklar: [kay('Test cranial', 'ikincil-ozet')],
  },
  {
    kod: 'hearing-9m', kategori: 'isitme', baslik: m('Hearing follow-up'), aciklama: m('Risk-indicator hearing follow-up.'),
    kriter: { herhangiBiri: [[g('nicuGun', '>', 5, 'NICU > 5 days')], [g('ototoksik5Gun', 'dogru', undefined, 'ototoxic > 5 days')], [g('degisimTransfuzyonu', 'dogru', undefined, 'exchange transfusion')]] },
    zamanlamalar: [
      { kod: 'assess', etiket: m('Assessment by month 9'), son: { tur: 'kronolojik-ay', ay: 9 } },
      { kod: 'follow-24m', etiket: m('Follow-up at 2 years'), bas: { tur: 'kronolojik-ay', ay: 24 } },
    ],
    kaynaklar: [kay('Test hearing', 'ikincil-ozet')],
  },
  {
    kod: 'hearing-ecmo', kategori: 'isitme', baslik: m('Hearing after ECMO'), aciklama: m('ECMO history.'),
    kriter: { herhangiBiri: [[g('ecmo', 'dogru', undefined, 'ECMO history')]] },
    zamanlamalar: [{ kod: 'assess', etiket: m('Assessment by month 3'), son: { tur: 'kronolojik-ay', ay: 3 } }],
    kaynaklar: [kay('Test hearing', 'ikincil-ozet')],
  },
  {
    kod: 'bpd', kategori: 'akciger', baslik: m('Chronic lung disease'), aciklama: m('< 32 weeks + oxygen at 28 days.'),
    kriter: { herhangiBiri: [[g('gestasyonHafta', '<', 32, 'gestation < 32'), g('oksijen28Gun', 'dogru', undefined, 'oxygen at day 28')]] },
    zamanlamalar: [], kaynaklar: [kay('Test lung', 'ikincil-ozet')],
  },
  {
    kod: 'rsv', kategori: 'enfeksiyon', baslik: m('RSV eligibility'), aciklama: m('RSV prophylaxis eligibility.'),
    kriter: { herhangiBiri: [
      [g('gestasyonHafta', '<', 29, 'gestation < 29'), g('yasAy', '<', 12, 'age < 12 months')],
      [g('gestasyonHafta', '<', 32, 'gestation < 32'), g('oksijen28Gun', 'dogru', undefined, 'oxygen at day 28'), g('yasAy', '<', 12, 'age < 12 months')],
      [g('hsKkh', 'dogru', undefined, 'haemodynamically significant CHD'), g('yasAy', '<=', 12, 'age <= 12 months')],
    ] },
    zamanlamalar: [], kaynaklar: [kay('Test RSV', 'ikincil-ozet')],
  },
  {
    kod: 'iron', kategori: 'kan', baslik: m('Iron prophylaxis'), aciklama: m('Iron window.'),
    kriter: { herhangiBiri: [[g('gestasyonHafta', '<', 37, 'gestation < 37')], [g('dogumKiloGr', '<', 2500, 'birth weight < 2500 g')]] },
    zamanlamalar: [{ kod: 'start', etiket: m('Window from month 2 for 5 months'), bas: { tur: 'dogumdan-gun', gun: 60 }, son: { tur: 'dogumdan-gun', gun: 212 } }],
    kaynaklar: [kay('Test iron', 'ikincil-ozet')],
  },
  {
    kod: 'bone', kategori: 'kemik', baslik: m('Bone metabolism'), aciklama: m('Citation only.'),
    kriter: { herhangiBiri: [[g('gestasyonHafta', '<', 37, 'gestation < 37')]] },
    zamanlamalar: [], kaynaklar: [kay('Test bone', 'ikincil-ozet')],
  },
]

/** The Türkiye table's numbers, in English, for the equality tests. */
export const TEST_PROTOKOLU: PrematurProtokol = {
  ulke: 'xx', ad: m('Test'), surum: '2026-11-13',
  duzeltme: { baslangicHafta: 37, buyumeUstAy: 24, gelisimUstAy: 24, kaynak: 'test' },
  kapsam: { gestasyonHaftaKucuk: 37, dogumKiloGrEnFazla: 1500, kaynak: m('test') },
  urun: { ...URUN_PARAMETRELERI }, kurallar: KURALLAR,
}

/** "Follow your local protocol" in place of every dated rule: what a pack states when it could read no source. */
export const TEST_YEREL_PROTOKOLU: PrematurProtokol = {
  ...TEST_PROTOKOLU,
  kurallar: KURALLAR.map((k) => ({ kod: `local-${k.kod}`, kategori: k.kategori, baslik: k.baslik, aciklama: m('Follow your local protocol.'), yerel: true as const, kriter: null, zamanlamalar: [], kaynaklar: [] })),
}

const kd = (kisa: string, durum: Kaynak['durum']) => kay(kisa, durum)
/** The Türkiye module's early-birth numbers (ESIK). */
export const TEST_ERKEN_DOGUM: ErkenDogumProtokolu = {
  ulke: 'xx', surum: '2026-11-13',
  serviks: { pencereBasGun: 16 * 7, pencereSonGun: 24 * 7, kisaMm: 25, kisaDahil: false, digerKisaMm: 25, digerKisaDahil: true, progesteron: { sonGun: 24 * 7 - 1, esikMm: 20, ustMm: 25 }, cokKisaMm: 10 },
  steroid: { yasayabilirlik: 23 * 7, anaBas: 24 * 7, anaSon: 33 * 7 + 6, gecBas: 34 * 7, gecSon: 36 * 7 + 6, tekrarGun: 14 },
  kaynaklar: [kd('Test cervix', 'birincil-okundu'), kd('Test steroid', 'ikincil-ozet')],
  serviksKaynaklari: ['Test cervix'], steroidKaynaklari: ['Test steroid'], kapsam: m('test'),
}
export const TEST_ERKEN_DOGUM_YEREL: ErkenDogumProtokolu = { ...TEST_ERKEN_DOGUM, serviks: null, steroid: null, kaynaklar: [], serviksKaynaklari: [], steroidKaynaklari: [] }
