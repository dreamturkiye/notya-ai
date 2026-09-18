import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pediKohortSatiri, pediKohortSatirlari, pediHatirlatmaMesaji, type PediKohortGirdi } from '../engines/kohort'

const BUGUN = '2026-09-18'
const bos = (ek: Partial<PediKohortGirdi>): PediKohortGirdi => ({
  patientId: 'p1', ad: 'Sentetik Çocuk', dogumIso: '2025-01-10', cinsiyet: 'female', asilar: [], taramalar: [], mchat: [], gidr: [], seanslar: [],
  olcumler: [], ilaclar: [], bebekGorevleri: [], gebelikHaftasi: null, dogumKiloGr: null, portalVar: true, ...ek,
})

describe('pediatri kohort — bayraklar diğer pediatri motorlarından', () => {
  it('aşı kaydı tutulmayan çocuk aşı bayrağı almaz (ASM dozları gürültü yapmasın)', () => {
    assert.ok(!pediKohortSatiri(bos({}), BUGUN).bayraklar.includes('asi_gecikti'))
  })
  it('aşı kaydı olan çocukta gecikmiş doz → bayrak + ayrıntı + aşı sekmesi', () => {
    const s = pediKohortSatiri(bos({ asilar: [{ id: 'a', ad: "5'li karma", tarih: '2025-03-10', kaynak: 'kayit' }] }), BUGUN)
    assert.ok(s.bayraklar.includes('asi_gecikti'))
    assert.match(s.detay.join(' '), /Karma 2\. doz/)
    assert.doesNotMatch(s.detay.join(' '), /Hep B|BCG/) // kaydı hiç olmayan seri bayrak üretmez
    assert.equal(s.sekme, 'asilar')
  })
  it('izlem: daha önce muayene olmuş çocukta son 180 günde kapanan pencerede muayene yoksa bayrak', () => {
    // 2025-01-10 doğum → 18. ay penceresi 2026-05-06 – 2026-08-03; önceki muayene 12. ayda
    const s = pediKohortSatiri(bos({ seanslar: ['2026-01-15'] }), BUGUN)
    assert.ok(s.bayraklar.includes('izlem_kacti'))
    assert.match(s.detay.join(' '), /18\. ay/)
    assert.ok(!pediKohortSatiri(bos({ seanslar: ['2026-01-15', '2026-06-01'] }), BUGUN).bayraklar.includes('izlem_kacti'))
    assert.ok(!pediKohortSatiri(bos({ seanslar: [] }), BUGUN).bayraklar.includes('izlem_kacti'))
  })
  it('persentil kayması (Neyzi): son ölçüm ≥ 2 majör çizgi', () => {
    const s = pediKohortSatiri(bos({ olcumler: [{ tarih: '2025-07-10', boy: 68 }, { tarih: '2026-09-10', boy: 76 }] }), BUGUN)
    assert.ok(s.bayraklar.includes('persentil_kaymasi'), JSON.stringify(s))
    assert.match(s.detay.join(' '), /Boy/)
  })
  it('profilaksi: 2 aylıkta D vitamini kaydı yoksa; 14 aylıkta aktif D vit → süresi doldu', () => {
    assert.match(pediKohortSatiri(bos({ dogumIso: '2026-07-10' }), BUGUN).detay.join(' '), /D vitamini kayıtta yok/)
    assert.ok(!pediKohortSatiri(bos({ dogumIso: '2026-07-10', ilaclar: [{ ad: 'D vitamini damla', aktif: true, baslangic: '2026-07-15', bitis: null }] }), BUGUN).bayraklar.includes('profilaksi'))
    assert.match(pediKohortSatiri(bos({ dogumIso: '2025-07-01', ilaclar: [{ ad: 'Devit-3', aktif: true, baslangic: '2025-07-05', bitis: null }, { ad: 'Ferrum damla', aktif: false, baslangic: null, bitis: null }] }), BUGUN).detay.join(' '), /süresi doldu/)
  })
  it('tarama: 2 aylıkta işitme kaydı yoksa; 26 aylıkta M-CHAT hiç yoksa', () => {
    assert.match(pediKohortSatiri(bos({ dogumIso: '2026-07-10', ilaclar: [{ ad: 'D vit', aktif: true, baslangic: null, bitis: null }] }), BUGUN).detay.join(' '), /işitme/)
    const s = pediKohortSatiri(bos({ dogumIso: '2024-07-10' }), BUGUN)
    assert.match(s.detay.join(' '), /otizm/)
  })
  it('liste yalnız bayraklı çocukları, en eski gecikme üstte döndürür', () => {
    const l = pediKohortSatirlari([bos({ patientId: 'a', dogumIso: '2019-01-01' }), bos({ patientId: 'b', asilar: [{ id: 'x', ad: "5'li karma", tarih: '2025-03-10', kaynak: 'kayit' }] })], BUGUN)
    assert.ok(l.every((s) => s.bayraklar.length > 0))
    assert.ok(l.some((s) => s.patientId === 'b'))
  })
  it('veli mesajı hasta-güvenli: tanı/ölçüm/persentil/ilaç yok, 112 var', () => {
    const m = pediHatirlatmaMesaji(['asi_gecikti', 'persentil_kaymasi', 'profilaksi', 'tarama_gecikti', 'izlem_kacti'])
    assert.match(m.metin, /112/)
    assert.doesNotMatch(m.metin, /persentil|\bkg\b|\bcm\b|\bIU\b|\bmg\b|KKK|M-CHAT|otizm|\banemi|Devit|Ferrum/i)
  })
})
