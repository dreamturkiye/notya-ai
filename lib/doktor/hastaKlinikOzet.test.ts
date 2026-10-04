import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  genelOzetYaz,
  sonMuayeneOzetiYaz,
  klinikOzetleriNotesOku,
  klinikOzetleriNotesYaz,
} from './hastaKlinikOzet'

describe('NOTYA-OZET-CIFT-01 — Genel Özet + Son muayene özeti', () => {
  it('son muayene: hasta_ozeti varsa onu kullanır', () => {
    const metin = sonMuayeneOzetiYaz({
      approved_at: '2026-10-03T12:00:00Z',
      hasta_ozeti: 'Sağlam çocuk kontrolü yapıldı; D vitamini devam.',
      content_tani: 'Z00.1',
    })
    assert.match(metin, /Sağlam çocuk kontrolü/)
    assert.match(metin, /muayenesi/)
  })

  it('son muayene: hasta_ozeti yoksa tanı/plan ile kurar', () => {
    const metin = sonMuayeneOzetiYaz({
      approved_at: '2026-10-03T12:00:00Z',
      basvuru_yakinmasi: '24 aylık sağlam çocuk',
      content_tani: 'Sağlam çocuk izlemi',
      content_plan: 'Hep A planlandı',
    })
    assert.match(metin, /24 aylık/)
    assert.match(metin, /Sağlam çocuk izlemi/)
    assert.match(metin, /Hep A/)
  })

  it('genel özet: alerji, ilaç, vizit ve tanıları birleştirir', () => {
    const metin = genelOzetYaz({
      dogumIso: '2024-10-01',
      cinsiyetHam: 'male',
      notes: { alerjiler: 'Bilinen alerjisi yok', kronikHastaliklar: [], suregenIlaclar: 'D vitamini' },
      aktifIlaclar: ['Wellcare D vitamini 1000 ünite', 'NBL Probiotic'],
      onayliNotlar: [
        {
          approved_at: '2026-10-03T10:00:00Z',
          basvuru_yakinmasi: '24 ay kontrol',
          content_tani: 'Sağlam çocuk',
          content_plan: 'Hep A + grip',
        },
        {
          approved_at: '2026-04-01T10:00:00Z',
          content_tani: '18 ay kontrol',
        },
      ],
    })
    assert.match(metin, /alerji/i)
    assert.match(metin, /Wellcare|Probiotic|D vitamini/)
    assert.match(metin, /2 onaylı muayene/)
    assert.match(metin, /Sağlam çocuk|18 ay/)
    assert.match(metin, /Son muayene/)
  })

  it('genel özet: uzun plan (lot no) kısaltılmaz — hekim tamamını okuyabilmeli', () => {
    const plan = '1. Hepatit A aşısının ikinci dozunun yapıldı. Sol bacak, Havrix, lot no: H1234 2. İlk kez grip aşısı yapıldı; Vaxigrip, sağ bacak, Lot no: G9876. 3. D vitamini devam.'
    const metin = genelOzetYaz({
      dogumIso: '2024-10-01',
      cinsiyetHam: 'male',
      notes: {},
      aktifIlaclar: [],
      onayliNotlar: [{
        approved_at: '2026-10-04T10:00:00Z',
        basvuru_yakinmasi: '24 aylık sağlam çocuk muayenesi',
        content_tani: '24 aylık sağlam çocuk muayenesi',
        content_plan: plan,
      }],
    })
    assert.match(metin, /Lot no: G9876/)
    assert.match(metin, /D vitamini devam/)
    assert.doesNotMatch(metin, /…|\.\.\.\s*$/)
  })

  it('notes okuma/yazma genelOzet ve sonMuayeneOzeti anahtarlarını kullanır', () => {
    const yaz = klinikOzetleriNotesYaz({ sehir: 'İstanbul' }, 'Genel metin', 'Son metin')
    assert.equal(yaz.sehir, 'İstanbul')
    assert.equal(yaz.genelOzet, 'Genel metin')
    assert.equal(yaz.sonMuayeneOzeti, 'Son metin')
    assert.ok(String(yaz.klinikOzetGuncelleme || '').length > 8)
    const oku = klinikOzetleriNotesOku(yaz)
    assert.equal(oku.genelOzet, 'Genel metin')
    assert.equal(oku.sonMuayeneOzeti, 'Son metin')
  })
})
