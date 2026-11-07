/**
 * GENITAL-ESTETIK-01 — known-answer tests of the shared engine (byte-identical on every branch): the cosmetic / medical gate
 * and the under-18 block, the records (lot numbers for recalls, expiry, series), the outcome measures (FSFI scoring
 * appendix, FGSIS, COPS-L cut-off), before/after trend, photo consent and the fixed photo rules. Keys only.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  COPS_L_KESIM, FSFI_KESIM, GE_FOTO_KURALLARI, GE_OLCEK_LISANSLARI, GE_OLCEKLER, beyazlatmaDogrula, enerjiSeansiDogrula, enjeksiyonDogrula,
  fgsisPuanla, fotoOnamiDogrula, fotoOnamiGecerli, fsfiPuanla, geKapi, geMaddeGirisiAcik, geMedikalOlabilir, geTamYas, lotAnahtari, lotNoDogrula,
  olcekKaydiDogrula, olcekToplamDegerlendir, olcekTrendi, seansVadesi, sonKullanmaGunu,
} from './genitalEstetik'
import { ONAM_PROSEDURLERI, ONAM_YAPILARI } from './onamProsedurleri'

const YETISKIN = '1990-05-10', COCUK = '2010-05-10', GUN = '2026-11-06'

test('age: whole years, birthday-exact, unknown never guessed', () => {
  assert.equal(geTamYas('2008-11-06', GUN), 18)
  assert.equal(geTamYas('2008-11-07', GUN), 17)
  assert.equal(geTamYas(null, GUN), null)
  assert.equal(geTamYas('garbage', GUN), null)
  assert.equal(geTamYas('2030-01-01', GUN), null)
})

test('under-18 HARD BLOCK on cosmetic procedures, every kind', () => {
  for (const tur of ['cerrahi', 'enerji', 'enjeksiyon', 'beyazlatma'] as const) {
    const r = geKapi({ dogumTarihi: COCUK, gun: GUN, endikasyon: 'kozmetik', tur })
    assert.equal(r.izin, false, tur)
    assert.equal(!r.izin && r.neden, 'yas_18_alti', tur)
    assert.equal(geKapi({ dogumTarihi: YETISKIN, gun: GUN, endikasyon: 'kozmetik', tur }).izin, true, tur)
  }
  // the day before the 18th birthday is still blocked; the birthday opens it
  assert.equal(geKapi({ dogumTarihi: '2008-11-07', gun: GUN, endikasyon: 'kozmetik', tur: 'cerrahi' }).izin, false)
  assert.equal(geKapi({ dogumTarihi: '2008-11-06', gun: GUN, endikasyon: 'kozmetik', tur: 'cerrahi' }).izin, true)
})

test('a missing birth date never opens the cosmetic gate', () => {
  const r = geKapi({ dogumTarihi: null, gun: GUN, endikasyon: 'kozmetik', tur: 'cerrahi' })
  assert.deepEqual([r.izin, !r.izin && r.neden], [false, 'dogum_tarihi_yok'])
})

test('medically indicated surgery for a minor is NOT blocked (with a structured reason and words)', () => {
  const ok = geKapi({ dogumTarihi: COCUK, gun: GUN, endikasyon: 'medikal', medikalGerekce: 'konjenital_anomali', medikalAciklama: 'Belgelenmis fonksiyonel sikayet ve konjenital asimetri', tur: 'cerrahi' })
  assert.equal(ok.izin, true)
  assert.equal(ok.izin && ok.endikasyon, 'medikal')
  // without a reason or without words it is refused (so "medical" cannot be ticked to bypass the block)
  assert.equal(geKapi({ dogumTarihi: COCUK, gun: GUN, endikasyon: 'medikal', tur: 'cerrahi' }).izin, false)
  assert.equal(geKapi({ dogumTarihi: COCUK, gun: GUN, endikasyon: 'medikal', medikalGerekce: 'konjenital_anomali', medikalAciklama: 'kisa', tur: 'cerrahi' }).izin, false)
  // even an unknown birth date does not block a medically indicated procedure
  assert.equal(geKapi({ dogumTarihi: null, gun: GUN, endikasyon: 'medikal', medikalGerekce: 'travma_onarimi', medikalAciklama: 'Perine yirtigi sonrasi onarim', tur: 'cerrahi' }).izin, true)
  // no indication at all: refused
  assert.equal(geKapi({ dogumTarihi: YETISKIN, gun: GUN, endikasyon: '', tur: 'cerrahi' }).izin, false)
})

test('whitening and a G-spot filler can never be "medically indicated"', () => {
  assert.equal(geMedikalOlabilir('beyazlatma'), false)
  assert.equal(geMedikalOlabilir('enjeksiyon', { urun: 'ha_dolgu', bolge: 'g_noktasi_on_vajinal_duvar' }), false)
  assert.equal(geMedikalOlabilir('enjeksiyon', { urun: 'prp', bolge: 'vajinal_duvar' }), true)
  const r = geKapi({ dogumTarihi: COCUK, gun: GUN, endikasyon: 'medikal', medikalGerekce: 'diger_tibbi', medikalAciklama: 'Gercek tibbi neden yok ama yazildi', tur: 'beyazlatma' })
  assert.deepEqual([r.izin, !r.izin && r.neden], [false, 'medikal_bu_islemde_yok'])
  const b = beyazlatmaDogrula({ tarih: GUN, endikasyon: 'medikal', yontem: 'topikal', ajan: 'x', konsantrasyonYuzde: 2, bolgeler: ['labia_majora'] })
  assert.equal(b.ok, false)
})

test('injection log: lot kept recall-searchable, expired product refused, follow-up day', () => {
  assert.deepEqual(lotNoDogrula(' ab 12-34 '), { lot: 'AB12-34' })
  assert.equal(lotAnahtari('ab 12-34'), lotAnahtari('AB12-34'))
  assert.deepEqual(lotNoDogrula(''), { hata: 'lot_yok' })
  assert.deepEqual(lotNoDogrula('2 mL'), { hata: 'lot_doz_iceriyor' })
  assert.deepEqual(lotNoDogrula('lot#1'), { hata: 'lot_gecersiz' })
  assert.equal(sonKullanmaGunu('2027-02'), '2027-02-28')
  assert.equal(sonKullanmaGunu('2028-02'), '2028-02-29')
  assert.equal(sonKullanmaGunu('2027-13'), null)
  const temel = { tarih: GUN, endikasyon: 'kozmetik', urun: 'ha_dolgu', urunAdi: 'Sentetik HA', lot: 'qa 778', sonKullanma: '2027-06', hacimMl: '1,5', bolge: 'labia_majora', teknik: 'lineer_retrograd', kontrolGun: 14 }
  const r = enjeksiyonDogrula(temel)
  assert.ok(r.ok)
  assert.equal(r.ok && r.veri.lot, 'QA778')
  assert.equal(r.ok && r.veri.hacimMl, 1.5)
  assert.equal(r.ok && r.veri.kontrolTarihi, '2026-11-20')
  assert.equal(r.ok && r.veri.advers[0], 'yok')
  const gecmis = enjeksiyonDogrula({ ...temel, sonKullanma: '2026-10' })
  assert.deepEqual(!gecmis.ok && [gecmis.hata, gecmis.alan], ['urun_suresi_gecmis', 'sonKullanma'])
  assert.equal(enjeksiyonDogrula({ ...temel, lot: '' }).ok, false)
  // an adverse event needs words
  assert.equal(enjeksiyonDogrula({ ...temel, advers: ['nodul'] }).ok, false)
  assert.equal(enjeksiyonDogrula({ ...temel, advers: ['nodul'], adversAciklama: 'Sol tarafta 3 mm nodul' }).ok, true)
})

test('energy session: device, nominal wavelength, settings recorded (not proposed), series and next date', () => {
  const s = { tarih: GUN, endikasyon: 'medikal', medikalGerekce: 'gsm_tedavisi', medikalAciklama: 'Menopoz sonrasi kuruluk', modalite: 'co2_lazer', cihaz: 'Sentetik cihaz', amac: 'gsm', bolgeler: ['vajinal_kanal'], gecis: 2, seansNo: 1, seriToplam: 3, aralikGun: 28, ayarlar: { gucW: 30, yogunlukYuzde: 10 } }
  const r = enerjiSeansiDogrula(s)
  assert.ok(r.ok)
  assert.equal(r.ok && r.veri.dalgaBoyuNm, 10600)
  assert.equal(r.ok && r.veri.sonrakiTarih, '2026-12-04')
  assert.equal(r.ok && r.veri.ayarlar.gucW, 30)
  assert.equal(r.ok && r.veri.ayarlar.enerjiMj, null)
  const er = enerjiSeansiDogrula({ ...s, modalite: 'erbiyum_yag_lazer' })
  assert.equal(er.ok && er.veri.dalgaBoyuNm, 2940)
  // series running: an interval is required; last session: none
  assert.equal(enerjiSeansiDogrula({ ...s, aralikGun: undefined }).ok, false)
  const son = enerjiSeansiDogrula({ ...s, seansNo: 3, aralikGun: undefined })
  assert.ok(son.ok && son.veri.sonrakiTarih === null)
  assert.equal(enerjiSeansiDogrula({ ...s, seansNo: 4 }).ok, false)
  assert.equal(enerjiSeansiDogrula({ ...s, ayarlar: { gucW: 900 } }).ok, false)
  assert.deepEqual(seansVadesi(GUN, 13), { hata: 'aralik_gecersiz' })
  assert.deepEqual(seansVadesi(GUN, 90), { due: '2027-02-04' })
})

test('whitening: agent and concentration for a peel / topical, device for a laser, reaction words', () => {
  const p = { tarih: GUN, endikasyon: 'kozmetik', yontem: 'kimyasal_peeling', ajan: 'Sentetik ajan', konsantrasyonYuzde: 20, bolgeler: ['labia_majora'], reaksiyon: ['eritem'], reaksiyonAciklama: 'Hafif kizariklik' }
  assert.ok(beyazlatmaDogrula(p).ok)
  assert.equal(beyazlatmaDogrula({ ...p, konsantrasyonYuzde: undefined }).ok, false)
  assert.equal(beyazlatmaDogrula({ ...p, reaksiyonAciklama: '' }).ok, false)
  assert.ok(beyazlatmaDogrula({ tarih: GUN, endikasyon: 'kozmetik', yontem: 'lazer', cihaz: 'Sentetik lazer', bolgeler: ['perine'] }).ok)
})

test('FSFI known answers (Rosen 2000 scoring appendix): max 36.0, min 2.0, a worked case, cut-off 26.55', () => {
  const maks = Array(19).fill(5)
  assert.equal(fsfiPuanla(maks)?.toplam, 36)
  const min = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0]
  const m = fsfiPuanla(min)
  assert.equal(m?.toplam, 2)
  assert.equal(m?.alanlar.istek, 1.2)
  assert.equal(m?.alanlar.doyum, 0.8)
  // worked case: desire 3+3 → 3.6; arousal 4×4 → 4.8; lubrication 4×5 → 6.0; orgasm 3×3 → 3.6; satisfaction 4+4+4 → 4.8; pain 3×4 → 4.8 = 27.6
  const ornek = [3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 3, 3, 3, 4, 4, 4, 4, 4, 4]
  const o = fsfiPuanla(ornek)
  assert.deepEqual(o?.alanlar, { istek: 3.6, uyarilma: 4.8, lubrikasyon: 6, orgazm: 3.6, doyum: 4.8, agri: 4.8 })
  assert.equal(o?.toplam, 27.6)
  assert.equal(fsfiPuanla([0, ...Array(18).fill(3)]), null, 'item 1 is scored 1-5')
  assert.equal(fsfiPuanla(Array(18).fill(3)), null)
  assert.deepEqual(olcekToplamDegerlendir('fsfi', 26.55), { gecerli: true, toplam: 26.55, bant: 'fsfi_kesim_alti', yonlendirmeOner: false })
  const ust = olcekToplamDegerlendir('fsfi', 26.6)
  assert.ok(ust.gecerli && ust.bant === 'fsfi_kesim_ustu')
  const kes = olcekToplamDegerlendir('fsfi', 26.5)
  assert.ok(kes.gecerli && kes.bant === 'fsfi_kesim_alti')
  assert.equal(FSFI_KESIM, 26.55)
  assert.equal(olcekToplamDegerlendir('fsfi', 1.9).gecerli, false)
})

test('FGSIS known answers: 7 items 1-4 → 7-28, no cut-off', () => {
  assert.equal(fgsisPuanla([4, 4, 4, 4, 4, 4, 4]), 28)
  assert.equal(fgsisPuanla([1, 1, 1, 1, 1, 1, 1]), 7)
  assert.equal(fgsisPuanla([3, 2, 4, 1, 3, 3, 2]), 18)
  assert.equal(fgsisPuanla([5, 1, 1, 1, 1, 1, 1]), null)
  const d = olcekToplamDegerlendir('fgsis', 18)
  assert.ok(d.gecerli && d.bant === null && !d.yonlendirmeOner)
  assert.equal(olcekToplamDegerlendir('fgsis', 18.5).gecerli, false)
})

test('the Vaginal Laxity Questionnaire is not in the package (not formally validated; removed 2026-11-06)', () => {
  assert.deepEqual([...GE_OLCEKLER], ['fsfi', 'fgsis', 'cops_l'])
  assert.equal(olcekToplamDegerlendir('vlq' as never, 4).gecerli, false)
})

test('COPS-L: ≥40 sets the referral prompt; it never blocks and never diagnoses', () => {
  const p = olcekToplamDegerlendir('cops_l', 40), n = olcekToplamDegerlendir('cops_l', 39)
  assert.ok(p.gecerli && p.bant === 'cops_l_pozitif' && p.yonlendirmeOner === true)
  assert.ok(n.gecerli && n.bant === 'cops_l_negatif' && n.yonlendirmeOner === false)
  assert.equal(COPS_L_KESIM, 40)
  assert.equal(olcekToplamDegerlendir('cops_l', 73).gecerli, false)
  // a positive screen does not change the procedure gate (no coupling: prompt only)
  assert.equal(geKapi({ dogumTarihi: YETISKIN, gun: GUN, endikasyon: 'kozmetik', tur: 'cerrahi' }).izin, true)
  const k = olcekKaydiDogrula({ tarih: GUN, olcek: 'cops_l', asama: 'oncesi', toplam: 52 })
  assert.ok(k.ok && k.veri.yonlendirmeOner)
})

test('before / after trend: oldest first, change from baseline', () => {
  const t = olcekTrendi([{ tarih: '2026-12-01', toplam: 30.1 }, { tarih: '2026-09-01', toplam: 22.4 }, { tarih: '2026-10-15', toplam: 25 }])
  assert.deepEqual(t.noktalar.map((x) => x.tarih), ['2026-09-01', '2026-10-15', '2026-12-01'])
  assert.deepEqual([t.ilk, t.son, t.degisim, t.yon], [22.4, 30.1, 7.7, 'artis'])
  assert.equal(olcekTrendi([{ tarih: GUN, toplam: 10 }]).yon, null)
  assert.equal(olcekTrendi([]).ilk, null)
})

test('licences: no instrument opens item-level entry until a licence is recorded', () => {
  for (const o of GE_OLCEKLER) assert.equal(geMaddeGirisiAcik(o), false, o)
  assert.equal(GE_OLCEK_LISANSLARI.fgsis.durum, 'belirsiz')
  assert.equal(GE_OLCEK_LISANSLARI.fsfi.durum, 'izin-gerekli')
  assert.equal(GE_OLCEK_LISANSLARI.cops_l.durum, 'izin-gerekli')
})

test('photo consent is separate and explicit; photo rules are fixed', () => {
  assert.equal(fotoOnamiDogrula({ tarih: GUN, belgeleme: false }).ok, false)
  const o = fotoOnamiDogrula({ tarih: '2026-11-01', belgeleme: true })
  assert.ok(o.ok)
  const onamlar = o.ok ? [o.veri] : []
  assert.equal(fotoOnamiGecerli(onamlar, GUN), true)
  assert.equal(fotoOnamiGecerli(onamlar, '2026-10-31'), false, 'not before the consent day')
  assert.equal(fotoOnamiGecerli([], GUN), false)
  assert.equal(fotoOnamiGecerli([{ tarih: '2026-11-01', belgeleme: true, egitimYayin: false, geriCekildi: '2026-11-03' }], GUN), false, 'withdrawn')
  assert.equal(GE_FOTO_KURALLARI.kucukResim, false)
  assert.equal(GE_FOTO_KURALLARI.yapayZekayaGonderilir, false)
  assert.equal(GE_FOTO_KURALLARI.disaAktarimVarsayilan, false)
  assert.equal(GE_FOTO_KURALLARI.varsayilanBulanik, true)
  assert.ok(Object.isFrozen(GE_FOTO_KURALLARI))
})

test('consent forms: the hood variant and vaginoplasty exist, hymenoplasty never', () => {
  assert.ok(ONAM_PROSEDURLERI.includes('labioplasti_klitoral') && ONAM_PROSEDURLERI.includes('vajinoplasti'))
  assert.ok(!(ONAM_PROSEDURLERI as readonly string[]).some((k) => /himen|hymen/.test(k)))
  assert.ok(ONAM_YAPILARI.labioplasti_klitoral.ciddi.includes('klitoral_his_degisikligi'))
  assert.ok(ONAM_YAPILARI.vajinoplasti.ciddi.includes('introitus_darligi'))
})
