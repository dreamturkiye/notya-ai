/**
 * PREMATURE-MODUL — KD erken doğum risk motoru: yayımlanmış eşikler, trend, steroid penceresi, temizleme, kart özeti.
 * Her eşik testi kaynağındaki sayıyı birebir kilitler (ACOG PB 234 < 25 mm; SMFM #70 ≤ 25 / ≤ 20 / < 10; CO 713 pencereleri).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  BOS_KAYIT, ESIK, erkenDogumDegerlendir, erkenDogumTemizle, gestasyonCoz, gestasyonGunuTarihte, kartOzeti, steroidPenceresi,
  type ErkenDogumKaydi, type ErkenDogumGirdisi, type ServiksOlcumu,
} from '../engines/erkenDogum'

const SAT = '2026-01-01'
const tarihGunSonra = (g: number) => new Date(Date.UTC(2026, 0, 1) + g * 86_400_000).toISOString().slice(0, 10)
const olcum = (gun: number, mm: number, yontem: 'transvajinal' | 'transabdominal' = 'transvajinal'): ServiksOlcumu => ({ id: `${gun}-${yontem}`, tarih: tarihGunSonra(gun), gestasyonGun: gun, mm, yontem })
const girdi = (k: Partial<ErkenDogumKaydi>, o: Partial<ErkenDogumGirdisi> = {}): ErkenDogumGirdisi => ({ sat: SAT, tdt: null, cogulTipi: null, durum: 'aktif', kayit: { ...BOS_KAYIT, ...k }, ...o })
const bayrak = (s: ReturnType<typeof erkenDogumDegerlendir>, kod: string) => s.bayraklar.find((b) => b.kod === kod)!
const BUGUN = tarihGunSonra(22 * 7 + 3)

describe('gestasyon yardımcıları', () => {
  it('SAT ve düzeltilmiş TDT (TDT − 280) ile gestasyon', () => {
    assert.equal(gestasyonGunuTarihte(SAT, null, tarihGunSonra(154)), 154)
    assert.equal(gestasyonGunuTarihte(SAT, '2026-10-08', tarihGunSonra(154)), 154 + 0) // TDT 2026-10-08 → LMP 2026-01-01
    assert.equal(gestasyonGunuTarihte(null, null, '2026-05-01'), null)
    assert.equal(gestasyonGunuTarihte(SAT, null, '2025-12-01'), null) // gebelikten önce
  })
  it('gestasyonCoz: 22+3, 22, 22,5; aralık dışı null', () => {
    assert.equal(gestasyonCoz('22+3'), 157)
    assert.equal(gestasyonCoz('22'), 154)
    assert.equal(gestasyonCoz('22,5'), 158)
    assert.equal(gestasyonCoz('13+6'), null)
    assert.equal(gestasyonCoz('43'), null)
    assert.equal(gestasyonCoz(''), null)
  })
})

describe('kısa serviks — ACOG < 25 mm, SMFM / FIGO ≤ 25 mm (transvajinal, 16+0–24+0)', () => {
  const kisa = (mm: number, gun = 20 * 7) => bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(gun, mm)] }), BUGUN), 'kisa_serviks')
  it('24 mm: iki tanım da karşılanır', () => { const b = kisa(24); assert.equal(b.durum, 'karsilandi'); assert.match(b.gerekce.join(' '), /ACOG PB 234 \(< 25 mm\): karşılandı · SMFM #70 \/ FIGO \(≤ 25 mm\): karşılandı/) })
  it('tam 25 mm: yalnız SMFM / FIGO; sınır notu', () => { const b = kisa(25); assert.equal(b.durum, 'karsilandi'); assert.match(b.gerekce.join(' '), /ACOG PB 234 \(< 25 mm\): karşılanmadı/); assert.match(b.gerekce.join(' '), /sınırdır/) })
  it('25,1 mm ve 30 mm: karşılanmaz', () => { assert.equal(kisa(25.1).durum, 'karsilanmadi'); assert.equal(kisa(30).durum, 'karsilanmadi') })
  it('pencere sınırları: 16+0 ve 24+0 dahil, 15+6 ve 24+1 dışarıda', () => {
    assert.equal(kisa(20, 16 * 7).durum, 'karsilandi')
    assert.equal(kisa(20, 24 * 7).durum, 'karsilandi')
    assert.equal(kisa(20, 16 * 7 - 1).durum, 'belirsiz')
    assert.equal(kisa(20, 24 * 7 + 1).durum, 'belirsiz')
  })
  it('transabdominal ölçüm kısa serviks sayılmaz (transvajinal gerekir)', () => {
    const b = bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(140, 18, 'transabdominal')] }), BUGUN), 'kisa_serviks')
    assert.equal(b.durum, 'belirsiz')
    assert.match(b.gerekce.join(' '), /transabdominal/)
  })
  it('ölçüm yok: belirsiz ve eksik veri listesinde', () => {
    const s = erkenDogumDegerlendir(girdi({}), BUGUN)
    assert.equal(bayrak(s, 'kisa_serviks').durum, 'belirsiz')
    assert.ok(s.eksikVeri.some((e) => /Serviks uzunluğu ölçümü/.test(e)))
  })
  it('en kısa transvajinal ölçüm esas alınır', () => {
    const b = bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(130, 34), olcum(140, 22), olcum(150, 28)] }), BUGUN), 'kisa_serviks')
    assert.match(b.gerekce[0], /22 mm/)
  })
})

describe('progesteron değerlendirme aralığı — SMFM #70 (≤ 20 mm; 21–25 mm paylaşımlı; tanı < 24+0; tekil; önceki spontan erken doğum yok)', () => {
  const p = (mm: number, gun: number, k: Partial<ErkenDogumKaydi> = {}, o: Partial<ErkenDogumGirdisi> = {}) =>
    bayrak(erkenDogumDegerlendir(girdi({ oncekiSpontanPreterm: false, serviks: [olcum(gun, mm)], ...k }, o), BUGUN), 'progesteron_degerlendirme')
  it('20 mm, 22+0: eşik karşılanır (GRADE 1A)', () => { const b = p(20, 22 * 7); assert.equal(b.durum, 'karsilandi'); assert.match(b.gerekce.join(' '), /GRADE 1A/) })
  it('21 ve 25 mm: paylaşımlı karar aralığı (GRADE 1B)', () => { for (const mm of [21, 25]) { const b = p(mm, 22 * 7); assert.equal(b.durum, 'karsilandi'); assert.match(b.gerekce.join(' '), /GRADE 1B/) } })
  it('26 mm: karşılanmaz', () => assert.equal(p(26, 22 * 7).durum, 'karsilanmadi'))
  it('tanı 23+6 evet, 24+0 hayır (24. haftadan ÖNCE)', () => { assert.equal(p(18, 23 * 7 + 6).durum, 'karsilandi'); assert.equal(p(18, 24 * 7).durum, 'karsilanmadi') })
  it('önceki spontan erken doğum varsa kriter uygulanmaz; öykü girilmediyse belirsiz', () => {
    assert.equal(p(15, 20 * 7, { oncekiSpontanPreterm: true }).durum, 'karsilanmadi')
    assert.equal(p(15, 20 * 7, { oncekiSpontanPreterm: null }).durum, 'belirsiz')
  })
  it('çoğul gebelikte uygulanmaz', () => assert.equal(p(15, 20 * 7, {}, { cogulTipi: 'dikoryonik-diamniyotik' }).durum, 'karsilanmadi'))
  it('hekimin progesteron kaydı gerekçede görünür, doz alanı yok', () => {
    const b = p(18, 20 * 7, { progesteron: { kullaniyor: true, baslangic: tarihGunSonra(21 * 7), yol: 'vajinal' } })
    assert.match(b.gerekce.join(' '), /Progesteron kullanımı kayıtlı/)
    assert.match(b.gerekce.join(' '), /vajinal/)
    assert.doesNotMatch(JSON.stringify(b), /\bmg\b|doz:|\bIU\b/i)
  })
})

describe('serviks < 10 mm, önceki spontan erken doğum, çoğul gebelik, PPROM', () => {
  it('< 10 mm: 9,9 evet, 10 hayır', () => {
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(140, 9.9)] }), BUGUN), 'cok_kisa_serviks').durum, 'karsilandi')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(140, 10)] }), BUGUN), 'cok_kisa_serviks').durum, 'karsilanmadi')
  })
  it('önceki spontan erken doğum: pencerede ölçüm sayısı gösterilir', () => {
    const b = bayrak(erkenDogumDegerlendir(girdi({ oncekiSpontanPreterm: true, serviks: [olcum(120, 35), olcum(140, 33), olcum(170, 31)] }), BUGUN), 'onceki_spontan_preterm')
    assert.equal(b.durum, 'karsilandi')
    assert.match(b.gerekce[0], /2 transvajinal ölçüm/) // 170 gün (24+2) pencere dışında
  })
  it('çoğul gebelik: tekil dışı her tip', () => {
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({}, { cogulTipi: 'monokoryonik-diamniyotik' }), BUGUN), 'cogul_gebelik').durum, 'karsilandi')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({}, { cogulTipi: 'tekil' }), BUGUN), 'cogul_gebelik').durum, 'karsilanmadi')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({}, { cogulTipi: null }), BUGUN), 'cogul_gebelik').durum, 'karsilanmadi')
  })
  it('PPROM kaydı: gestasyon ve geçen gün', () => {
    const s = erkenDogumDegerlendir(girdi({ pprom: { var: true, tarih: tarihGunSonra(25 * 7) } }), tarihGunSonra(25 * 7 + 3))
    assert.equal(bayrak(s, 'pprom').durum, 'karsilandi')
    assert.match(s.pprom!.aciklama, /25\+0/)
    assert.match(s.pprom!.aciklama, /3 gün önce/)
  })
})

describe('trend: yalnız ölçümler ve farklar, kısalma bayrağı yok', () => {
  it('sıralı, fark ve gün aralığı', () => {
    const s = erkenDogumDegerlendir(girdi({ serviks: [olcum(168, 28), olcum(140, 34), olcum(154, 31)] }), BUGUN)
    assert.deepEqual(s.trend.map((t) => [t.gestasyon, t.mm, t.fark, t.gunAralik]), [['20+0', 34, null, null], ['22+0', 31, -3, 14], ['24+0', 28, -3, 14]])
    assert.equal(s.trend[2].pencerede, true)
    assert.ok(!s.bayraklar.some((b) => /kisalma/i.test(b.kod)))
  })
})

describe('steroid penceresi — ACOG CO 713', () => {
  it('sınırlar: 22+6 önce, 23+0 yaşayabilirlik, 24+0–33+6 ana, 34+0–36+6 geç, 37+0 dışı', () => {
    assert.equal(steroidPenceresi(22 * 7 + 6).pencere, 'oncesi')
    assert.equal(steroidPenceresi(23 * 7).pencere, 'yasayabilirlik')
    assert.equal(steroidPenceresi(23 * 7 + 6).pencere, 'yasayabilirlik')
    assert.equal(steroidPenceresi(24 * 7).pencere, 'ana')
    assert.equal(steroidPenceresi(33 * 7 + 6).pencere, 'ana')
    assert.equal(steroidPenceresi(34 * 7).pencere, 'gec')
    assert.equal(steroidPenceresi(36 * 7 + 6).pencere, 'gec')
    assert.equal(steroidPenceresi(37 * 7).pencere, 'disi')
    assert.equal(steroidPenceresi(null).pencere, 'bilinmiyor')
  })
  it('kür günlüğü: her kür gestasyonla etiketlenir, önceki kürden geçen gün hesaplanır', () => {
    const s = erkenDogumDegerlendir(girdi({ steroid: { yapildi: true, kurlar: [{ id: 'a', tarih: tarihGunSonra(28 * 7) }, { id: 'b', tarih: tarihGunSonra(30 * 7 + 2) }] } }), tarihGunSonra(31 * 7))
    assert.deepEqual(s.steroid.satirlar.map((x) => [x.gestasyon, x.pencere, x.oncekindenGun]), [['28+0', 'ana', null], ['30+2', 'ana', 16]])
    assert.equal(s.steroid.guncel!.pencere, 'ana')
  })
  it('doğum yapmış gebelikte güncel pencere gösterilmez', () => {
    assert.equal(erkenDogumDegerlendir(girdi({}, { durum: 'dogum_yapti' }), BUGUN).steroid.guncel, null)
  })
})

describe('kohort nedenleri (yalnız aktif gebelik)', () => {
  it('kısa serviks ve PPROM neden olur; doğum yapmış gebelik ve normal serviks olmaz', () => {
    const k = { serviks: [olcum(140, 22)], pprom: { var: true, tarih: tarihGunSonra(150) } }
    assert.equal(erkenDogumDegerlendir(girdi(k), BUGUN).kohortNedenleri.length, 2)
    assert.equal(erkenDogumDegerlendir(girdi(k, { durum: 'dogum_yapti' }), BUGUN).kohortNedenleri.length, 0)
    assert.equal(erkenDogumDegerlendir(girdi({ serviks: [olcum(140, 40)] }), BUGUN).kohortNedenleri.length, 0)
  })
  it('önceki spontan erken doğum + pencerede ölçüm yok → neden; ölçüm varsa yok', () => {
    assert.equal(erkenDogumDegerlendir(girdi({ oncekiSpontanPreterm: true }), BUGUN).kohortNedenleri.length, 1)
    assert.equal(erkenDogumDegerlendir(girdi({ oncekiSpontanPreterm: true, serviks: [olcum(150, 38)] }), BUGUN).kohortNedenleri.length, 0)
    // 16 haftadan önce pencere henüz açık değil
    assert.equal(erkenDogumDegerlendir(girdi({ oncekiSpontanPreterm: true }), tarihGunSonra(14 * 7)).kohortNedenleri.length, 0)
  })
  it('riskVar progesteron bayrağını saymaz (kısa serviğin gölgesi)', () => {
    assert.equal(erkenDogumDegerlendir(girdi({ serviks: [olcum(140, 40)] }), BUGUN).riskVar, false)
  })
})

describe('erkenDogumTemizle', () => {
  const bugun = '2026-06-01'
  it('geçerli kayıt: sıralı, tekilleştirilmiş, steroid yapildi true olur', () => {
    const { kayit, hata } = erkenDogumTemizle({
      serviks: [{ tarih: '2026-05-10', gestasyonGun: '22+0', mm: '24,5' }, { tarih: '2026-05-10', gestasyonGun: 154, mm: 25, yontem: 'transvajinal' }, { tarih: '2026-04-20', gestasyonGun: 140, mm: 33.04 }],
      steroid: { kurlar: [{ tarih: '2026-05-20' }] }, pprom: { var: true, tarih: '2026-05-19' }, progesteron: { kullaniyor: true, baslangic: '2026-05-01', yol: 'vajinal', doz: '200 mg' },
    }, bugun)
    assert.equal(hata, null)
    assert.deepEqual(kayit.serviks.map((s) => [s.tarih, s.mm, s.gestasyonGun]), [['2026-04-20', 33, 140], ['2026-05-10', 25, 154]])
    assert.equal(kayit.steroid.yapildi, true)
    assert.ok(!('doz' in kayit.progesteron), 'doz alanı saklanmaz')
    assert.equal(kayit.progesteron.yol, 'vajinal')
  })
  it('geçersiz satırlar atılır ve hata döner: gelecek tarih, mm aralığı, gestasyon aralığı', () => {
    assert.match(erkenDogumTemizle({ serviks: [{ tarih: '2026-07-01', gestasyonGun: 154, mm: 25 }] }, bugun).hata!, /İleri tarihli/)
    assert.match(erkenDogumTemizle({ serviks: [{ tarih: '2026-05-01', gestasyonGun: 154, mm: 0 }] }, bugun).hata!, /1–80 mm/)
    assert.match(erkenDogumTemizle({ serviks: [{ tarih: '2026-05-01', gestasyonGun: 50, mm: 25 }] }, bugun).hata!, /14\+0–42\+0/)
    assert.match(erkenDogumTemizle({ steroid: { kurlar: [{ tarih: 'bozuk' }] } }, bugun).hata!, /Steroid/)
    assert.equal(erkenDogumTemizle({ serviks: [{ tarih: '2026-05-01', gestasyonGun: 154, mm: 25 }, { tarih: 'x', gestasyonGun: 1, mm: 1 }] }, bugun).kayit.serviks.length, 1)
  })
  it('çöp girdi boş kayda döner', () => {
    for (const ham of [null, undefined, 5, 'x', [], { serviks: 'x', pprom: 3 }]) assert.deepEqual(erkenDogumTemizle(ham, bugun).kayit.serviks, [])
    assert.deepEqual(erkenDogumTemizle(null, bugun).kayit, BOS_KAYIT)
  })
  it('pprom yok ise tarih saklanmaz', () => assert.equal(erkenDogumTemizle({ pprom: { var: false, tarih: '2026-05-01' } }, bugun).kayit.pprom.tarih, null))
})

describe('kartOzeti — taburcu paketine taşınan özet', () => {
  it('kayıt yoksa ya da hiçbiri bilinmiyorsa null', () => {
    assert.equal(kartOzeti(null, 30), null)
    assert.equal(kartOzeti(BOS_KAYIT, 30), null)
  })
  it('steroid kürü var → true; PPROM ve magnezyum olduğu gibi; hafta aralık dışı null', () => {
    const k: ErkenDogumKaydi = { ...BOS_KAYIT, steroid: { yapildi: true, kurlar: [{ id: 'a', tarih: '2026-05-01' }] }, pprom: { var: false, tarih: null }, magnezyum: { verildi: true, tarih: '2026-05-02' } }
    assert.deepEqual(kartOzeti(k, 29.57), { gestasyonHafta: 29.57, steroidKuru: true, pprom: false, magnezyum: true })
    assert.equal(kartOzeti(k, 12)!.gestasyonHafta, null)
  })
  it('steroid "hayır" kaydı false olarak taşınır', () => {
    assert.equal(kartOzeti({ ...BOS_KAYIT, steroid: { yapildi: false, kurlar: [] } }, 33)!.steroidKuru, false)
  })
})

describe('motor doz / sipariş üretmez', () => {
  it('çıktı metinlerinde doz birimi ya da emir kipi yok', () => {
    const s = erkenDogumDegerlendir(girdi({ oncekiSpontanPreterm: false, serviks: [olcum(140, 8)], pprom: { var: true, tarih: tarihGunSonra(140) }, progesteron: { kullaniyor: true, baslangic: null, yol: 'vajinal' } }), BUGUN)
    const metin = JSON.stringify([s.bayraklar, s.steroid, s.progesteron, s.pprom])
    assert.doesNotMatch(metin, /\b\d+\s?(mg|mcg|µg|IU|ml|mL)\b/)
    assert.doesNotMatch(metin, /(başlayın|verin|yapın|uygulayın|isteyin)/i)
  })
  it('ESIK sabitleri kaynaktaki sayılar', () => {
    assert.equal(ESIK.acogMm, 25); assert.equal(ESIK.smfmMm, 25); assert.equal(ESIK.progesteronEsikMm, 20); assert.equal(ESIK.cokKisaMm, 10)
    assert.equal(ESIK.pencereBas, 112); assert.equal(ESIK.pencereSon, 168)
    assert.equal(ESIK.steroid.anaBas, 168); assert.equal(ESIK.steroid.anaSon, 237); assert.equal(ESIK.steroid.gecBas, 238); assert.equal(ESIK.steroid.gecSon, 258)
  })
})
