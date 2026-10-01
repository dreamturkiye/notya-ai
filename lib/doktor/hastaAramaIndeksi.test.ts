/**
 * NOTYA-ARAMA-INDEKS-01 -- blind token index dogrulamasi: ayni sonuc, hic kimseyi cozmeden.
 *   1) indeks round-trip (yaz -> hash olarak oku, ad asla duz metin olarak saklanmaz)
 *   2) guncelleme eskiyi siler (coklama yok)
 *   3) CAPRAZ-DOKTOR: A'nin token'i B'nin sorgusunda ASLA eslesmez
 *   4) hastaninSozunuCoz uctan uca: indeksli yol eski tam-tarama ile ayni hastayi bulur
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-arama-indeks-anahtari'

import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { encrypt } from '../security/encryption'
import { tokenOzeti, adIndeksParcalari, hastaAramaIndeksiniGuncelle, mesajAdaylariniBul } from './hastaAramaIndeksi'
import { hastaninSozunuCoz, sesliSozTokenlari, duzle } from './hastaCozumleyici'

describe('NOTYA-ARAMA-INDEKS-01 -- blind token index', () => {
  it('ozet tek yonlu ve deterministiktir; duz ad hic saklanmaz', () => {
    const parcalar = adIndeksParcalari('Mehmet Yilmaz')
    assert.deepEqual(parcalar.sort(), ['mehmet', 'yilmaz'])
    const h1 = tokenOzeti('mehmet')
    const h2 = tokenOzeti('mehmet')
    assert.equal(h1, h2)
    assert.notEqual(h1, 'mehmet')
    assert.equal(h1.length, 64) // sha256 hex
  })

  it('kaydet + guncelle -- eski token satirlari coklanmaz', async () => {
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doctorId = randomUUID()
    const patientId = randomUUID()
    await hastaAramaIndeksiniGuncelle(sb, doctorId, patientId, 'Mehmet Yilmaz')
    const once = db.tablo('patient_search_tokens').filter((r: any) => r.patient_id === patientId)
    assert.equal(once.length, 2) // mehmet, yilmaz
    await hastaAramaIndeksiniGuncelle(sb, doctorId, patientId, 'Ayse Demir')
    const twice = db.tablo('patient_search_tokens').filter((r: any) => r.patient_id === patientId)
    assert.equal(twice.length, 2) // eskisi silindi, yenisi yazildi -- coklanmadi
    const hashes = twice.map((r: any) => r.token_hash).sort()
    assert.deepEqual(hashes, [tokenOzeti('ayse'), tokenOzeti('demir')].sort())
  })

  it('CAPRAZ-DOKTOR: A doktorunun adaylarinda B doktorunun hastasi asla cikmaz', async () => {
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doktorA = randomUUID()
    const doktorB = randomUUID()
    const hastaA = randomUUID()
    const hastaB = randomUUID()
    await hastaAramaIndeksiniGuncelle(sb, doktorA, hastaA, 'Umutcan Turkoglu')
    await hastaAramaIndeksiniGuncelle(sb, doktorB, hastaB, 'Umutcan Yildiz')
    const tokenlar = sesliSozTokenlari(duzle('Umutcan nasil'))
    const adaylarA = await mesajAdaylariniBul(sb, doktorA, tokenlar)
    const adaylarB = await mesajAdaylariniBul(sb, doktorB, tokenlar)
    assert.ok(adaylarA && adaylarA.has(hastaA))
    assert.ok(adaylarA && !adaylarA.has(hastaB))
    assert.ok(adaylarB && adaylarB.has(hastaB))
    assert.ok(adaylarB && !adaylarB.has(hastaA))
  })

  it('hastaninSozunuCoz uctan uca: tek adaydan tek eslesme, indeksli yolla', async () => {
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doctorId = randomUUID()
    const p1 = db.ekle('patients', { doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad: 'Mehmet Yilmaz' })), is_active: true })
    db.ekle('patients', { doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad: 'Ayse Demir' })), is_active: true })
    await hastaAramaIndeksiniGuncelle(sb, doctorId, p1.id, 'Mehmet Yilmaz')
    await hastaAramaIndeksiniGuncelle(sb, doctorId, db.tablo('patients')[1].id, 'Ayse Demir')

    const sonuc = await hastaninSozunuCoz(sb, doctorId, 'Mehmet Yilmaz kac kere geldi')
    assert.equal(sonuc.tur, 'tek')
    assert.equal((sonuc as any).patientId, p1.id)
  })

  it('hastaninSozunuCoz: hicbir hasta adi gecmeyen mesaj -- kimse cozulmez, yok doner', async () => {
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doctorId = randomUUID()
    const p1 = db.ekle('patients', { doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad: 'Mehmet Yilmaz' })), is_active: true })
    await hastaAramaIndeksiniGuncelle(sb, doctorId, p1.id, 'Mehmet Yilmaz')

    const sonuc = await hastaninSozunuCoz(sb, doctorId, 'bugun hava nasil acaba')
    assert.equal(sonuc.tur, 'yok')
  })
})
