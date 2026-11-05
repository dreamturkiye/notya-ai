/**
 * KD-OPERATOR-01 — known-answer tests for the shared calculators (lib/clinical). Every case is taken from the definition
 * in the source the file cites; the same file runs on main and on every release branch.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { asaEtiketi, capriniHesapla, capriniYasPuani, sscDurumu, SSC_MADDELERI } from './cerrahiGuvenlik'
import { profilaksiHesapla, type ProfilaksiParametreleri } from './antibiyotikProfilaksi'
import { iotaBasitKurallar, oradsKategori, rmi1, rmiU } from './adneksKitle'
import { asrmEvre, enzianKodu, myomOzeti, palmCoeinKodu } from './jinekolojikSiniflama'
import { bishopSkoru, kanKaybi, kanamaEvresi, robsonSiniflandir, sezaryenAciliyeti, sokIndeksi, vki } from './dogumSalonu'
import { erasDurumu, ERAS_LISTELERI, siviAcigi } from './histeroskopiEras'
import { ONAM_PROSEDURLERI, ONAM_RISKLERI, ONAM_YAPILARI } from './onamProsedurleri'

test('WHO checklist: every phase must be answered yes or (where allowed) not applicable', () => {
  const hepsi: Record<string, 'evet'> = {}
  for (const a of Object.values(SSC_MADDELERI)) for (const m of a) hepsi[m.anahtar] = 'evet'
  assert.equal(sscDurumu(hepsi).tamam, true)
  assert.deepEqual(sscDurumu({ ...hepsi, antibiyotik_60dk: 'hayir' }).asamalar.mola.hayir, ['antibiyotik_60dk'])
  // "not applicable" is refused where the item does not allow it (patient identity cannot be N/A)
  assert.deepEqual(sscDurumu({ ...hepsi, kimlik_bolge_islem_onam: 'na' }).asamalar.giris.eksik, ['kimlik_bolge_islem_onam'])
  assert.equal(sscDurumu({ ...hepsi, sayim_dogru: 'na' }).asamalar.cikis.tamam, true)
})

test('Caprini 2005: age points and the CHEST 2012 groups', () => {
  assert.deepEqual([30, 41, 60, 61, 74, 75].map(capriniYasPuani), [0, 1, 1, 2, 2, 3])
  // 45-year-old, laparoscopic surgery over 45 minutes (2), BMI over 25 (1), oral contraceptive (1): 1+2+1+1 = 5 -> high
  const r = capriniHesapla({ yas: 45, secili: ['laparoskopik_cerrahi_45dk', 'vki_25_ustu', 'oks_hrt'] })
  assert.equal(r.toplam, 5)
  assert.equal(r.bant, 'yuksek')
  assert.deepEqual(r.plan, ['farmakolojik', 'mekanik_ek'])
  assert.deepEqual(capriniHesapla({ yas: 45, secili: ['laparoskopik_cerrahi_45dk', 'malignite', 'vki_25_ustu'], kanserCerrahisi: true }).plan, ['farmakolojik', 'mekanik_ek', 'uzatilmis_4_hafta'])
  assert.equal(capriniHesapla({ yas: 30, secili: [] }).bant, 'cok_dusuk')
  assert.equal(capriniHesapla({ yas: 30, secili: ['kucuk_cerrahi', 'varis'] }).bant, 'dusuk')
  assert.equal(capriniHesapla({ yas: 50, secili: ['buyuk_acik_cerrahi_45dk'] }).bant, 'orta')
  assert.deepEqual(capriniHesapla({ yas: 50, secili: ['buyuk_acik_cerrahi_45dk'], kanamaRiskiYuksek: true }).plan, ['mekanik_kanama_riski'])
  assert.deepEqual(capriniHesapla({ yas: 20, secili: ['yok_boyle'] }).bilinmeyen, ['yok_boyle'])
  assert.equal(capriniHesapla({ yas: 20, secili: ['vte_oykusu', 'vte_oykusu'] }).toplam, 3) // a tick counts once
})

test('ASA labels with the emergency modifier (never on class VI)', () => {
  assert.equal(asaEtiketi('3', true), 'ASA III-E')
  assert.equal(asaEtiketi('1'), 'ASA I')
  assert.equal(asaEtiketi('6', true), 'ASA VI')
  assert.equal(asaEtiketi('7'), null)
})

test('antibiotic prophylaxis: computes only what the country states', () => {
  const ABD: ProfilaksiParametreleri = { sefazolin_g: 2, sefazolin_yuksek_g: 3, kilo_esigi_kg: 120, kilo_esigi_dahil: 1, azitromisin_mg: 500, klindamisin_mg: 900, gentamisin_mg_kg: 5, tekrar_saat: 4, tekrar_kan_ml: 1500 }
  assert.deepEqual(profilaksiHesapla({ islem: 'sezaryen', kiloKg: 80 }, ABD).dozlar, [{ ilac: 'sefazolin', miktar: 2, birim: 'g' }])
  assert.deepEqual(profilaksiHesapla({ islem: 'sezaryen', kiloKg: 120 }, ABD).dozlar[0], { ilac: 'sefazolin', miktar: 3, birim: 'g' })
  assert.ok(profilaksiHesapla({ islem: 'sezaryen', kiloKg: 90, eylemdeVeyaZarAcik: true }, ABD).dozlar.some((d) => d.ilac === 'azitromisin' && d.miktar === 500))
  const alerji = profilaksiHesapla({ islem: 'sezaryen', kiloKg: 70, siddetliBetaLaktamAlerjisi: true }, ABD)
  assert.deepEqual(alerji.dozlar, [{ ilac: 'klindamisin', miktar: 900, birim: 'mg' }, { ilac: 'gentamisin', miktar: 350, birim: 'mg' }])
  const uzun = profilaksiHesapla({ islem: 'histerektomi', kiloKg: 70, gecenSaat: 4, kanKaybiMl: 1600 }, ABD)
  assert.deepEqual(uzun.uyarilar, ['tekrar_doz_sure', 'tekrar_doz_kan'])
  // RANZCOG C-Gen 17: strictly OVER 120 kg, and the higher amount for caesarean only
  const RANZCOG: ProfilaksiParametreleri = { sefazolin_g: 2, sefazolin_yuksek_g: 3, kilo_esigi_kg: 120, kilo_esigi_dahil: 0, kilo_esigi_yalniz_sezaryen: 1, klindamisin_mg: 600, gentamisin_mg_kg: 2, metronidazol_mg: 500, tekrar_saat: 3 }
  assert.equal(profilaksiHesapla({ islem: 'sezaryen', kiloKg: 120 }, RANZCOG).dozlar[0].miktar, 2)
  assert.equal(profilaksiHesapla({ islem: 'sezaryen', kiloKg: 121 }, RANZCOG).dozlar[0].miktar, 3)
  assert.deepEqual(profilaksiHesapla({ islem: 'histerektomi', kiloKg: 130 }, RANZCOG).dozlar, [{ ilac: 'sefazolin', miktar: 2, birim: 'g' }, { ilac: 'metronidazol', miktar: 500, birim: 'mg' }])
  // a country with no national dose: nothing computed, said out loud
  const yok = profilaksiHesapla({ islem: 'sezaryen', kiloKg: 70 }, {})
  assert.equal(yok.ulusalDozYok, true)
  assert.deepEqual(yok.dozlar, [])
  assert.equal(profilaksiHesapla({ islem: 'sezaryen', kiloKg: 0 }, ABD).tamam, false)
})

test('IOTA Simple Rules (Timmerman 2008)', () => {
  assert.equal(iotaBasitKurallar(['b1_unilokuler', 'b5_akim_yok']).sonuc, 'benign')
  assert.equal(iotaBasitKurallar(['m2_asit']).sonuc, 'malign')
  assert.equal(iotaBasitKurallar(['b1_unilokuler', 'm2_asit']).sonuc, 'belirsiz')
  assert.equal(iotaBasitKurallar([]).sonuc, 'belirsiz')
})

test('RMI I (NICE CG122 appendix): U 0/1/3, M 1/3, x CA-125', () => {
  assert.equal(rmiU([]), 0)
  assert.equal(rmiU(['solid_alan']), 1)
  assert.equal(rmiU(['multilokuler', 'asit', 'bilateral']), 3)
  // postmenopausal, 2 features (U=3), CA-125 35 -> 3 x 3 x 35 = 315; at NICE's 250: refer
  assert.deepEqual(rmi1({ usg: ['multilokuler', 'solid_alan'], postmenopozal: true, ca125: 35 }, 250), { rmi: 315, u: 3, m: 3, esikUstu: true })
  assert.equal(rmi1({ usg: ['solid_alan'], postmenopozal: false, ca125: 100 }, 200)?.esikUstu, false)
  assert.equal(rmi1({ usg: ['solid_alan'], postmenopozal: false, ca125: 100 })?.esikUstu, null)
  assert.equal(rmi1({ usg: [], postmenopozal: false, ca125: null }), null)
})

test('O-RADS US v2022 categories', () => {
  assert.equal(oradsKategori({ lezyon: 'unilokuler', basitKist: true, boyutCm: 2.5 }).kategori, 1)
  assert.equal(oradsKategori({ lezyon: 'unilokuler', basitKist: true, boyutCm: 2.5, postmenopozal: true }).kategori, 2)
  assert.equal(oradsKategori({ lezyon: 'unilokuler', basitKist: true, boyutCm: 12 }).kategori, 3)
  assert.equal(oradsKategori({ lezyon: 'unilokuler', solidBilesen: true, papillerSayisi: 4 }).kategori, 5)
  assert.equal(oradsKategori({ lezyon: 'unilokuler', solidBilesen: true, papillerSayisi: 2 }).kategori, 4)
  assert.equal(oradsKategori({ lezyon: 'multilokuler', renkSkoru: 2, boyutCm: 6 }).kategori, 3)
  assert.equal(oradsKategori({ lezyon: 'multilokuler', renkSkoru: 4, boyutCm: 6 }).kategori, 4)
  assert.equal(oradsKategori({ lezyon: 'multilokuler', solidBilesen: true, renkSkoru: 3 }).kategori, 5)
  assert.equal(oradsKategori({ lezyon: 'solid', renkSkoru: 1 }).kategori, 3)
  assert.equal(oradsKategori({ lezyon: 'solid', renkSkoru: 3 }).kategori, 4)
  assert.equal(oradsKategori({ lezyon: 'solid', renkSkoru: 4 }).kategori, 5)
  assert.equal(oradsKategori({ lezyon: 'solid', disKonturDuzensiz: true }).kategori, 5)
  assert.equal(oradsKategori({ lezyon: 'klasik_benign', boyutCm: 4 }).kategori, 2)
  assert.equal(oradsKategori({ lezyon: 'bilokuler', boyutCm: 5, asitVeyaPeritonNodulu: true }).kategori, 5)
  assert.deepEqual(oradsKategori({ lezyon: 'solid' }), { kategori: null, eksik: ['renk_skoru'] })
})

test('FIGO PALM-COEIN notation and the leiomyoma subclassification', () => {
  assert.equal(palmCoeinKodu({ palm: [], coein: ['O'], myomTipleri: ['2'] }), 'P0 A0 L1(SM) M0 - C0 O1 E0 I0 N0')
  assert.equal(palmCoeinKodu({ palm: ['P'], coein: [], myomTipleri: ['4', '6'] }), 'P1 A0 L1(O) M0 - C0 O0 E0 I0 N0')
  assert.equal(palmCoeinKodu({ palm: [], coein: [] }), 'P0 A0 L0 M0 - C0 O0 E0 I0 N0')
  const o = myomOzeti([{ tip: '0', boyutMm: 20 }, { tip: '4', boyutMm: 55 }, { tip: '2-5', boyutMm: 40 }, { tip: '9', boyutMm: 10 }])
  assert.equal(o.sayi, 3)
  assert.equal(o.enBuyukMm, 55)
  assert.equal(o.submukoz, 1)
  assert.equal(o.hibrit, 1)
  assert.ok(o.bayraklar.includes('kavite_ile_iliskili') && o.bayraklar.includes('tipi_bilinmeyen_var'))
})

test('revised ASRM (1996): points and stage', () => {
  assert.deepEqual(asrmEvre({ periton_yuzeyel: 'lt1' }), { puan: 1, evre: 'I' })
  // superficial peritoneum 1-3 cm (2) + right ovary deep 1-3 cm (16) = 18 -> III
  assert.deepEqual(asrmEvre({ periton_yuzeyel: '1_3', over_sag_derin: '1_3' }), { puan: 18, evre: 'III' })
  // complete obliteration of the cul-de-sac (40) + peritoneum deep >3 cm (6) = 46 -> IV
  assert.deepEqual(asrmEvre({ douglas: 'tam', periton_derin: 'gt3' }), { puan: 46, evre: 'IV' })
  // a completely enclosed fimbriated end counts 16 for that tube
  assert.equal(asrmEvre({ fimbria_sol_kapali: true }).puan, 16)
  assert.deepEqual(asrmEvre({}), { puan: 0, evre: null })
})

test('#Enzian notation', () => {
  assert.equal(enzianKodu({ yontem: 's', P: '2', O_sol: '1', O_sag: '2', T_sol: '2', T_sag: '3', A: '2', B_sol: '1', B_sag: '1', C: '3', F: ['FA', 'XX'] }), '#Enzian(s) P2, O1/2, T2/3, A2, B1/1, C3, FA')
  assert.equal(enzianKodu({ yontem: 'q' }), null)
})

test('Bishop (1964) and the country limit', () => {
  const tam = { aciklik: '3_4', silinme: '60_70', istasyon: 'eksi1_0', kivam: 'yumusak', pozisyon: 'orta' }
  assert.deepEqual(bishopSkoru(tam), { toplam: 9, eksik: [], uygun: null })
  assert.equal(bishopSkoru(tam, 6).uygun, true) // NICE NG207: more than 6
  assert.equal(bishopSkoru({ ...tam, kivam: 'sert', pozisyon: 'posterior' }, 8).uygun, false) // 6 is not more than 8
  assert.deepEqual(bishopSkoru({ aciklik: 'kapali' }).eksik, ['silinme', 'istasyon', 'kivam', 'pozisyon'])
})

test('Robson (WHO 2017)', () => {
  const b = { parite: 'nullipar' as const, oncekiSezaryen: false, fetus: 'tekil' as const, prezentasyon: 'bas' as const, hafta: 39, eylem: 'spontan' as const }
  assert.equal(robsonSiniflandir(b).grup, 1)
  assert.deepEqual(robsonSiniflandir({ ...b, eylem: 'induksiyon' }), { grup: 2, alt: 'a', eksik: [] })
  assert.deepEqual(robsonSiniflandir({ ...b, parite: 'multipar', eylem: 'eylem_oncesi_sezaryen' }), { grup: 4, alt: 'b', eksik: [] })
  assert.equal(robsonSiniflandir({ ...b, parite: 'multipar', oncekiSezaryen: true }).grup, 5)
  assert.equal(robsonSiniflandir({ ...b, prezentasyon: 'makat' }).grup, 6)
  assert.equal(robsonSiniflandir({ ...b, fetus: 'cogul' }).grup, 8)
  assert.equal(robsonSiniflandir({ ...b, prezentasyon: 'transvers' }).grup, 9)
  assert.equal(robsonSiniflandir({ ...b, hafta: 34 }).grup, 10)
})

test('caesarean urgency: the country target in minutes', () => {
  const r = sezaryenAciliyeti({ kategori: '1', kararZamani: '2026-11-05T10:00', dogumZamani: '2026-11-05T10:35' }, 30)
  assert.equal(r.hedef, '2026-11-05T10:30')
  assert.equal(r.gecenDk, 35)
  assert.equal(r.asildi, true)
  assert.equal(sezaryenAciliyeti({ kategori: '3', kararZamani: '2026-11-05T10:00' }).hedef, null)
})

test('QBL, shock index (El Ayadi 2016) and PPH stage', () => {
  assert.deepEqual(kanKaybi({ islakGram: 1450, kuruGram: 450, kanisterMl: 600, amniyonMl: 400 }), { ml: 1200, olculdu: true })
  assert.deepEqual(kanKaybi({ tahminiMl: 700 }), { ml: 700, olculdu: false })
  assert.deepEqual(sokIndeksi(110, 100), { si: 1.1, bant: 'esik_0_9' })
  assert.equal(sokIndeksi(140, 80)?.bant, 'esik_1_7')
  assert.equal(sokIndeksi(80, 120)?.bant, 'normal')
  // RCOG GTG 52: 500 / 1001 / 2001 (more than 1000, more than 2000) -> 1200 mL = band 2 (moderate major)
  assert.equal(kanamaEvresi(1200, [500, 1001, 2001]), 2)
  assert.equal(kanamaEvresi(400, [500, 1001, 2001]), 0)
  assert.equal(kanamaEvresi(1000, [1000]), 1) // ACOG: 1000 mL or more
  assert.equal(vki(165, 68), 25)
})

test('hysteroscopy fluid deficit (AAGL 2013 limits)', () => {
  const r = siviAcigi({ ortam: 'hipotonik', riskli: false, olcumler: [{ zaman: '10:00', girenMl: 2000, cikanMl: 1700 }, { zaman: '10:15', girenMl: 4000, cikanMl: 3150 }] })
  assert.equal(r?.acikMl, 850)
  assert.equal(r?.sinirMl, 1000)
  assert.equal(r?.bant, 'sinira_yakin')
  assert.equal(siviAcigi({ ortam: 'izotonik', riskli: false, olcumler: [{ zaman: '1', girenMl: 5000, cikanMl: 2400 }] })?.bant, 'sinir_asildi')
  assert.equal(siviAcigi({ ortam: 'hipotonik', riskli: true, olcumler: [{ zaman: '1', girenMl: 700, cikanMl: 200 }] })?.sinirMl, 750)
  assert.equal(siviAcigi({ ortam: 'hipotonik', riskli: false, olcumler: [] }), null)
  const e = erasDurumu('sezaryen', ['normotermi', 'rejyonel_anestezi'])
  assert.equal(e.yapilan, 2)
  assert.equal(e.toplam, ERAS_LISTELERI.sezaryen.length)
})

test('consent forms: one structure per operation-note template, every risk keyed', () => {
  assert.equal(ONAM_PROSEDURLERI.length, 16)
  assert.ok(!(ONAM_PROSEDURLERI as readonly string[]).some((k) => /himen/.test(k)))
  for (const k of ONAM_PROSEDURLERI) assert.ok(ONAM_YAPILARI[k].ciddi.length > 0 && ONAM_YAPILARI[k].sik.length > 0, k)
  assert.ok(ONAM_RISKLERI.every((r) => /^[a-z0-9_]+$/.test(r)))
})
