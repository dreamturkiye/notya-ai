/**
 * MBYS-YARDIMCI-01 — pre-send checks and the record builder. Synthetic data only.
 *   npx tsx --test lib/enabiz/mbys/kontrol.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  icd10Gecerli,
  icd10Normalize,
  mbysAyarCoz,
  mbysDurum,
  mbysDuzMetin,
  mbysKontrol,
  sayiMi,
  tcKimlikGecerli,
  MBYS_VARSAYILAN_AYAR,
  type MbysKayit,
} from './kontrol'
import { adSoyadAyir, mbysKayitKur, mbysTanilar, mbysTarihCoz } from './kayit'

/** A valid synthetic T.C. number (checksums hold); not a real person. */
const TC = '10000000146'

function tamKayit(): MbysKayit {
  return {
    surum: 1,
    kayitTuru: 'vatandas',
    kimlik: { tcKimlikNo: TC, pasaportNo: '', sahisNo: '', ad: 'QA Ayşe', soyad: 'Örnek', cinsiyet: 'K', dogumTarihi: '1990-05-17', uyruk: 'TR' },
    muayene: { sikayet: 'Boğaz ağrısı', hikaye: 'İki gündür boğaz ağrısı', bulgu: 'Farenks hiperemik', aciklama: 'Semptomatik', boy: '165', kilo: '58,5', muayeneTuru: 'Normal Muayene', vakaTuru: 'Normal Vaka', ozellikliHizmet: '' },
    tanilar: [{ kod: 'J02.9', ad: 'Akut farenjit' }],
    hazirlandi: '2026-10-07T09:00:00.000Z',
  }
}

describe('T.C. kimlik no checksum', () => {
  it('accepts a number whose 10th and 11th digits hold', () => {
    assert.equal(tcKimlikGecerli(TC), true)
    assert.equal(tcKimlikGecerli(' 10000000146 '), true)
  })
  it('rejects a wrong 10th digit, a wrong 11th digit, a leading 0, wrong length and letters', () => {
    assert.equal(tcKimlikGecerli('10000000156'), false)
    assert.equal(tcKimlikGecerli('10000000147'), false)
    assert.equal(tcKimlikGecerli('01000000146'), false)
    assert.equal(tcKimlikGecerli('1000000014'), false)
    assert.equal(tcKimlikGecerli('100000001460'), false)
    assert.equal(tcKimlikGecerli('1000000014a'), false)
    assert.equal(tcKimlikGecerli(''), false)
    assert.equal(tcKimlikGecerli(null), false)
  })
  it('agrees with the rule on generated numbers', () => {
    for (let i = 0; i < 200; i++) {
      const d = [1 + (i % 9), ...Array.from({ length: 8 }, (_, j) => (i * 7 + j * 3) % 10)]
      const on = (((d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7])) % 10 + 10) % 10
      const onBir = (d.reduce((a, b) => a + b, 0) + on) % 10
      const no = [...d, on, onBir].join('')
      assert.equal(tcKimlikGecerli(no), true, no)
      assert.equal(tcKimlikGecerli(no.slice(0, 10) + ((onBir + 1) % 10)), false)
    }
  })
})

describe('ICD-10, numbers, settings', () => {
  it('normalizes and validates ICD-10 codes', () => {
    assert.equal(icd10Normalize('j069'), 'J06.9')
    assert.equal(icd10Normalize(' Z00.0 '), 'Z00.0')
    assert.equal(icd10Normalize('I10'), 'I10')
    assert.equal(icd10Gecerli('J06.9'), true)
    assert.equal(icd10Gecerli('U07.1'), true)
    assert.equal(icd10Gecerli('J6.9'), false)
    assert.equal(icd10Gecerli('farenjit'), false)
    assert.equal(icd10Gecerli(''), false)
  })
  it('reads boy / kilo with comma or dot', () => {
    assert.equal(sayiMi('165'), true)
    assert.equal(sayiMi('58,5'), true)
    assert.equal(sayiMi('58.5'), true)
    assert.equal(sayiMi('elli'), false)
    assert.equal(sayiMi('0'), false)
  })
  it('defaults muayene / vaka türü and keeps the doctor’s values', () => {
    assert.deepEqual(mbysAyarCoz(null), MBYS_VARSAYILAN_AYAR)
    assert.deepEqual(mbysAyarCoz({ muayeneTuru: 'Kontrol Muayenesi', vakaTuru: ' ' }), { muayeneTuru: 'Kontrol Muayenesi', vakaTuru: MBYS_VARSAYILAN_AYAR.vakaTuru })
  })
})

describe('mbysKontrol — nothing bounces at the Ministry screen', () => {
  it('a complete record is Hazır', () => {
    const k = tamKayit()
    assert.deepEqual(mbysKontrol(k), [])
    assert.equal(mbysDurum(mbysKontrol(k), null), 'hazir')
  })
  it('flags every required field, each with where to fix it', () => {
    const k = tamKayit()
    k.kayitTuru = ''
    k.kimlik = { tcKimlikNo: '', pasaportNo: '', sahisNo: '', ad: '', soyad: '', cinsiyet: '', dogumTarihi: '', uyruk: '' }
    k.muayene = { ...k.muayene!, sikayet: '', hikaye: ' ', bulgu: '', boy: 'uzun', kilo: '', muayeneTuru: '', vakaTuru: '' }
    k.tanilar = []
    const e = mbysKontrol(k)
    const alanlar = e.map((x) => x.alan)
    for (const a of ['kayitTuru', 'ad', 'soyad', 'cinsiyet', 'dogumTarihi', 'uyruk', 'tani', 'sikayet', 'hikaye', 'bulgu', 'boy', 'muayeneTuru', 'vakaTuru']) {
      assert.ok(alanlar.includes(a), `${a} eksik sayılmadı`)
    }
    assert.ok(!alanlar.includes('kilo'), 'boş kilo zorunlu değil')
    assert.equal(e.find((x) => x.alan === 'ad')!.duzelt, 'kimlik')
    assert.equal(e.find((x) => x.alan === 'tani')!.duzelt, 'not')
    assert.equal(e.find((x) => x.alan === 'vakaTuru')!.duzelt, 'ayar')
    assert.equal(mbysDurum(e, null), 'eksik')
  })
  it('checks the number that belongs to the Kayıt türü', () => {
    const k = tamKayit()
    k.kimlik.tcKimlikNo = '12345678901'
    assert.match(mbysKontrol(k)[0].mesaj, /geçersiz/)
    k.kayitTuru = 'yabanci'
    k.kimlik.uyruk = 'Almanya'
    assert.deepEqual(mbysKontrol(k).map((x) => x.alan), ['pasaportNo'])
    k.kimlik.pasaportNo = 'U1234567'
    assert.deepEqual(mbysKontrol(k), [])
    k.kayitTuru = 'vatansiz'
    assert.deepEqual(mbysKontrol(k).map((x) => x.alan), ['sahisNo'])
  })
  it('rejects a bad ICD-10 code and a future birth date', () => {
    const k = tamKayit()
    k.tanilar = [{ kod: 'J02.9', ad: '' }, { kod: 'farenjit', ad: '' }]
    k.kimlik.dogumTarihi = '2999-01-01'
    const alanlar = mbysKontrol(k).map((x) => x.alan)
    assert.deepEqual(alanlar.sort(), ['dogumTarihi', 'tani'])
  })
  it('ön büro record (no muayene) is checked on identity only', () => {
    const k = tamKayit()
    k.muayene = null
    k.tanilar = []
    assert.deepEqual(mbysKontrol(k), [])
  })
  it('stored status wins over computed', () => {
    assert.equal(mbysDurum([{ alan: 'ad', mesaj: '', duzelt: 'kimlik' }], 'aktarildi'), 'aktarildi')
    assert.equal(mbysDurum([], 'kaydedildi'), 'kaydedildi')
  })
  it('clipboard text follows the two MBYS screens', () => {
    const t = mbysDuzMetin(tamKayit())
    assert.match(t, /Hasta T\.C\.: 10000000146/)
    assert.match(t, /Doğum Tarihi: 17\.05\.1990/)
    assert.match(t, /Tanılar \(ICD-10\): J02\.9 Akut farenjit/)
    assert.ok(t.indexOf('Hasta Kayıt') < t.indexOf('Muayene'))
  })
})

describe('mbysKayitKur — record from what Notya holds', () => {
  const not = {
    basvuru_yakinmasi: 'Öksürük',
    content_subjektif: 'Üç gündür öksürük\nAteş yok',
    content_objektif: 'Akciğer sesleri doğal',
    content_plan: 'Bol sıvı',
    icd10_codes: [{ kod: 'j069', ad: 'ÜSYE' }, 'J20.9 Akut bronşit', { code: 'J06.9' }],
    vitaller: { boy: '120 cm', kilo: 24.5 },
  }
  it('builds identity from the patient record and muayene from the note', () => {
    const k = mbysKayitKur({ hastaAd: 'QA Ali Veli Örnek', dogum: '2018-02-03', cinsiyet: 'male', kartTc: TC, form: null, ek: null, not, ayar: MBYS_VARSAYILAN_AYAR, muayeneDahil: true, simdi: 'x' })
    assert.equal(k.kayitTuru, 'vatandas')
    assert.deepEqual(k.kimlik, { tcKimlikNo: TC, pasaportNo: '', sahisNo: '', ad: 'QA Ali Veli', soyad: 'Örnek', cinsiyet: 'E', dogumTarihi: '2018-02-03', uyruk: 'TR' })
    assert.equal(k.muayene!.sikayet, 'Öksürük')
    assert.equal(k.muayene!.hikaye, 'Üç gündür öksürük\nAteş yok')
    assert.equal(k.muayene!.bulgu, 'Akciğer sesleri doğal')
    assert.equal(k.muayene!.boy, '120')
    assert.equal(k.muayene!.kilo, '24.5')
    assert.deepEqual(k.tanilar, [{ kod: 'J06.9', ad: 'ÜSYE' }, { kod: 'J20.9', ad: 'Akut bronşit' }])
    assert.deepEqual(mbysKontrol(k), [])
  })
  it('the doctor’s MBYS identity wins over the intake form, which wins over the record', () => {
    const k = mbysKayitKur({
      hastaAd: 'QA Ali Örnek', dogum: '', cinsiyet: '', kartTc: '', not: null, ayar: MBYS_VARSAYILAN_AYAR, muayeneDahil: false,
      form: { ad: 'Formdan', soyad: 'Soyad', tcKimlik: TC, cinsiyet: 'Kadın', dogumTarihi: '01.02.2000' },
      ek: { kayitTuru: 'yabanci', pasaportNo: 'P99', uyruk: 'Almanya', ad: 'Elle' },
    })
    assert.equal(k.kayitTuru, 'yabanci')
    assert.equal(k.kimlik.tcKimlikNo, '')
    assert.equal(k.kimlik.pasaportNo, 'P99')
    assert.equal(k.kimlik.ad, 'Elle')
    assert.equal(k.kimlik.soyad, 'Soyad')
    assert.equal(k.kimlik.cinsiyet, 'K')
    assert.equal(k.kimlik.dogumTarihi, '2000-02-01')
    assert.equal(k.muayene, null, 'ön büro never receives the muayene part')
    assert.deepEqual(k.tanilar, [])
  })
  it('no T.C. and no choice → Kayıt türü left for the doctor', () => {
    const k = mbysKayitKur({ hastaAd: 'Tek', dogum: '', cinsiyet: '', kartTc: '', form: null, ek: null, not: null, ayar: MBYS_VARSAYILAN_AYAR, muayeneDahil: true })
    assert.equal(k.kayitTuru, '')
    assert.equal(k.kimlik.uyruk, '')
    assert.ok(mbysKontrol(k).some((e) => e.alan === 'kayitTuru'))
  })
  it('helpers', () => {
    assert.deepEqual(adSoyadAyir('Ayşe Nur Yılmaz'), { ad: 'Ayşe Nur', soyad: 'Yılmaz' })
    assert.deepEqual(adSoyadAyir('Tek'), { ad: 'Tek', soyad: '' })
    assert.equal(mbysTarihCoz('2019-03-01T00:00:00Z'), '2019-03-01')
    assert.equal(mbysTarihCoz('1/3/2019'), '2019-03-01')
    assert.deepEqual(mbysTanilar(null), [])
  })
})
