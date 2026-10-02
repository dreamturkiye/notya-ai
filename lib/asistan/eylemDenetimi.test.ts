/**
 * NOTYA-AYSE-GERI-08 — the action-audit HARNESS, proved with a stand-in for OpenRouter (no network, no model).
 * It shows that both channels reach the wire, that a forced tool, the offered tool count, the tool the "model"
 * called and the card the server made of it are all recorded, and that the unforced pass really sends no
 * tool_choice. What Luna does with those requests is measured by eylemDenetimi.kos.ts, not here.
 */
import { gercekModelAc, sahneHazirla } from './tests/ayseSahne'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { EYLEM_CUMLELERI, denetimRaporu, dogruMu, eylemDenetiminiKos, ozetle, vekilOpenRouter, type DenetimSatiri } from './tests/eylemDenetimi'
import { aracZorlamaKapali } from './ayseCevapla'

before(async () => {
  await sahneHazirla()
  assert.equal(gercekModelAc(vekilOpenRouter), true)
})
after(() => { delete process.env.OPENROUTER_API_KEY })

const sec = (...no: number[]) => EYLEM_CUMLELERI.filter((c) => no.includes(c.no))

describe('eylem denetimi — cümle seti', () => {
  it('otuz civarı cümle; her eylem ailesi ve iki "komut değil" kontrolü var; numaralar tekil', () => {
    assert.ok(EYLEM_CUMLELERI.length >= 30 && EYLEM_CUMLELERI.length <= 36, String(EYLEM_CUMLELERI.length))
    assert.equal(new Set(EYLEM_CUMLELERI.map((c) => c.no)).size, EYLEM_CUMLELERI.length)
    const araclar = new Set(EYLEM_CUMLELERI.map((c) => c.beklenen).filter(Boolean))
    for (const a of ['alerji_ekle', 'alerji_kaldir', 'kronik_hastalik_ekle', 'olcum_ekle', 'bas_cevresi_ekle', 'ilac_ekle', 'ilac_sonlandir', 'ilac_doz_degistir', 'dosya_notu_ekle', 'asi_kaydi_ekle', 'hasta_bilgisi_duzelt', 'kontrol_randevusu_olustur', 'randevu_tasi', 'randevu_iptal']) assert.ok(araclar.has(a), a)
    assert.ok(EYLEM_CUMLELERI.filter((c) => !c.beklenen).length >= 3)
    for (const h of ['acik', 'adla', 'yok'] as const) assert.ok(EYLEM_CUMLELERI.some((c) => c.hasta === h), h)
  })
  it('doğruluk: beklenen araç çağrıldıysa; araç beklenmiyorsa hiç çağrılmadıysa; hata her zaman yanlış', () => {
    assert.equal(dogruMu('alerji_ekle', ['alerji_ekle'], ''), true)
    assert.equal(dogruMu('alerji_ekle', ['dosya_notu_ekle'], ''), false)
    assert.equal(dogruMu('alerji_ekle', [], ''), false)
    assert.equal(dogruMu(null, [], ''), true)
    assert.equal(dogruMu(null, ['alerji_ekle'], ''), false)
    assert.equal(dogruMu('alerji_ekle', ['alerji_ekle'], 'luna_fail:transport:http_502'), false)
  })
})

describe('eylem denetimi — koşum (vekil model)', () => {
  let satirlar: DenetimSatiri[] = []
  before(async () => { satirlar = await eylemDenetiminiKos({ cumleler: sec(1, 12, 26, 29, 32) }) })
  const bul = (no: number, kanal: 'yazi' | 'ses', mod: 'uretim' | 'zorlamasiz') => satirlar.find((s) => s.no === no && s.kanal === kanal && s.mod === mod)!

  it('her cümle iki kanalda ve iki geçişte koşar; koşumdan sonra denetim anahtarları temizdir', () => {
    assert.equal(satirlar.length, 5 * 2 * 2)
    assert.equal(aracZorlamaKapali(), false)
    assert.notEqual(process.env.NOTYA_KORUYUCU_KAPALI, '1')
  })
  it('üretim geçişi: komut aracını zorlar; çağrı telden okunur; sunucu kartı hazırlar — yazıda da seste de', () => {
    for (const kanal of ['yazi', 'ses'] as const) {
      const s = bul(1, kanal, 'uretim')
      assert.equal(s.rota, 'model', kanal)
      assert.equal(s.zorlanan, 'alerji_ekle', kanal)
      assert.equal(s.sunulanArac, 1, 'zorlanan araç tek başına sunulur')
      assert.deepEqual(s.cagrilan, ['alerji_ekle'], `${kanal}: akışta parçalı gelen ad birleşir`)
      assert.equal(s.kartlar[0]?.eylem, 'alerji_ekle')
      assert.ok(s.kartlar[0].eksik >= 1, 'vekil boş argüman verdi — zorunlu alan eksik')
      assert.equal(s.dogru, true)
    }
  })
  it('zorlamasız geçiş: tool_choice gitmez, araç listesi bütündür; vekil araç çağırmadığı için cümle yanlış sayılır', () => {
    for (const kanal of ['yazi', 'ses'] as const) {
      const s = bul(12, kanal, 'zorlamasiz')
      assert.equal(s.zorlanan, null, kanal)
      assert.ok(s.sunulanArac > 5, `${kanal}: ${s.sunulanArac}`)
      assert.deepEqual(s.cagrilan, [])
      assert.equal(s.dogru, false)
      assert.equal(bul(12, kanal, 'uretim').zorlanan, 'ilac_sonlandir')
    }
  })
  it('ilaç adı boş gelen kart "undefined" demez — yalnız eksik alan sorulur (denetimin bulduğu hata)', () => {
    for (const kanal of ['yazi', 'ses'] as const) {
      const s = bul(12, kanal, 'uretim')
      assert.equal(s.kartlar[0]?.eylem, 'ilac_sonlandir')
      assert.ok(!/undefined/.test(s.cevap), s.cevap)
      assert.match(s.cevap, /İlaç boş/)
    }
  })
  it('adı cümlede geçen hasta: dosya açık değilken de araç o hastaya zorlanır', () => {
    const s = bul(26, 'ses', 'uretim')
    assert.equal(s.zorlanan, 'alerji_ekle')
    assert.equal(s.kartlar.length, 1)
  })
  it('araç beklenmeyen cümleler: hastasız komut zorlanmaz, soru komut değildir — ikisi de doğru sayılır', () => {
    const hastasiz = bul(29, 'yazi', 'uretim')
    assert.equal(hastasiz.zorlanan, null)
    assert.ok(hastasiz.sunulanArac > 0, 'araçlar hasta_adi alanıyla sunulur')
    assert.equal(hastasiz.dogru, true)
    const soru = bul(32, 'ses', 'uretim')
    assert.deepEqual(soru.cagrilan, [])
    assert.equal(soru.dogru, true)
  })
  it('özet ve rapor: oran bütün eylem cümleleri üzerinden; kuru koşum raporda açıkça yazar', () => {
    const o = ozetle(satirlar)
    assert.equal(o.length, 4)
    const u = o.find((x) => x.mod === 'uretim' && x.kanal === 'ses')!
    assert.deepEqual([u.eylem, u.aracCagiran, u.dogruArac, u.eylemsiz, u.yanlisCagri, u.hata], [3, 3, 3, 2, 0, 0])
    const z = o.find((x) => x.mod === 'zorlamasiz' && x.kanal === 'yazi')!
    assert.deepEqual([z.eylem, z.aracCagiran], [3, 0])
    const rapor = denetimRaporu({ tarih: '2026-10-01', model: 'vekil', satirlar, kuru: true })
    assert.match(rapor, /DRY RUN/)
    assert.match(rapor, /3 \/ 3 \(100 %\)/)
    assert.match(rapor, /0 \/ 3 \(0 %\)/)
    assert.ok(!/undefined|NaN/.test(rapor))
  })
})
