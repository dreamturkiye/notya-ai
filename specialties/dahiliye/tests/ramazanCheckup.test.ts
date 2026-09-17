import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ramazanDegerlendir, type RamazanGirdi } from '../engines/ramazan'
import { uygunPaketler, paketDurumu, birlesikRapor } from '../engines/checkupPaket'

const r0: RamazanGirdi = { dmTip: 'T2', hba1c: 6.8, eGFR: 80, yas: 55, gebe: false, ilacMetinleri: ['glifor metformin'], htVar: false, son3AyAgirHipo: false, son3AyDkaHhs: false, hipoFarkindalikAzalmis: false, tekrarlayanHipo: false, ileriMakrovaskuler: false, akutHastalik: false, yalnizYasiyor: false, kirilgan: false, agirFizikselIs: false }

test('Ramazan risk kademeleri', () => {
  assert.equal(ramazanDegerlendir(r0).risk, 'dusuk')
  assert.equal(ramazanDegerlendir({ ...r0, ilacMetinleri: ['diamicron gliklazid'] }).risk, 'orta')
  assert.equal(ramazanDegerlendir({ ...r0, hba1c: 9.4 }).risk, 'yuksek')
  assert.equal(ramazanDegerlendir({ ...r0, son3AyAgirHipo: true }).risk, 'cok_yuksek')
  assert.equal(ramazanDegerlendir({ ...r0, dmTip: 'T1', hba1c: 8.5 }).risk, 'cok_yuksek')
  assert.match(ramazanDegerlendir({ ...r0, hba1c: 9.4 }).oruc, /önerilmez/)
})

test('insülin: doz/yüzde önerisi yok — hekim; oruç bozma <70 / >300; hasta yaprağı', () => {
  const r = ramazanDegerlendir({ ...r0, ilacMetinleri: ['lantus insülin glarjin', 'lasix furosemid'], htVar: true })
  const ins = r.ilacRehberi.find((x) => /İnsülin/.test(x))!
  assert.match(ins, /HEKİM/); assert.ok(!/%\s?\d|\d+\s?%|ünite|IU/.test(ins))
  assert.ok(r.ilacRehberi.some((x) => /Diüretik: iftardan sonra/.test(x)))
  assert.ok(r.bozmaKurallari.some((x) => /70/.test(x)) && r.bozmaKurallari.some((x) => /300/.test(x)))
  assert.match(r.hastaYapragi, /112/)
})

test('check-up: yaş/cinsiyet SKU; paket sonrası onaylı lab/belge tamam sayar; önceki sonuç sayılmaz; rapor taslak damgası', () => {
  assert.deepEqual(uygunPaketler(45, true).map((p) => p.sku), ['kapsamli', 'kadin40'])
  assert.deepEqual(uygunPaketler(30, false).map((p) => p.sku), ['temel'])
  const d = paketDurumu({ sku: 'temel', tarih: '2026-09-01', manuelTamam: ['idrar'] }, { Hb: ['2026-09-03'], Glu: ['2026-08-20'], TChol: ['2026-09-03'], Kre: ['2026-09-03'], ALT: ['2026-09-03'], TSH: ['2026-09-03'] }, {})
  assert.equal(d.tamamlanan, 6); assert.equal(d.zorunluToplam, 7); assert.equal(d.bitti, false)
  assert.equal(d.kalemler.find((k) => k.kod === 'glukoz')?.tamam, false); assert.equal(d.kalemler.find((k) => k.kod === 'idrar')?.kaynak, 'hekim')
  const e = paketDurumu({ sku: 'kapsamli', tarih: '2026-09-01', manuelTamam: [] }, {}, { ekg: ['2026-09-02'] })
  assert.equal(e.kalemler.find((k) => k.kod === 'ekg')?.tamam, true)
  const rap = birlesikRapor({ hasta: { adSoyad: 'QA Test', yas: 45, kadin: true }, paketAd: 'Kapsamlı', paketTarih: '2026-09-01', labs: [], belgeler: [], kartOzetleri: [], eksikKalemler: ['EKG'], hekimKilitli: false, bugun: '2026-09-16' })
  assert.equal(rap.taslak, true); assert.match(rap.bolumler[0].satirlar[1], /SGK'ya fatura edilmez/); assert.match(rap.bolumler[0].satirlar[2], /TASLAK/)
})
