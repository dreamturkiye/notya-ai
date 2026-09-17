import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type Anthropic from '@anthropic-ai/sdk'
import { csvXlsxCoz, gorselCikar, pdfMetinCoz, trTarihIso } from './cikarim'
import { kanonikBul } from './kanonik'
import { satirKur, uzlastir } from './trend'
import { SENTETIK_SATIRLAR, sentetikLabPdf } from './fixtures/sentetikLabPdf'

// DAH-LAB-BELGELER — extraction stage audit. Synthetic fixture only; no real patient document.

describe('pdfMetinCoz (digital PDF text layer)', () => {
  it('parses every printed lab row of the synthetic PDF; header/identity/date lines are not rows', async () => {
    const r = await pdfMetinCoz(sentetikLabPdf('2026-09-13', '2026-09-14'))
    assert.equal(r.kaynak, 'yapi'); assert.equal(r.sayfa, 1); assert.equal(r.not, 'dijital PDF')
    assert.deepEqual(r.satirlar.map((s) => s.raw_name), SENTETIK_SATIRLAR.map((s) => s.ad))
    const a1c = r.satirlar[0]
    assert.deepEqual({ value: a1c.value, unit: a1c.unit, ref_low: a1c.ref_low, ref_high: a1c.ref_high, flag: a1c.flag_printed, page: a1c.page }, { value: '7.9', unit: '%', ref_low: '4', ref_high: '6', flag: 'H', page: 1 })
    assert.equal(r.numune_tarihi, '2026-09-13'); assert.equal(r.rapor_tarihi, '2026-09-14')
    assert.equal(r.kimlik, null) // the structural pass never extracts identity
  })

  it('rows → canonical_key, canonical unit conversion, printed-ref flags', async () => {
    const r = await pdfMetinCoz(sentetikLabPdf('2026-09-13', '2026-09-14'))
    const rows = r.satirlar.map((h) => satirKur(h, []))
    assert.deepEqual(rows.map((s) => s.canonical_key), SENTETIK_SATIRLAR.map((s) => s.beklenenKey))
    const by = Object.fromEntries(rows.map((s) => [s.canonical_key, s]))
    assert.equal(by.HbA1c.kanonik_deger, 7.9); assert.equal(by.HbA1c.flag, 'H'); assert.equal(by.HbA1c.loinc, '4548-4')
    assert.equal(by.Kre.kanonik_birim, 'mg/dL'); assert.equal(by.Kre.kanonik_deger, 0.995) // 88 µmol/L × 0.01131
    assert.equal(by.Kre.value_num, 88); assert.equal(by.Kre.unit, 'umol/L') // printed value/unit kept as-is
    assert.equal(by.LDL.kanonik_deger, 119.877); assert.equal(by.LDL.flag, 'normal')
    assert.equal(by.K.flag, 'normal'); assert.equal(by.K.kritik, false)
    assert.ok(rows.every((s) => s.trend === 'no_prior' && !s.dogrulanacak))
  })
})

describe('csvXlsxCoz', () => {
  it('header CSV: Turkish decimals, combined Referans column, printed flag column', () => {
    const csv = 'Tetkik,Sonuç,Birim,Referans,Durum\nHbA1c,"8,2",%,4 - 6,H\nPotasyum,"5,4",mmol/L,"3,5 - 5,1",H\nAçlık Kan Şekeri,142,mg/dL,70-100,\n,,,,\n'
    const r = csvXlsxCoz(Buffer.from(csv, 'utf8'), 'text/csv')
    assert.equal(r.not, 'CSV'); assert.equal(r.satirlar.length, 3)
    assert.deepEqual(r.satirlar[1], { raw_name: 'Potasyum', value: '5,4', unit: 'mmol/L', ref_low: '3,5', ref_high: '5,1', flag_printed: 'H', page: 1, kaynak: 'yapi' })
    const rows = r.satirlar.map((h) => satirKur(h, []))
    assert.deepEqual(rows.map((s) => s.canonical_key), ['HbA1c', 'K', 'Glu'])
    assert.equal(rows[0].value_num, 8.2); assert.equal(rows[1].flag, 'H'); assert.equal(rows[2].flag, 'H') // 142 > 100 from printed ref
  })
  it('regression: BOM + semicolon export keeps "8,2" as 8.2 (was read as 82) and Turkish names intact', () => {
    const r = csvXlsxCoz(Buffer.from('\uFEFFTetkik;Sonuç;Birim;Referans\nHbA1c;8,2;%;4 - 6\nKreatinin;1,34;mg/dL;0,7 - 1,2\nİdrar albümin/kreatinin;86;mg/g;0 - 30\n', 'utf8'), 'text/csv')
    const rows = r.satirlar.map((h) => satirKur(h, []))
    assert.deepEqual(rows.map((s) => [s.canonical_key, s.value_num, s.flag]), [['HbA1c', 8.2, 'H'], ['Kre', 1.34, 'H'], ['UACR', 86, 'H']])
  })
  it('headerless CSV falls back to the lab-row grammar', () => {
    const r = csvXlsxCoz(Buffer.from('Hemoglobin,12.5,g/dL,12 - 16\nnot a row\n', 'utf8'), 'text/csv')
    assert.equal(r.satirlar.length, 1); assert.equal(kanonikBul(r.satirlar[0].raw_name), 'Hb'); assert.equal(r.satirlar[0].ref_high, '16')
  })
})

describe('alias matching on printed names', () => {
  it('common Turkish lab-report spellings map; unknown stays null (never guessed)', () => {
    assert.equal(kanonikBul('Glikozile Hemoglobin (HbA1c)'), 'HbA1c')
    assert.equal(kanonikBul('LDL-C'), 'LDL'); assert.equal(kanonikBul('Potasyum (K+)'), 'K')
    assert.equal(kanonikBul('ALT (SGPT)'), 'ALT'); assert.equal(kanonikBul('Spot idrar albumin/kreatinin'), 'UACR')
    assert.equal(kanonikBul('Serbest T4'), 'FT4'); assert.equal(kanonikBul('Kreatinin'), 'Kre')
    assert.equal(kanonikBul('Sentetik Parametre X'), null)
  })
})

describe('trTarihIso', () => {
  it('dd.mm.yyyy and dd/mm/yyyy → ISO; garbage → null', () => {
    assert.equal(trTarihIso('3.9.2026'), '2026-09-03'); assert.equal(trTarihIso('13/09/2026'), '2026-09-13')
    assert.equal(trTarihIso(null), null); assert.equal(trTarihIso('yok'), null)
  })
})

describe('gorselCikar (vision pass) — response normalisation with a stub client', () => {
  const stub = (text: string) => ({ messages: { create: async () => ({ content: [{ type: 'text', text }] }) } }) as unknown as Anthropic
  it('fenced JSON → rows as strings, rows without value dropped, ISO dates, kimlik kept for the identity guard only', async () => {
    const json = { lab_adi: 'QA Lab', numune_tarihi: '2026-09-13', rapor_tarihi: '2026-09-14', kimlik: { ad: 'TEST Sentetik', dogum: null, tc_son4: null },
      satirlar: [{ raw_name: 'HbA1c', value: 7.9, unit: '%', ref_low: 4, ref_high: 6, flag_printed: 'H', page: 1 }, { raw_name: 'Boş', value: null, unit: null, ref_low: null, ref_high: null, flag_printed: null, page: 1 }, { raw_name: 'Kreatinin', value: '88', unit: 'µmol/L', ref_low: '62', ref_high: '106', flag_printed: null, page: 1 }], not: null }
    const r = await gorselCikar(stub('Here:\n```json\n' + JSON.stringify(json) + '\n```'), { tip: 'pdf', base64: '' })
    assert.equal(r.kaynak, 'gorsel'); assert.equal(r.lab_adi, 'QA Lab'); assert.equal(r.numune_tarihi, '2026-09-13')
    assert.equal(r.satirlar.length, 2); assert.equal(r.satirlar[0].value, '7.9'); assert.equal(r.satirlar[0].ref_low, '4'); assert.equal(r.satirlar[0].kaynak, 'gorsel')
    assert.equal(r.kimlik?.ad, 'TEST Sentetik')
  })
  it('structural vs vision disagreement becomes a dogrulanacak cell; µmol/L and umol/L convert identically', async () => {
    const yapi = (await pdfMetinCoz(sentetikLabPdf('2026-09-13', '2026-09-14'))).satirlar
    const gorsel = yapi.map((s) => (s.raw_name === 'HbA1c' ? { ...s, value: '7.6', kaynak: 'gorsel' as const } : s.raw_name === 'Kreatinin' ? { ...s, unit: 'µmol/L', kaynak: 'gorsel' as const } : { ...s, kaynak: 'gorsel' as const }))
    const u = uzlastir(yapi, gorsel)
    assert.deepEqual(u.uyusmazlik.map((x) => `${x.raw_name}.${x.alan}`), ['HbA1c.value', 'Kreatinin.unit'])
    assert.equal(u.satirlar.length, SENTETIK_SATIRLAR.length)
    assert.equal(satirKur({ ...yapi[2], unit: 'µmol/L' }, []).kanonik_deger, satirKur(yapi[2], []).kanonik_deger)
  })
})
