/**
 * ESNEK-GELISIM — the El Notu improvement loop, pure parts: branş lexicon growth (threshold of 3 independent doctors,
 * never-learned classes excluded, curated seed and the doctor's own lexicon win), the regression set's ground truth (no
 * identity, no dates), the regression guard (replay of recorded answers; a worse reader fails; a prompt change is STALE),
 * the founder dashboard's numbers. Synthetic data only.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { bransOnerileri, bransTohumuBirlestir, oneriKorumaliMi, ESIK_DOKTOR, type HekimGirdisi } from './bransSozlukBuyume'
import { sozlukKur, coz } from './sozluk'
import { tohumlarTr } from './tohum'
import { sayfaGercekleri, kimlikTasiyorMu, haftaBasi, sonHaftalar, ASGARI_GERCEK } from './regresyonSeti'
import { kaydedenModel, setiOynat, bekciKarari, sayfaOlc, kayitAnahtari, olcumdenPuan, puandanOlcum } from './regresyonBekcisi'
import { toplamPuan } from './degerlendirme'
import { sayfayiOku } from './okuyucu'
import { ornekSet, canliModel, ornekOrtam } from './testing/regresyonOrnek'
import { kaliteTablosu, metrikHesapla, satirTemizle } from '@/lib/kurucu/elNotuKaliteHesap'

const g = (doktorId: string, kisaltma: string, anlam: string, brans: string | null = 'kardiyoloji'): HekimGirdisi => ({ doktorId, brans, kisaltma, anlam })

test('branş lexicon growth: proposed only at 3 different doctors of the SAME branş', () => {
  assert.equal(ESIK_DOKTOR, 3)
  const iki = [g('d1', 'PAH', 'pulmoner arter hipertansiyonu'), g('d2', 'PAH', 'pulmoner arter hipertansiyonu')]
  assert.deepEqual(bransOnerileri(iki, tohumlarTr), [], 'two doctors are not enough')
  const ayniDoktor = [...iki, g('d2', 'pah', 'Pulmoner arter hipertansiyonu')]
  assert.deepEqual(bransOnerileri(ayniDoktor, tohumlarTr), [], 'the same doctor twice counts once')
  const baskaBrans = [...iki, g('d3', 'PAH', 'pulmoner arter hipertansiyonu', 'nefroloji')]
  assert.deepEqual(bransOnerileri(baskaBrans, tohumlarTr), [], 'a doctor of another branş does not count')
  const uc = [...iki, g('d3', 'PAH.', 'Pulmoner  arter hipertansiyonu')]
  const r = bransOnerileri(uc, tohumlarTr)
  assert.equal(r.length, 1)
  assert.deepEqual({ brans: r[0].brans, kisaltma: r[0].kisaltma, anlam: r[0].anlam, doktorSayisi: r[0].doktorSayisi }, { brans: 'kardiyoloji', kisaltma: 'PAH', anlam: 'pulmoner arter hipertansiyonu', doktorSayisi: 3 })
  assert.ok(!JSON.stringify(r).includes('d1'), 'no doctor id in a proposal')
  // two different meanings each need their own 3 doctors
  const farkli = [...iki, g('d3', 'PAH', 'periyodik akut hipotansiyon')]
  assert.deepEqual(bransOnerileri(farkli, tohumlarTr), [])
})

test('branş lexicon growth: never-learned classes (side, dose, numbers, allergy, negation, identity) are never proposed', () => {
  const uc = (k: string, a: string) => ['d1', 'd2', 'd3'].map((d) => g(d, k, a))
  for (const [k, a] of [['sğ', 'sağ'], ['sl', 'sol taraf'], ['2x1', 'günde iki kez'], ['5mg', 'beş miligram'], ['ALJ', 'penisilin alerjisi'], ['nkda', 'bilinen ilaç alerjisi yok'], ['Ø', 'yok'], ['neg', 'negatif'], ['TC', 'kimlik no'], ['tel', 'telefon 05551234567'], ['YAS', '37 yaş']]) {
    assert.equal(oneriKorumaliMi(k, a), true, `${k} → ${a} must be refused`)
    assert.deepEqual(bransOnerileri(uc(k, a), tohumlarTr), [], `${k} → ${a}`)
  }
  assert.equal(oneriKorumaliMi('PAH', 'pulmoner arter hipertansiyonu'), false)
})

test('branş lexicon growth: the curated seed stays authoritative; approved pairs join the seed below the doctor\'s own lexicon', () => {
  const kbb = (k: string, a: string) => ['d1', 'd2', 'd3'].map((d) => g(d, k, a, 'kulak-burun-bogaz'))
  assert.deepEqual(bransOnerileri(kbb('SD', 'sağ dudak'), tohumlarTr), [], 'a key the curated KBB seed knows is not proposed')
  assert.deepEqual(bransOnerileri(kbb('N', 'normal'), tohumlarTr), [], 'a pair the general seed already resolves the same way adds nothing')
  const t = tohumlarTr('kardiyoloji')
  const birlesik = bransTohumuBirlestir(t.brans, [{ kisaltma: 'PAH', anlam: 'pulmoner arter hipertansiyonu' }, { kisaltma: 'sğ', anlam: 'sağ' }])
  assert.equal(birlesik.length, t.brans.length + 1, 'the never-learned pair is dropped even if stored')
  const s = sozlukKur([], birlesik, t.genel)
  assert.deepEqual(coz(s, 'PAH'), { anlam: 'pulmoner arter hipertansiyonu', kaynak: 'brans' })
  const kisisel = sozlukKur([{ kisaltma: 'PAH', anlam: 'periferik arter hastalığı', kaynak: 'hekim' }], birlesik, t.genel)
  assert.deepEqual(coz(kisisel, 'PAH'), { anlam: 'periferik arter hastalığı', kaynak: 'hekim' }, 'his own lexicon still wins')
  const kbbTohum = tohumlarTr('kulak-burun-bogaz').brans
  assert.equal(bransTohumuBirlestir(kbbTohum, [{ kisaltma: 'SD', anlam: 'sağ dudak' }]).length, kbbTohum.length, 'an approved pair never overrides a curated key')
})

test('regression set ground truth: facts per page from the approved note; identity, names and dates never enter', () => {
  const not = {
    objektif: 'KZ doğal. Tonsil hipertrofik. Septum sağa deviye. Hasta adı Gizem Sentetik. Tel 05551234567',
    degerlendirme: 'Kronik tonsillit',
    plan: 'Odyometri 12.12.2026 tarihinde. Kontrol 2 hafta sonra.',
  }
  const [s] = sayfaGercekleri({ not, sayfaMetinleri: ['KZ doğal\nTonsil hipertrofik'], genislet: (x) => x, adlar: ['Gizem', 'Sentetik'], tekSayfa: true })
  const metin = JSON.stringify(s)
  assert.ok(s.length >= ASGARI_GERCEK)
  assert.ok(!/Gizem|Sentetik|0555|12\.12|2026/.test(metin), 'no name, phone or date in the facts')
  assert.ok(s.some((f) => f.anahtarlar.some((grup) => grup.includes('hipertrofik'))))
  const taraf = s.find((f) => /Septum/.test(f.metin))!
  assert.equal(taraf.korumali, true, 'a side makes the fact protected')
  assert.ok(taraf.anahtarlar.some((grup) => grup.includes('sağ')))
  const kontrol = s.find((f) => /Kontrol/.test(f.metin))!
  assert.ok(kontrol.anahtarlar.some((grup) => grup.includes('2')), 'a small clinical number stays a key')
  // a dictated visit: only the facts found on the page belong to it
  const [yalniz] = sayfaGercekleri({ not, sayfaMetinleri: ['KZ doğal\nTonsil hipertrofik'], genislet: (x) => x, adlar: [], tekSayfa: false })
  assert.deepEqual(yalniz.map((f) => f.metin).sort(), ['KZ doğal.', 'Tonsil hipertrofik.'])
  assert.equal(kimlikTasiyorMu('T.C. kimlik 12345678901'), true)
  assert.equal(kimlikTasiyorMu('tonsil hipertrofik'), false)
})

test('week keys: Monday, Türkiye time', () => {
  assert.equal(haftaBasi(new Date('2026-11-24T10:00:00Z')), '2026-11-23')
  assert.equal(haftaBasi(new Date('2026-11-29T22:30:00Z')), '2026-11-30', 'Sunday 22:30 UTC is already Monday in Türkiye')
  assert.deepEqual(sonHaftalar(3, new Date('2026-11-24T10:00:00Z')), ['2026-11-09', '2026-11-16', '2026-11-23'])
})

test('regression guard: recorded answers replay to the same score; a worse reader FAILS; a prompt change is STALE', async () => {
  const set = ornekSet()
  const ortam = ornekOrtam()
  const kayitlar: Record<string, Record<string, unknown>> = {}
  const canli = []
  for (const s of set) { kayitlar[s.ad] = {}; canli.push((await sayfaOlc(s, kaydedenModel(canliModel(s.ad), s.ad, kayitlar[s.ad]), ortam)).puan) }
  const taban = toplamPuan(canli)
  assert.ok(taban.dogrulaIleYuzde >= 80, `the synthetic set reads well (${taban.dogrulaIleYuzde}%)`)
  assert.ok(Object.keys(kayitlar['sentetik-1']).every((k) => k.startsWith('sentetik-1-el-notu-')), 'the harness replay key')
  assert.match(kayitAnahtari('p', 'el-notu-sayfa-1', 'sys', ['x']), /^p-el-notu-sayfa-1-[0-9a-f]{16}\.json$/)

  const ayni = await setiOynat(set, kayitlar, ortam)
  assert.equal(ayni.eksik.length, 0)
  assert.deepEqual(bekciKarari(taban, ayni.toplam), { gecti: true, nedenler: [] }, 'the unchanged reader passes')

  // a reader change that loses a line → lower score → fail
  const kotu = await setiOynat(set, kayitlar, { ...ortam, oku: async (p, b, m) => { const s = await sayfayiOku(p, b, m); return { ...s, satirlar: s.satirlar.slice(0, -1) } } })
  const k = bekciKarari(taban, kotu.toplam)
  assert.equal(k.gecti, false)
  assert.ok(k.nedenler.some((n) => /fell/.test(n)), k.nedenler.join('; '))

  // a prompt change: nothing recorded answers it → stale (never a silent pass)
  const bayat = await setiOynat(set, kayitlar, { ...ortam, bransAdi: () => 'Başka branş' })
  assert.ok(bayat.eksik.length > 0)

  // more questions per page / invented words / a changed set all fail
  assert.equal(bekciKarari(taban, { ...taban, dogrulaSayfaBasina: taban.dogrulaSayfaBasina + 1 }).gecti, false)
  assert.equal(bekciKarari(taban, { ...taban, uydurma: taban.uydurma + 1 }).gecti, false)
  assert.match(bekciKarari(taban, { ...taban, gercek: taban.gercek + 1 }).nedenler[0], /set changed/)
  // stored numbers round-trip to the same total (dashboard trend = guard baseline)
  assert.deepEqual(toplamPuan(canli.map(puandanOlcum).map(olcumdenPuan)).dogrulaIleYuzde, taban.dogrulaIleYuzde)
})

test('dashboard numbers: ratios with no denominator are null; time saved only with a baseline', () => {
  const s = (d: string, h: string, x: Partial<Record<string, number>>) => satirTemizle({ doctor_id: d, hafta: h, ...x })
  const satirlar = [
    s('a', '2026-11-16', { sayfa: 10, dogrula: 30, kelime: 200, kabul: 150, onayli_not: 4, duzeltme: 6, golge: 5, golge_ayni: 4, dok_ms: 600000, dok_hasta: 4 }),
    s('b', '2026-11-16', { sayfa: 10, dogrula: 10, kelime: 100, kabul: 90, onayli_not: 0, duzeltme: 0, dok_ms: 0, dok_hasta: 0 }),
    s('a', '2026-11-23', { sayfa: 5, dogrula: 5, kelime: 100, kabul: 95, onayli_not: 2, duzeltme: 0 }),
  ]
  const m = metrikHesapla('2026-11-16', satirlar.filter((x) => x.hafta === '2026-11-16'), (id) => (id === 'a' ? 6 : null))
  assert.deepEqual({ q: m.dogrulaSayfaBasina, c: m.duzeltmeNotBasina, o: m.otomatikKabulYuzde, g: m.golgeEslesmeYuzde, k: m.kazancDk }, { q: 2, c: 1.5, o: 80, g: 80, k: 14 })
  const bos = metrikHesapla('2026-11-09', [], () => 6)
  assert.deepEqual([bos.dogrulaSayfaBasina, bos.duzeltmeNotBasina, bos.otomatikKabulYuzde, bos.golgeEslesmeYuzde, bos.kazancDk], [null, null, null, null, null])
  const t = kaliteTablosu({ satirlar, haftalar: ['2026-11-16', '2026-11-23'], doktorlar: new Map([['a', { ad: 'QA Hekim A', brans: 'kulak-burun-bogaz' }], ['b', { ad: 'QA Hekim B', brans: 'kardiyoloji' }]]), tabanlar: new Map([['a', 6]]), bransEtiketi: (b) => b || '—' })
  assert.equal(t.branslar.length, 2)
  const a = t.doktorlar.find((d) => d.ad === 'QA Hekim A')!
  assert.deepEqual(a.metrikler.map((x) => x.dogrulaSayfaBasina), [3, 1], 'the doctor\'s weekly trend')
  assert.ok(!JSON.stringify(t).includes('"a"') && t.doktorlar.every((d) => /^d\d+$/.test(d.anahtar)), 'doctor ids do not leave')
  assert.equal(t.toplam[0].sayfa, 20)
})

test('regression guard on the committed recorded set: the CURRENT reader must not score lower (npm test runs it on every change)', async () => {
  const fs = await import('node:fs'), path = await import('node:path')
  const d = path.join(process.cwd(), 'core/elNotu/testing/regresyon-ornek')
  const oku = (f: string) => JSON.parse(fs.readFileSync(f, 'utf8'))
  const sayfalar = fs.readdirSync(path.join(d, 'sayfalar')).sort().map((f) => oku(path.join(d, 'sayfalar', f)))
  const kayitlar = Object.fromEntries(sayfalar.map((s: { ad: string }) => [s.ad, oku(path.join(d, 'kayit', `${s.ad}.json`)).kayit]))
  const r = await setiOynat(sayfalar, kayitlar, ornekOrtam())
  assert.equal(r.eksik.length, 0, 'the reader asks questions the recordings do not answer (a prompt / input change): re-record the real set on production, check `--uretim`, then `npx tsx core/elNotu/testing/regresyonOrnekYaz.mts`')
  const k = bekciKarari(oku(path.join(d, 'taban.json')), r.toplam)
  assert.ok(k.gecti, k.nedenler.join('; '))
  assert.ok(r.toplam.korumali.gercek >= 1 && r.toplam.dogrulaSayfaBasina > 0, 'the set exercises a protected side question')
})
