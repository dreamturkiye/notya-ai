import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cumlelereBol, duzeltmeAnaliz, piiTemizle, type DuzeltmeDelta } from './duzeltmeAnaliz'
import { deltalardanAdaylar, kuraliBirlesitir, kuralDurumHesapla } from './kuralTuret'

function turler(d: DuzeltmeDelta[]): DuzeltmeDelta['tur'][] {
  return d.map((x) => x.tur)
}

test('piiTemizle strips TC and two-word names', () => {
  assert.equal(piiTemizle('Ali Yılmaz 12345678901 geldi'), '[AD] [TC] geldi')
})

test('1 terim: gerektiğinde → Lüzumlu halde', () => {
  const d = duzeltmeAnaliz(
    { plan: '1) Amoksisilin 7 gün. Ateş olursa gerektiğinde parasetamol.' },
    { plan: '1) Amoksisilin 7 gün. Ateş olursa Lüzumlu halde parasetamol.' },
  )
  assert.ok(turler(d).includes('terim'))
  const t = d.find((x) => x.tur === 'terim')
  assert.ok(t)
  assert.match(t.terimOnceki || t.onceki, /gerektiğinde/i)
  assert.match(t.terimSonraki || t.sonraki, /lüzumlu/i)
})

test('2 silme: boilerplate alarm cümlesi çıkarılmış', () => {
  const d = duzeltmeAnaliz(
    { alarmBulgulari: 'Bol sıvı.\nAcil bir durumda acil servise başvurun.' },
    { alarmBulgulari: 'Bol sıvı.' },
  )
  assert.ok(d.some((x) => x.tur === 'silme' && /acil servise/i.test(x.onceki)))
})

test('3 ekleme: evde dikkat satırı', () => {
  const d = duzeltmeAnaliz(
    { alarmBulgulari: 'Ateşi izleyin.' },
    { alarmBulgulari: 'Ateşi izleyin.\nEvde bol sıvı verin.' },
  )
  assert.ok(d.some((x) => x.tur === 'ekleme' && /bol sıvı/i.test(x.sonraki)))
})

test('4 sıra: anamnez bölümleri yer değiştirmiş', () => {
  const d = duzeltmeAnaliz(
    { subjektif: 'Şikayet: öksürük\nÖzgeçmiş: yok\nSoygeçmiş: yok' },
    { subjektif: 'Özgeçmiş: yok\nSoygeçmiş: yok\nŞikayet: öksürük' },
  )
  assert.ok(d.some((x) => x.tur === 'sira'))
})

test('5 ilaç değişimi: Amoksisilin → Augmentin', () => {
  const d = duzeltmeAnaliz(
    { ilaclar: JSON.stringify([{ ad: 'Amoksisilin', doz: '400 mg' }]) },
    { ilaclar: JSON.stringify([{ ad: 'Augmentin', doz: '400 mg' }]) },
  )
  const i = d.find((x) => x.tur === 'ilac_degisimi')
  assert.ok(i)
  assert.match(i.ilacOnceki || '', /Amoksisilin/i)
  assert.match(i.ilacSonraki || '', /Augmentin/i)
})

test('6 doz DEĞERİ kural olmaz', () => {
  const d = duzeltmeAnaliz(
    { plan: 'Amoksisilin 400 mg 2x1.' },
    { plan: 'Amoksisilin 250 mg 2x1.' },
  )
  assert.ok(d.some((x) => x.tur === 'doz_degeri'))
  const aday = deltalardanAdaylar(d, 'n1')
  assert.equal(aday.filter((a) => a.tur === 'doz_degeri').length, 0)
  assert.equal(kuralDurumHesapla(5, 'doz_degeri'), 'atlanir')
})

test('7 silme: değerlendirilmedi kalıbı', () => {
  const d = duzeltmeAnaliz(
    { objektif: 'Genel durum: iyi.\nNörolojik sistem değerlendirilmedi.' },
    { objektif: 'Genel durum: iyi.' },
  )
  assert.ok(d.some((x) => x.tur === 'silme' && /değerlendirilmedi/i.test(x.onceki)))
})

test('8 yeniden yazma: subjektif kısaltılmış', () => {
  const d = duzeltmeAnaliz(
    { subjektif: 'Şikayet: Üç gündür öksürük ve burun akıntısı ile başvurdu, gece artıyor.' },
    { subjektif: 'Şikayet: 3 gündür öksürük, gece artıyor.' },
  )
  assert.ok(d.some((x) => x.tur === 'yeniden_yazma' || x.tur === 'uzunluk'))
})

test('9 uzunluk: plan yarıya inmiş', () => {
  const uzun = '1) Antibiyotik 7 gün verilecek ve kontrol planlanacak ayrıca evde izlem anlatılacak.\n2) Ateş düşürücü lüzum halinde.'
  const d = duzeltmeAnaliz({ plan: uzun }, { plan: '1) Antibiyotik 7 gün.' })
  assert.ok(d.some((x) => x.tur === 'uzunluk' && (x.oran || 1) < 0.7))
})

test('10 terim: kontrol → denetim', () => {
  const d = duzeltmeAnaliz(
    { plan: '1 hafta sonra kontrol.' },
    { plan: '1 hafta sonra denetim.' },
  )
  assert.ok(d.some((x) => x.tur === 'terim' && /kontrol/i.test(x.terimOnceki || x.onceki)))
})

test('11 ekleme: ikinci evde dikkat satırı', () => {
  const d = duzeltmeAnaliz(
    { alarmBulgulari: 'Ateş olursa arayın.' },
    { alarmBulgulari: 'Ateş olursa arayın.\nEvde dikkat: solunum sıkışırsa gelin.' },
  )
  assert.ok(d.some((x) => x.tur === 'ekleme' && /solunum/i.test(x.sonraki)))
})

test('12 doz BİÇİMİ (değer değil): mg/kg → günlük toplam', () => {
  const d = duzeltmeAnaliz(
    { plan: 'Amoksisilin 10 mg/kg/gün 2 dozda.' },
    { plan: 'Amoksisilin günlük toplam 200 mg, 2 dozda.' },
  )
  assert.ok(d.some((x) => x.tur === 'doz_bicimi'), JSON.stringify(d))
  const aday = deltalardanAdaylar(d, 'n2')
  assert.ok(aday.some((a) => a.tur === 'doz_bicimi'))
})

test('hasta adı örnekte kalmaz', () => {
  const d = duzeltmeAnaliz(
    { plan: 'Kontrol.' },
    { plan: 'Mehmet Demir için evde bol sıvı.' },
  )
  const ek = d.find((x) => x.tur === 'ekleme' || x.tur === 'yeniden_yazma')
  assert.ok(ek)
  assert.doesNotMatch(ek.sonraki, /Mehmet/)
})

test('kuralTuret: 1 not ADAY, 2 not UYGULANIR; ilaç 3 ister', () => {
  const terim = deltalardanAdaylar(duzeltmeAnaliz(
    { plan: 'gerektiğinde parasetamol' },
    { plan: 'Lüzumlu halde parasetamol' },
  ), 'n-a')
  assert.ok(terim.length >= 1)
  const a1 = kuraliBirlesitir(null, terim[0])
  assert.equal(a1?.durum, 'aday')
  const a2 = kuraliBirlesitir(a1, { ...terim[0], noteId: 'n-b' })
  assert.equal(a2?.durum, 'uygulanir')
  const aAyni = kuraliBirlesitir(a2, { ...terim[0], noteId: 'n-b' })
  assert.equal(aAyni?.kanit_sayisi, a2?.kanit_sayisi)

  const ilac = deltalardanAdaylar(duzeltmeAnaliz(
    { ilaclar: JSON.stringify([{ ad: 'Amoksisilin' }]) },
    { ilaclar: JSON.stringify([{ ad: 'Augmentin' }]) },
  ), 'i1').find((a) => a.tur === 'ilac_degisimi')
  assert.ok(ilac)
  let sat = kuraliBirlesitir(null, { ...ilac, noteId: 'i1' })
  sat = kuraliBirlesitir(sat, { ...ilac, noteId: 'i2' })
  assert.equal(sat?.durum, 'aday')
  sat = kuraliBirlesitir(sat, { ...ilac, noteId: 'i3' })
  assert.equal(sat?.durum, 'uygulanir')
})

test('kapalı kural bir daha uygulanmaz', () => {
  const aday = deltalardanAdaylar(duzeltmeAnaliz(
    { plan: 'gerektiğinde' },
    { plan: 'Lüzumlu halde' },
  ), 'z1')[0]
  const kapali = kuraliBirlesitir({
    anahtar: aday.anahtarSlug, kategori: 'uslup', deger: aday.deger, kaynak: 'duzeltme',
    kanit_sayisi: 4, durum: 'kapali', ornekler: [], kanit_not_idler: [], aktif: true,
  }, { ...aday, noteId: 'z2' })
  assert.equal(kapali?.durum, 'kapali')
})

test('cumlelereBol satır ve nokta ayırır', () => {
  assert.equal(cumlelereBol('A.\nB cümle.').length, 2)
})
