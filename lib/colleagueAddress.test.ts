import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { turkceYonelmeHali } from './colleagueAddress'

describe('turkceYonelmeHali — Türkçe yönelme hali (-e/-a)', () => {
  it('30 persona adının (specialistsCatalog.ts) tamamında doğru eki üretir', () => {
    const beklenen: Record<string, string> = {
      Ayşe: "Ayşe'ye",
      Mehmet: "Mehmet'e",
      Elif: "Elif'e",
      Zeynep: "Zeynep'e",
      Deniz: "Deniz'e",
      Hakan: "Hakan'a",
      Burak: "Burak'a",
      // NOTYA-ILK10-ASI / BUG A: dermatoloji'nin kendi uzmanı — "Ayşe'ye Danış" yerine bu görünmeli.
      Selin: "Selin'e",
      Emre: "Emre'ye",
      İrem: "İrem'e",
      Fatma: "Fatma'ya",
      Murat: "Murat'a",
      Caner: "Caner'e",
      Pınar: "Pınar'a",
      Oğuz: "Oğuz'a",
      Aylin: "Aylin'e",
      Serkan: "Serkan'a",
      Gülşah: "Gülşah'a",
      Volkan: "Volkan'a",
      Mert: "Mert'e",
      Nazlı: "Nazlı'ya",
      Ece: "Ece'ye",
      Barış: "Barış'a",
      Tolga: "Tolga'ya",
      Melis: "Melis'e",
      Kerem: "Kerem'e",
      Sinan: "Sinan'a",
      Derya: "Derya'ya",
      Yusuf: "Yusuf'a",
      Cemre: "Cemre'ye",
    }
    for (const [ad, sonuc] of Object.entries(beklenen)) {
      assert.equal(turkceYonelmeHali(ad), sonuc, `${ad} → ${sonuc} bekleniyordu`)
    }
  })

  it('boş adda boş döner, çöker', () => {
    assert.equal(turkceYonelmeHali(''), '')
    assert.equal(turkceYonelmeHali('   '), '')
  })
})

describe('turkceYonelmeHali — Uzbek Doktor adları (release/uz, countries/uz/klinik/asistanAdlari.ts), mangle/çökme yok', () => {
  it('30 UZ Doktor kısa adının (kisaAd) tamamında çökmeden sağlıklı bir ek üretir (TR\'ye özgü bir varsayım değil)', () => {
    const beklenen: Record<string, string> = {
      Jasur: "Jasur'a",
      Nilufar: "Nilufar'a",
      Bekzod: "Bekzod'a",
      Alisher: "Alisher'e",
      Sardor: "Sardor'a",
      Madina: "Madina'ya",
      Sevara: "Sevara'ya",
      Dilnoza: "Dilnoza'ya",
      Otabek: "Otabek'e",
      Jamshid: "Jamshid'e",
      Sherzod: "Sherzod'a",
      Farrux: "Farrux'a",
      Gulnoza: "Gulnoza'ya",
      Aziza: "Aziza'ya",
      Shahnoza: "Shahnoza'ya",
      Temur: "Temur'a",
      Kamola: "Kamola'ya",
      Nodir: "Nodir'e",
      Mohira: "Mohira'ya",
      Bobur: "Bobur'a",
      Nigora: "Nigora'ya",
      Ulugbek: "Ulugbek'e",
      Malika: "Malika'ya",
      Barno: "Barno'ya",
      Zulfiya: "Zulfiya'ya",
      Akmal: "Akmal'a",
      Saodat: "Saodat'a",
      Javohir: "Javohir'e",
      Sanjar: "Sanjar'a",
      Laziz: "Laziz'e",
    }
    assert.equal(Object.keys(beklenen).length, 30)
    for (const [ad, sonuc] of Object.entries(beklenen)) {
      assert.equal(turkceYonelmeHali(ad), sonuc, `${ad} → ${sonuc} bekleniyordu`)
      assert.doesNotMatch(turkceYonelmeHali(ad), /undefined|NaN/, `${ad}: bozuk/anlamsız sonuç`)
    }
  })
})
