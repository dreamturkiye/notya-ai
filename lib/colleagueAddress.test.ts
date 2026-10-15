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
