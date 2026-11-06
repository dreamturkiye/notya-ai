/**
 * AMELIYAT-NOTU-01 / KD-RAPOR-01 (2026-11-05) — the kit's operation note, ultrasound reports, discharge summary and FIGO
 * CTG: arithmetic against the published thresholds, the paragraph field, the pre-filled paragraphs, the printed record.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kitAraci } from './katalog'
import { girdiyiCoz, hamiSuz } from './girdi'
import { sablonuUygula } from './sablon'
import { UZUN_METIN_UZUNLUGU, METIN_UZUNLUGU } from './yardimci'
import { AMELIYAT_ZORUNLU, figoKtg } from './tanimlar/kadinDogumCerrahi'
import type { AracGirdisi } from './tipler'

const o = { sayi: { ondalik: '.', binlik: ',' }, birimler: { boy: 'cm', agirlik: 'kg' }, lab: {} } as never
const NOT: AracGirdisi = { tarih: '2026-11-05', aciliyet: 'elektif', preop_tani: 'x', postop_tani: 'x', islem: 'TLH', cerrah: 'QA', anestezi: 'genel', anestezist: 'QA', bulgular: 'b', teknik: 't', patoloji: 'gonderildi', patoloji_materyal: 'Uterus', kan_kaybi: 150, komplikasyon: 'None', kapanis: 'k', postop: 'p' }
const ORT = { bugun: '2026-11-05', p: {} }

describe('operation note (kit)', () => {
  const t = kitAraci('ameliyat-notu')!
  it('is printed, and complete only when every required item is there', () => {
    assert.equal(t.yazdirilir, true)
    assert.equal(t.hesapla(NOT, ORT).tamam, true)
    for (const k of AMELIYAT_ZORUNLU) assert.equal(t.hesapla({ ...NOT, [k]: null }, ORT).tamam, false, k)
    assert.equal(t.hesapla({ ...NOT, kan_kaybi: null }, ORT).tamam, false)
    assert.equal(t.hesapla({ ...NOT, anestezist: null }, ORT).tamam, false)
    assert.equal(t.hesapla({ ...NOT, anestezi: 'lokal', anestezist: null }, ORT).tamam, true)
    assert.equal(t.hesapla({ ...NOT, patoloji_materyal: null }, ORT).tamam, false)
  })
  it('the KD note is the same note with the operation choice', () => {
    const kd = kitAraci('ameliyat-notu-kd')!
    assert.equal(kd.alanlar[0].anahtar, 'sablon')
    // GENITAL-ESTETIK-01: labiaplasty / perineoplasty on this note are medically indicated only (tick + reason, shown only for them)
    assert.deepEqual(kd.alanlar.slice(1, 3).map((a) => a.anahtar), ['tibbi_endikasyon', 'tibbi_gerekce'])
    assert.deepEqual(kd.alanlar.slice(3).map((a) => a.anahtar), t.alanlar.map((a) => a.anahtar))
    assert.equal(kd.hesapla({ ...NOT, sablon: 'sezaryen' }, ORT).tamam, true)
  })
  it('a paragraph field keeps a paragraph; a few-words field keeps a few words', () => {
    const uzun = 'x'.repeat(UZUN_METIN_UZUNLUGU)
    const ham = hamiSuz(t.alanlar, { teknik: uzun, cerrah: 'y'.repeat(METIN_UZUNLUGU + 5) })
    const g = girdiyiCoz(t.alanlar, ham, o)
    assert.equal(String(g.teknik).length, UZUN_METIN_UZUNLUGU)
    assert.equal(String(g.cerrah).length, METIN_UZUNLUGU)
  })
})

describe('pre-filled paragraphs (PaketAraci.sablonlar)', () => {
  const t = kitAraci('ameliyat-notu-kd')!
  const paket = { sablonlar: { sablon: { sezaryen: { teknik: { 'en-GB': '1. Step' }, kapanis: { 'en-GB': 'Fascia closed' }, islem: { 'en-GB': 'never: not a paragraph' } } } } }
  it('fills only empty paragraph fields, in the asked form, never a few-words field', () => {
    const r = sablonuUygula(paket, t, { sablon: 'sezaryen', kapanis: 'mine' }, 'sablon', 'sezaryen', 'en-GB')
    assert.equal(r.teknik, '1. Step'); assert.equal(r.kapanis, 'mine'); assert.equal(r.islem, undefined)
    assert.deepEqual(sablonuUygula(paket, t, { a: 'b' }, 'sablon', 'tlh', 'en-GB'), { a: 'b' })
    assert.deepEqual(sablonuUygula(paket, t, { a: 'b' }, 'anestezi', 'genel', 'en-GB'), { a: 'b' })
  })
})

describe('obstetric ultrasound (kit)', () => {
  const t = kitAraci('usg-obstetrik')!
  const s = (g: AracGirdisi) => t.hesapla({ tarih: '2026-11-05', hafta: 30, ...g }, ORT)
  it('MCA-PSV MoM (Mari 2000) and its 1.5 threshold; CPR below 1.08', () => {
    const r = s({ mca_psv: 60.1, mca_pi: 1.0, ua_pi: 1.0 })
    assert.equal(r.sayilar.find((x) => x.anahtar === 'mca_mom')!.deger, 1.5)
    assert.ok(r.uyarilar.includes('mca_anemi')); assert.ok(r.uyarilar.includes('cpr_dusuk'))
    assert.ok(!s({ mca_psv: 45, mca_pi: 1.8, ua_pi: 1.2 }).uyarilar.includes('mca_anemi'))
  })
  it('liquor, FHR, EDF and NT flags at the published thresholds', () => {
    assert.ok(s({ afi: 5 }).uyarilar.includes('afi_oligo')); assert.ok(s({ afi: 24 }).uyarilar.includes('afi_poli'))
    assert.ok(!s({ afi: 12 }).uyarilar.some((u) => u.startsWith('afi')))
    assert.ok(s({ dvp: 1.9 }).uyarilar.includes('dvp_oligo')); assert.ok(s({ dvp: 8 }).uyarilar.includes('dvp_poli'))
    assert.ok(s({ fkh: 105 }).uyarilar.includes('fkh_dusuk')); assert.ok(s({ fkh: 165 }).uyarilar.includes('fkh_yuksek'))
    assert.ok(s({ ua_edf: 'ters' }).uyarilar.includes('ua_edf_ters')); assert.ok(s({ nt: 3.5 }).uyarilar.includes('nt_esik'))
  })
  it('INTERGROWTH-21st centile and Hadlock EFW from the embedded tables', () => {
    const r = t.hesapla({ tarih: '2026-11-05', hafta: 20, hc: 172.5, ac: 150, fl: 32 }, ORT)
    assert.equal(r.sayilar.find((x) => x.anahtar === 'hc_p')!.deger, 50)
    assert.ok(r.sayilar.some((x) => x.anahtar === 'efw'))
    assert.equal(t.hesapla({ tarih: '2026-11-05' }, ORT).tamam, false)
  })
})

describe('gynaecological ultrasound (kit)', () => {
  const t = kitAraci('usg-jinekolojik')!
  it('ellipsoid volumes and the postmenopausal endometrium above 4 mm', () => {
    const r = t.hesapla({ tarih: '2026-11-05', uterus_u: 80, uterus_ap: 40, uterus_g: 50, menopoz: true, endometrium: 5 }, ORT)
    assert.equal(r.sayilar.find((x) => x.anahtar === 'uterus_hacim')!.deger, 83.7)
    assert.ok(r.uyarilar.includes('endometrium_postmenopoz'))
    assert.ok(!t.hesapla({ tarih: '2026-11-05', endometrium: 9, menopoz: false }, ORT).uyarilar.length)
  })
})

describe('FIGO 2015 CTG (kit)', () => {
  const g = (x: AracGirdisi): AracGirdisi => ({ bazal: 140, varyabilite: 10, ...x })
  it('normal, suspicious and pathological', () => {
    assert.equal(figoKtg(g({}))!.bant, 'normal')
    assert.equal(figoKtg(g({ bazal: 165 }))!.bant, 'supheli')
    assert.equal(figoKtg(g({ bazal: 95 }))!.bant, 'patolojik')
    assert.equal(figoKtg(g({ varyabilite: 3, azalmis_dk: 55 }))!.bant, 'patolojik')
    assert.equal(figoKtg(g({ en_uzun_des: 6 }))!.bant, 'patolojik')
    assert.equal(figoKtg(g({ tekrarlayan: true, gec: 4, tekrar_dk: 25, varyabilite: 4 }))!.bant, 'patolojik')
    assert.equal(figoKtg(g({ tekrarlayan: true, gec: 4, tekrar_dk: 25 }))!.bant, 'supheli')
    assert.equal(figoKtg({ bazal: 140 }), null)
  })
})
