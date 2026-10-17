/**
 * FOTO-AI-01 — the evaluation harness itself: fixture validation, scorer arithmetic, scripted end-to-end run of the bundled
 * synthetic fixture. No network, no image, no model. These tests prove the INSTRUMENT works; they say nothing about clinical accuracy.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { olguSetiDogrula, type Olgu } from './olgu'
import { olgulariKos, sahteCagirici } from './kos'
import { puanla, raporMetni, RAPOR_UYARISI, type OlguSonucu } from './puanla'
import { fotoSonucuDogrula } from '../sema'
import { kalibreEt } from '../kalibrasyon'
import { sahteFotoAiYaniti } from '../../../fotoArsiv/testGorselleri'

const ornek = JSON.parse(readFileSync(join(__dirname, 'ornek.fixture.json'), 'utf8'))

const olgu = (id: string, beklenen: Olgu['beklenen'], mod: Olgu['mod'] = 'genel'): Olgu => ({ id, mod, yas: null, veliDili: false, beklenen })
const sonuc = (o: Olgu, degistir: (h: Record<string, any>) => void = () => undefined): OlguSonucu => {
  const h = JSON.parse(sahteFotoAiYaniti('t', o.mod)); degistir(h)
  const d = fotoSonucuDogrula(h, o.mod).deger!
  return { olgu: o, durum: 'tamam', deger: kalibreEt(d, { veliDili: false }) }
}
const bayrakla = (kod: string, durum = 'var') => (h: Record<string, any>) => {
  const b = h.kirmiziBayraklar.find((x: any) => x.kod === kod); b.durum = durum; b.kriter = 'somut ölçüt'
}

describe('fixture doğrulama', () => {
  it('paketlenmiş sentetik fixture geçerlidir ve görüntü içermez', () => {
    const r = olguSetiDogrula(ornek)
    assert.deepEqual(r.hatalar, [])
    assert.equal(r.set!.olgular.length, 7)
    assert.ok(r.set!.olgular.every((o) => !o.gorsel), 'depoya görüntü dosyası adı bile girmez')
    assert.match(JSON.stringify(ornek), /gercek goruntu yok/)
  })
  it('hataları açıkça söyler', () => {
    const kotu = olguSetiDogrula({ surum: 2, olgular: [{ id: 'a b', mod: 'genel' }, { id: 'x', mod: 'cocuk' }, { id: 'y', mod: 'genel', beklenen: { bolge: 'burun-ucu', kirmiziBayrak: ['sarilik-yasa-duyarli'], kalite: 'harika' } }, { id: 'z', mod: 'genel', gorsel: '../../etc/passwd' }] })
    assert.equal(kotu.set, undefined)
    const t = kotu.hatalar.join('\n')
    for (const beklenen of ['"surum": 1', '"id"', '"mod"', 'bilinmeyen bir bölge', 'genel" modunda geçerli kodların', 'kalite', 'dosya adı olmalı']) assert.ok(t.includes(beklenen), beklenen)
  })
  it('kimlik tekrarını ve boş kümeyi reddeder', () => {
    assert.ok(olguSetiDogrula({ surum: 1, olgular: [] }).hatalar.length)
    const iki = { surum: 1, olgular: [{ id: 'a', mod: 'genel' }, { id: 'a', mod: 'genel' }] }
    assert.ok(olguSetiDogrula(iki).hatalar.some((h) => h.includes('tekrar')))
  })
  it('pediatrik kod yalnız pediatrik modda geçerli bir beklentidir', () => {
    assert.ok(olguSetiDogrula({ surum: 1, olgular: [{ id: 'a', mod: 'pediatrik', beklenen: { kirmiziBayrak: ['hemanjiyom-riskli-konum'] } }] }).set)
    assert.ok(!olguSetiDogrula({ surum: 1, olgular: [{ id: 'a', mod: 'genel', beklenen: { kirmiziBayrak: ['hemanjiyom-riskli-konum'] } }] }).set)
  })
})

describe('puanlayıcı aritmetiği', () => {
  it('kırmızı bayrak duyarlılığı / kesinliği / özgüllüğü ve kaçırılanlar', () => {
    const a = olgu('a', { kirmiziBayrak: ['peteshi-purpura'] })
    const b = olgu('b', { kirmiziBayrak: ['yanik'] })
    const c = olgu('c', { kirmiziBayrak: [] })
    const p = puanla([
      sonuc(a, bayrakla('peteshi-purpura')), // TP
      sonuc(b), // FN: yanık var ama model görmedi
      sonuc(c, bayrakla('sarilik', 'olasi')), // FP
    ])
    assert.equal(p.bayrakDuyarlilik.pay, 1)
    assert.equal(p.bayrakDuyarlilik.payda, 2)
    assert.equal(p.bayrakDuyarlilik.oran, 0.5)
    assert.equal(p.bayrakKesinlik.oran, 0.5)
    assert.deepEqual(p.kacirilanBayrak, [{ olguId: 'b', kod: 'yanik' }])
    assert.deepEqual(p.yanlisAlarm, [{ olguId: 'c', kod: 'sarilik' }])
    assert.equal(p.bayrakOzgulluk.payda, 22, '3 olgu x 8 kod - 2 gerçek pozitif')
    assert.equal(p.bayrakOzgulluk.pay, 21)
    assert.equal(p.katki.bayrak, 3)
  })
  it('"degerlendirilemez" pozitif sayılmaz; "olası" sayılır', () => {
    const a = olgu('a', { kirmiziBayrak: ['yanik'] })
    assert.equal(puanla([sonuc(a, bayrakla('yanik', 'degerlendirilemez'))]).bayrakDuyarlilik.oran, 0)
    assert.equal(puanla([sonuc(a, bayrakla('yanik', 'olasi'))]).bayrakDuyarlilik.oran, 1)
  })
  it('örnek yoksa oran null\'dır, süslü bir 1.0 değil', () => {
    const p = puanla([sonuc(olgu('a', {}))])
    assert.equal(p.bayrakDuyarlilik.oran, null)
    assert.equal(p.bolgeUyumu.oran, null)
    assert.equal(p.abstain.dogruluk.oran, null)
    assert.equal(puanla([]).semaGecerliligi.oran, null)
  })
  it('bölge uyumu: null beklenti "belirlenemez" demektir', () => {
    const p = puanla([
      sonuc(olgu('a', { bolge: 'kol-sag' })),
      sonuc(olgu('b', { bolge: 'yuz' })), // model kol-sag dedi
      sonuc(olgu('c', { bolge: null }), (h) => { h.bolge.id = null }),
    ])
    assert.equal(p.bolgeUyumu.pay, 2)
    assert.equal(p.bolgeUyumu.payda, 3)
  })
  it('abstain: doğru abstain, gereksiz abstain, KAÇIRILAN abstain', () => {
    const kotuKalite = (h: Record<string, any>) => { h.kalite.genel = 'yetersiz' }
    const p = puanla([
      sonuc(olgu('dogru-abstain', { degerlendirilebilir: false }), kotuKalite),
      sonuc(olgu('gereksiz', { degerlendirilebilir: true }), kotuKalite),
      sonuc(olgu('kacirilan', { degerlendirilebilir: false })),
      sonuc(olgu('dogru-deg', { degerlendirilebilir: true })),
    ])
    assert.equal(p.abstain.dogruAbstain, 1)
    assert.equal(p.abstain.gereksizAbstain, 1)
    assert.equal(p.abstain.kacirilanAbstain, 1)
    assert.equal(p.abstain.dogruDegerlendirme, 1)
    assert.deepEqual(p.abstain.kacirilanOlgular, ['kacirilan'])
    assert.equal(p.abstain.dogruluk.oran, 0.5)
  })
  it('şema geçerliliği: hata durumundaki olgular paydada, onarım sayılır', () => {
    const o = olgu('x', {})
    const p = puanla([sonuc(o), { olgu: o, durum: 'hata', hatalar: ['x'], onarimDenendi: true }, { ...sonuc(o), onarimDenendi: true }])
    assert.equal(p.semaGecerliligi.pay, 2)
    assert.equal(p.semaGecerliligi.payda, 3)
    assert.equal(p.onarimGerekenOlgu, 2)
  })
  it('kalite derecesi uyumu', () => {
    const p = puanla([sonuc(olgu('a', { kalite: 'iyi' })), sonuc(olgu('b', { kalite: 'yetersiz' }))])
    assert.equal(p.kalite.oran, 0.5)
  })
})

describe('uçtan uca: sahte modelle paketlenmiş fixture', () => {
  it('beklenen sonuçlar tam olarak çıkar (alet çalışıyor, hatalar doğru raporlanıyor)', async () => {
    const set = olguSetiDogrula(ornek).set!
    const sonuclar = await olgulariKos(set, { sahte: true })
    assert.equal(sonuclar.length, 7)
    const p = puanla(sonuclar)
    assert.equal(p.semaGecerliligi.pay, 6)
    assert.equal(p.onarimGerekenOlgu, 1)
    assert.deepEqual(p.kacirilanBayrak, [{ olguId: 'sentetik-04-kacirilan-bayrak', kod: 'enfeksiyon-selulit' }])
    assert.deepEqual(p.yanlisAlarm, [{ olguId: 'sentetik-05-yanlis-alarm', kod: 'yanik' }])
    assert.deepEqual(p.abstain.kacirilanOlgular, ['sentetik-06-kacirilan-abstain'])
    assert.equal(p.abstain.dogruAbstain, 1)
    assert.equal(p.bayrakDuyarlilik.oran, 0.5)
    // the pediatric case really ran in pediatric mode (its extra codes were scored), the generic ones did not
    const kodlar = new Set(p.bayrakKodlari.map((k) => k.kod))
    assert.ok(kodlar.has('hemanjiyom-riskli-konum'))
    assert.equal(p.bayrakKodlari.find((k) => k.kod === 'hemanjiyom-riskli-konum')!.tn, 1)
  })
  it('rapor dürüst: klinik doğrulama olmadığını, sahte kaynağı ve kaçırılanları açıkça yazar', async () => {
    const set = olguSetiDogrula(ornek).set!
    const p = puanla(await olgulariKos(set, { sahte: true }))
    const r = raporMetni(p, set.ad, { sahte: true, surum: 'foto-ai-v1' })
    assert.ok(r.includes(RAPOR_UYARISI))
    assert.match(r, /KLİNİK DOĞRULAMA DEĞİLDİR/)
    assert.match(r, /SCRIPTED/)
    assert.match(r, /KAÇIRILAN KIRMIZI BAYRAKLAR/)
    assert.match(r, /sentetik-04-kacirilan-bayrak: enfeksiyon-selulit/)
    assert.match(raporMetni(p, 'x', { sahte: false, surum: 'v' }), /canlı model/)
  })
  it('canlı mod: görüntü yoksa / büyükse / JPEG-PNG değilse hata olarak raporlanır, model çağrılmaz', async () => {
    let cagri = 0
    const set = olguSetiDogrula({ surum: 1, olgular: [{ id: 'yok', mod: 'genel', gorsel: 'yok.jpg' }, { id: 'buyuk', mod: 'genel', gorsel: 'buyuk.jpg' }, { id: 'webp', mod: 'genel', gorsel: 'a.webp' }] }).set!
    const s = await olgulariKos(set, {
      gorselOku: (d) => (d === 'buyuk.jpg' ? Buffer.alloc(3_000_000) : d === 'a.webp' ? Buffer.from('RIFFxxxxWEBP') : null),
      cagir: () => async () => { cagri++; return { content: [] } },
    })
    assert.deepEqual(s.map((x) => x.durum), ['hata', 'hata', 'hata'])
    assert.match(s[0].hatalar![0], /bulunamadı/)
    assert.match(s[1].hatalar![0], /küçültün/)
    assert.match(s[2].hatalar![0], /JPEG veya PNG/)
    assert.equal(cagri, 0)
  })
  it('sahteCagirici yanıtı olmayan olguda geçersiz (boş) cevap üretir, uydurmaz', async () => {
    const m = await sahteCagirici({ ...olgu('x', {}), yanit: undefined })({} as never)
    assert.match(JSON.stringify(m.content), /\{\}/)
  })
})
