import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kbSinifla, kbHedefi, htDegerlendir, dmDegerlendir, lipidDegerlendir, tiroidDegerlendir, checkupAraligi, dxaGorevi, ilacGuvenlik, kirmiziBayraklar } from '../engines/dahiliye'

describe('HT — Uzlaşı 2025', () => {
  it('classification and targets', () => {
    assert.equal(kbSinifla(118, 76).sinif, 'normal'); assert.equal(kbSinifla(128, 78).sinif, 'artmis'); assert.equal(kbSinifla(150, 92).sinif, 'ht_evre1'); assert.equal(kbSinifla(165, 88).sinif, 'ht_evre2')
    assert.deepEqual(kbHedefi(55, false).hedefSbp, [120, 130]); assert.deepEqual(kbHedefi(83, false).hedefSbp, [130, 140]); assert.deepEqual(kbHedefi(70, true).tedaviEsigi, [160, 90])
  })
  it('single evre1 → verify; confirmed HT untreated → combo suggestion (doctor picks); resistant → sevk', () => {
    const tek = htDegerlendir({ sbp: 148, dbp: 92, yas: 50, kirilgan: false, onceki: [], aktifAntihipertansif: 0, diuretikVar: false })
    assert.equal(tek.dogrulanmisHt, false); assert.ok(tek.plan[0].includes('doğrulama'))
    const dog = htDegerlendir({ sbp: 148, dbp: 92, yas: 50, kirilgan: false, onceki: [{ sbp: 146, dbp: 90, tarih: '2026-09-01' }], aktifAntihipertansif: 0, diuretikVar: false })
    assert.equal(dog.dogrulanmisHt, true); assert.ok(dog.plan.some((p) => p.includes('ACEi/ARB + KKB'))); assert.ok(dog.plan.every((p) => !/\d+\s*mg/.test(p)))
    const dir = htDegerlendir({ sbp: 158, dbp: 96, yas: 60, kirilgan: false, onceki: [{ sbp: 160, dbp: 95, tarih: '2026-08-01' }], aktifAntihipertansif: 3, diuretikVar: true })
    assert.equal(dir.direncli, true); assert.ok(dir.sevk[0].includes('Nefroloji'))
  })
})
describe('DM — TEMD 2026', () => {
  it('3 vs 6 month HbA1c; annual tasks when stale; eGFR metformin warning; no insulin titration', () => {
    const k = dmDegerlendir({ tip: 'T2', taniTarihi: '2020-01-01', hba1c: 6.8, oncekiHba1c: [{ deger: 7.4, tarih: '2026-03-01' }], hedefHba1c: 7, ilacSiniflari: ['metformin'], eGFR: 80, sonUacr: '2026-05-01', sonGozDibi: '2025-01-01', sonAyak: '2026-05-01', sonLipid: '2026-05-01', bugun: '2026-09-16' })
    assert.equal(k.kontrolde, true); assert.equal(k.sonrakiHba1cAy, 6); assert.equal(k.delta, -0.6); assert.ok(k.gorevler.some((g) => g.kod === 'dm_goz')); assert.ok(!k.gorevler.some((g) => g.kod === 'dm_uacr'))
    const u = dmDegerlendir({ tip: 'T2', taniTarihi: null, hba1c: 8.6, oncekiHba1c: [], hedefHba1c: null, ilacSiniflari: ['metformin'], eGFR: 25, sonUacr: null, sonGozDibi: null, sonAyak: null, sonLipid: null, bugun: '2026-09-16' })
    assert.equal(u.sonrakiHba1cAy, 3); assert.ok(u.uyarilar.some((x) => x.includes('metformin kontrendike'))); assert.ok(u.plan.some((p) => p.includes('ek sınıf'))); assert.ok(u.plan.every((p) => !/ünite|IU/i.test(p)))
  })
})
describe('Lipid + statin ALT trend', () => {
  it('no auto LDL target; ALT >3× after statin → review', () => {
    const l = lipidDegerlendir({ tc: 240, ldl: 160, hdl: 40, tg: 180, hedefLdl: null, statinVar: true, statinBaslangic: '2026-06-01', alt: [{ deger: 30, tarih: '2026-05-01' }, { deger: 140, tarih: '2026-09-01' }], ck: null, dm: true, ht: false, obezite: false, bugun: '2026-09-16' })
    assert.equal(l.ldlHedefte, null); assert.ok(l.plan[0].includes('hekim alanı')); assert.ok(l.uyarilar.some((u) => u.includes('>3×'))); assert.equal(l.yillikPanel, true)
  })
})
describe('Tiroid / check-up / DXA / ilaç / red flags', () => {
  it('rules', () => {
    assert.ok(tiroidDegerlendir({ tsh: 12, ft4: 0.6, levoMcg: null, kiloKg: 70, sonDozDegisim: null, nodulVar: false, bugun: '2026-09-16' }).yorum.includes('aşikâr'))
    assert.equal(tiroidDegerlendir({ tsh: 2, ft4: 1, levoMcg: 75, kiloKg: 70, sonDozDegisim: '2026-09-01', nodulVar: true, bugun: '2026-09-16' }).gorevler.length, 2)
    assert.equal(checkupAraligi(35).ay, 18); assert.equal(checkupAraligi(52).ay, 12)
    assert.equal(dxaGorevi(true, 67, false).gerekli, true); assert.equal(dxaGorevi(true, 50, false).gerekli, false)
    const i = ilacGuvenlik([{ ad: 'Metformin 1000', aktif: true }, { ad: 'Ibuprofen', aktif: true }, { ad: 'Ramipril', aktif: true }, { ad: 'Atorvastatin', aktif: true }, { ad: 'Amlodipin', aktif: true }], 25)
    assert.equal(i.polifarmasi, true); assert.equal(i.uyarilar.length, 2)
    const r = kirmiziBayraklar({ gogusAgrisi: true, yeniEkg: true, k: 6.3, hb: 6.5, eGFR: 40, oncekiEGFR: 70, ates: true, wbc: 15 }); assert.equal(r.length, 5)
    assert.equal(kirmiziBayraklar({ gogusAgrisi: false, yeniEkg: false, k: 4, hb: 13, eGFR: 65, oncekiEGFR: 70, ates: false, wbc: 8 }).length, 0)
  })
})
