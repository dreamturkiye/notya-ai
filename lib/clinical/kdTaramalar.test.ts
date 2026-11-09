/**
 * KD-TARAMA-01 — known answers of the shared engine (byte-identical on main and the six release branches). Rule sets
 * here are written with the numbers of their sources so the arithmetic is checked against what each source states:
 * ATA 2017 (Recommendation 26 and the Question 2 text) and RANZCOG C-Obs 46 (section 3.3). No Turkish copy is used:
 * the engine returns codes only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  adetEpizotlari, ayEkle, haftaTarihi, hpvPlani, lt4NotuDogrula, pmddGunDogrula, pmddKontrolListesi, pmddOzeti, smaDegerlendir,
  tiroidDegerlendir, tiroidTakipNoktalari, tiroidTaramaIstemi, trimesterHaftadan, yasTarihte,
  PMDD_ALANLARI, type HpvKurali, type PmddGunGirdisi, type TiroidKurali,
} from './kdTaramalar'

const ATA: TiroidKurali = {
  kaynak: 'ATA_2017', t1AltDusus: 0.4, t1UstDusus: 0.5, t1BaslangicHafta: 7, t23GebelikDisi: false,
  sabitUst: 4.0, sabitBasHafta: 7, sabitSonHafta: 13, hedefT1Ust: null, hedefT23Ust: null, hedefAltYari: true,
  hipoAralikHafta: 4, hipoSonHafta: 20, hipoEkHafta: 30, postpartumHafta: 6, hiperAralikHafta: 4,
  trabPencereleri: [[18, 22], [30, 34]], antikorAralikHafta: 4, antikorSonHafta: 20,
  tarama: 'risk', riskFaktorleri: ['oyku_tiroid_disfonksiyon', 'belirti_tiroid', 'yas_30_ustu', 'tip1_diyabet'],
}
const RANZCOG: TiroidKurali = {
  ...ATA, kaynak: 'RANZCOG_C_OBS_46', t1AltDusus: 0.5, t1UstDusus: 0.5, t1BaslangicHafta: null, t23GebelikDisi: true,
  sabitUst: 4, sabitBasHafta: null, sabitSonHafta: null, tarama: 'risk', riskFaktorleri: ['oyku_tiroid_disfonksiyon', 'belirti_tiroid', 'tip1_diyabet'],
}
const TEMD_HEDEF: TiroidKurali = { ...ATA, hedefT1Ust: 2.5, hedefT23Ust: 3, hedefAltYari: false, tarama: 'evrensel', riskFaktorleri: [] }

describe('thyroid in pregnancy', () => {
  it('trimester cut is the same as the pregnancy engine (14 / 28)', () => {
    assert.equal(trimesterHaftadan(13), 1); assert.equal(trimesterHaftadan(14), 2); assert.equal(trimesterHaftadan(27), 2)
    assert.equal(trimesterHaftadan(28), 3); assert.equal(trimesterHaftadan(null), null); assert.equal(trimesterHaftadan(60), null)
  })
  it('the laboratory\'s own pregnancy range always wins', () => {
    const r = tiroidDegerlendir({ hafta: 10, tsh: 3.1, labTshAlt: 0.1, labTshUst: 3.0, gebelikDisiTshAlt: 0.4, gebelikDisiTshUst: 4.5 }, ATA)
    assert.deepEqual([r.tsh.kaynak, r.tsh.bayrak, r.tsh.ust], ['laboratuvar', 'yuksek', 3.0])
  })
  it('ATA fallback on the non-pregnant range: first trimester from week 7, lower −0.4, upper −0.5', () => {
    const r = tiroidDegerlendir({ hafta: 9, tsh: 4.2, gebelikDisiTshAlt: 0.4, gebelikDisiTshUst: 4.5 }, ATA)
    assert.equal(r.tsh.kaynak, 'yedek_duzeltilmis'); assert.equal(r.tsh.alt, 0); assert.equal(r.tsh.ust, 4.0); assert.equal(r.tsh.bayrak, 'yuksek')
  })
  it('ATA gives no number before week 7 or in the 2nd/3rd trimester: no flag is invented', () => {
    assert.equal(tiroidDegerlendir({ hafta: 5, tsh: 6, gebelikDisiTshAlt: 0.4, gebelikDisiTshUst: 4.5 }, ATA).tsh.bayrak, 'aralik_yok')
    const t2 = tiroidDegerlendir({ hafta: 20, tsh: 6, gebelikDisiTshAlt: 0.4, gebelikDisiTshUst: 4.5 }, ATA)
    assert.deepEqual([t2.tsh.kaynak, t2.tsh.bayrak], ['yok', 'aralik_yok'])
  })
  it('ATA ~4.0 upper limit when no range at all is entered (late first trimester only)', () => {
    const r = tiroidDegerlendir({ hafta: 11, tsh: 4.3 }, ATA)
    assert.deepEqual([r.tsh.kaynak, r.tsh.ust, r.tsh.alt, r.tsh.bayrak], ['yedek_sabit', 4.0, null, 'yuksek'])
    assert.equal(tiroidDegerlendir({ hafta: 11, tsh: 3.9 }, ATA).tsh.bayrak, 'aralikta')
  })
  it('RANZCOG: first trimester 0.5 below the non-pregnant range, 2nd/3rd = non-pregnant, or 4 throughout', () => {
    const t1 = tiroidDegerlendir({ hafta: 6, tsh: 0.2, gebelikDisiTshAlt: 0.5, gebelikDisiTshUst: 4.0 }, RANZCOG)
    assert.deepEqual([t1.tsh.alt, t1.tsh.ust, t1.tsh.bayrak], [0, 3.5, 'aralikta'])
    const t3 = tiroidDegerlendir({ hafta: 30, tsh: 4.2, gebelikDisiTshAlt: 0.5, gebelikDisiTshUst: 4.0 }, RANZCOG)
    assert.deepEqual([t3.tsh.kaynak, t3.tsh.bayrak], ['yedek_gebelik_disi', 'yuksek'])
    const s = tiroidDegerlendir({ hafta: 33, tsh: 4.1 }, RANZCOG)
    assert.deepEqual([s.tsh.kaynak, s.tsh.bayrak], ['yedek_sabit', 'yuksek'])
  })
  it('free T4 only against a method-specific laboratory range', () => {
    assert.equal(tiroidDegerlendir({ hafta: 12, ft4: 9 }, ATA).ft4.bayrak, 'aralik_yok')
    assert.equal(tiroidDegerlendir({ hafta: 12, ft4: 9, labFt4Alt: 10, labFt4Ust: 18 }, ATA).ft4.bayrak, 'dusuk')
  })
  it('treatment target: a fixed target (TEMD style, "<2.5") or the lower half of the range (ATA / RANZCOG)', () => {
    assert.equal(tiroidDegerlendir({ hafta: 10, tsh: 2.5, lt4Tedavisi: true }, TEMD_HEDEF).hedef, 'hedef_ustu')
    assert.equal(tiroidDegerlendir({ hafta: 20, tsh: 2.9, lt4Tedavisi: true }, TEMD_HEDEF).hedef, 'hedefte')
    const a = tiroidDegerlendir({ hafta: 20, tsh: 2.1, lt4Tedavisi: true, labTshAlt: 0.2, labTshUst: 3.8 }, ATA)
    assert.deepEqual([a.hedefUst, a.hedef], [2, 'hedef_ustu'])
    assert.equal(tiroidDegerlendir({ hafta: 20, tsh: 2.1, lt4Tedavisi: true }, ATA).hedef, null)
    assert.equal(tiroidDegerlendir({ hafta: 20, tsh: 2.1 }, ATA).hedef, null)
  })
  it('booking prompt: universal until a TSH is recorded; risk-based only on a listed factor', () => {
    assert.equal(tiroidTaramaIstemi(TEMD_HEDEF, { tshKayitli: false, riskler: [] }).neden, 'evrensel')
    assert.equal(tiroidTaramaIstemi(TEMD_HEDEF, { tshKayitli: true, riskler: [] }).goster, false)
    assert.equal(tiroidTaramaIstemi(RANZCOG, { tshKayitli: false, riskler: ['yas_30_ustu'] }).goster, false)
    assert.deepEqual(tiroidTaramaIstemi(ATA, { tshKayitli: false, riskler: ['yas_30_ustu', 'aile_oykusu'] }).eslesen, ['yas_30_ustu'])
  })
  it('follow-up points come from the source intervals only', () => {
    const hipo = tiroidTakipNoktalari('hipotiroidi', 9, ATA)
    assert.deepEqual(hipo.filter((p) => p.kod === 'tsh_kontrol').map((p) => p.haftaBas), [9, 13, 17])
    assert.ok(hipo.some((p) => p.kod === 'tsh_ek' && p.haftaBas === 30) && hipo.some((p) => p.kod === 'postpartum_tft' && p.haftaBas === 6))
    const hiper = tiroidTakipNoktalari('hipertiroidi', 20, ATA)
    assert.deepEqual(hiper.filter((p) => p.kod === 'trab').map((p) => [p.haftaBas, p.haftaSon, p.durum]), [[18, 22, 'simdi'], [30, 34, 'ileride']])
    assert.deepEqual(hiper.filter((p) => p.kod === 'tft_kontrol').map((p) => p.haftaBas), [24])
    assert.deepEqual(tiroidTakipNoktalari('yok', 10, ATA), [])
    assert.equal(haftaTarihi('2026-11-09', 10, 30), '2027-03-29')
  })
  it('levothyroxine: only the clinician\'s words, never an amount', () => {
    assert.deepEqual(lt4NotuDogrula('  as decided at visit  '), { ok: true, metin: 'as decided at visit' })
    assert.deepEqual(lt4NotuDogrula(''), { ok: false, hata: 'bos' })
    assert.equal(lt4NotuDogrula('x'.repeat(301)).ok, false)
  })
})

describe('HPV vaccination', () => {
  const WHO: HpvKurali = { kaynak: 'WHO_2022', satirlar: [
    { yasAlt: 0, yasUst: null, immun: 'baskilanmis', dozlar: [2, 3] },
    { yasAlt: 9, yasUst: 14, immun: 'normal', dozlar: [1, 2] },
    { yasAlt: 15, yasUst: 20, immun: 'normal', dozlar: [1, 2] },
    { yasAlt: 21, yasUst: null, immun: 'normal', dozlar: [2], araliklar: [{ doz: 2, enAzAy: 6 }] },
  ] }
  const CDC: HpvKurali = { kaynak: 'CDC_ACIP', satirlar: [
    { yasAlt: 9, yasUst: 26, immun: 'baskilanmis', dozlar: [3], araliklar: [{ doz: 2, enAzAy: 1, enCokAy: 2 }, { doz: 3, enAzAy: 6 }] },
    { yasAlt: 9, yasUst: 14, immun: 'normal', dozlar: [2], araliklar: [{ doz: 2, enAzAy: 6, enCokAy: 12 }], kisaAralik: { enAzAy: 5, ekDoz: 3 } },
    { yasAlt: 15, yasUst: 26, immun: 'normal', dozlar: [3], araliklar: [{ doz: 2, enAzAy: 1, enCokAy: 2 }, { doz: 3, enAzAy: 6 }] },
  ] }
  it('a one-or-two-dose schedule is complete at one dose', () => {
    const p = hpvPlani({ ilkDozYasi: 12, immun: 'normal', dozlar: [{ no: 1, tarih: '2026-01-10', tip: '9v' }] }, WHO)
    assert.deepEqual([p.durum, p.gereken, p.yapilan], ['tamamlandi', 1, 1])
  })
  it('over 21: two doses, the second 6 months after the first', () => {
    const p = hpvPlani({ ilkDozYasi: 23, immun: 'normal', dozlar: [{ no: 1, tarih: '2026-01-31' }] }, WHO)
    assert.deepEqual([p.durum, p.sonraki?.no, p.sonraki?.enErken, p.sonraki?.enGec], ['devam', 2, '2026-07-31', null])
  })
  it('immunocompromised rows come first: at least two doses', () => {
    const p = hpvPlani({ ilkDozYasi: 12, immun: 'baskilanmis', dozlar: [{ no: 1, tarih: '2026-01-10' }] }, WHO)
    assert.deepEqual([p.durum, p.gereken], ['devam', 2])
  })
  it('CDC: two doses less than 5 months apart need a third', () => {
    const p = hpvPlani({ ilkDozYasi: 11, immun: 'normal', dozlar: [{ no: 1, tarih: '2026-01-15' }, { no: 2, tarih: '2026-05-01' }] }, CDC)
    assert.deepEqual([p.durum, p.gereken], ['devam', 3]); assert.ok(p.uyarilar.includes('kisa_aralik_ek_doz'))
    const ok = hpvPlani({ ilkDozYasi: 11, immun: 'normal', dozlar: [{ no: 1, tarih: '2026-01-15' }, { no: 2, tarih: '2026-07-20' }] }, CDC)
    assert.equal(ok.durum, 'tamamlandi')
  })
  it('CDC 15–26: three doses at 0, 1–2 and 6 months', () => {
    const p = hpvPlani({ ilkDozYasi: 17, immun: 'normal', dozlar: [{ no: 1, tarih: '2026-03-31' }] }, CDC)
    assert.deepEqual(p.sonraki, { no: 2, enErken: '2026-04-30', enGec: '2026-05-31' })
  })
  it('no row for the age: no rule (never a guess); no dose: no record', () => {
    assert.equal(hpvPlani({ ilkDozYasi: 30, immun: 'normal', dozlar: [{ no: 1, tarih: '2026-01-01' }] }, CDC).durum, 'kural_yok')
    assert.equal(hpvPlani({ ilkDozYasi: 12, immun: 'normal', dozlar: [] }, CDC).durum, 'kayit_yok')
  })
  it('age at first dose and month arithmetic', () => {
    assert.equal(yasTarihte('2014-06-15', '2026-06-14'), 11); assert.equal(yasTarihte('2014-06-15', '2026-06-15'), 12)
    assert.equal(ayEkle('2026-01-31', 1), '2026-02-28')
  })
})

describe('SMA carrier screening', () => {
  it('a result needs status "done"; the copy number is kept as written', () => {
    assert.deepEqual(smaDegerlendir({ durum: 'teklif_edildi', sonuc: 'tasiyici' }), { ok: false, hata: 'sonuc_yalniz_yapildi' })
    assert.deepEqual(smaDegerlendir({ durum: 'yapildi' }), { ok: false, hata: 'sonuc_gerekli' })
    assert.deepEqual(smaDegerlendir({ durum: 'yapildi', sonuc: 'tasiyici', smn1Kopya: 'one' }), { ok: false, hata: 'kopya_bicimi' })
    const r = smaDegerlendir({ durum: 'yapildi', sonuc: 'tasiyici', smn1Kopya: '1', tarih: '2026-11-01' })
    assert.ok(r.ok && r.kayit.smn1Kopya === '1' && r.esTestiIstemi && r.genetikDanismaIstemi && !r.ciftTasiyici)
  })
  it('the engine never turns a copy number into a carrier status', () => {
    const r = smaDegerlendir({ durum: 'yapildi', sonuc: 'tasiyici_degil', smn1Kopya: '1' })
    assert.ok(r.ok && !r.esTestiIstemi && !r.genetikDanismaIstemi)
  })
  it('partner tested carrier: couple flagged; referral prompt until referred', () => {
    const r = smaDegerlendir({ durum: 'yapildi', sonuc: 'tasiyici', smn1Kopya: '1', esDurumu: 'yapildi', esSonucu: 'tasiyici', esSmn1Kopya: '≥3' })
    assert.ok(r.ok && r.ciftTasiyici && !r.esTestiIstemi && r.genetikDanismaIstemi)
    const s = smaDegerlendir({ durum: 'yapildi', sonuc: 'tasiyici', esDurumu: 'yapildi', esSonucu: 'tasiyici', genetikDanisma: 'yonlendirildi' })
    assert.ok(s.ok && !s.genetikDanismaIstemi)
    assert.deepEqual(smaDegerlendir({ durum: 'yapildi', sonuc: 'tasiyici', esDurumu: 'yapildi' }), { ok: false, hata: 'es_sonucu_gerekli' })
    assert.deepEqual(smaDegerlendir({ durum: 'declined' as never }), { ok: false, hata: 'durum' })
  })
})

describe('PMS / PMDD diary', () => {
  const PUAN = (b: number, c: number) => Object.fromEntries(PMDD_ALANLARI.map((a) => [a, a.startsWith('b') ? b : c]))
  /** A cycle: 7 premenstrual days, 5 days of bleeding, 7 post-menses days. */
  function dongu(basla: string, once: [number, number], sonra: [number, number], eksik = false): PmddGunGirdisi[] {
    const out: PmddGunGirdisi[] = []
    const d = (i: number) => new Date(Date.parse(`${basla}T00:00:00Z`) + i * 86400000).toISOString().slice(0, 10)
    for (let i = 0; i < 7; i++) if (!(eksik && i === 3)) out.push({ tarih: d(i), adet: false, puan: PUAN(...once) })
    for (let i = 7; i < 12; i++) out.push({ tarih: d(i), adet: true, puan: PUAN(2, 2) })
    for (let i = 12; i < 19; i++) out.push({ tarih: d(i), adet: false, puan: PUAN(...sonra) })
    return out
  }
  it('validates one day; refuses a value off the scale', () => {
    assert.equal(pmddGunDogrula({ tarih: '2026-11-01', adet: false, puan: { b1: 4 } }).ok, true)
    assert.deepEqual(pmddGunDogrula({ tarih: '2026-11-01', puan: { b1: 9 } }), { ok: false, hata: 'puan' })
    assert.deepEqual(pmddGunDogrula({ tarih: '2026-11-01', puan: {} }), { ok: false, hata: 'bos' })
    assert.equal(pmddGunDogrula({ tarih: '2026-11-01', adet: true, puan: {} }).ok, true)
  })
  it('bleeding episodes are runs of consecutive days', () => {
    assert.deepEqual(adetEpizotlari(dongu('2026-09-01', [5, 3], [0, 1])), [{ bas: '2026-09-08', son: '2026-09-12' }])
  })
  it('two complete cycles with the pattern: criterion F is supported', () => {
    const o = pmddOzeti([...dongu('2026-09-01', [5, 3], [0, 1]), ...dongu('2026-09-29', [4, 2], [1, 0])])
    assert.equal(o.degerlendirilebilir, 2); assert.equal(o.oruntuDongu, 2); assert.equal(o.ikiDonguTamam, true)
    assert.equal(o.donguler[0].karsilayan, 11); assert.equal(o.donguler[0].bKarsilayan, 4)
  })
  it('"marked" for criterion B: a B rating of 3 does not count, C items of 2 still do', () => {
    const o = pmddOzeti(dongu('2026-09-01', [3, 2], [0, 0]))
    assert.equal(o.donguler[0].bKarsilayan, 0); assert.equal(o.donguler[0].karsilayan, 7); assert.equal(o.donguler[0].oruntu, false)
  })
  it('symptoms that continue after menses do not count; a missing day leaves the cycle unscored', () => {
    assert.equal(pmddOzeti(dongu('2026-09-01', [5, 5], [3, 3])).donguler[0].oruntu, false)
    const e = pmddOzeti(dongu('2026-09-01', [5, 5], [0, 0], true))
    assert.deepEqual([e.donguler[0].oruntu, e.donguler[0].once.eksikGun, e.degerlendirilebilir], [null, 1, 0])
  })
  it('the checklist: all ticked; F missing = provisional; anything else missing = incomplete', () => {
    assert.equal(pmddKontrolListesi(['A', 'B', 'C', 'D', 'E', 'F', 'G']).durum, 'tum_kriterler')
    assert.equal(pmddKontrolListesi(['A', 'B', 'C', 'D', 'E', 'G']).durum, 'gecici')
    assert.deepEqual(pmddKontrolListesi(['A', 'B']).eksik, ['C', 'D', 'E', 'F', 'G'])
  })
})
