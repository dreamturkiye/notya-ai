import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { raporBelgesiModeliKur, raporDosyaAdi, type RaporBelgesiGirdi } from './raporBelgesi'
import type { RaporDoktorBlogu } from './raporDoktorBlogu'

const DOKTOR_DOLU: RaporDoktorBlogu = {
  unvanliAdSoyad: 'Dr. Ayşe Kaya',
  uzmanlik: 'Çocuk Sağlığı ve Hastalıkları',
  klinikAdi: 'Kaya Çocuk Kliniği',
  adres: 'Bağdat Cad. No:1, İstanbul',
  telefon: '0532 123 45 67',
  eposta: 'ayse@example.com',
  diplomaTescilNo: '12345',
}

const DOKTOR_BOS: RaporDoktorBlogu = {
  unvanliAdSoyad: 'Dr.',
  uzmanlik: '',
  klinikAdi: null,
  adres: null,
  telefon: null,
  eposta: null,
  diplomaTescilNo: null,
}

function girdi(ekstra: Partial<RaporBelgesiGirdi> = {}): RaporBelgesiGirdi {
  return {
    ustBaslik: 'İstirahat Raporu',
    belgeNo: 'NOTYA-ISTIRAHAT-20261015-ABCD',
    tarihIso: '2026-10-15',
    hasta: { adSoyad: 'Test Hasta', dogumTarihiIso: '2020-01-01', cinsiyetHam: 'female' },
    pediatrikYasBicimi: true,
    klinikBaslik: 'KARAR',
    klinikMetin: 'Karar metni burada.',
    doktor: DOKTOR_DOLU,
    veliGorunsun: true,
    ...ekstra,
  }
}

describe('raporBelgesiModeliKur', () => {
  it('hasta bloğu dolu — ad soyad, doğum tarihi tr-TR, cinsiyet Türkçe, yaş yıl+ay', () => {
    const m = raporBelgesiModeliKur(girdi())
    assert.equal(m.hasta.adSoyad, 'Test Hasta')
    assert.match(m.hasta.dogumTarihi || '', /01\.01\.2020/)
    assert.equal(m.hasta.cinsiyet, 'Kadın')
    assert.match(m.hasta.yasYilAy || '', /yaş/)
  })

  it('T.C. kimlik satırı HER ZAMAN gizlilik notu — Notya ham T.C. saklamaz', () => {
    const m = raporBelgesiModeliKur(girdi())
    assert.match(m.hasta.tcKimlikSatiri, /Notya T\.C\. kimlik numarasını saklamaz/)
  })

  it('pediatrikYasBicimi false ise yaş alanı boş', () => {
    const m = raporBelgesiModeliKur(girdi({ pediatrikYasBicimi: false }))
    assert.equal(m.hasta.yasYilAy, null)
  })

  it('veliGorunsun false ise anne/baba adı modelde taşınsa da bayrak false kalır', () => {
    const m = raporBelgesiModeliKur(girdi({ veliGorunsun: false, hasta: { adSoyad: 'X', dogumTarihiIso: null, cinsiyetHam: null, anneAdi: 'Zeynep' } }))
    assert.equal(m.hasta.veliGorunsun, false)
    assert.equal(m.hasta.anneAdi, 'Zeynep')
  })

  it('doktor bloğu dolu profilde profil verisini birebir taşır', () => {
    const m = raporBelgesiModeliKur(girdi())
    assert.equal(m.doktor.unvanliAdSoyad, 'Dr. Ayşe Kaya')
    assert.equal(m.doktor.diplomaTescilNo, '12345')
    assert.equal(m.doktor.klinikAdi, 'Kaya Çocuk Kliniği')
  })

  it('doktor bloğu eksikse hiçbir alan sahte veri yazmaz — "profilde tamamlayın" notu', () => {
    const m = raporBelgesiModeliKur(girdi({ doktor: DOKTOR_BOS }))
    assert.match(m.doktor.diplomaTescilNo, /profilde tamamlayın/)
    assert.match(m.doktor.klinikAdi, /profilde tamamlayın/)
    assert.match(m.doktor.adres, /profilde tamamlayın/)
    assert.match(m.doktor.telefon, /profilde tamamlayın/)
    assert.match(m.doktor.eposta, /profilde tamamlayın/)
  })

  it('belgeNo ve tarih görünümü aynen taşınır', () => {
    const m = raporBelgesiModeliKur(girdi())
    assert.equal(m.belgeNo, 'NOTYA-ISTIRAHAT-20261015-ABCD')
    assert.match(m.tarihGorunum, /15\.10\.2026/)
  })

  it('NOTYA-PROTOKOL-NO-01: protokolNo verildiğinde birebir taşınır', () => {
    const m = raporBelgesiModeliKur(girdi({ protokolNo: '2026-000123' }))
    assert.equal(m.protokolNo, '2026-000123')
  })

  it('NOTYA-PROTOKOL-NO-01: protokolNo verilmediğinde (muayeneye bağlı olmayan rapor) "—" gösterilir, asla sayı icat edilmez', () => {
    const m = raporBelgesiModeliKur(girdi())
    assert.equal(m.protokolNo, '—')
    const mNull = raporBelgesiModeliKur(girdi({ protokolNo: null }))
    assert.equal(mNull.protokolNo, '—')
  })
})

describe('raporDosyaAdi', () => {
  it('Türkçe karakterleri sadeleştirir ve belgeNo ile sonlanır', () => {
    assert.equal(raporDosyaAdi('İstirahat Raporu', 'NOTYA-X-1'), 'istirahat-raporu-NOTYA-X-1.pdf')
  })

  it('boş başlıkta "rapor" öneki kullanır', () => {
    assert.equal(raporDosyaAdi('', 'NOTYA-X-1'), 'rapor-NOTYA-X-1.pdf')
  })
})
