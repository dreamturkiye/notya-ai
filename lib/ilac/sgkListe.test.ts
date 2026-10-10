/**
 * NOTYA-SUT-RAPOR-01i — the SGK list import (scripts/import-sgk-ilac.mjs → scripts/lib/sgk-liste.mjs) and the
 * catalogue it wrote from the EK-4/A list in force from 02.10.2026.
 *
 * Rule behind every assertion: SUT 4.1.9(1) — "Bu listede ticari isimleri ve barkod/karekod numaraları yer almayan
 * ilaçların bedelleri hiç bir koşulda Kurumca ödenmez." Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { listeyiBirlestir, pasifDurumu, tarihleriCoz, barkodlar, type KatalogKaydi, type ListeSatiri } from '../../scripts/lib/sgk-liste.mjs'
import { ilacAra, type IlacKaydi } from './ilacArama'
import { ilaclariGrupla } from './ilacGrupla'

const satir = (o: Partial<ListeSatiri>): ListeSatiri => ({ kamuNo: '', barkod: '', ad: '', esdegerGrubu: '', eskiBarkodlar: [], aktiflenme: [], pasiflenme: [], cikarma: false, ...o })

describe('SGK liste importu — etken madde korunur, pasif ve listeden çıkan ürün "ödenir" kalmaz', () => {
  const mevcut: KatalogKaydi[] = [
    { kamuNo: 'A1', barkod: '8690000000011', ad: 'ORNEK 10 MG 30 TABLET', marka: 'ORNEK', esdegerGrubu: 'E1A', sgk: true, etkenMadde: 'Örnek madde', atc: 'A00AA00', etkenKaynak: 'titck', ruhsatAskida: 1 },
    { kamuNo: 'A2', barkod: '8690000000028', ad: 'CIKAN 5 MG 20 TABLET', marka: 'CIKAN', esdegerGrubu: 'E2A', sgk: true, etkenMadde: 'Çıkan madde', atc: 'B00BB00', etkenKaynak: 'titck' },
    { kamuNo: 'A3', barkod: '8690000000035', ad: 'TASINAN 2 MG/ML SURUP', marka: 'TASINAN', esdegerGrubu: '', sgk: true, etkenMadde: 'Taşınan madde', atc: 'C00CC00', etkenKaynak: 'esdeger' },
    { kamuNo: 'A4', barkod: '8690000000042', ad: 'PASIF 15 MG 28 TABLET', marka: 'PASIF', esdegerGrubu: 'E4A', sgk: true, etkenMadde: 'Pasif madde', atc: 'D00DD00', etkenKaynak: 'titck' },
  ]

  it('(a) listede kalan ürünün etken maddesi, ATC kodu, kaynağı ve ruhsat işareti barkodla korunur', () => {
    const { ilaclar, rapor } = listeyiBirlestir(mevcut, [satir({ kamuNo: 'A1', barkod: '8690000000011', ad: 'ORNEK 10 MG 30 TABLET (YENI AD)', esdegerGrubu: 'E1A/ E1B' })], { tamListe: false, listeTarihi: '2026-10-02' })
    const k = ilaclar.find((d) => d.barkod === '8690000000011')!
    assert.equal(k.etkenMadde, 'Örnek madde')
    assert.equal(k.atc, 'A00AA00')
    assert.equal(k.etkenKaynak, 'titck')
    assert.equal(k.ruhsatAskida, 1)
    assert.equal(k.ad, 'ORNEK 10 MG 30 TABLET (YENI AD)')
    assert.equal(k.esdegerGrubu, 'E1A/E1B', 'eşdeğer grubu kodundaki boşluk temizlenir')
    assert.equal(k.sgk, true)
    assert.equal(rapor.adiDegisen.length, 1)
    assert.equal(rapor.esdegerDegisen.length, 1)
  })

  it('(a) listeye yeni giren ürüne etken madde UYDURULMAZ', () => {
    const { ilaclar, rapor } = listeyiBirlestir(mevcut, [satir({ kamuNo: 'A9', barkod: '8690000000097', ad: 'YENI 100 MG 30 TABLET', esdegerGrubu: 'E1A' })], { listeTarihi: '2026-10-02' })
    const k = ilaclar.find((d) => d.barkod === '8690000000097')!
    assert.equal(k.etkenMadde, undefined)
    assert.equal(k.atc, undefined)
    assert.equal(k.sgk, true)
    assert.deepEqual(rapor.etkensizYeni.map((x) => x.barkod), ['8690000000097'])
  })

  it('(a) barkodu değişen ürün: SGK’nın "Eski Barkodlar" sütunu ve aynı Kamu No ile etken madde yeni barkoda taşınır', () => {
    const { ilaclar, rapor } = listeyiBirlestir(mevcut, [satir({ kamuNo: 'A3', barkod: '8680000000777', ad: 'TASINAN 2 MG/ML SURUP', eskiBarkodlar: ['8690000000035'] })], { tamListe: true, listeTarihi: '2026-10-02' })
    const k = ilaclar.find((d) => d.barkod === '8680000000777')!
    assert.equal(k.etkenMadde, 'Taşınan madde')
    assert.equal(k.etkenKaynak, 'eski-barkod')
    assert.ok(!ilaclar.some((d) => d.barkod === '8690000000035'), 'eski barkod ayrı bir kayıt olarak kalmaz')
    assert.equal(rapor.yenidenBarkodlanan.length, 1)
    // Kamu No farklıysa aynı ürün sayılmaz: etken madde taşınmaz.
    const baska = listeyiBirlestir(mevcut, [satir({ kamuNo: 'A77', barkod: '8680000000778', ad: 'BASKA 2 MG/ML SURUP', eskiBarkodlar: ['8690000000035'] })], { listeTarihi: '2026-10-02' })
    assert.equal(baska.ilaclar.find((d) => d.barkod === '8680000000778')!.etkenMadde, undefined)
  })

  it('(b) Pasiflenme Tarihi: son pasiflenme son aktiflenmeden sonraysa ürün ödenmez sayılır; yeniden aktiflenen ödenir', () => {
    assert.deepEqual(tarihleriCoz('19.04.2024/\n17.05.2025/\n01.05.2026'), ['2024-04-19', '2025-05-17', '2026-05-01'])
    assert.deepEqual(tarihleriCoz({ y: 2022, m: 5, d: 30 }), ['2022-05-30'])
    assert.deepEqual(tarihleriCoz('   '), [])
    assert.equal(pasifDurumu([], ['2022-05-30'], '2026-10-02').pasif, true)
    assert.equal(pasifDurumu(['2018-10-11'], ['2018-08-30', '2022-05-30'], '2026-10-02').pasif, true)
    assert.equal(pasifDurumu(['2025-09-26'], ['2025-05-17'], '2026-10-02').pasif, false)
    assert.equal(pasifDurumu(['2024-08-30', '2025-09-12', '2026-09-18'], ['2024-04-19', '2025-05-17', '2026-05-01'], '2026-10-02').pasif, false)
    // Aynı gün: sıra listeden okunamaz — ürün listede göründüğü gibi bırakılır ve raporda ayrıca sayılır.
    assert.deepEqual(pasifDurumu(['2024-01-19'], ['2024-01-19'], '2026-10-02'), { pasif: false, belirsiz: true, tarih: '2024-01-19' })
    // Liste tarihinden sonraki bir pasiflenme henüz yürürlükte değildir.
    assert.equal(pasifDurumu([], ['2026-12-01'], '2026-10-02').pasif, false)

    const { ilaclar } = listeyiBirlestir(mevcut, [satir({ kamuNo: 'A4', barkod: '8690000000042', ad: 'PASIF 15 MG 28 TABLET', esdegerGrubu: 'E4A', pasiflenme: ['2024-04-19'] })], { listeTarihi: '2026-10-02' })
    const k = ilaclar.find((d) => d.barkod === '8690000000042')!
    assert.equal(k.sgk, false)
    assert.equal(k.sgkDurum, 'pasif')
    assert.equal(k.sgkDurumTarihi, '2024-04-19')
    assert.equal(k.etkenMadde, 'Pasif madde', 'pasif ürünün etken maddesi silinmez')
  })

  it('(c) SUT 4.1.9(1): tam listede artık yer almayan ürün silinmez, "ödenir" de kalmaz', () => {
    const { ilaclar, rapor } = listeyiBirlestir(mevcut, [satir({ kamuNo: 'A1', barkod: '8690000000011', ad: 'ORNEK 10 MG 30 TABLET', esdegerGrubu: 'E1A' })], { tamListe: true, listeTarihi: '2026-10-02' })
    const cikan = ilaclar.find((d) => d.barkod === '8690000000028')!
    assert.equal(cikan.sgk, false)
    assert.equal(cikan.sgkDurum, 'cikarildi')
    assert.equal(cikan.sgkDurumTarihi, '2026-10-02')
    assert.equal(cikan.etkenMadde, 'Çıkan madde')
    assert.equal(rapor.cikarilan.length, 3)
    // Haftalık fark dosyası tam liste değildir: adı geçmeyen ürüne dokunulmaz.
    const fark = listeyiBirlestir(mevcut, [satir({ kamuNo: 'A1', barkod: '8690000000011', ad: 'ORNEK 10 MG 30 TABLET' })], { tamListe: false, listeTarihi: '2026-10-02' })
    assert.equal(fark.ilaclar.find((d) => d.barkod === '8690000000028')!.sgk, true)
    // ÇIKARILANLAR sayfası: ürün ödenmez olarak işaretlenir.
    const cikarma = listeyiBirlestir(mevcut, [satir({ barkod: '8690000000028', ad: 'CIKAN 5 MG 20 TABLET', cikarma: true })], { listeTarihi: '2026-10-09' })
    assert.equal(cikarma.ilaclar.find((d) => d.barkod === '8690000000028')!.sgk, false)
    // Listeye geri dönen ürün yeniden ödenir.
    const donen = listeyiBirlestir(cikarma.ilaclar, [satir({ kamuNo: 'A2', barkod: '8690000000028', ad: 'CIKAN 5 MG 20 TABLET', esdegerGrubu: 'E2A' })], { listeTarihi: '2026-10-16' })
    const d2 = donen.ilaclar.find((d) => d.barkod === '8690000000028')!
    assert.equal(d2.sgk, true)
    assert.equal(d2.sgkDurum, undefined)
    assert.equal(d2.etkenMadde, 'Çıkan madde')
  })

  it('barkod hücresi birden çok barkod taşıyabilir', () => {
    assert.deepEqual(barkodlar('8699624570062, 8699624570079'), ['8699624570062', '8699624570079'])
    assert.deepEqual(barkodlar(null), [])
  })
})

describe('data/sgk-ilaclar.json — 02.10.2026 tarihli EK-4/A’dan üretilen katalog', () => {
  const veri = JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'sgk-ilaclar.json'), 'utf8')) as { guncelleme: string; titck: string; ilaclar: (IlacKaydi & { sgkDurum?: string; sgkDurumTarihi?: string })[] }
  const kayitlar = veri.ilaclar

  it('liste tarihi 02.10.2026; TİTCK tarihi (etken maddenin kaynağı) korunmuş', () => {
    assert.equal(veri.guncelleme, '2026-10-02')
    assert.equal(veri.titck, '2026-08-26')
  })

  it('02.10.2026 listesindeki 8.184 üründen 8.180’i ödenir, 4’ü listede pasiftir; listeden çıkan 477 ürün ödenmez olarak durur', () => {
    assert.equal(kayitlar.filter((k) => k.sgk !== false).length, 8180)
    assert.equal(kayitlar.filter((k) => k.sgkDurum === 'pasif').length, 4)
    assert.equal(kayitlar.filter((k) => k.sgkDurum === 'cikarildi').length, 477)
    assert.ok(kayitlar.every((k) => (k.sgk === false) === (k.sgkDurum === 'pasif' || k.sgkDurum === 'cikarildi')))
    assert.equal(new Set(kayitlar.map((k) => k.barkod || k.ad)).size, kayitlar.length, 'barkod tekrarı yok')
  })

  it('etken madde kaybı yok: önceki katalogdaki 8.435 etken maddeli kaydın hepsi duruyor', () => {
    assert.equal(kayitlar.filter((k) => k.etkenMadde).length, 8435)
    assert.ok(kayitlar.filter((k) => k.etkenMadde).every((k) => ['titck', 'esdeger', 'eski-barkod'].includes(String(k.etkenKaynak))))
  })

  it('etken maddesi olmayan kayıt (listeye yeni giren ürün) aramada adıyla bulunur ve grubu bozmaz', () => {
    const etkensiz = kayitlar.filter((k) => !k.etkenMadde && k.sgk !== false)
    assert.ok(etkensiz.length > 0)
    const ornek = etkensiz.find((k) => /^[A-Z]{5,}$/.test(k.marka)) || etkensiz[0]
    const gruplar = ilaclariGrupla(ilacAra(kayitlar, ornek.marka, 60))
    const g = gruplar.find((x) => x.sunumlar.some((s) => s.barkod === ornek.barkod))
    assert.ok(g, `${ornek.marka} aramada bulunmalı`)
    assert.equal(g!.sunumlar.find((s) => s.barkod === ornek.barkod)!.etkenMadde, undefined)
  })

  it('ödenmeyen sunum grubun içinde işaretlidir; ödenen bir sunumu olan marka "SGK öder" görünür', () => {
    const pasif = kayitlar.find((k) => k.sgkDurum === 'pasif')!
    const g = ilaclariGrupla(ilacAra(kayitlar, pasif.marka, 60)).find((x) => x.sunumlar.some((s) => s.barkod === pasif.barkod))!
    const s = g.sunumlar.find((x) => x.barkod === pasif.barkod)!
    assert.equal(s.sgk, false)
    assert.equal(g.sgk, g.sunumlar.some((x) => x.sgk !== false))
  })
})
