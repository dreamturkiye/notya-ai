/**
 * KD-TARAMA-01 (2026-11-09) — the four O&G records of the country kit: the arithmetic is the shared engine's, every number
 * the pack's. Known answers with the numbers of RANZCOG C-Obs 46 and ATA 2017, and an HPV table written as CDC states it.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { GEBELIK_TIROID, HPV_ASI_KAYDI, KD_TARAMA_ARACLARI, PMDD_GUNLUK_OZETI, SMA_TASIYICILIK, hpvKuraliTablodan, tiroidKuraliParametrelerden } from './tanimlar/kdTaramalar'
import { kitAraci } from './katalog'
import { PMDD_ALANLARI } from '@/lib/clinical/kdTaramalar'

const RANZCOG = { t1_alt_dusus: 0.5, t1_ust_dusus: 0.5, t23_gebelik_disi: 1, sabit_ust: 4, hedef_alt_yari: 1, hipo_aralik_hafta: 4, hipo_son_hafta: 20, hipo_ek_hafta: 30, postpartum_hafta: 6 }
const ATA = { t1_alt_dusus: 0.4, t1_ust_dusus: 0.5, t1_bas_hafta: 7, sabit_ust: 4, sabit_bas_hafta: 7, sabit_son_hafta: 13, hedef_alt_yari: 1, hiper_aralik_hafta: 4, trab1_bas: 18, trab1_son: 22, trab2_bas: 30, trab2_son: 34 }
const CDC = [
  { immun: 'baskilanmis', yas_alt: 9, yas_ust: 26, doz_en_az: 3, doz_en_cok: 3, d2_en_az_ay: 1, d2_en_cok_ay: 2, d2_en_az_hafta: -1, d3_en_az_ay: 6, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
  { immun: 'normal', yas_alt: 9, yas_ust: 14, doz_en_az: 2, doz_en_cok: 2, d2_en_az_ay: 6, d2_en_cok_ay: 12, d2_en_az_hafta: -1, d3_en_az_ay: -1, d3_en_cok_ay: -1, kisa_aralik_ay: 5, kisa_ek_doz: 3 },
  { immun: 'normal', yas_alt: 15, yas_ust: 26, doz_en_az: 3, doz_en_cok: 3, d2_en_az_ay: 1, d2_en_cok_ay: 2, d2_en_az_hafta: -1, d3_en_az_ay: 6, d3_en_cok_ay: -1, kisa_aralik_ay: -1, kisa_ek_doz: -1 },
]

describe('KD-TARAMA-01 kit tools', () => {
  it('are in the catalogue, obstetric only by the pack, and hold no number of their own', () => {
    for (const a of KD_TARAMA_ARACLARI) assert.equal(kitAraci(a.anahtar)?.anahtar, a.anahtar)
    assert.equal(GEBELIK_TIROID.parametreler, undefined)
    assert.ok((GEBELIK_TIROID.secimlikParametreler ?? []).length > 10)
  })
  it('thyroid: the pack\'s numbers become the engine\'s rule; absent = null', () => {
    const k = tiroidKuraliParametrelerden(RANZCOG)
    assert.deepEqual([k.t1UstDusus, k.t23GebelikDisi, k.sabitUst, k.t1BaslangicHafta, k.hiperAralikHafta], [0.5, true, 4, null, null])
    assert.equal(tiroidKuraliParametrelerden({}).sabitUst, null)
  })
  it('thyroid: RANZCOG third trimester on the non-pregnant range; ATA second trimester gives no range', () => {
    const g = { tarih: '2026-11-09', gebelik_haftasi: 30, tsh: 4.2, gd_tsh_alt: 0.5, gd_tsh_ust: 4.0, tiroid_durumu: 'yok' }
    const r = GEBELIK_TIROID.hesapla(g, { bugun: '2026-11-09', p: RANZCOG })
    assert.deepEqual([r.tamam, r.bant], [true, 'tsh_yuksek']); assert.ok(r.uyarilar.includes('kaynak_yedek_gebelik_disi'))
    assert.equal(GEBELIK_TIROID.hesapla({ ...g, gebelik_haftasi: 20 }, { bugun: '2026-11-09', p: ATA }).bant, 'tsh_aralik_yok')
  })
  it('thyroid: hyperthyroid status dates the TRAb windows and the next test from the sample\'s week', () => {
    const r = GEBELIK_TIROID.hesapla({ tarih: '2026-11-09', gebelik_haftasi: 16, tsh: 0.05, tiroid_durumu: 'hipertiroidi' }, { bugun: '2026-11-09', p: ATA })
    assert.deepEqual(r.tarihler.filter((t) => t.anahtar.startsWith('trab')).map((t) => t.tarih), ['2026-11-23', '2027-02-15'])
    assert.ok(r.uyarilar.includes('takip_hipertiroidi') && r.uyarilar.includes('trab_pencere'))
  })
  it('thyroid: no TSH in the first trimester under a universal source raises the booking prompt', () => {
    const r = GEBELIK_TIROID.hesapla({ tarih: '2026-11-09', gebelik_haftasi: 8, tiroid_durumu: 'yok' }, { bugun: '2026-11-09', p: { tarama_evrensel: 1 } })
    assert.ok(r.uyarilar.includes('tarama_istemi')); assert.equal(r.bant, null)
  })
  it('HPV: the pack\'s table (-1 = not stated) gives the schedule; no table, no result', () => {
    assert.equal(hpvKuraliTablodan(CDC)?.satirlar[1].kisaAralik?.ekDoz, 3)
    const r = HPV_ASI_KAYDI.hesapla({ ilk_doz_yasi: 17, immun: 'normal', asi_tipi: '9v', doz1_tarihi: '2026-03-31' }, { bugun: '2026-11-09', p: {}, t: { hpv_takvimi: CDC } })
    assert.deepEqual([r.bant, r.tarihler.map((t) => t.tarih)], ['devam', ['2026-04-30', '2026-05-31']])
    const yok = HPV_ASI_KAYDI.hesapla({ ilk_doz_yasi: 17, immun: 'normal', doz1_tarihi: '2026-03-31' }, { bugun: '2026-11-09', p: {} })
    assert.deepEqual([yok.tamam, yok.bant], [true, 'kural_yok'])
    const ok = HPV_ASI_KAYDI.hesapla({ ilk_doz_yasi: 11, immun: 'normal', doz1_tarihi: '2026-01-15', doz2_tarihi: '2026-05-01' }, { bugun: '2026-11-09', p: {}, t: { hpv_takvimi: CDC } })
    assert.ok(ok.uyarilar.includes('kisa_aralik_ek_doz'))
  })
  it('SMA: a carrier result prompts partner testing and genetic counselling; the copy number is never interpreted', () => {
    const r = SMA_TASIYICILIK.hesapla({ durum: 'yapildi', sonuc: 'tasiyici', smn1_kopya: '1' }, { bugun: '2026-11-09', p: {} })
    assert.equal(r.bant, 'yapildi_tasiyici')
    for (const u of ['es_testi_istemi', 'genetik_danisma_istemi', 'kopya_yorumlanmaz']) assert.ok(r.uyarilar.includes(u), u)
    assert.equal(SMA_TASIYICILIK.hesapla({ durum: 'teklif_edildi' }, { bugun: '2026-11-09', p: {} }).bant, 'teklif_edildi')
  })
  it('PMDD: two cycles scored with the shared rule; F not ticked = provisional', () => {
    const g: Record<string, number | string | boolean> = { d1_adet: '2026-09-08', d2_adet: '2026-10-06' }
    for (const c of [1, 2]) for (const a of PMDD_ALANLARI) { g[`d${c}_${a}_once`] = a.startsWith('b') ? 4 : 2; g[`d${c}_${a}_sonra`] = 0 }
    for (const k of ['a', 'b', 'c', 'd', 'e', 'g']) g[`kriter_${k}`] = true
    const r = PMDD_GUNLUK_OZETI.hesapla(g, { bugun: '2026-11-09', p: {} })
    assert.deepEqual([r.bant, r.sayilar.find((s) => s.anahtar === 'oruntu_dongu')?.deger], ['gecici', 2])
    assert.ok(r.uyarilar.includes('iki_dongu_oruntu'))
  })
})
