/**
 * WHATSAPP-ONBURO-01 — the Turkish pack's rules: booking intent (phrasings, typos, Turkish I/İ folding, negation and
 * question guards, no false positive on cancel / reschedule), day and part-of-day wishes, the medical and emergency
 * guards, the deterministic sheet rules and the name check. Pure, no network. Synthetic text only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TR_ON_BURO as dil, randevuKelimesiMi } from './dil/tr'
import { kuralNiyeti } from '../whatsapp/niyet'
import { slotSec } from './slot'
import type { Slot } from '../../randevu/v2/slot'

const TZ = 'Europe/Istanbul'
/** Thursday 12 November 2026, 12:00 Istanbul. */
const SIMDI = new Date('2026-11-12T09:00:00Z')

describe('randevu isteği: ifadeler', () => {
  const istek = [
    'Randevu almak istiyorum', 'randevu alabilir miyim', 'RANDEVU ALMAK İSTİYORUM', 'randevu almak ıstıyorum', 'Randevu istiyorum',
    'randevu', 'Yeni randevu', 'randevu lütfen', 'bana randevu verir misiniz', 'bir randevu rica ediyorum', 'randevu oluşturabilir misiniz',
    'Merhaba, randevu almak istiyorum', 'yarın için randevu alabilir miyim', 'salı günü randevu var mı', 'randevu lazım',
    'en yakın ne zaman gelebilirim', 'boş saatiniz var mı', 'muayene olmak istiyorum', 'kontrole gelmek istiyorum', 'randevum yok, randevu almak istiyorum',
    'randevu alicam', 'randevu alabilirmiyim',
  ]
  for (const m of istek) it(`"${m}" → istek`, () => assert.equal(dil.randevuNiyeti(m), 'istek'))

  const yazimHatali = ['randavu almak istiyorum', 'randvu almak istiyorum', 'rnadevu alabilir miyim', 'randevuu istiyorum', 'randevu almak istyorum', 'randevü almak istiyom']
  for (const m of yazimHatali) it(`yazım hatası "${m}" → istek`, () => assert.equal(dil.randevuNiyeti(m), 'istek'))

  it('Türkçe I/İ katlama: büyük harf, noktalı / noktasız', () => {
    for (const m of ['RANDEVU ISTIYORUM', 'RANDEVU İSTİYORUM', 'Randevu Istıyorum', 'randevu ıstıyorum']) assert.equal(dil.randevuNiyeti(m), 'istek', m)
    assert.ok(randevuKelimesiMi('randevu') && randevuKelimesiMi('randevuyu') && randevuKelimesiMi('randavu'))
    assert.ok(!randevuKelimesiMi('rande') && !randevuKelimesiMi('mandevu'))
  })
})

describe('randevu isteği: koruyucular', () => {
  const olumsuz = ['randevu almak istemiyorum', 'randevu istemiyorum', 'randevu almayacağım', 'randevuya gerek yok değil mi', 'randevu almaktan vazgeçtim', 'belki randevu alırım', 'randevu almayı düşünüyorum']
  for (const m of olumsuz) it(`olumsuz / belirsiz "${m}" → istek DEĞİL`, () => assert.notEqual(dil.randevuNiyeti(m), 'istek'))

  const soru = ['randevum ne zaman', 'randevum var mı', 'randevum saat kaçta', 'randevum onaylandı mı', 'randevu ücreti ne kadar', 'randevu nasıl alınır', 'randevu aldım', 'randevu almıştım geçen hafta', 'randevu saatimi öğrenebilir miyim']
  for (const m of soru) it(`soru / geçmiş "${m}" → istek DEĞİL`, () => assert.notEqual(dil.randevuNiyeti(m), 'istek'))

  const iptalErteleme = ['randevumu iptal etmek istiyorum', 'randevuyu iptal edin', 'randevumu ertelemek istiyorum', 'randevuyu başka güne alabilir miyiz', 'randevuya gelemiyorum', 'randevu saatini değiştirebilir miyiz', 'iptal']
  for (const m of iptalErteleme) {
    it(`iptal / erteleme "${m}" → istek DEĞİL, mevcut kural akışında kalır`, () => {
      assert.notEqual(dil.randevuNiyeti(m), 'istek')
      const k = kuralNiyeti(m)
      assert.ok(k && (k.niyet === 'iptal' || k.niyet === 'yeniden_planla'), `kuralNiyeti: ${JSON.stringify(k)}`)
    })
  }

  it('ilgisiz mesaj, boş mesaj ve çok uzun mesaj → yok', () => {
    for (const m of ['merhaba', 'teşekkürler', '', '👍', 'otoparkınız var mı']) assert.equal(dil.randevuNiyeti(m), 'yok', m)
    assert.equal(dil.randevuNiyeti('randevu almak istiyorum ' + 'çünkü uzun zamandır bekliyorum ve '.repeat(4)), 'yok')
  })
})

describe('gün / saat dilimi isteği ve seçim', () => {
  it('yarın, hafta günü, tarih', () => {
    assert.equal(dil.tercih('yarın', SIMDI, TZ)?.gun, '2026-11-13')
    assert.equal(dil.tercih('salı olur mu', SIMDI, TZ)?.gun, '2026-11-17')
    assert.equal(dil.tercih('SALI', SIMDI, TZ)?.gun, '2026-11-17')
    assert.equal(dil.tercih('20 kasım', SIMDI, TZ)?.gun, '2026-11-20')
    assert.equal(dil.tercih('20.11 uygun mu', SIMDI, TZ)?.gun, '2026-11-20')
    assert.equal(dil.tercih('05.01', SIMDI, TZ)?.gun, '2027-01-05', 'geçmiş gün-ay gelecek yıla taşınır')
  })
  it('sabah / öğleden sonra / başka gün / daha geç', () => {
    assert.equal(dil.tercih('sabah olsun', SIMDI, TZ)?.dilim, 'sabah')
    assert.equal(dil.tercih('öğleden sonra', SIMDI, TZ)?.dilim, 'ogleden_sonra')
    assert.equal(dil.tercih('akşam üstü gelebilirim', SIMDI, TZ)?.dilim, 'ogleden_sonra')
    assert.equal(dil.tercih('başka gün olur mu', SIMDI, TZ)?.baskaGun, true)
    assert.equal(dil.tercih('daha geç bir tarih', SIMDI, TZ)?.dahaGec, true)
    assert.deepEqual(dil.tercih('yarın sabah', SIMDI, TZ), { dilim: 'sabah', gun: '2026-11-13' })
    assert.equal(dil.tercih('teşekkürler', SIMDI, TZ), null)
  })
  it('seçim: yalnız 1/2/3', () => {
    assert.equal(dil.secim('1'), 1); assert.equal(dil.secim('2.'), 2); assert.equal(dil.secim('3 numara'), 3); assert.equal(dil.secim(' 2 olsun '), 2)
    assert.equal(dil.secim('4'), null); assert.equal(dil.secim('12'), null); assert.equal(dil.secim('1 kişi'), null)
  })
  it('slotSec: gün başına bir öneri; istenen gün içinde yayılır; dilim süzülür; başka gün / daha geç', () => {
    const s = (gun: string, saat: string): Slot => ({ gun, saat, bas: `${gun}T${saat}:00+03:00`, son: `${gun}T${saat}:30+03:00` })
    const slotlar = [s('2026-11-13', '09:00'), s('2026-11-13', '10:00'), s('2026-11-13', '15:00'), s('2026-11-16', '09:00'), s('2026-11-16', '14:00'), s('2026-11-17', '11:00'), s('2026-11-18', '16:00')]
    assert.deepEqual(slotSec({ slotlar }).secilen.map((x) => x.gun), ['2026-11-13', '2026-11-16', '2026-11-17'])
    assert.deepEqual(slotSec({ slotlar, tercih: { gun: '2026-11-13' } }).secilen.map((x) => x.saat), ['09:00', '10:00', '15:00'])
    assert.deepEqual(slotSec({ slotlar, tercih: { dilim: 'ogleden_sonra' } }).secilen.map((x) => x.saat), ['15:00', '14:00', '16:00'])
    const yok = slotSec({ slotlar, tercih: { gun: '2026-11-14' } })
    assert.equal(yok.tercihKarsilandi, false)
    assert.equal(yok.secilen[0].gun, '2026-11-16')
    const baska = slotSec({ slotlar, tercih: { baskaGun: true }, onceki: [slotlar[0].bas], oncekiGunler: ['2026-11-13'] })
    assert.ok(baska.secilen.every((x) => x.gun !== '2026-11-13'))
    const gec = slotSec({ slotlar, tercih: { dahaGec: true }, onceki: [slotlar[4].bas] })
    assert.ok(gec.secilen.every((x) => x.bas > slotlar[4].bas))
  })
})

describe('tıbbi ve acil koruyucular', () => {
  const acil = ['göğsümde ağrı var', 'Göğüs ağrısı çekiyorum', 'nefes alamıyorum', 'çocuğum nefes alamıyor', 'kanama durmuyor', 'intihar etmeyi düşünüyorum', 'kendimi öldürmek istiyorum', 'nöbet geçiriyor', 'bayıldı uyanmıyor', 'bilinci kapalı', 'ACİL', 'bebek morardı']
  for (const m of acil) it(`acil: "${m}"`, () => assert.equal(dil.acilMi(m), true))
  const tibbi = ['ateşi 39 ne yapmalıyım', 'ilacı aç karna mı içsin', 'antibiyotiğe devam edeyim mi', 'tahlil sonucum normal mi', 'doz kaç ml olmalı', 'hamileyim bu ilacı kullanabilir miyim', 'çocuğum öksürüyor', 'bebeğim emmiyor kilo almıyor', 'döküntü çıktı', 'başım ağrıyor', 'aşı yan etki yaptı']
  for (const m of tibbi) it(`tıbbi: "${m}"`, () => assert.equal(dil.tibbiMi(m), true))
  const degil = ['otoparkınız var mı', 'adresiniz nerede', 'cumartesi açık mısınız', 'kredi kartı geçiyor mu', 'randevu almak istiyorum', 'teşekkürler', 'masası olan bir bekleme odası var mı']
  for (const m of degil) it(`tıbbi / acil DEĞİL: "${m}"`, () => { assert.equal(dil.tibbiMi(m), false); assert.equal(dil.acilMi(m), false) })
  it('acil cümlesi ülkenin acil numarasını taşır ve sabittir', () => {
    assert.equal(dil.acilNumara, '112')
    assert.match(dil.metin.acil, /112/)
    assert.match(dil.metin.tibbi, /112/)
  })
})

describe('muayenehane bilgisi kuralları ve ad soyad', () => {
  it('bariz sorular doğru alana gider', () => {
    assert.deepEqual(dil.bilgiAlanlari('adresiniz nedir'), ['adres'])
    assert.deepEqual(dil.bilgiAlanlari('Konum atar mısınız'), ['harita'])
    assert.deepEqual(dil.bilgiAlanlari('OTOPARK VAR MI'), ['otopark'])
    assert.deepEqual(dil.bilgiAlanlari('muayene ücreti ne kadar'), ['ucretler'])
    assert.deepEqual(dil.bilgiAlanlari('cumartesi açık mısınız'), ['calismaSaatleri'])
    assert.deepEqual(dil.bilgiAlanlari('SGK geçiyor mu'), ['sigorta'])
    assert.deepEqual(dil.bilgiAlanlari('kredi kartı geçiyor mu'), ['odeme'])
    assert.deepEqual(dil.bilgiAlanlari('kontrol için hazırlık gerekiyor mu'), ['hazirlik.kontrol'])
    assert.deepEqual(dil.bilgiAlanlari('telefon numaranız nedir'), ['telefon'])
    assert.deepEqual(dil.bilgiAlanlari('telefonum 0532 111 22 33'), [], 'hastanın kendi numarası soru değildir')
    assert.deepEqual(dil.bilgiAlanlari('merhaba'), [])
  })
  it('ad soyad: iki-dört kelime, yalnız harf; selam / teşekkür / niyet ad değildir', () => {
    assert.equal(dil.adSoyad('ayşe yılmaz'), 'Ayşe Yılmaz')
    assert.equal(dil.adSoyad('Adım Mehmet Ali Öztürk.'), 'Mehmet Ali Öztürk')
    for (const m of ['Ayşe', 'teşekkür ederim', 'randevu istiyorum', 'iyi günler', 'Ali 2', 'evet tamam', 'a b']) assert.equal(dil.adSoyad(m), null, m)
  })
  it('çalışma planı tek satır olur', () => {
    const g = { '0': { acik: false, baslangic: '09:00', bitis: '18:00' }, '1': { acik: true, baslangic: '09:00', bitis: '18:00' }, '6': { acik: true, baslangic: '10:00', bitis: '14:00' } }
    assert.equal(dil.calismaSaatiMetni(g), 'Pazartesi 09:00–18:00, Cumartesi 10:00–14:00')
  })
})
