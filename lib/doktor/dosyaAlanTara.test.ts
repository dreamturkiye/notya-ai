import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dogumTarihiTara, formAlanlariniTara } from './dosyaAlanTara'

const EPIKRIZ = `
Yenidoğan taburculuk epikrizi
Doğum Tarihi: 01.09.2026
Cinsiyet: Erkek
Doğum Kilosu: 3200 gram
Kan Grubu: 0 Rh+
Anne Adı: Ayşe
Baba Adı: Mehmet
Hepatit B aşısı doğumda uygulandı
`

describe('dosyaAlanTara — form başlıkları tüm dosyada', () => {
  it('etiketli doğum tarihini ISO yapar; vizit tarihini doğum saymaz', () => {
    const d = dogumTarihiTara(EPIKRIZ)
    assert.equal(d?.deger, '2026-09-01')
    assert.equal(dogumTarihiTara('Vizit tarihi: 20.09.2026\nUygulama tarihi: 15.09.2026'), null)
  })

  it('"tarihinde doğdu" cümlesini yakalar', () => {
    assert.equal(dogumTarihiTara('Bebek 12.03.2024 tarihinde doğdu, taburcu edildi.')?.deger, '2024-03-12')
  })

  it('formdaki diğer başlıkları epikriz satırından okur', () => {
    const b = formAlanlariniTara(EPIKRIZ, { brans: 'pediatri', hastaDogumIso: '2026-09-01' })
    const map = Object.fromEntries(b.map((x) => [x.id, x.deger]))
    assert.equal(map.dogumTarihi, '2026-09-01')
    assert.equal(map.cinsiyet, 'Erkek')
    assert.match(map.kanGrubu || '', /0 Rh\+/)
    assert.equal(map.anneAdi, 'Ayşe')
    assert.equal(map.babaAdi, 'Mehmet')
    assert.match(map.dogumKilosuPed || '', /3200/)
  })

  it('dolu form alanını tekrar yazmaz', () => {
    const b = formAlanlariniTara(EPIKRIZ, { brans: 'pediatri', dolu: ['dogumTarihi', 'cinsiyet'] })
    assert.ok(!b.some((x) => x.id === 'dogumTarihi'))
    assert.ok(!b.some((x) => x.id === 'cinsiyet'))
    assert.ok(b.some((x) => x.id === 'kanGrubu'))
  })

  it('baş çevresi / doğum kilosu KD dosyasına sızmaz', () => {
    const b = formAlanlariniTara(EPIKRIZ, { brans: 'kadin-hastaliklari-dogum', hastaDogumIso: '1990-01-01' })
    assert.ok(!b.some((x) => x.id === 'dogumKilosuPed'))
    assert.ok(!b.some((x) => x.id === 'basCevresiPed'))
    assert.ok(b.some((x) => x.id === 'dogumTarihi'))
  })

  it('TC / telefon / ad satırını modele vermez', () => {
    const b = formAlanlariniTara('T.C. Kimlik Numarası: 12345678901\nCep Telefonu: 05551112233\nAdı: Gizli\nDoğum Tarihi: 01.01.2020')
    assert.ok(!b.some((x) => x.id === 'tcKimlik' || x.id === 'telefon' || x.id === 'ad'))
    assert.equal(b.find((x) => x.id === 'dogumTarihi')?.deger, '2020-01-01')
  })
})
