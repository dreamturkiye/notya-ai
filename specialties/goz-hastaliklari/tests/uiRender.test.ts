/**
 * GOZ-EXCEPTIONAL-01 — Göz sekmeleri gerçek react-dom/server render'ı (sentetik veri). Çalışma zamanı hatası (döngüsel içe aktarma,
 * eksik alan) ve UI kapıları: erişkinde ROP kartı yok, bebekte var; IVT listesi, lazer, biyometri, EGS ön ayar etiketi görünür.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GozKartlar, type GozVeri } from '../ui/GozKartlar'
import { gozSeridi } from '../engines/serit'
import { GLOKOM_ARALIK_ONERILERI, GLOKOM_ONERI_ETIKETI, SHAFFER_AD } from '../engines/glokom'
import { IVT_KONTROL } from '../engines/antiVegf'
import { ACIL_EYLEM_LISTESI, ACIL_KODLARI } from '../engines/acil'
import { KATARAKT_KONTROL, GIL_EK3G_KALEMLERI, ON_SEGMENT_PROTOKOLLERI, kataraktHazirlik } from '../engines/klinik'
import { GOZ_KAYNAKLAR } from '../protocols/sources'

const T = '2026-09-18'
function veri(yasAy: number | null, ekstra: Partial<GozVeri> = {}): GozVeri {
  return {
    hasta: { yas: yasAy == null ? null : Math.floor(yasAy / 12), yasAy }, rol: 'doktor',
    serit: gozSeridi({ muayeneler: [], hedefSag: null, hedefSol: null, evreSag: null, evreSol: null, sonrakiEnjeksiyon: null, gorevDue: [], sikayetMetinleri: [], bugun: T }),
    muayeneler: [], sonFundus: null, kopya: null, glokom: null, dr: null, acikGozSevkleri: [],
    enjeksiyonlar: [{ id: 'e1', goz: 'sag', ajan: 'bevacizumab', endikasyon: 'ybmd', faz: 'yukleme', dozNo: 1, tarih: T, durum: 'planli' }],
    sonrakiDoz: { sag: { faz: null, dozNo: null, enErken: null, enGec: null, not: 'Bu gözde yapılmış anti-VEGF yok.' }, sol: { faz: null, dozNo: null, enErken: null, enGec: null, not: 'Bu gözde yapılmış anti-VEGF yok.' } },
    sgkRaporlari: [], sgkSablonlari: [{ id: 'katarakt_gil', ad: 'Katarakt / GİL' }],
    katarakt: [{ id: 'k1', goz: 'sag', checklist: {}, gil_tipi_hekim: 'torik', planlanan_tarih: null, durum: 'planlama', biyometri: { alMm: 23.4, k1D: 43, k2D: 44, kAks: null, aSabiti: 118.9, cihaz: null, tarih: null }, postop: null, ek3g_kod: 'G10110', postopUyari: [], hazirlik: { ...kataraktHazirlik({}) } }],
    kataraktKontrol: KATARAKT_KONTROL, gilEk3g: GIL_EK3G_KALEMLERI,
    goruntuler: [{ id: 'g1', modalite: 'oct', goz: 'sag', tarih: T, url: null, okumalar: [] }], goruntuDisclaimer: 'Karar desteği, tanı değildir.',
    kontroller: [], pediatrik: { satir: null, izlem: { hatirlatmalar: [], gorevler: [], dipnotlar: [] } }, kuruGoz: [], gorevler: [], intake: null,
    acil: [], acilKodlari: ACIL_KODLARI, protokoller: ON_SEGMENT_PROTOKOLLERI, kaynaklar: GOZ_KAYNAKLAR,
    lazerler: [], lazerOzeti: [{ goz: 'sag', satirlar: [] }, { goz: 'sol', satirlar: [] }], rop: [], ropEndikasyon: null,
    pediatrikGorunum: { pediatrikSekme: yasAy != null && yasAy < 216, ropKart: yasAy != null && yasAy < 12 },
    acilKayitlari: [], acilEylemListesi: ACIL_EYLEM_LISTESI, octOlcumleri: [{ goruntu_id: 'g1', goz: 'sag', mfk_mikron: 312, rnfl_mikron: null, not_hekim: null }],
    glokomOnerileri: GLOKOM_ARALIK_ONERILERI, glokomOneriEtiketi: GLOKOM_ONERI_ETIKETI, shafferAd: SHAFFER_AD as Record<string, string>, ivtKontrol: IVT_KONTROL,
    hatirlatma: { bayraklar: ['kontrol_gecikti'], detay: ['Göz kontrolü 2026-09-01'], sonGonderim: null },
    sonRefraksiyon: null, sonBiyomikroskopi: null, sonKeratokonus: null,
    ...ekstra,
  } as GozVeri
}
const calistir = async () => null
const ciz = (v: GozVeri, sekme: string) => renderToStaticMarkup(React.createElement(GozKartlar, { v, sekme, kaynak: false, salt: false, calistir }))

describe('Göz sekmeleri render (sentetik)', () => {
  it('every tab renders without throwing', () => {
    for (const s of ['Özet', 'Fundus', 'Glokom', 'DR', 'Enjeksiyon', 'SGK rapor', 'Katarakt', 'Görüntü', 'Ön segment', 'Kuru göz', 'Pediatrik', 'Kontrol']) assert.ok(ciz(veri(600), s).length > 50, s)
  })
  it('new cards are on their tabs', () => {
    assert.match(ciz(veri(600), 'Özet'), /Hastaya hatırlatma gönder/)
    assert.match(ciz(veri(600), 'Glokom'), /öneri — hekim kilitler/)
    assert.match(ciz(veri(600), 'Glokom'), /Shaffer/)
    assert.match(ciz(veri(600), 'DR'), /Lazer kaydı/)
    assert.match(ciz(veri(600), 'Katarakt'), /GİL gücü Notya tarafından hesaplanmaz/)
    assert.match(ciz(veri(600), 'Katarakt'), /Post-op kaydet/)
    assert.match(ciz(veri(600), 'Görüntü'), /MFK 312 µm/)
    assert.match(ciz(veri(600), 'Ön segment'), /Biyomikroskopi/)
    assert.match(ciz(veri(600), 'Ön segment'), /Keratokonus/)
  })
  it('ROP card: infant yes, adult / unknown age no', () => {
    assert.match(ciz(veri(2), 'Pediatrik'), /ROP tarama kartı/)
    assert.doesNotMatch(ciz(veri(600), 'Pediatrik'), /ROP tarama kartı/)
    assert.doesNotMatch(ciz(veri(null), 'Pediatrik'), /ROP tarama kartı/)
    assert.match(ciz(veri(72), 'Pediatrik'), /Hirschberg/)
  })
  it('no pediatri / KD / derm chapter content leaks onto a göz chart', () => {
    for (const s of ['Özet', 'Glokom', 'DR', 'Katarakt', 'Ön segment']) assert.doesNotMatch(ciz(veri(600), s), /Baş Çevresi|Neyzi|gebelik haftası|PASI|Fitzpatrick|veli/i, s)
  })
})
