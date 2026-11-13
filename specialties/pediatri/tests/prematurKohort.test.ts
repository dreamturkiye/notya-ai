/**
 * PREMATURE-MODUL — prematür plan girdisi (hekim girdisi + KD taburcu özeti + mevcut kayıtlar) ve kohort satırları.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { etkinGirdi, mevcutKayitlarKur, prematurPlanHesapla, prematurKohortSatirlari, siradakiOge, type PrematurKaynakVeri, type PrematurKohortGirdi } from '../engines/prematurKohort'
import { PROTOKOL_TR } from '@/lib/clinical/prematur/protokolTR'

const veri = (o: Partial<PrematurKaynakVeri> = {}): PrematurKaynakVeri => ({
  dogumIso: '2026-01-01', kartGestasyonHafta: null, kartDogumKiloGr: null, kartOzet: null, profil: {}, durumlar: {}, taramalar: [], ...o,
})

describe('etkinGirdi — hekim önceliklidir, kart eksik olanı doldurur', () => {
  it('yalnız kart: gestasyon kartan, kaynak kd-taburcu', () => {
    const e = etkinGirdi(veri({ kartGestasyonHafta: 29.57, kartDogumKiloGr: 1200 }))
    assert.equal(e.gestasyonGun, 207) // 29,57 hf × 7
    assert.equal(e.dogumKiloGr, 1200)
    assert.equal(e.gestasyonKaynagi, 'kd-taburcu')
  })
  it('hekim girdisi karttakini ezer', () => {
    const e = etkinGirdi(veri({ kartGestasyonHafta: 33, kartDogumKiloGr: 1900, profil: { gestasyonHafta: 30, dogumKiloGr: 1400 } }))
    assert.equal(e.gestasyonGun, 210)
    assert.equal(e.dogumKiloGr, 1400)
    assert.equal(e.gestasyonKaynagi, 'elle')
  })
  it('KD özeti: steroid / PPROM / magnezyum yalnız hekim işaretlemediyse doldurulur', () => {
    const e = etkinGirdi(veri({ kartOzet: { steroidKuru: true, pprom: true, magnezyum: false }, profil: { pprom: false } }))
    assert.equal(e.profil.antenatalSteroid, true)
    assert.equal(e.profil.pprom, false) // hekim: hayır
    assert.equal(e.profil.magnezyum, false)
    assert.equal(e.profil.kaynak, 'kd-taburcu')
  })
  it('geçersiz hafta (19) yok sayılır', () => {
    assert.equal(etkinGirdi(veri({ kartGestasyonHafta: 19 })).gestasyonGun, null)
  })
})

describe('mevcutKayitlarKur', () => {
  it('pedi_taramalar türü → kuralın kayıt türüyle eşleşir; geçersiz tarih atlanır', () => {
    const m = mevcutKayitlarKur(PROTOKOL_TR, [{ tur: 'rop', tarih: '2026-01-29' }, { tur: 'rop', tarih: 'bozuk' }, { tur: 'otizm', tarih: '2026-03-01' }])
    assert.deepEqual(m.rop, ['2026-01-29'])
    assert.ok(!('otizm' in m))
  })
})

describe('prematurPlanHesapla', () => {
  it('26 hf bebek: ROP ilk muayene PMA 30–31. hafta; ROP taraması kaydı kalemi kapatır', () => {
    const acik = prematurPlanHesapla(veri({ kartGestasyonHafta: 26, kartDogumKiloGr: 800 }), '2026-02-20', PROTOKOL_TR).plan
    const rop = acik.ogeler.find((o) => o.id === 'rop:ilk-pma')!
    assert.equal(rop.kriter.durum, 'karsilandi')
    assert.equal(rop.durum === 'yapildi', false)
    const kapali = prematurPlanHesapla(veri({ kartGestasyonHafta: 26, kartDogumKiloGr: 800, taramalar: [{ tur: 'rop', tarih: '2026-02-05' }] }), '2026-02-20', PROTOKOL_TR).plan
    assert.equal(kapali.ogeler.find((o) => o.id === 'rop:ilk-pma')!.durum, 'yapildi')
    assert.equal(kapali.ogeler.find((o) => o.id === 'rop:ilk-pma')!.otomatikKayit, '2026-02-05')
  })
  it('hekimin "yapıldı" işareti kalemi kapatır; "uygulanmaz" kapatır', () => {
    const p = prematurPlanHesapla(veri({ kartGestasyonHafta: 28, kartDogumKiloGr: 1000, durumlar: { 'kraniyal-usg:ilk': { durum: 'yapildi', tarih: '2026-01-10' }, 'kraniyal-usg:tekrar': { durum: 'uygulanmaz' } } }), '2026-03-15', PROTOKOL_TR).plan
    assert.equal(p.ogeler.find((o) => o.id === 'kraniyal-usg:ilk')!.durum, 'yapildi')
    assert.equal(p.ogeler.find((o) => o.id === 'kraniyal-usg:tekrar')!.durum, 'uygulanmaz')
  })
})

const bebek = (id: string, o: Partial<PrematurKohortGirdi> = {}): PrematurKohortGirdi => ({ ...veri(), patientId: id, ad: `Bebek ${id}`, ...o })

describe('prematurKohortSatirlari', () => {
  const bugun = '2026-03-15'
  it('term bebek, bilinmeyen bebek, kapsam dışı yaşlı çocuk kohortta yok; bilinmeyen sayılır', () => {
    const s = prematurKohortSatirlari([
      bebek('term', { kartGestasyonHafta: 39, kartDogumKiloGr: 3200 }),
      bebek('bilinmiyor'),
      bebek('eski', { dogumIso: '2022-01-01', kartGestasyonHafta: 28, kartDogumKiloGr: 1000 }),
      bebek('pre', { kartGestasyonHafta: 28, kartDogumKiloGr: 1000 }),
    ], bugun, PROTOKOL_TR)
    assert.deepEqual(s.satirlar.map((r) => r.patientId), ['pre'])
    assert.equal(s.bilinmeyenSayisi, 1)
  })
  it('geciken bebek öne sıralanır; sıradaki kalem en acil olan', () => {
    const s = prematurKohortSatirlari([
      bebek('b-tamam', { kartGestasyonHafta: 36, kartDogumKiloGr: 2400, dogumIso: '2026-03-01' }),
      bebek('a-geciken', { kartGestasyonHafta: 27, kartDogumKiloGr: 900, dogumIso: '2026-01-01' }),
    ], bugun, PROTOKOL_TR)
    assert.equal(s.satirlar[0].patientId, 'a-geciken')
    assert.ok(s.satirlar[0].ozet.gecikti > 0)
    assert.equal(s.satirlar[0].gecikti, true)
    assert.ok(s.satirlar[0].siradaki)
    assert.match(s.satirlar[0].gestasyon, /^27\+0$/)
    assert.ok(s.satirlar[0].duzeltilmisYas.length > 0)
  })
  it('siradakiOge: yalnız kriteri karşılanan açık kalemler', () => {
    const { plan } = prematurPlanHesapla(veri({ kartGestasyonHafta: 38, kartDogumKiloGr: 1400 }), bugun, PROTOKOL_TR)
    const s = siradakiOge(plan)
    assert.ok(!s || s.kriter.durum === 'karsilandi')
  })
  it('ülke-bağımsızlık: enjekte edilen protokol (kapsam eşiği) kohortu belirler', () => {
    const dar = { ...PROTOKOL_TR, kapsam: { ...PROTOKOL_TR.kapsam, gestasyonHaftaKucuk: 32 } }
    const s = prematurKohortSatirlari([bebek('x', { kartGestasyonHafta: 34, kartDogumKiloGr: 2000 })], bugun, dar)
    assert.equal(s.satirlar.length, 0)
  })
})
