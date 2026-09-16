import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aubDegerlendir, pmpKapatilabilir, kokDegerlendir, endometriozisDegerlendir, rmDegerlendir, egkDegerlendir } from '../engines/jinekoloji-v2'

describe('AUB / PALM-COEIN', () => {
  it('menoraji by duration/pads/clots; ≥45 or PMP → sampling mandatory; cytology never enough for PMP', () => {
    const a = aubDegerlendir({ yas: 47, postmenopoz: false, palm: {}, coein: {}, sureGun: 9, pedAdet: 12, pihti: false, hb: 10.5, ferritin: 8 })
    assert.equal(a.menoraji, true); assert.equal(a.anemi, 'hafif'); assert.equal(a.endometrialOrnekZorunlu, true)
    const p = aubDegerlendir({ yas: 58, postmenopoz: true, palm: {}, coein: {}, sureGun: 2, pedAdet: 2, pihti: false, hb: 13, ferritin: null })
    assert.equal(p.endometrialOrnekZorunlu, true); assert.ok(p.gerekce.some((g) => g.includes('KAPATMAZ')))
    const y = aubDegerlendir({ yas: 28, postmenopoz: false, palm: {}, coein: {}, sureGun: 5, pedAdet: 8, pihti: false, hb: 13, ferritin: 30 })
    assert.equal(y.endometrialOrnekZorunlu, false); assert.equal(y.menoraji, false)
    const adol = aubDegerlendir({ yas: 16, postmenopoz: false, palm: {}, coein: {}, sureGun: 10, pedAdet: 25, pihti: true, hb: 9, ferritin: 5 })
    assert.ok(adol.tetkikler.some((t) => t.includes('vWF')))
  })
  it('PMP gate closes only with TVUS + sampling; ET notes', () => {
    assert.equal(pmpKapatilabilir({ tvusEt: 3, ornekleme: { tur: null, sonuc: null }, sitolojiVar: true }).kapatilabilir, false)
    const r = pmpKapatilabilir({ tvusEt: 6, ornekleme: { tur: 'pipelle', sonuc: 'benign' }, sitolojiVar: false }); assert.equal(r.kapatilabilir, true); assert.ok(r.not.some((n) => n.includes('>4 mm')))
  })
})

describe('KOK — WHO MEC gate', () => {
  it('MEC 4 blocks; MEC 3 cautions; clean → 1; alternatives listed when ≥3', () => {
    const blok = kokDegerlendir({ yas: 38, sigaraGunluk: 20, vteOykusu: false, migrenAura: false, taSistolik: 120, taDiastolik: 80, vaskulerHastalik: false, memeCa: false, karacigerAgir: false, karacigerTumor: false, postpartumGun: null, emziriyor: false, slePozitifApl: false, dmVaskuler: false, buyukCerrahiImmobil: false, bilinmeyenKanama: false })
    assert.equal(blok.kategori, 4); assert.ok(blok.alternatif.length >= 1)
    const dikkat = kokDegerlendir({ yas: 36, sigaraGunluk: 5, vteOykusu: false, migrenAura: false, taSistolik: 145, taDiastolik: 92, vaskulerHastalik: false, memeCa: false, karacigerAgir: false, karacigerTumor: false, postpartumGun: null, emziriyor: false, slePozitifApl: false, dmVaskuler: false, buyukCerrahiImmobil: false, bilinmeyenKanama: false })
    assert.equal(dikkat.kategori, 3); assert.equal(dikkat.dikkat.length, 2)
    const temizGirdi = { yas: 24, sigaraGunluk: 0, vteOykusu: false, migrenAura: false, taSistolik: 110, taDiastolik: 70, vaskulerHastalik: false, memeCa: false, karacigerAgir: false, karacigerTumor: false, postpartumGun: null, emziriyor: false, slePozitifApl: false, dmVaskuler: false, buyukCerrahiImmobil: false, bilinmeyenKanama: false }
    const temiz = kokDegerlendir(temizGirdi)
    assert.equal(temiz.kategori, 1); assert.equal(temiz.alternatif.length, 0)
    assert.equal(kokDegerlendir({ ...temizGirdi, migrenAura: true }).kategori, 4)
    assert.equal(kokDegerlendir({ ...temizGirdi, yas: 30, postpartumGun: 10 }).kategori, 4)
  })
})

describe('Endometriozis', () => {
  it('triad → olasılık; gebelik isteği suppresses hormonal; endometrioma ≥4 cm → surgery referral; no staging', () => {
    const e = endometriozisDegerlendir({ dismenore: true, disparoni: true, kronikPelvikAgri: true, infertilite: false, endometriomaCm: null, ca125: 45, gebelikIstegi: false })
    assert.equal(e.olasilik, 'yuksek'); assert.ok(e.ampirik.length >= 2); assert.ok(e.not.some((n) => n.includes('Evreleme')))
    const f = endometriozisDegerlendir({ dismenore: true, disparoni: false, kronikPelvikAgri: false, infertilite: true, endometriomaCm: 5, ca125: null, gebelikIstegi: true })
    assert.equal(f.ampirik.length, 0); assert.ok(f.sevk.some((s) => s.includes('IVF'))); assert.ok(f.sevk.some((s) => s.includes('≥4 cm')))
  })
})

describe('Tekrarlayan gebelik kaybı', () => {
  it('threshold 2 (or doctor 3); APS/cavity/TSH routine; inherited thrombophilia not recommended', () => {
    const r = rmDegerlendir({ klinikKayipSayisi: 2, hekimEsigi3: false, anneYas: 32, ardisik: true })
    assert.equal(r.kriterKarsilandi, true); assert.ok(r.tetkikler.find((t) => t.ad.startsWith('Antifosfolipid'))!.oneri === 'rutin'); assert.ok(r.tetkikler.find((t) => t.ad.includes('trombofili'))!.oneri === 'onerilmez')
    assert.equal(rmDegerlendir({ klinikKayipSayisi: 2, hekimEsigi3: true, anneYas: 32, ardisik: true }).kriterKarsilandi, false)
  })
})

describe('Erken gebelik kaybı — definitive criteria', () => {
  it('CRL ≥7 no FHR → kesin; CRL 5 no FHR → şüphe (repeat); FHR → viabl; Rh− → anti-D task; plateau → ektopik', () => {
    const k = egkDegerlendir({ crlMm: 8, fhrVar: false, msdMm: null, embriyoVar: true, bhcg: [], rhNegatif: true, hafta: 8 }, 'insufficient')
    assert.equal(k.tanı, 'kesin_nonviabl'); assert.equal(k.secenekler.length, 3); assert.ok(k.gorevler.some((g) => g.includes('anti-D')))
    const s = egkDegerlendir({ crlMm: 5, fhrVar: false, msdMm: null, embriyoVar: true, bhcg: [], rhNegatif: false, hafta: 6 }, 'insufficient')
    assert.equal(s.tanı, 'suphe'); assert.equal(s.secenekler.length, 0); assert.ok(s.gorevler.some((g) => g.includes('Tekrar TVUS')))
    assert.equal(egkDegerlendir({ crlMm: 12, fhrVar: true, msdMm: null, embriyoVar: true, bhcg: [], rhNegatif: false, hafta: 8 }, 'rising').tanı, 'viabl')
    const p = egkDegerlendir({ crlMm: null, fhrVar: null, msdMm: null, embriyoVar: false, bhcg: [], rhNegatif: false, hafta: 5 }, 'plateau')
    assert.ok(p.gorevler.some((g) => g.includes('ektopik')))
  })
})
