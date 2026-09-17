/**
 * NOTYA-SUPERUSER-BRANS-01 — izin listesinin kendi testi.
 *
 * Buradaki asıl iddia: liste TAM OLARAK iki doğrulanmış kimlikten ibaret. Listeye üçüncü
 * bir kimlik sessizce eklenirse ya da kontrol gevşetilirse (e-posta metnine düşmek,
 * büyük/küçük harf ya da parça eşleşmesi) bu dosya kırmızıya döner.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SUPERUSER_BRANS_IDS,
  bransDegistirebilir,
  gecerliBransMi,
  bransSecenekleri,
} from './superuserBranslar'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import { SPECIALTIES } from '@/lib/doktor/specialties'

const KAAN = 'c4989e29-a219-45b6-bf17-18e260e3c7f9'   // kaanari@mac.com
const GOKHAN = '94c4db57-8b89-4880-80be-143f88f4bcc1' // dr.gokhanmamur@gmail.com
const GOKHAN2 = '9030fe09-0a5f-484b-9cc9-3e1e1b0b5178' // dr.gokhan@notya.ai (günlük hesabı)

test('izin listesi tam olarak üç doğrulanmış kimlik', () => {
  assert.equal(SUPERUSER_BRANS_IDS.length, 3)
  assert.deepEqual([...SUPERUSER_BRANS_IDS].sort(), [GOKHAN, GOKHAN2, KAAN].sort())
})

test('yalnız o iki kimlik geçer', () => {
  assert.equal(bransDegistirebilir(KAAN), true)
  assert.equal(bransDegistirebilir(GOKHAN), true)
  assert.equal(bransDegistirebilir(GOKHAN2), true)
})

test('başka her hekim reddedilir', () => {
  const baskalari = [
    '419386d9-88b6-455b-a12a-ac422b0cd296', // sentetik QA hekimi
    'aaaaaaaa-0000-4000-8000-00000000d002',
    '00000000-0000-0000-0000-000000000000',
  ]
  for (const id of baskalari) assert.equal(bransDegistirebilir(id), false, id)
})

test('boş / bozuk girdi reddedilir — açık kapı yok', () => {
  for (const kotu of [null, undefined, '', '   ', 'kaanari@mac.com', 'undefined', 'null']) {
    assert.equal(bransDegistirebilir(kotu as string | null | undefined), false, String(kotu))
  }
  for (const kotu of [0, 1, true, {}, [], { id: KAAN }]) {
    assert.equal(bransDegistirebilir(kotu as unknown as string), false, JSON.stringify(kotu))
  }
})

test('kimlik eşleşmesi tam — parça ya da harf değişimi geçmez', () => {
  assert.equal(bransDegistirebilir(KAAN.toUpperCase()), false)
  assert.equal(bransDegistirebilir(KAAN.slice(0, 8)), false)
  assert.equal(bransDegistirebilir(KAAN + 'x'), false)
  assert.equal(bransDegistirebilir(`${KAAN},${GOKHAN}`), false)
})

test('branş doğrulaması kanonik kayıttan — ikinci liste yok', () => {
  const kanonik = Object.keys(BRANS_ETIKETLERI)
  assert.deepEqual(kanonik.sort(), SPECIALTIES.map((s) => s.key).sort())
  for (const anahtar of kanonik) assert.equal(gecerliBransMi(anahtar), true, anahtar)
  assert.equal(gecerliBransMi('pediatri'), true)
  assert.equal(gecerliBransMi('kadin-hastaliklari-dogum'), true)
})

test('uydurma / tehlikeli branş değerleri reddedilir', () => {
  for (const kotu of ['genel', 'kadin-dogum', 'Pediatri', '', null, undefined, 42, {}, '__proto__', 'constructor', 'toString']) {
    assert.equal(gecerliBransMi(kotu), false, String(kotu))
  }
})

test('açılır liste 30 branşın tamamını Türkçe etiketiyle verir', () => {
  const secenekler = bransSecenekleri()
  assert.equal(secenekler.length, Object.keys(BRANS_ETIKETLERI).length)
  for (const s of secenekler) {
    assert.equal(gecerliBransMi(s.anahtar), true)
    assert.equal(s.etiket, BRANS_ETIKETLERI[s.anahtar])
  }
  assert.ok(secenekler.some((s) => s.anahtar === 'pediatri' && s.etiket === 'Pediatri (Çocuk Sağlığı)'))
  assert.ok(secenekler.some((s) => s.anahtar === 'kadin-hastaliklari-dogum' && s.etiket === 'Kadın Hastalıkları ve Doğum'))
})
