import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  gebelikSekmesiUygun,
  hastaDosyaSekmeleri,
  ozelBolumBransi,
  pediatriAracSekmesiUygun,
  pediatriSekmesiUygun,
  muayeneAltiSekmeler,
  gogusSekmesiBransi,
  dahiliyeSekmesiBransi,
  urolojiSekmesiBransi,
  sporHekimligiSekmesiBransi,
  ortopediSekmesiBransi,
  genelCerrahiSekmesiBransi, pediatriCaprazBransi, gebeBayrakMetni, kadinSagligiBolumuBransi
} from './hastaDosyaSekmeleri'

const NOW = Date.parse('2026-09-15T00:00:00Z')

describe('hastaDosyaSekmeleri', () => {
  it('hides M-CHAT, gelişim, and büyüme tabs on adult patients', () => {
    assert.equal(pediatriSekmesiUygun('1998-04-01', NOW), false)
    const adult = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, deriUygun: false })
    const labels = adult.map((t) => t.label)
    assert.equal(labels.includes('M-CHAT-R/F'), false)
    assert.equal(labels.includes('Gelişim Taraması'), false)
    assert.equal(labels.includes('Büyüme Eğrileri'), false)
    assert.equal(labels.includes('Deri & Lezyon'), false)
    // Ayşe şerit — sekme listesinde yok
    assert.equal(adult.some((t) => t.id === 'ayse'), false)
    assert.equal(labels.includes("Ayşe'ye Danış"), false)
  })

  it('shows Deri only when deriUygun (dermatoloji doctor)', () => {
    const derm = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, deriUygun: true })
    assert.ok(derm.some((t) => t.id === 'deri'))
    const goz = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, gozUygun: true, deriUygun: false })
    assert.equal(goz.some((t) => t.id === 'deri'), false)
    assert.ok(goz.some((t) => t.id === 'goz'))
  })

  it('keeps pediatric tabs for a child; KD lives under Muayene Geçmişi (not top-level)', () => {
    assert.equal(pediatriSekmesiUygun('2022-01-10', NOW), true)
    assert.equal(gebelikSekmesiUygun({ cinsiyet: 'Kadın', dogumIso: '1995-06-01' }, NOW), true)
    assert.equal(gebelikSekmesiUygun({ cinsiyet: 'Erkek', dogumIso: '1995-06-01' }, NOW), false)
    const woman = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: true })
    assert.equal(woman.some((t) => t.id === 'gebelik'), false)
    assert.ok(muayeneAltiSekmeler(true).some((t) => t.id === 'gebelik'))
    assert.equal(muayeneAltiSekmeler(false).some((t) => t.id === 'gebelik'), false)
    assert.equal(woman.some((t) => t.id === 'mchat'), false)
    const child = hastaDosyaSekmeleri({ pediatriUygun: true, gebelikUygun: false })
    assert.ok(child.some((t) => t.id === 'mchat'))
    assert.ok(child.some((t) => t.id === 'gelisim'))
    assert.ok(child.some((t) => t.id === 'buyume'))
  })

  it('CHART-TAB-POLICY: göz doctor does not get ped tabs even for a child', () => {
    assert.equal(ozelBolumBransi('Göz Hastalıkları'), true)
    assert.equal(ozelBolumBransi('aile hekimliği'), false)
    assert.equal(
      pediatriAracSekmesiUygun({ dogumIso: '2022-01-10', doktorBransi: 'goz-hastaliklari', pediatriDoktoru: false }, NOW),
      false,
    )
    assert.equal(
      pediatriAracSekmesiUygun({ dogumIso: '2022-01-10', doktorBransi: 'aile hekimliği', pediatriDoktoru: false }, NOW),
      true,
    )
    assert.equal(
      pediatriAracSekmesiUygun({ dogumIso: '2022-01-10', doktorBransi: 'pediatri', pediatriDoktoru: true }, NOW),
      true,
    )
  })

  it('KONSULTASYON-01: Konsültasyonlar sekmesi evrensel — her branş bayrağı kombinasyonunda, Belgeler\'in hemen ardından', () => {
    const kombinasyonlar = [
      { pediatriUygun: false, gebelikUygun: false },
      { pediatriUygun: true, gebelikUygun: false },
      { pediatriUygun: false, gebelikUygun: true, dahiliyeUygun: true },
      { pediatriUygun: false, gebelikUygun: false, gozUygun: true },
      { pediatriUygun: false, gebelikUygun: false, deriUygun: true },
      { pediatriUygun: false, gebelikUygun: false, psikiyatriUygun: true },
      { pediatriUygun: false, gebelikUygun: false, kbbUygun: true },
    ]
    for (const k of kombinasyonlar) {
      const ids = hastaDosyaSekmeleri(k).map((t) => t.id)
      assert.equal(ids.filter((x) => x === 'konsultasyon').length, 1, JSON.stringify(k))
      assert.equal(ids[ids.indexOf('belgeler') + 1], 'konsultasyon')
      const goruntu = hastaDosyaSekmeleri(k).find((t) => t.id === 'goruntuleme')
      assert.equal(goruntu?.label, 'Görüntüler')
    }
    const etiket = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false }).find((t) => t.id === 'konsultasyon')!.label
    assert.equal(etiket, 'Konsültasyonlar')
    assert.doesNotMatch(etiket, /sevk/i, 'SGK sevki ayrı belgedir — sekme "sevk" demez')
  })

  it('KBB-EXCEPTIONAL-01: KBB sekmesi yalnız kbbUygun; yabancı branşta yok', () => {
    const kbb = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, kbbUygun: true })
    assert.ok(kbb.some((t) => t.id === 'kbb' && t.label === 'KBB'))
    const psik = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, psikiyatriUygun: true })
    assert.equal(psik.some((t) => t.id === 'kbb'), false)
    assert.ok(psik.some((t) => t.id === 'psikiyatri'))
    const goz = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, gozUygun: true })
    assert.equal(goz.some((t) => t.id === 'kbb'), false)
    assert.equal(ozelBolumBransi('Kulak Burun Boğaz'), true)
    assert.equal(ozelBolumBransi('kulak-burun-bogaz'), true)
  })

  it('GOGUS-EXCEPTIONAL-01: Göğüs sekmesi yalnız gogusUygun; cerrahi ve dahiliye yok', () => {
    const g = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, gogusUygun: true })
    assert.ok(g.some((t) => t.id === 'gogus' && t.label === 'Göğüs'))
    const dah = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, dahiliyeUygun: true })
    assert.equal(dah.some((t) => t.id === 'gogus'), false)
    assert.equal(gogusSekmesiBransi('gogus-hastaliklari'), true)
    assert.equal(gogusSekmesiBransi('Göğüs Hastalıkları'), true)
    assert.equal(gogusSekmesiBransi('gogus-cerrahisi'), false)
    assert.equal(gogusSekmesiBransi('Göğüs Cerrahisi'), false)
    assert.equal(dahiliyeSekmesiBransi('gogus-hastaliklari'), false)
    assert.equal(ozelBolumBransi('gogus-hastaliklari'), true)
  })

  it('UROLOJI-EXCEPTIONAL-01: Üroloji sekmesi yalnız urolojiUygun; yabancı branşta yok', () => {
    const uro = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, urolojiUygun: true })
    assert.ok(uro.some((t) => t.id === 'uroloji' && t.label === 'Üroloji'))
    const kbb = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, kbbUygun: true })
    assert.equal(kbb.some((t) => t.id === 'uroloji'), false)
    assert.equal(urolojiSekmesiBransi('uroloji'), true)
    assert.equal(urolojiSekmesiBransi('Üroloji'), true)
    assert.equal(urolojiSekmesiBransi('urology'), true)
    assert.equal(urolojiSekmesiBransi('dahiliye'), false)
    assert.equal(ozelBolumBransi('uroloji'), true)
  })

  it('SPOR-HEKIMLIGI-EXCEPTIONAL-01: Spor Hekimliği sekmesi yalnız sporHekimligiUygun; ortopedi/FTR yok', () => {
    const spor = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, sporHekimligiUygun: true })
    assert.ok(spor.some((t) => t.id === 'spor-hekimligi' && t.label === 'Spor Hekimliği'))
    const orto = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, ortopediUygun: true })
    assert.equal(orto.some((t) => t.id === 'spor-hekimligi'), false)
    const ftr = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, fizikTedaviUygun: true })
    assert.equal(ftr.some((t) => t.id === 'spor-hekimligi'), false)
    assert.equal(sporHekimligiSekmesiBransi('spor-hekimligi'), true)
    assert.equal(sporHekimligiSekmesiBransi('Spor Hekimliği'), true)
    assert.equal(sporHekimligiSekmesiBransi('ortopedi'), false)
    assert.equal(sporHekimligiSekmesiBransi('fizik-tedavi'), false)
    assert.equal(ozelBolumBransi('spor-hekimligi'), true)
  })

  it('ORTOPEDI-EXCEPTIONAL-01: Ortopedi sekmesi yalnız ortopediUygun; yabancı branşta yok', () => {
    const orto = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, ortopediUygun: true })
    assert.ok(orto.some((t) => t.id === 'ortopedi' && t.label === 'Ortopedi'))
    const ftr = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, fizikTedaviUygun: true })
    assert.equal(ftr.some((t) => t.id === 'ortopedi'), false)
    assert.equal(ortopediSekmesiBransi('ortopedi'), true)
    assert.equal(ortopediSekmesiBransi('Ortopedi ve Travmatoloji'), true)
    assert.equal(ortopediSekmesiBransi('orthopedics'), true)
    assert.equal(ortopediSekmesiBransi('fizik-tedavi'), false)
    assert.equal(ozelBolumBransi('ortopedi'), true)
  })

  it('GENEL-CERRAHI-EXCEPTIONAL-01: Genel Cerrahi sekmesi yalnız genelCerrahiUygun; yabancı branşta yok', () => {
    const gc = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, genelCerrahiUygun: true })
    assert.ok(gc.some((t) => t.id === 'genel-cerrahi' && t.label === 'Genel Cerrahi'))
    const plastik = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, plastikUygun: true })
    assert.equal(plastik.some((t) => t.id === 'genel-cerrahi'), false)
    assert.equal(genelCerrahiSekmesiBransi('genel-cerrahi'), true)
    assert.equal(genelCerrahiSekmesiBransi('Genel Cerrahi'), true)
    assert.equal(genelCerrahiSekmesiBransi('plastik-cerrahi'), false)
    assert.equal(genelCerrahiSekmesiBransi('cocuk-cerrahisi'), false)
    assert.equal(ozelBolumBransi('genel-cerrahi'), true)
  })
})


// BRANS-SIZMASI-PEDIATRI (Kaan, 2026-09-25): pediatri alanı pediatride kalır; çapraz geçiş aile / pratisyen.
describe('pediatri sekmeleri — branş sızması yok', () => {
  const COCUK = '2021-03-01'
  const ERISKIN = '1980-03-01'
  const SIMDI = Date.parse('2026-09-25T12:00:00Z')
  const uygun = (brans: string | null, pediatriDoktoru = false, dogum = COCUK) =>
    pediatriAracSekmesiUygun({ dogumIso: dogum, doktorBransi: brans, pediatriDoktoru }, SIMDI)

  it('kardiyoloji / KBB / üroloji / ortopedi / göz / derm / KD / dahiliye / yeni branş çocuk hastada GÖRMEZ', () => {
    for (const b of ['kardiyoloji', 'kulak burun boğaz', 'uroloji', 'ortopedi', 'goz', 'dermatoloji', 'kadin-dogum', 'dahiliye', 'yeni-bir-brans']) {
      assert.equal(uygun(b), false, b)
    }
  })

  it('pediatri her zaman; çapraz geçiş aile hekimliği / pratisyen / branşsız görür', () => {
    assert.equal(uygun('pediatri', true), true)
    assert.equal(uygun('aile hekimliği'), true)
    assert.equal(uygun('aile-hekimligi'), true)
    assert.equal(uygun('genel pratisyen'), true)
    assert.equal(uygun(''), true)
    assert.equal(pediatriCaprazBransi('kardiyoloji'), false)
  })

  it('erişkin hastada aile hekiminde ve pediatride bile yok', () => {
    assert.equal(uygun('aile hekimliği', false, ERISKIN), false)
    assert.equal(uygun('pediatri', true, ERISKIN), false)
  })
})


// BRANS-SIZMASI-KD (Kaan, 2026-09-25): tam KD bölümü kadın doğum + birinci basamak; diğerlerine yalnız gebelik bayrağı.
describe('Kadın Sağlığı & Gebelik — branş sızması yok, Türkiye pratiği', () => {
  const KADIN = { cinsiyet: 'Kadın', dogumIso: '1994-05-01' }
  const SIMDI = Date.parse('2026-09-25T12:00:00Z')

  it('kadın doğum ve yan dalları + aile hekimi / pratisyen tam bölümü görür', () => {
    for (const b of ['kadın hastalıkları ve doğum', 'kadin-dogum', 'perinatoloji', 'jinekolojik onkoloji', 'aile hekimliği', 'genel pratisyen', '']) {
      assert.equal(gebelikSekmesiUygun({ ...KADIN, doktorBransi: b }, SIMDI), true, b)
    }
  })

  it('dermatoloji / radyoloji / dahiliye / KBB / kardiyoloji / göz / pediatri tam bölümü GÖRMEZ', () => {
    for (const b of ['dermatoloji', 'radyoloji', 'dahiliye', 'kulak burun boğaz', 'kardiyoloji', 'goz', 'pediatri']) {
      assert.equal(gebelikSekmesiUygun({ ...KADIN, doktorBransi: b }, SIMDI), false, b)
    }
    assert.equal(kadinSagligiBolumuBransi('dermatoloji'), false)
  })

  it('erkek hastada hiç yok; branş verilmeyen eski çağrı eski davranışı korur', () => {
    assert.equal(gebelikSekmesiUygun({ cinsiyet: 'Erkek', dogumIso: '1994-05-01', doktorBransi: 'kadin-dogum' }, SIMDI), false)
    assert.equal(gebelikSekmesiUygun(KADIN, SIMDI), true)
  })

  it('gebeBayrakMetni: SAT ya da TDT ile hafta; tarih yoksa yalnız Gebe; kayıt yoksa null', () => {
    assert.equal(gebeBayrakMetni({ sat: '2026-04-10' }, SIMDI), 'Gebe · 24. hafta')
    assert.equal(gebeBayrakMetni({ tdt: '2026-12-25' }, SIMDI), 'Gebe · 27. hafta')
    assert.equal(gebeBayrakMetni({}, SIMDI), 'Gebe')
    assert.equal(gebeBayrakMetni(null, SIMDI), null)
  })
})
