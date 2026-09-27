import { test } from 'node:test'
import assert from 'node:assert/strict'
import { meslektasSelamSatiri, ogrenmeSelamSatiri, tarzCipiMetni } from './selam'
import { doktorKurallariBlogu, soapSistemBloklari, uygulananKurallariSuz } from '@/lib/doktor/soapUret'

test('öğrenme selamı yalnız alışma+ ve kural varken', () => {
  assert.equal(ogrenmeSelamSatiri({ asama: 'tanisma', yeniKurallar: [{ deger: 'Kısa yaz' }] }), null)
  assert.equal(ogrenmeSelamSatiri({ asama: 'alisma', yeniKurallar: [] }), null)
  assert.match(ogrenmeSelamSatiri({ asama: 'alisma', yeniKurallar: [{ deger: 'Kısa yaz' }, { deger: 'Lüzumlu halde' }] }) || '', /Dünkü düzeltmelerinizden öğrendim: Kısa yaz; Lüzumlu halde/)
})

test('10. seans satırı yalnız gerçek kural + ilk kez', () => {
  assert.equal(meslektasSelamSatiri({ seans: 9, dahaOnceGosterildi: false, kuralSayisi: 3 }), null)
  assert.equal(meslektasSelamSatiri({ seans: 10, dahaOnceGosterildi: true, kuralSayisi: 3 }), null)
  assert.equal(meslektasSelamSatiri({ seans: 10, dahaOnceGosterildi: false, kuralSayisi: 0 }), null)
  const s = meslektasSelamSatiri({ seans: 10, dahaOnceGosterildi: false, kuralSayisi: 4, rutinBaslangic: '09:00' })
  assert.match(s || '', /10\. seansımız Hocam — artık notlarınızı 4 kuralınızla yazıyorum; sabahları genelde 09:00 ile başlıyorsunuz/)
})

test('chip metni', () => {
  assert.equal(tarzCipiMetni(3), 'Sizin tarzınızla yazıldı · 3 kural')
})

test('soap değişken blokta DOKTORUN KURALLARI ve uygulananKurallar süzülür', () => {
  const kurallar = [{ slug: 'terim-gerektiginde-luzumlu', satir: '"gerektiğinde" yerine "Lüzumlu halde" yaz' }]
  const blok = doktorKurallariBlogu(kurallar)
  assert.match(blok, /DOKTORUN KURALLARI/)
  assert.match(blok, /terim-gerektiginde-luzumlu/)
  const sistem = soapSistemBloklari({
    transcript: 'öksürük',
    specialty: 'pediatri',
    doktorKurallari: kurallar,
  })
  assert.equal(sistem[0].onbellek, true)
  assert.ok(sistem.some((b) => !b.onbellek && /DOKTORUN KURALLARI/.test(b.metin)))
  assert.deepEqual(uygulananKurallariSuz(['terim-gerektiginde-luzumlu', 'uydurma'], kurallar), ['terim-gerektiginde-luzumlu'])
  assert.deepEqual(uygulananKurallariSuz(['x'], []), [])
})
