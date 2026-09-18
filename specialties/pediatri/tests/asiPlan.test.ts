import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ULUSAL_TAKVIM } from '@/lib/asi/ulusalAsiTakvimi'
import { asiPlani, takvimAdiSeri, kayitSerisi, takvimDozlari, onerilenDonem, asiOzetMetni, type AsiKaydi } from '../engines/asiPlan'
import { yasGunCoz, dogumVeyaYasCoz, yasMetni } from '../engines/girdi'

let n = 0
const k = (ad: string, tarih: string | null, ek: Partial<AsiKaydi> = {}): AsiKaydi => ({ id: `k${++n}`, ad, tarih, kaynak: 'kayit', ...ek })
const doz = (p: ReturnType<typeof asiPlani>, seri: string, no: number) => p.seriler.find((s) => s.seri === seri)!.dozlar.find((d) => d.no === no)!

describe('aşı planı — takvim bağlama', () => {
  it('ulusalAsiTakvimi her satırı bir seriye bağlanır (takvim kopyalanmaz)', () => {
    for (const d of ULUSAL_TAKVIM) for (const a of d.asilar) assert.ok(takvimAdiSeri(a.ad), `eşleşmeyen takvim satırı: ${a.ad}`)
    const dozlar = takvimDozlari({ donem: 'altili' })
    assert.equal(dozlar.length, ULUSAL_TAKVIM.reduce((t, d) => t + d.asilar.length, 0))
    assert.equal(dozlar.filter((d) => d.seri === 'karma').length, 5) // 2/4/6/18 ay + okul öncesi 4'lü rapel
  })
  it("önceki düzen: Hep B 0-1-6 + 5'li karma", () => {
    const hepb = takvimDozlari({ donem: 'besli' }).filter((d) => d.seri === 'hepb')
    assert.deepEqual(hepb.map((d) => d.onerilenGun), [0, 30, 180])
  })
  it('serbest kayıt adları seriye eşleşir', () => {
    assert.equal(kayitSerisi("6'lı Karma (DaBT-İPA-Hib-HepB)"), 'karma')
    assert.equal(kayitSerisi('5li karma'), 'karma')
    assert.equal(kayitSerisi("DaBT-İPA (4'lü Karma)"), 'karma')
    assert.equal(kayitSerisi('Td (Tetanoz-Difteri, erişkin tip)'), 'td')
    assert.equal(kayitSerisi('Hepatit B'), 'hepb')
    assert.equal(kayitSerisi('Hep A'), 'hepa')
    assert.equal(kayitSerisi('Prevenar 13'), 'kpa')
    assert.equal(kayitSerisi('KKK (Kızamık-Kızamıkçık-Kabakulak)'), 'kkk')
    assert.equal(kayitSerisi('Suçiçeği (Varisella)'), 'vzv')
    assert.equal(kayitSerisi('Rotarix'), 'rota')
    assert.equal(kayitSerisi('Bexsero'), 'menb')
    assert.equal(kayitSerisi('Meningokok B'), 'menb')
    assert.equal(kayitSerisi('Nimenrix'), 'menacwy')
    assert.equal(kayitSerisi('İnfluenza (Grip)'), 'grip')
    assert.equal(kayitSerisi('Kuduz'), null)
  })
  it('dönem önerisi: kayıttaki ürün, yoksa doğum tarihi', () => {
    assert.equal(onerilenDonem('2025-06-01', []), 'altili')
    assert.equal(onerilenDonem('2023-06-01', []), 'besli')
    assert.equal(onerilenDonem('2025-06-01', [k("5'li karma", '2025-08-01')]), 'besli')
  })
})

describe('aşı planı — durum ve telafi', () => {
  it('takvimde giden bebek: yapılanlar işaretli, sıradaki yaklaşıyor, gecikme yok', () => {
    const p = asiPlani({ dogumIso: '2026-06-01', bugunIso: '2026-09-15', donem: 'altili', kayitlar: [
      k('Hepatit B', '2026-06-01'), k('BCG (Verem)', '2026-08-01'), k("6'lı Karma (DaBT-İPA-Hib-HepB)", '2026-08-01'), k('KPA (Konjuge Pnömokok)', '2026-08-01'),
    ] })
    assert.equal(doz(p, 'karma', 1).durum, 'yapildi')
    assert.equal(doz(p, 'karma', 2).durum, 'yaklasiyor')
    assert.equal(doz(p, 'karma', 2).plan, '2026-10-01')
    assert.equal(p.gecikmis.length, 0)
    assert.equal(p.bugunYapilabilir.length, 0)
    assert.equal(p.sonrakiZiyaret?.tarih, '2026-10-01')
    assert.deepEqual(p.sonrakiZiyaret?.dozlar.map((d) => d.seri).sort(), ['karma', 'kpa'])
  })
  it('hiç aşısı olmayan 10 aylık: bugün yapılabilecekler + zincir minimum aralıkla ileri kayar (seri baştan başlamaz)', () => {
    const p = asiPlani({ dogumIso: '2025-11-10', bugunIso: '2026-09-15', donem: 'altili', kayitlar: [k('Hepatit B', '2025-11-10')] })
    const bugun = p.bugunYapilabilir.map((d) => `${d.seri}${d.no}`).sort()
    assert.deepEqual(bugun, ['bcg1', 'karma1', 'kpa1', 'opa1'])
    assert.equal(doz(p, 'karma', 2).plan, '2026-10-13') // +28 gün
    assert.equal(doz(p, 'karma', 3).plan, '2026-11-10') // +28 gün
    assert.equal(doz(p, 'karma', 3).telafi, true)
    assert.ok(p.gecikmis.some((d) => d.seri === 'karma' && d.no === 1))
    assert.ok(doz(p, 'karma', 1).gecikmeGun > 200)
  })
  it('yarım seri: 1. doz 2. ayda yapılmış, 9. ayda gelen çocukta 2. dozdan devam — 1. doz korunur', () => {
    const p = asiPlani({ dogumIso: '2025-12-01', bugunIso: '2026-09-15', donem: 'altili', kayitlar: [k("6'lı karma", '2026-02-01')] })
    assert.equal(doz(p, 'karma', 1).durum, 'yapildi')
    assert.equal(doz(p, 'karma', 2).durum, 'bugun')
    assert.equal(doz(p, 'karma', 3).plan, '2026-10-13')
    // rapel: 18. ay önerisi, 3. dozdan ≥ 180 gün sonradan daha geç → takvimdeki yaşında kalır
    assert.equal(doz(p, 'karma', 4).plan, '2027-06-01')
    assert.equal(doz(p, 'karma', 4).telafi, false)
  })
  it('canlı aşılar: KKK 10 gün önce yapılmışsa suçiçeği KKK + 28 güne kayar', () => {
    const p = asiPlani({ dogumIso: '2025-08-01', bugunIso: '2026-09-15', donem: 'altili', kayitlar: [k('KKK', '2026-09-05')] })
    assert.equal(doz(p, 'vzv', 1).plan, '2026-10-03')
    assert.match(doz(p, 'vzv', 1).uyarilar.join(' '), /canlı aşılar/)
  })
  it('prematüre < 2000 g, önceki düzen: Hep B 0-1-2-6 (öneri notu ile)', () => {
    const p = asiPlani({ dogumIso: '2024-06-01', bugunIso: '2024-07-15', donem: 'besli', dogumKiloGr: 1650, gebelikHaftasi: 31.4, kayitlar: [] })
    const hepb = p.seriler.find((s) => s.seri === 'hepb')!.dozlar
    assert.equal(hepb.length, 4)
    assert.deepEqual(hepb.map((d) => d.onerilenGun ?? d.onerilenAy * 30), [0, 30, 60, 180])
    assert.ok(p.notlar.some((x) => /2000 g/.test(x) && /TND 2026/.test(x)))
    assert.ok(p.notlar.some((x) => /takvim yaşı/.test(x)))
  })
  it("anne HBsAg(+), ≥ 2000 g: 1. ayda ek doz YOK (TND 2026) — HBIG notu", () => {
    const p = asiPlani({ dogumIso: '2026-08-01', bugunIso: '2026-09-15', donem: 'altili', anneHbsag: 'pozitif', kayitlar: [k('Hepatit B', '2026-08-01')] })
    assert.equal(p.seriler.find((s) => s.seri === 'hepb')!.dozlar.length, 1)
    assert.ok(p.notlar.some((x) => /HBIG/.test(x) && /ek doz yok/.test(x)))
  })
  it("< 2000 g, 6'lı dönem: doğum dozu sayılmaz + 1. ayda tekli; anne HBsAg(−) ise doğum dozu yok", () => {
    const poz = asiPlani({ dogumIso: '2026-08-01', bugunIso: '2026-09-15', donem: 'altili', dogumKiloGr: 1600, kayitlar: [k('Hepatit B', '2026-08-01')] })
    const hepb = poz.seriler.find((s) => s.seri === 'hepb')!.dozlar
    assert.deepEqual(hepb.map((d) => d.etiket), ['Doğum dozu (seriye sayılmaz)', 'Tekli doz (< 2000 g)'])
    assert.equal(hepb[1].durum, 'bugun')
    const neg = asiPlani({ dogumIso: '2026-08-01', bugunIso: '2026-09-15', donem: 'altili', dogumKiloGr: 1600, anneHbsag: 'negatif', kayitlar: [] })
    assert.deepEqual(neg.seriler.find((s) => s.seri === 'hepb')!.dozlar.map((d) => d.onerilenAy), [1])
  })
  it('GBP: minimum aralıktan önce yapılan doz geçersiz — yalnız o doz tekrarlanır, seri baştan başlamaz', () => {
    const p = asiPlani({ dogumIso: '2026-01-01', bugunIso: '2026-09-15', donem: 'altili', kayitlar: [k("6'lı karma", '2026-03-01'), k("6'lı karma", '2026-03-15'), k("6'lı karma", '2026-05-01')] })
    const d2 = doz(p, 'karma', 2)
    assert.equal(d2.durum, 'yapildi')
    assert.equal(d2.kayit?.tarih, '2026-05-01')
    assert.equal(d2.gecersizler.length, 1)
    assert.match(d2.uyarilar.join(' '), /geçersiz/)
    assert.equal(doz(p, 'karma', 1).kayit?.tarih, '2026-03-01')
    // hekim kapatırsa uyarı olarak kalır, sayılır
    const q = asiPlani({ dogumIso: '2026-01-01', bugunIso: '2026-09-15', donem: 'altili', kisaAralikGecersiz: false, kayitlar: [k("6'lı karma", '2026-03-01'), k("6'lı karma", '2026-03-15')] })
    assert.equal(doz(q, 'karma', 2).kayit?.tarih, '2026-03-15')
  })
  it('Hep B 3. doz 1. dozdan ≥ 16 hafta (GBP)', () => {
    const p = asiPlani({ dogumIso: '2024-01-01', bugunIso: '2024-03-05', donem: 'besli', kayitlar: [k('Hepatit B', '2024-01-01'), k('Hepatit B', '2024-02-01')] })
    assert.ok(doz(p, 'hepb', 3).plan! >= '2024-04-22')
  })
  it('GBP: 72 ay üstünde DaBT-İPA-Hib uygulanmaz; aşısız 6 yaş üstüne BCG gerekmez; hiç aşısız çocuğa genelge tablosu', () => {
    const p = asiPlani({ dogumIso: '2019-01-01', bugunIso: '2026-09-15', donem: 'besli', kayitlar: [] })
    assert.equal(doz(p, 'karma', 1).durum, 'yas_disi')
    assert.equal(doz(p, 'bcg', 1).durum, 'yas_disi')
    assert.match(p.hicAsisiz!.baslik, /72 ay ve üstü/)
    assert.ok(!p.bugunYapilabilir.some((d) => d.seri === 'karma' && d.no <= 4))
    const q = asiPlani({ dogumIso: '2024-06-01', bugunIso: '2026-09-15', donem: 'besli', kayitlar: [] })
    assert.match(q.hicAsisiz!.baslik, /12–71 ay/)
    assert.equal(asiPlani({ dogumIso: '2024-06-01', bugunIso: '2026-09-15', donem: 'besli', kayitlar: [k('KKK', '2025-06-10')] }).hicAsisiz, null)
  })
  it('prematüre < 34 hafta: BCG postkonsepsiyonel 34 haftadan önce planlanmaz; 3 ay sonrası BCG için PPD notu', () => {
    const p = asiPlani({ dogumIso: '2026-07-01', bugunIso: '2026-09-15', donem: 'altili', gebelikHaftasi: 24, kayitlar: [] })
    assert.ok(doz(p, 'bcg', 1).plan! >= '2026-09-09') // 24 + 10 hafta
    assert.match(doz(p, 'bcg', 1).uyarilar.join(' '), /34 hafta/)
    assert.ok(p.notlar.some((x) => /ROP/.test(x)))
    const q = asiPlani({ dogumIso: '2026-03-01', bugunIso: '2026-09-15', donem: 'altili', kayitlar: [] })
    assert.ok(q.seriler.find((s) => s.seri === 'bcg')!.oneriler.some((o) => /PPD/.test(o)))
  })
  it('BCG, KKK sonrası 4 hafta beklenir (GBP)', () => {
    const p = asiPlani({ dogumIso: '2025-08-01', bugunIso: '2026-09-15', donem: 'altili', kayitlar: [k('KKK', '2026-09-05')] })
    assert.equal(doz(p, 'bcg', 1).plan, '2026-10-03')
  })
  it('48. ay: KKK 2 + DaBT-İPA + suçiçeği 2 (takvim bağlı)', () => {
    const p = asiPlani({ dogumIso: '2022-06-01', bugunIso: '2026-09-15', donem: 'besli', kayitlar: [] })
    assert.equal(doz(p, 'kkk', 2).donemEtiket, '48. ay')
    assert.equal(doz(p, 'karma', 5).donemEtiket, '48. ay')
    assert.equal(doz(p, 'vzv', 2).onerilen, '2026-06-01')
  })
  it('yaşa göre öneri: 3 yaşında KPA eksik → tek doz önerisi, hekim kilitler', () => {
    const p = asiPlani({ dogumIso: '2023-06-01', bugunIso: '2026-09-15', donem: 'besli', kayitlar: [] })
    assert.ok(p.seriler.find((s) => s.seri === 'kpa')!.oneriler.some((o) => /tek doz/.test(o) && /hekim kilitler/.test(o)))
  })
  it('hekim ön ayarı aralığı değiştirir', () => {
    const p = asiPlani({ dogumIso: '2025-12-01', bugunIso: '2026-09-15', donem: 'altili', kayitlar: [k("6'lı karma", '2026-02-01')],
      kurallar: { karma: { minYasGun: { 1: 42 }, minAralikGun: { 2: 28, 3: 60, 4: 180, 5: 180 }, kaynak: 'hekim', dogrulandi: true } } })
    assert.equal(doz(p, 'karma', 3).plan, '2026-11-14')
  })
  it('özel aşılar ayrı grup; eşleşmeyen kayıt kaybolmaz; özet metni', () => {
    const p = asiPlani({ dogumIso: '2026-05-01', bugunIso: '2026-09-15', donem: 'altili', kayitlar: [k('Rotarix', '2026-07-01'), k('Kuduz', '2026-08-01')] })
    assert.equal(p.ozel.find((o) => o.kod === 'rota')!.kayitlar.length, 1)
    assert.equal(p.ozel.find((o) => o.kod === 'rota')!.uygunluk, 'uygun')
    assert.equal(p.ozel.find((o) => o.kod === 'hpv')!.uygunluk, 'erken')
    assert.equal(p.eslesmeyen.length, 1)
    assert.match(asiOzetMetni(p, '2026-09-15'), /baştan başlatılmadı/)
  })
})

describe('girdi — yaş yazımı', () => {
  it('"14 aylık" · "2 yaş 3 ay" · "3 haftalık" · "10 günlük"', () => {
    assert.equal(yasGunCoz('14 aylık'), Math.round(14 * 30.4375))
    assert.equal(yasGunCoz('2 yaş 3 ay'), Math.round(2 * 365.25 + 3 * 30.4375))
    assert.equal(yasGunCoz('2,5 yaş'), Math.round(2.5 * 365.25))
    assert.equal(yasGunCoz('3 haftalık'), 21)
    assert.equal(yasGunCoz('10 günlük'), 10)
    assert.equal(yasGunCoz('1y 3a'), Math.round(365.25 + 3 * 30.4375))
    assert.equal(yasGunCoz('14'), null)
    assert.equal(yasGunCoz('2 yaş 3'), null)
  })
  it('doğum alanı tarih ya da yaş kabul eder, yaşta yaklaşık işaretler', () => {
    assert.deepEqual(dogumVeyaYasCoz('12.03.2024', '2026-09-15'), { iso: '2024-03-12', yaklasik: false })
    const y = dogumVeyaYasCoz('10 günlük', '2026-09-15')!
    assert.deepEqual(y, { iso: '2026-09-05', yaklasik: true })
    // takvim ayı: "18 aylık" ekranda yine 18 aylık görünür
    const a = dogumVeyaYasCoz('18 aylık', '2026-09-19')!
    assert.equal(a.iso, '2025-03-19')
    assert.equal(yasMetni(a.iso, '2026-09-19'), '18 aylık')
    assert.equal(dogumVeyaYasCoz('2 yaş 3 ay', '2026-09-19')!.iso, '2024-06-19')
  })
})
