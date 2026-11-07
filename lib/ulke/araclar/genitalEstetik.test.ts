/**
 * GENITAL-ESTETIK-01 (2026-11-06) — the kit's cosmetic gynaecology tools: known answers through the shared engine, the
 * medically-indicated-only rule of labiaplasty / perineoplasty on the ungated O&G note, the body-image prompts, no item of
 * any questionnaire. Identical on every country branch.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kitAraci } from './katalog'
import type { AracGirdisi } from './tipler'
import { GE_KOZMETIK_ARACLARI, GENITAL_ESTETIK_ARACLARI } from './tanimlar/genitalEstetik'

const ORT = { bugun: '2026-11-06', p: {} }
const NOT: AracGirdisi = { tarih: '2026-11-06', aciliyet: 'elektif', preop_tani: 'x', postop_tani: 'x', islem: 'x', cerrah: 'QA', anestezi: 'genel', anestezist: 'QA', bulgular: 'b', teknik: 't', patoloji: 'gonderilmedi', kan_kaybi: 50, komplikasyon: 'yok', kapanis: 'k', postop: 'p' }

describe('genital aesthetics (kit)', () => {
  it('every tool is in the catalogue; the cosmetic-capable ones are named for the 18+ gate', () => {
    for (const t of GENITAL_ESTETIK_ARACLARI) assert.ok(kitAraci(t.anahtar), t.anahtar)
    assert.deepEqual([...GE_KOZMETIK_ARACLARI].sort(), ['ameliyat-notu-genital', 'genital-beyazlatma', 'genital-enerji-seansi', 'genital-enjeksiyon', 'onam-formu-genital'])
    // no item of a published questionnaire anywhere in the package
    for (const t of GENITAL_ESTETIK_ARACLARI) assert.ok(!t.alanlar.some((a) => a.numarali), t.anahtar)
  })

  it('the O&G note: labiaplasty and perineoplasty are medically indicated only (tick + reason); other templates unchanged', () => {
    const kd = kitAraci('ameliyat-notu-kd')!
    assert.equal(kd.hesapla({ ...NOT, sablon: 'labioplasti' }, ORT).tamam, false)
    assert.equal(kd.hesapla({ ...NOT, sablon: 'labioplasti', tibbi_endikasyon: true }, ORT).tamam, false)
    assert.equal(kd.hesapla({ ...NOT, sablon: 'labioplasti', tibbi_endikasyon: true, tibbi_gerekce: 'Congenital asymmetry with documented symptoms' }, ORT).tamam, true)
    assert.equal(kd.hesapla({ ...NOT, sablon: 'perineoplasti' }, ORT).tamam, false)
    assert.equal(kd.hesapla({ ...NOT, sablon: 'tlh' }, ORT).tamam, true)
    assert.equal(kd.hesapla({ ...NOT }, ORT).tamam, true)
    assert.ok(kd.alanlar.find((a) => a.anahtar === 'tibbi_endikasyon')?.kosul?.degerler.includes('labioplasti'))
  })

  it('the adult genital note: indication required; cosmetic without body-image screening warns; COPS-L ≥ 40 prompts', () => {
    const t = kitAraci('ameliyat-notu-genital')!
    assert.equal(t.hesapla({ ...NOT, sablon: 'vajinoplasti' }, ORT).tamam, false, 'indication class required')
    const k = t.hesapla({ ...NOT, sablon: 'vajinoplasti', endikasyon_sinifi: 'kozmetik', bdd_tarama: 'yapilmadi' }, ORT)
    assert.deepEqual([k.tamam, k.uyarilar], [true, ['bdd_tarama_yok']])
    const p = t.hesapla({ ...NOT, sablon: 'labioplasti', endikasyon_sinifi: 'kozmetik', bdd_tarama: 'yapildi', cops_l_toplam: 44 }, ORT)
    assert.deepEqual([p.tamam, p.uyarilar], [true, ['cops_l_pozitif']], 'a positive screen prompts and does not block')
    assert.equal(t.hesapla({ ...NOT, sablon: 'labioplasti', endikasyon_sinifi: 'medikal' }, ORT).tamam, false, 'medical needs a reason')
    assert.equal(t.hesapla({ ...NOT, sablon: 'labioplasti', endikasyon_sinifi: 'medikal', medikal_gerekce: 'konjenital_anomali', medikal_aciklama: 'Congenital asymmetry with symptoms' }, ORT).tamam, true)
    assert.equal(t.alanlar.find((a) => a.anahtar === 'sablon')?.secenekSerbest, true, 'a country may offer fewer operations')
  })

  it('energy session: nominal wavelength, next session from the chosen interval, adverse event warning', () => {
    const t = kitAraci('genital-enerji-seansi')!
    const g: AracGirdisi = { tarih: '2026-11-06', endikasyon_sinifi: 'kozmetik', modalite: 'erbiyum_yag_lazer', cihaz: 'QA', amac: 'vajinal_laksite', bolge_vajinal_kanal: true, gecis: 2, seans_no: 1, seri_toplam: 3, aralik_gun: 30, advers: 'yok' }
    const r = t.hesapla(g, ORT)
    assert.equal(r.tamam, true)
    assert.equal(r.sayilar[0].deger, 2940)
    assert.deepEqual(r.tarihler, [{ anahtar: 'tarih', tarih: '2026-11-06' }, { anahtar: 'sonraki_seans', tarih: '2026-12-06' }])
    assert.equal(t.hesapla({ ...g, bolge_vajinal_kanal: false }, ORT).tamam, false, 'an area is required')
    assert.equal(t.hesapla({ ...g, aralik_gun: null }, ORT).tamam, false, 'series running: interval required')
    assert.deepEqual(t.hesapla({ ...g, advers: 'yanik', advers_aciklama: 'Superficial burn, introitus' }, ORT).uyarilar, ['advers_var'])
  })

  it('injection: lot required, expired product keeps nothing, review date', () => {
    const t = kitAraci('genital-enjeksiyon')!
    const g: AracGirdisi = { tarih: '2026-11-06', endikasyon_sinifi: 'kozmetik', urun: 'ha_dolgu', urun_adi: 'QA HA', lot: 'qa 1', son_kullanma: '2027-01-31', hacim: 1, bolge: 'g_noktasi_on_vajinal_duvar', teknik: 'bolus', kontrol_gun: 14, advers: 'yok' }
    const r = t.hesapla(g, ORT)
    assert.equal(r.tamam, true)
    assert.deepEqual(r.tarihler.map((x) => x.tarih), ['2026-11-06', '2026-11-20'])
    assert.equal(t.hesapla({ ...g, son_kullanma: '2026-11-05' }, ORT).tamam, false)
    assert.equal(t.hesapla({ ...g, lot: null }, ORT).tamam, false)
    assert.equal(t.hesapla({ ...g, endikasyon_sinifi: 'medikal', medikal_gerekce: 'diger_tibbi', medikal_aciklama: 'Not a real medical reason' }, ORT).tamam, false, 'a G-spot filler is never medical')
  })

  it('whitening: cosmetic only; agent and concentration, or a device', () => {
    const t = kitAraci('genital-beyazlatma')!
    assert.equal(t.hesapla({ tarih: '2026-11-06', yontem: 'kimyasal_peeling', ajan: 'QA', konsantrasyon: 20, bolge_labia_majora: true, reaksiyon: 'yok' }, ORT).tamam, true)
    assert.equal(t.hesapla({ tarih: '2026-11-06', yontem: 'kimyasal_peeling', ajan: 'QA', bolge_labia_majora: true, reaksiyon: 'yok' }, ORT).tamam, false)
    assert.equal(t.hesapla({ tarih: '2026-11-06', yontem: 'lazer', cihaz: 'QA', bolge_perine: true, reaksiyon: 'yok' }, ORT).tamam, true)
  })

  it('outcome totals: FSFI cut-off 26.55, COPS-L 40 prompts referral, ranges held', () => {
    const t = kitAraci('genital-sonuc-olcegi')!
    const f = t.hesapla({ tarih: '2026-11-06', olcek: 'fsfi', asama: 'oncesi', toplam: 26.55 }, ORT)
    assert.deepEqual([f.tamam, f.bant], [true, 'fsfi_kesim_alti'])
    const c = t.hesapla({ tarih: '2026-11-06', olcek: 'cops_l', asama: 'oncesi', toplam: 40 }, ORT)
    assert.deepEqual([c.bant, c.uyarilar], ['cops_l_pozitif', ['cops_l_pozitif']])
    assert.equal(t.hesapla({ tarih: '2026-11-06', olcek: 'vlq', asama: 'oncesi', toplam: 4 }, ORT).tamam, false, 'the Vaginal Laxity Questionnaire is not in the package (removed 2026-11-06)')
    assert.deepEqual(t.alanlar.find((a) => a.anahtar === 'olcek')?.secenekler, ['fsfi', 'fgsis', 'cops_l'])
    assert.equal(t.hesapla({ tarih: '2026-11-06', olcek: 'fgsis', asama: 'sonrasi', toplam: 30 }, ORT).tamam, false)
  })

  it('the consent form of the four operations: the O&G form\'s arithmetic, only the genital-aesthetic operations, fewer per country', () => {
    const t = kitAraci('onam-formu-genital')!, kd = kitAraci('onam-formu-kd')!
    const islem = t.alanlar.find((a) => a.anahtar === 'islem')!
    assert.deepEqual(islem.secenekler, ['labioplasti', 'labioplasti_klitoral', 'vajinoplasti', 'perineoplasti'])
    assert.equal(islem.secenekSerbest, true)
    for (const k of islem.secenekler ?? []) assert.ok(kd.alanlar.find((a) => a.anahtar === 'islem')?.secenekler?.includes(k), k)
    const g: AracGirdisi = { tarih: '2026-11-06', islem: 'vajinoplasti', aciklama: 'a', riskler: 'r', yazili_bilgi: true, sorular_yanitlandi: true }
    assert.deepEqual(t.hesapla(g, ORT), kd.hesapla(g, ORT))
    assert.equal(t.hesapla({ ...g, riskler: '' }, ORT).tamam, false)
  })

  it('photo consent: separate and explicit (the documentation tick is required)', () => {
    const t = kitAraci('genital-foto-onam')!
    assert.equal(t.hesapla({ tarih: '2026-11-06', belgeleme: false }, ORT).tamam, false)
    assert.deepEqual(t.hesapla({ tarih: '2026-11-06', belgeleme: true, egitim_yayin: true }, ORT).uyarilar, ['egitim_yayin_onayi'])
  })
})
