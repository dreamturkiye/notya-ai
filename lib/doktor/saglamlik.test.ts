/**
 * NOTYA-AYSE-GERI-07 (audit §7, PR 12) — the two places where a model answer is parsed as JSON and a cut or
 * wrapped answer used to be lost: the in-note consult envelope and the memory extraction. Pure; the advisory cap
 * is in soapUret.test.ts, the gate itself in lib/ai/kapilar.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NOT_KONSULT_YARIM_CEVAP, notKonsultZarfi } from './notKonsultPromptu'
import { OGRENME_TOKEN_TAVANI, ogrenilenKayitlar } from './hafiza'

import { jsonCikar } from '../ai/jsonOnar'

const kaynak = (yol: string) => readFileSync(join(process.cwd(), yol), 'utf8')

// PR 13 — the tool pages (dose, SGK report, epikriz, e-reçete, vaccine card, lab, consult).
describe('araç sayfaları: sarılı JSON okunur, kesik JSON tamamlanmaz', () => {
  const DOZ = { doz: '560 mg', kullanim: '2x1', aciklama: '40 mg/kg/gün, 14 kg.' }

  it('düz, çitli ve cümleye sarılı JSON aynı nesneyi verir', () => {
    const g = JSON.stringify(DOZ)
    for (const ham of [g, '```json\n' + g + '\n```', '```\n' + g + '\n```', `Öneri şöyle:\n${g}\nHekim onayı gerekir.`]) assert.deepEqual(jsonCikar(ham), DOZ, ham)
  })
  it('kesik doz TAMAMLANMAZ — "560 mg" yarıda kalınca "56" diye okunmaz', () => {
    const g = JSON.stringify(DOZ)
    for (const kesik of [g.slice(0, g.indexOf('0 mg')), g.slice(0, g.indexOf('2x1') + 1), g.slice(0, -1)]) assert.equal(jsonCikar(kesik), null, kesik)
  })
  it('nesne olmayan ya da JSON olmayan cevap null', () => {
    for (const ham of ['', 'Doz önerilemedi.', '[1,2]', '"560 mg"', 'null']) assert.equal(jsonCikar(ham), null, ham)
  })
  it('rotalar: katı ayrıştırma kalmadı, model çağrısı rota süresine göre bütçeli', () => {
    const butceli = [
      'app/api/doktor/asilar/karne/route.ts', 'app/api/doktor/belgeler/lab/route.ts', 'app/api/doktor/konsultasyon/route.ts',
      'app/api/doktor/araclar/erecete/route.ts', 'app/api/doktor/araclar/sgk-rapor/route.ts', 'app/api/doktor/araclar/epikriz/route.ts',
      'app/api/doktor/ilaclar/doz-oner/route.ts',
    ]
    for (const yol of butceli) {
      const k = kaynak(yol)
      assert.match(k, /rotaButcesiMs\(maxDuration\)/, yol)
      assert.match(k, /export const maxDuration = \d+/, yol)
    }
    for (const yol of ['app/api/doktor/araclar/sgk-rapor/route.ts', 'app/api/doktor/araclar/epikriz/route.ts', 'app/api/doktor/ilaclar/doz-oner/route.ts']) {
      const k = kaynak(yol)
      assert.match(k, /jsonCikar\(/, yol)
      assert.ok(!/JSON\.parse\((temiz|cleaned|text\.replace)/.test(k), `${yol}: model çıktısında katı JSON.parse`)
    }
  })
  it('aşı karnesi: kesilme dalı gerçek alanı okur (stop_reason)', () => {
    const k = kaynak('app/api/doktor/asilar/karne/route.ts')
    assert.match(k, /stop_reason === 'max_tokens'/)
    assert.ok(!/stopReason/.test(k.replace(/read `stopReason`/, '')), 'eski alan adı kalmadı')
  })
})

describe('not içi danışma zarfı', () => {
  const TAM = { cevap: 'Planı kısalttım Hocam.', duzenlemeler: { plan: 'Parasetamol; 3 gün sonra kontrol.' }, eylemler: [{ tur: 'kontrol_randevu', tarih: '2026-10-05' }] }

  it('tam JSON, çitli JSON ve düzyazıya gömülü JSON aynen alınır', () => {
    for (const ham of [JSON.stringify(TAM), '```json\n' + JSON.stringify(TAM) + '\n```', `Tabii Hocam.\n${JSON.stringify(TAM)}\nBaşka bir şey var mı?`]) {
      assert.deepEqual(notKonsultZarfi(ham), TAM)
    }
  })
  it('kesik zarf: cevap kurtarılır, yarım SOAP alanı ve yarım eylem taslağa YAZILMAZ', () => {
    const kesik = JSON.stringify(TAM).slice(0, JSON.stringify(TAM).indexOf('3 gün'))
    const z = notKonsultZarfi(kesik)
    assert.equal(z.cevap, TAM.cevap)
    assert.equal(z.duzenlemeler, undefined)
    assert.equal(z.eylemler, undefined)
  })
  it('düzyazı cevap olduğu gibi döner; cevabı olmayan bozuk JSON "ekrana işledim" demez', () => {
    assert.deepEqual(notKonsultZarfi('Prognoz iyi Hocam.'), { cevap: 'Prognoz iyi Hocam.' })
    assert.deepEqual(notKonsultZarfi('{"duzenlemeler":{"plan":"Paraset'), { cevap: NOT_KONSULT_YARIM_CEVAP })
    assert.deepEqual(notKonsultZarfi(''), { cevap: '' })
    assert.deepEqual(notKonsultZarfi('[1,2]'), { cevap: '[1,2]' })
  })
  it('rota JSON bayrağını verir (zorlanan araç turu hariç) ve zarfı bu ayrıştırıcıyla okur', () => {
    const rota = kaynak('app/api/doktor/not-konsult/route.ts')
    assert.match(rota, /jsonBekleniyor: !toolChoice/)
    assert.match(rota, /const sonuc = notKonsultZarfi\(ham\)/)
    assert.ok(!/JSON\.parse\(temiz\)/.test(rota), 'katı ayrıştırma kalmadı')
  })
})

describe('hafıza çıkarımı', () => {
  const KAYIT = { kategori: 'rutin', anahtar: 'ogle-arasi', deger: 'Öğle 12:30-13:30 arası hasta almaz', unut: false }

  it('tam, çitli ve düzyazıya sarılı cevap aynı kayıtları verir', () => {
    const govde = JSON.stringify({ kayitlar: [KAYIT] })
    for (const ham of [govde, '```json\n' + govde + '\n```', `İşte kayıtlar:\n${govde}`]) assert.deepEqual(ogrenilenKayitlar(ham), [KAYIT])
  })
  it('liste ortasında kesilen cevap: tamamlanan kayıtlar kalır (eskiden hepsi atılırdı)', () => {
    const govde = JSON.stringify({ kayitlar: [KAYIT, { kategori: 'iletisim', anahtar: 'hitap-sekli', deger: 'Kendisine adıyla hitap edilmesini ister' }] })
    const kesik = govde.slice(0, govde.indexOf('hitap-sekli') + 4)
    assert.deepEqual(ogrenilenKayitlar(kesik), [KAYIT], 'yarım kalan ikinci kayıt alınmaz')
    // cut inside a value: the half sentence is not saved as a preference
    const yarimDeger = govde.slice(0, govde.indexOf('adıyla hitap') + 6)
    assert.deepEqual(ogrenilenKayitlar(yarimDeger), [KAYIT])
  })
  it('boş liste, JSON olmayan metin ve boş cevap kayıt üretmez', () => {
    for (const ham of ['{"kayitlar":[]}', 'Çıkarılacak bir şey yok.', '', '{"kayitlar":"yok"}', '{"kayitlar":[null,"x"]}']) assert.deepEqual(ogrenilenKayitlar(ham), [], ham)
  })
  it('çağrı effort none ile gitmez, JSON bayrağı taşır, tavan akıl yürütmeye yer bırakır', () => {
    const k = kaynak('lib/doktor/hafiza.ts')
    const cagri = k.slice(k.indexOf("gorev: 'cikarim'"), k.indexOf("gorev: 'cikarim'") + 200)
    assert.match(cagri, /caba: 'low'/)
    assert.match(cagri, /jsonBekleniyor: true/)
    assert.match(cagri, /maxTokens: OGRENME_TOKEN_TAVANI/)
    assert.ok(OGRENME_TOKEN_TAVANI >= 1000)
  })
})
