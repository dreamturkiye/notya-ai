import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { vizitPlani, IZLEM_PROTOKOLU, taramaNotSatiri, vizitOzetMetni } from '../engines/gelisimPlan'

const kalem = (p: ReturnType<typeof vizitPlani>, kod: string) => p.kalemler.find((k) => k.kod === kod)

describe('gelişim paneli — SB İzlem Protokolü 2018', () => {
  it('izlem takvimi: ≤ 24 ay pencereleri protokolden (doğrulanmış), sonrası öneri', () => {
    const v = (id: string) => IZLEM_PROTOKOLU.find((x) => x.id === id)!
    assert.deepEqual([v('ay3').basGun, v('ay3').sonGun], [90, 115])
    assert.deepEqual([v('ay18').basGun, v('ay18').sonGun], [481, 570])
    assert.equal(v('ay24').dogrulandi, true)
    assert.equal(v('ay36').dogrulandi, false)
    assert.equal(v('yas6').dogrulandi, false)
  })
  it('20 günlük bebek: işitme taraması bu vizitte, D vitamini sorulur, 15. gün izlemi', () => {
    const p = vizitPlani({ dogumIso: '2026-08-29', bugunIso: '2026-09-18' })
    assert.equal(p.simdikiVizit?.id, 'gun15')
    assert.equal(kalem(p, 'isitme')?.durum, 'simdi')
    assert.equal(kalem(p, 'dvit')?.durum, 'simdi')
    assert.match(kalem(p, 'dvit')!.ne, /400 IU/)
  })
  it('işitme: 30. günden sonra kayıt yoksa gecikti (tarama yapılmaz), bebek kartı kaydı tamamlar, geçemedi → dikkat', () => {
    assert.equal(kalem(vizitPlani({ dogumIso: '2026-07-01', bugunIso: '2026-09-18' }), 'isitme')?.durum, 'gecikti')
    assert.equal(kalem(vizitPlani({ dogumIso: '2026-07-01', bugunIso: '2026-09-18', taramalar: [{ tur: 'isitme', tarih: '2026-07-02', sonuc: 'normal', kaynak: 'bebek_karti' }] }), 'isitme')?.durum, 'tamam')
    assert.equal(kalem(vizitPlani({ dogumIso: '2026-07-01', bugunIso: '2026-09-18', taramalar: [{ tur: 'isitme', tarih: '2026-07-02', sonuc: 'ileri_degerlendirme' }] }), 'isitme')?.durum, 'dikkat')
  })
  it('18 aylık: M-CHAT bu vizitte (araç mchat), GİDR 18. ay penceresi; 6–9 ay GİDR kaçtıysa gecikti', () => {
    const p = vizitPlani({ dogumIso: '2025-03-10', bugunIso: '2026-09-18' })
    assert.equal(kalem(p, 'otizm')?.arac, 'mchat')
    assert.equal(kalem(p, 'otizm')?.durum, 'simdi')
    assert.equal(kalem(p, 'gidr')?.durum, 'gecikti')
    assert.match(kalem(p, 'gidr')!.ne, /6–9 ay/)
    const q = vizitPlani({ dogumIso: '2025-03-10', bugunIso: '2026-09-18', gidr: [{ tarih: '2025-11-01' }], mchat: [{ tarih: '2026-09-15', risk: 'dusuk', puan: 1 }] })
    assert.equal(kalem(q, 'gidr')?.durum, 'simdi')
    assert.equal(kalem(q, 'otizm')?.durum, 'tamam')
  })
  it('pencereler arası (20 ay): kaçan pencere adıyla söylenir, M-CHAT 30 aya kadar telafi', () => {
    const p = vizitPlani({ dogumIso: '2025-01-10', bugunIso: '2026-09-18', gidr: [{ tarih: '2025-09-01' }] })
    assert.match(kalem(p, 'gidr')!.ad, /18\. ay penceresi kaçtı/)
    assert.equal(kalem(p, 'gidr')!.durum, 'gecikti')
    assert.match(kalem(p, 'otizm')!.ad, /18\. ay penceresi kaçtı/)
    assert.equal(kalem(p, 'otizm')!.arac, 'mchat')
  })
  it('M-CHAT orta/yüksek risk → dikkat; 3 yaşta M-CHAT değil klinik değerlendirme', () => {
    const p = vizitPlani({ dogumIso: '2024-09-01', bugunIso: '2026-09-18', mchat: [{ tarih: '2026-09-10', risk: 'orta', puan: 5 }] })
    assert.equal(kalem(p, 'otizm')?.durum, 'dikkat')
    const q = vizitPlani({ dogumIso: '2023-09-01', bugunIso: '2026-09-18', mchat: [{ tarih: '2025-03-10', risk: 'dusuk' }, { tarih: '2025-09-05', risk: 'dusuk' }] })
    assert.equal(kalem(q, 'otizm')?.arac, 'isaret')
    assert.match(kalem(q, 'otizm')!.ne, /30 ay üstünde geçerli değil/)
  })
  it('3,5 yaş: görme taraması (36–48 ay) bu vizitte, Lea + sevk eşiği', () => {
    const p = vizitPlani({ dogumIso: '2023-03-01', bugunIso: '2026-09-18' })
    const g = p.kalemler.find((k) => k.kod === 'gorme')!
    assert.equal(g.durum, 'simdi')
    assert.match(g.ne, /Lea/)
    assert.match(g.ne, /0,5/)
  })
  it('prematüre: GİDR düzeltilmiş yaşla, ROP 4. hafta, demir 2. aydan 2 mg/kg', () => {
    const p = vizitPlani({ dogumIso: '2026-07-20', bugunIso: '2026-09-18', gebelikHaftasi: 30, dogumKiloGr: 1350 })
    assert.equal(p.duzeltilmisGun, 60 - 70 < 0 ? 0 : 60 - 70)
    assert.ok(kalem(p, 'rop'))
    assert.equal(kalem(p, 'rop')?.durum, 'gecikti')
    assert.equal(kalem(p, 'demir')?.durum, 'simdi')
    assert.match(kalem(p, 'demir')!.ne, /2 mg\/kg/)
  })
  it('term 4. ay: demir 10 mg/gün (sabit) ve 9. ay Hb', () => {
    assert.match(kalem(vizitPlani({ dogumIso: '2026-05-15', bugunIso: '2026-09-18' }), 'demir')!.ne, /10 mg\/gün/)
    assert.equal(kalem(vizitPlani({ dogumIso: '2025-12-10', bugunIso: '2026-09-18' }), 'hb')?.durum, 'simdi')
  })
  it('hasta seanslarıyla izlem: pencerede muayene varsa yapıldı, yoksa kaçırıldı', () => {
    const p = vizitPlani({ dogumIso: '2026-01-01', bugunIso: '2026-09-18', seanslar: ['2026-03-10', '2026-07-15'] })
    assert.equal(p.izlem.find((v) => v.id === 'ay2')?.durum, 'yapildi')
    assert.equal(p.izlem.find((v) => v.id === 'ay4')?.durum, 'kacirildi')
    assert.equal(p.izlem.find((v) => v.id === 'ay6')?.durum, 'yapildi')
  })
  it('not satırı ve özet deterministik', () => {
    assert.equal(taramaNotSatiri('isitme', 'normal', '2026-09-18'), 'Yenidoğan işitme taraması: normal (18.09.2026).')
    assert.equal(taramaNotSatiri('dvit', 'yapildi', '2026-09-18'), 'D vitamini profilaksisi: başlandı (18.09.2026).')
    assert.match(vizitOzetMetni(vizitPlani({ dogumIso: '2026-08-29', bugunIso: '2026-09-18' })), /15\. gün/)
  })
})
