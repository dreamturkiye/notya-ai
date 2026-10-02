/**
 * NOTYA-KADEMELI-01d (Dr. Gökhan via Kaan, 2026-10-02) — the growth answer of the live test, as a unit test.
 *
 * The series is exactly the one of the live screenshot (values and dates as given by Kaan). The record's birth date
 * was not given: 15.06.2024 and male are the date and sex for which the Neyzi engine reproduces every percentile of
 * the screenshot (weight p97 / p36 / p49 / p49, length p98 / p48 / p52 / p53, head circumference p93 / p39 / p52) —
 * derived for this test, not a patient's data.
 *
 * Expected: no drift warning, one inconsistency note, no VKİ comparison that uses the unverified weight.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { KAYMA_BASLANGIC_AY, dogrulanmisSatirlar, olcumSatirlari, persentilKaymalari, buyumeHizlari, tutarsizOlcumler } from '../engines/buyume'
import { PEDIATRI_SORGU } from '../sorgu'
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'

const DOGUM = '2024-06-15'
const SERI = [
  { tarih: DOGUM, kilo: 4.25, boy: 54.5, basCevresi: 37 },
  { tarih: '2025-11-15', kilo: 10.8, boy: 82, basCevresi: 47.8 },
  { tarih: '2026-05-15', kilo: 16.5 },
  { tarih: '2026-07-08', kilo: 12.8, boy: 89 },
  { tarih: '2026-09-24', kilo: 13.3, boy: 91, basCevresi: 49.7 },
]
const satirlar = () => olcumSatirlari('neyzi', 'male', DOGUM, SERI)
const p = (tarih: string, param: 'kilo' | 'boy' | 'basCevresi') => Math.round(satirlar().find((s) => s.tarih === tarih)!.sonuc[param]!.persentil)

const hasta: DosyaHastasi = { ad: 'Test', dogumIso: DOGUM, cinsiyet: 'male', brans: 'pediatri', bugunIso: '2026-10-02' }
const BIRIM = { kilo: 'kg', boy: 'cm', basCevresi: 'cm' } as const
function olaylar(seri: { tarih: string; kilo?: number; boy?: number; basCevresi?: number }[] = SERI): DosyaOlayi[] {
  return seri.flatMap((o, n) => (['kilo', 'boy', 'basCevresi'] as const).flatMap((tur) => (o[tur] == null ? [] : [{
    tarih: o.tarih, kaynak: 'olcum' as const, tur, durum: 'sonuclandi' as const, metin: `${tur} ${o[tur]}`, deger: o[tur]!, birim: BIRIM[tur], kaynakId: `v${n}`, vizitId: `v${n}`,
  }])))
}

describe('NOTYA-KADEMELI-01d — tutarsız ölçüm, doğumdan kayma ve VKİ', () => {
  it('motor, ekran görüntüsündeki persentilleri verir (seri doğru kuruldu)', () => {
    assert.deepEqual([p(DOGUM, 'kilo'), p('2025-11-15', 'kilo'), p('2026-07-08', 'kilo'), p('2026-09-24', 'kilo')], [97, 36, 49, 49])
    assert.deepEqual([p(DOGUM, 'boy'), p('2025-11-15', 'boy'), p('2026-07-08', 'boy'), p('2026-09-24', 'boy')], [98, 48, 52, 53])
    assert.deepEqual([p(DOGUM, 'basCevresi'), p('2025-11-15', 'basCevresi'), p('2026-09-24', 'basCevresi')], [93, 39, 52])
  })

  it('eski kural: doğum değerinden bugüne üç ölçümde de "kayma" çıkıyordu (yanıltıcı uyarının kaynağı)', () => {
    const eski = persentilKaymalari(satirlar())
    assert.deepEqual(eski.filter((k) => k.oncekiTarih === DOGUM).map((k) => k.param).sort(), ['basCevresi', 'boy', 'kilo'])
    assert.ok(eski.every((k) => k.cizgi < 0))
  })

  it('16,5 kg tek tutarsız ölçümdür: önceki ve sonraki ölçümler onunla çelişir, birbirleriyle çelişmez', () => {
    const t = tutarsizOlcumler(satirlar())
    assert.equal(t.length, 1)
    assert.deepEqual({ param: t[0].param, tarih: t[0].tarih, deger: t[0].deger }, { param: 'kilo', tarih: '2026-05-15', deger: 16.5 })
    assert.equal(t[0].onceki.deger, 10.8)
    assert.deepEqual(t[0].sonrakiler.map((s) => s.deger), [12.8, 13.3])
  })

  it('doğrulanmış seri: 6. aydan sonra kayma yok; hız tutarsız ölçümü kullanmaz', () => {
    const gecerli = dogrulanmisSatirlar(satirlar(), tutarsizOlcumler(satirlar()))
    assert.equal(KAYMA_BASLANGIC_AY, 6)
    assert.deepEqual(persentilKaymalari(gecerli, 2, KAYMA_BASLANGIC_AY), [])
    const kiloHizi = buyumeHizlari(gecerli).find((h) => h.param === 'kilo')!
    assert.equal(kiloHizi.oncekiTarih, '2025-11-15')
    assert.ok(Math.abs(kiloHizi.fark - 2.5) < 1e-9)
    // The unverified weight would have been the "previous" measurement of nothing, but it is gone from the series.
    assert.ok(!gecerli.some((s) => s.deger.kilo === 16.5))
  })

  it('aynı gün boy da kayıtlıysa: o günün VKİ değeri hesaplanmaz, VKİ kayması çıkmaz', () => {
    // Variant for the VKİ rule only: a length on the day of the unverified weight (89 cm is the series' own next value).
    const seri = SERI.map((o) => (o.tarih === '2026-05-15' ? { ...o, boy: 89 } : o))
    const ham = olcumSatirlari('neyzi', 'male', DOGUM, seri)
    assert.ok(ham.find((s) => s.tarih === '2026-05-15')!.sonuc.vki!.persentil > 99, 'ham seride VKİ > p99')
    assert.ok(persentilKaymalari(ham, 2, KAYMA_BASLANGIC_AY).some((k) => k.param === 'vki'), 'eski seride VKİ kayması vardı')
    const gecerli = dogrulanmisSatirlar(ham, tutarsizOlcumler(ham))
    const gun = gecerli.find((s) => s.tarih === '2026-05-15')!
    assert.equal(gun.deger.vki, undefined)
    assert.equal(gun.deger.boy, 89)
    assert.ok(!persentilKaymalari(gecerli, 2, KAYMA_BASLANGIC_AY).some((k) => k.param === 'vki'))
  })

  it('kanıt (Soru 3): kayma uyarısı yok, tek tutarsızlık notu, doğumdan düşüş yorumu yasak', () => {
    const b = PEDIATRI_SORGU.buyume(olaylar(), hasta)
    const blok = b.satirlar.join('\n')
    assert.ok(!/- Kayma:/.test(blok), blok)
    assert.equal(b.bayraklar.filter((x) => x.tur === 'buyume').length, 0)
    assert.equal(b.satirlar.filter((s) => s.startsWith('TUTARSIZ ÖLÇÜM')).length, 1)
    assert.match(blok, /TUTARSIZ ÖLÇÜM — 15\.05\.2026 kilo 16,5 kg: önceki 10,8 kg \(15\.11\.2025\) ve sonraki 12,8 kg \(08\.07\.2026\), 13,3 kg \(24\.09\.2026\) ölçümleriyle uyumsuz/)
    assert.equal(b.bayraklar.filter((x) => x.tur === 'celiski').length, 1)
    // The unverified value has no percentile in the evidence and no measurement line of its own.
    assert.ok(!/15\.05\.2026 \(/.test(blok), blok)
    assert.ok(!/p99|p100|>99/.test(blok), blok)
    assert.match(blok, /İlk 6 aydaki ölçümler \(doğum dahil\) yalnız öyküdür/)
    // Velocity from validated measurements only.
    assert.match(blok, /Kilo artışı: \+2,5 kg \(15\.11\.2025 → 24\.09\.2026/)
    // Birth values stay visible as history.
    assert.match(blok, /- 15\.06\.2024 \(0 günlük\): Kilo 4,25 kg \(p97/)
  })

  it('kanıt özeti: son üç ölçüm p49–p53, bir tutarsızlık, kayma yok', () => {
    const o = PEDIATRI_SORGU.buyume(olaylar(), hasta).ozet!
    assert.deepEqual(o.son.map((s) => [s.ad, Math.round(s.persentil!)]), [['kilo', 49], ['boy', 53], ['baş çevresi', 52]])
    assert.equal(o.tutarsizlik.length, 1)
    assert.match(o.tutarsizlik[0], /^15 Mayıs 2026 tarihli 16,5 kg kilo kaydı, sonraki 12,8 kg ve 13,3 kg ölçümleriyle uyumsuz/)
    assert.deepEqual(o.kayma, [])
  })

  it('doğrulanmış bir ölçüm pencere içinde iki majör çizgi düşerse uyarı çıkar — doğrulama önerisi olarak', () => {
    // 6. aydan sonra p75 üstünden p25 altına inen kilo (iki çizgi: 50 ve 25), son ölçüm olduğu için tutarsız sayılmaz.
    const seri = [
      { tarih: DOGUM, kilo: 4.25 },
      { tarih: '2025-06-15', kilo: 10.9 },
      { tarih: '2025-12-15', kilo: 11.9 },
      { tarih: '2026-09-24', kilo: 11.9 },
    ]
    const b = PEDIATRI_SORGU.buyume(olaylar(seri), hasta)
    const kayma = b.bayraklar.filter((x) => x.tur === 'buyume')
    assert.equal(kayma.length, 1, b.satirlar.join('\n'))
    assert.match(kayma[0].metin, /majör persentil çizgisi aşağı — ölçümün doğrulanması önerilir/)
    assert.ok(!/15\.06\.2024 →/.test(kayma[0].metin), 'kayma doğum değerinden başlatıldı')
    assert.ok(!/düşüş|alarm|acil/i.test(kayma[0].metin))
  })
})
