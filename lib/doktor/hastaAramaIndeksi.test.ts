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
import { tokenOzeti, adIndeksParcalari, hastaAramaIndeksiniGuncelle, mesajAdaylariniBul, indekssizHastalar, indeksOnbelleginiTemizle, adParcasiMi } from './hastaAramaIndeksi'
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

  it('hastaninSozunuCoz: eklenti sonek -- indeksli yolda da coziliyor (NOTYA-ARAMA-INDEKS-SUFFIX-01)', async () => {
    // Dr. Gokhan'in gercek vakasi: hasta 'Ayse Yesil', doktor sadece soyadini sonek yapisik soyluyor/yaziyor
    // ("yesilin dosyasini getir") -- NOTYA-SUFFIX-TOLERANS-01 ic karsilastirmayi duzeltmisti, ama bu indeks
    // (NOTYA-ARAMA-INDEKS-01) adayi hic getirmedigi icin o duzeltme devreye asla girmiyordu.
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doctorId = randomUUID()
    const p1 = db.ekle('patients', { doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad: 'Ayse Yesil' })), is_active: true })
    db.ekle('patients', { doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad: 'Umutcan Turkoglu' })), is_active: true })
    await hastaAramaIndeksiniGuncelle(sb, doctorId, p1.id, 'Ayse Yesil')
    await hastaAramaIndeksiniGuncelle(sb, doctorId, db.tablo('patients')[1].id, 'Umutcan Turkoglu')

    const soneklerVar = ['yesilin dosyasini getir', 'Turkoglunun asilari', 'Umutcanin dosyasi']
    for (const mesaj of soneklerVar) {
      const tokenlar = sesliSozTokenlari(duzle(mesaj))
      const adaylar = await mesajAdaylariniBul(sb, doctorId, tokenlar)
      assert.ok(adaylar && adaylar.size > 0, `onek icin aday bulunamadi: ${mesaj}`)
    }

    const sonuc = await hastaninSozunuCoz(sb, doctorId, 'yesilin dosyasini getir')
    assert.equal(sonuc.tur, 'tek')
    assert.equal((sonuc as any).patientId, p1.id)
  })
})

// NOTYA-AYSE-GERI-07 (audit §4.3, PR 10): the index cannot say "no" for a patient it has no row for.
describe('NOTYA-AYSE-GERI-07 -- indeks satiri olmayan hasta', () => {
  const hasta = (db: SahteVeritabani, doctorId: string, ad: string, aktif = true) =>
    db.ekle('patients', { doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad })), is_active: aktif }).id as string

  it('hic indeks satiri olmayan hekimin hastasi adla bulunur', async () => {
    indeksOnbelleginiTemizle()
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doctorId = randomUUID()
    const id = hasta(db, doctorId, 'Zeynep Arslan')
    hasta(db, doctorId, 'Mehmet Yilmaz')
    assert.deepEqual((await indekssizHastalar(sb, doctorId))?.length, 2)
    const sonuc = await hastaninSozunuCoz(sb, doctorId, 'Zeynep Arslanin dosyasini ac')
    assert.equal(sonuc.tur, 'tek')
    assert.equal((sonuc as any).patientId, id)
  })

  it('indeksli adasin yaninda indekssiz adas da aday olur -- tek hastaya sessizce cozulmez', async () => {
    indeksOnbelleginiTemizle()
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doctorId = randomUUID()
    const indeksli = hasta(db, doctorId, 'Umutcan Yildiz')
    const indekssiz = hasta(db, doctorId, 'Umutcan Turkoglu')
    await hastaAramaIndeksiniGuncelle(sb, doctorId, indeksli, 'Umutcan Yildiz')
    assert.deepEqual(await indekssizHastalar(sb, doctorId), [indekssiz])
    const sonuc = await hastaninSozunuCoz(sb, doctorId, 'Umutcanin dosyasini ac')
    assert.equal(sonuc.tur, 'coklu', 'iki Umutcan: hekime sorulur')
    const tam = await hastaninSozunuCoz(sb, doctorId, 'Umutcan Turkoglunun dosyasini ac')
    assert.equal(tam.tur, 'tek')
    assert.equal((tam as any).patientId, indekssiz)
  })

  it('CAPRAZ-DOKTOR: baska hekimin indekssiz hastasi aday olmaz', async () => {
    indeksOnbelleginiTemizle()
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doktorA = randomUUID()
    const doktorB = randomUUID()
    hasta(db, doktorB, 'Zeynep Arslan')
    const benim = hasta(db, doktorA, 'Mehmet Yilmaz')
    assert.deepEqual(await indekssizHastalar(sb, doktorA), [benim])
    const sonuc = await hastaninSozunuCoz(sb, doktorA, 'Zeynep Arslanin dosyasini ac', { yalnizAd: true })
    assert.equal(sonuc.tur, 'yok')
  })

  it('pasif hasta ve tam indeks: ek aday yok; tam indeks bir dakika hatirlanir', async () => {
    indeksOnbelleginiTemizle()
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doctorId = randomUUID()
    const id = hasta(db, doctorId, 'Mehmet Yilmaz')
    hasta(db, doctorId, 'Eski Hasta', false)
    await hastaAramaIndeksiniGuncelle(sb, doctorId, id, 'Mehmet Yilmaz')
    assert.deepEqual(await indekssizHastalar(sb, doctorId), [])
    // remembered: a patient added behind the index's back is not seen until the minute passes…
    hasta(db, doctorId, 'Zeynep Arslan')
    assert.deepEqual(await indekssizHastalar(sb, doctorId), [])
    // …and is seen once it has
    indeksOnbelleginiTemizle()
    assert.equal((await indekssizHastalar(sb, doctorId))?.length, 1)
  })

  it('adParcasiMi: indeks eksikken "hayir" demez (null), tamken der', async () => {
    indeksOnbelleginiTemizle()
    const db = new SahteVeritabani()
    const sb = db.istemci() as any
    const doctorId = randomUUID()
    const id = hasta(db, doctorId, 'Mehmet Yilmaz')
    assert.equal(await adParcasiMi(sb, doctorId, 'Mehmet'), null)
    await hastaAramaIndeksiniGuncelle(sb, doctorId, id, 'Mehmet Yilmaz')
    assert.equal(await adParcasiMi(sb, doctorId, 'Mehmet'), true)
    assert.equal(await adParcasiMi(sb, doctorId, 'Zeynep'), false)
  })
})
