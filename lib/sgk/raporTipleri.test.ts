import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  RAPOR_TIPLERI,
  UC_YILLIK_RAPOR,
  addDaysTr,
  raporSureSiniri,
  resolveRaporTipi,
  sgkRaporMetniBirlesik,
  sgkRaporUyariMetni,
  systemPromptFor,
  type SgkRaporDraft,
} from './raporTipleri'

describe('sgk raporTipleri', () => {
  it('lists unique report types without duplicate kurul', () => {
    const labels = RAPOR_TIPLERI.map((t) => t.label)
    assert.equal(new Set(labels).size, labels.length)
    assert.ok(RAPOR_TIPLERI.some((t) => t.id === 'is_goremezlik'))
    assert.ok(RAPOR_TIPLERI.some((t) => t.id === 'ilac_kullanim'))
    assert.ok(RAPOR_TIPLERI.some((t) => t.id === 'tibbi_malzeme'))
    assert.ok(RAPOR_TIPLERI.some((t) => t.id === 'muayenehane_istirahat'))
  })

  it('istirahat uses days and excludes çalışma kapasitesi from prompt', () => {
    const tip = resolveRaporTipi('is_goremezlik')
    assert.equal(tip.sureBirimi, 'gun')
    const prompt = systemPromptFor(tip)
    assert.match(prompt, /çalışma kapasitesi/i)
    assert.match(prompt, /YOKTUR/)
    assert.doesNotMatch(prompt, /calismaKapasitesi/)
  })

  it('resolves legacy labels', () => {
    assert.equal(resolveRaporTipi('İş Göremezlik (İstirahat) Raporu').id, 'is_goremezlik')
    assert.equal(resolveRaporTipi('İlaç Kullanım Raporu').id, 'ilac_kullanim')
  })

  it('computes inclusive end date in TR locale', () => {
    const start = new Date(2026, 8, 5) // 5 Sep 2026 local
    const end = addDaysTr(start, 3)
    // tr-TR may render 7.09.2026 or 07.09.2026
    assert.match(end, /^0?7\.0?9\.2026$/)
  })
})

/**
 * NOTYA-SUT-RAPOR-01 — Hasta Raporları (ortak araç, her branşta aynı): rapor süresi ve "kâğıt rapor" notu.
 * Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 */
describe('NOTYA-SUT-RAPOR-01 · Hasta Raporları süre sınırları resmî SUT metniyle aynı', () => {
  const ilac = resolveRaporTipi('ilac_kullanim')

  it('SUT 4.1.3(5): ilaç kullanım raporu en fazla iki yıl (24 ay)', () => {
    assert.deepEqual(raporSureSiniri(ilac), { min: 1, max: 24, madde: 'SUT 4.1.3(5)' })
    assert.match(systemPromptFor(ilac), /SUT süresi en fazla 24 ay/)
  })

  it('SUT 4.2.16(2) ve (6): çölyak hastalığı ve doğuştan metabolik hastalıkta özel mama raporu 3 yıl (36 ay) — önceki davranış 24 ayda kesiyordu', () => {
    assert.equal(UC_YILLIK_RAPOR.ay, 36)
    assert.deepEqual(raporSureSiniri(ilac, UC_YILLIK_RAPOR.id), { min: 1, max: 36, madde: 'SUT 4.2.16(2), 4.2.16(6)' })
    assert.match(UC_YILLIK_RAPOR.etiket, /SUT 4\.2\.16/)
    assert.match(UC_YILLIK_RAPOR.etiket, /çölyak hastalığı/)
    assert.match(UC_YILLIK_RAPOR.etiket, /doğuştan metabolik hastalık/)
    assert.match(systemPromptFor(ilac, UC_YILLIK_RAPOR.id), /SUT süresi en fazla 36 ay/)
  })

  it('üç yıllık süre yalnız hekim işaretlediğinde ve yalnız ilaç kullanım raporunda açılır', () => {
    assert.equal(raporSureSiniri(ilac, 'baska-bir-sey').max, 24)
    assert.equal(raporSureSiniri(ilac, null).max, 24)
    for (const t of RAPOR_TIPLERI.filter((x) => x.id !== 'ilac_kullanim')) {
      assert.equal(raporSureSiniri(t, UC_YILLIK_RAPOR.id).max, t.sureMax, t.id)
    }
  })

  it('SUT 3.1.2.2(2): tıbbi malzeme raporu en fazla 2 yıl', () => {
    assert.deepEqual(raporSureSiniri(resolveRaporTipi('tibbi_malzeme')), { min: 1, max: 24, madde: 'SUT 3.1.2.2(2)' })
  })

  it('SUT 4.1.3(2),(8): "kâğıt nüsha geçerli değildir" ve "01.02.2019" metinde yok — ekranda da yok', () => {
    assert.doesNotMatch(ilac.aciklama, /Kâğıt nüsha/i)
    assert.match(ilac.aciklama, /SUT 4\.1\.3\(2\)/)
    const sayfa = readFileSync(new URL('../../app/doktor-tools/sgk-rapor/page.tsx', import.meta.url), 'utf8')
    const ekran = sayfa.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
    assert.doesNotMatch(ekran, /2019/)
    assert.doesNotMatch(ekran, /kâğıt nüshayı kabul etmez/i)
    assert.match(ekran, /SUT 4\.1\.3\(2\)/)
    // Sayfa süre sınırını ortak fonksiyondan okur; 4.2.16 seçeneği yalnız ilaç kullanım raporunda görünür.
    assert.match(ekran, /raporSureSiniri\(tipMeta/)
    assert.match(ekran, /tipMeta\.id === 'ilac_kullanim' && \(/)
  })
})

/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — flattening the 6 existing draft types into the unified
 * PDF template's single klinik block, without silently dropping a section `show()` would render.
 */
describe('NOTYA-HASTA-RAPORLARI-UNIFIED-01 · sgkRaporMetniBirlesik / sgkRaporUyariMetni', () => {
  const taslak: SgkRaporDraft = {
    raporBasligi: 'İş Göremezlik (e-İstirahat) Raporu',
    raporTuru: 'Ilk',
    hastaAdi: 'Test Hasta',
    tcSon4: '',
    tani: { icd10: 'J06.9', aciklama: 'Üst solunum yolu enfeksiyonu' },
    hekim_degerlendirmesi: 'Ateş ve boğaz ağrısı ile başvurdu.',
    isGoremezlikGerekcesi: 'İstirahat gerektirir.',
    istirahat_suresi_gun: 3,
    baslangicTarihi: '05.09.2026',
    bitisTarihi: '07.09.2026',
    hekim_notu: 'Kontrol gerekirse başvurunuz.',
  }

  it('is_goremezlik: tanı, gerekçe, klinik, rapor bilgileri ve hekim açıklaması hepsi metinde', () => {
    const tip = resolveRaporTipi('is_goremezlik')
    const metin = sgkRaporMetniBirlesik(tip, taslak, 3)
    assert.match(metin, /TANI \(ICD-10\)/)
    assert.match(metin, /J06\.9/)
    assert.match(metin, /İŞ GÖREMEZLİK GEREKÇESİ/)
    assert.match(metin, /MUAYENE BULGULARI \/ KLİNİK DEĞERLENDİRME/)
    assert.match(metin, /RAPOR BİLGİLERİ/)
    assert.match(metin, /İstirahat süresi: 3 gün/)
    assert.match(metin, /HEKİM AÇIKLAMASI/)
    assert.match(metin, /Kontrol gerekirse/)
    // etken/malzeme/tetkik bu rapor tipinde yok — boş değilse bile metne girmemeli
    assert.doesNotMatch(metin, /ETKEN MADDELER/)
  })

  it('ilaç kullanım: etken maddeler ve rapor süresi (ay) metinde, gerekçe bölümü yok', () => {
    const tip = resolveRaporTipi('ilac_kullanim')
    const metin = sgkRaporMetniBirlesik(tip, { ...taslak, onerilen_sure_ay: 6, etkenMaddeler: ['Levotiroksin'] }, 6)
    assert.match(metin, /ETKEN MADDELER/)
    assert.match(metin, /Levotiroksin/)
    assert.match(metin, /RAPOR SÜRESİ/)
    assert.doesNotMatch(metin, /İŞ GÖREMEZLİK GEREKÇESİ/)
  })

  it('medula_not uyarısı yalnız Medula kanallı tiplerde, özel uyarı yalnız muayenehane istirahatinde', () => {
    const medula = sgkRaporUyariMetni(resolveRaporTipi('is_goremezlik'), true)
    assert.match(String(medula), /Medula/)
    const ozel = sgkRaporUyariMetni(resolveRaporTipi('muayenehane_istirahat'), true)
    assert.match(String(ozel), /SGK e-İstirahat değildir/)
    assert.equal(sgkRaporUyariMetni(resolveRaporTipi('saglik_kurulu'), true) !== undefined, true) // saglik_kurulu da medula_not taşır
  })

  it('Medula bağlı değilse medula_not uyarısı bunu söyler', () => {
    const uyari = sgkRaporUyariMetni(resolveRaporTipi('ilac_kullanim'), false)
    assert.match(String(uyari), /Entegrasyonlar sayfasından bağlayın/)
  })
})
