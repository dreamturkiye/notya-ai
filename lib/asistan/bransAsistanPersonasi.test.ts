/**
 * NOTYA-ASISTAN-PERSONA-BRANS-LOOKUP-01 — regresyon kilidi: BUG A'nın gerçek kapsamı.
 * CEO düzeltmesi: "Ayşe Kaya" yalnız pediatrinin kendi kimliğidir; başka HİÇBİR branşta
 * görünmemesi gerekir. Bu dosya, repo'da zaten tam olan iki rosterin (Doktor 30 branş + Klinik
 * 10 dal = 40) HER anahtarını tek tek dener — hiçbiri burada icat edilmedi, ikisi de mevcut
 * kaynak dosyalardan (`specialistsCatalog.ts`, `klinik_uzmanlar.ts`) okunuyor.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bransAsistanPersonasiBul, bransPersonasiBulunamadiMi } from './bransAsistanPersonasi'

describe('bransAsistanPersonasiBul — Doktor rosteri (30/30 branş, hiçbiri "Ayşe" değil)', () => {
  const beklenen: Record<string, string> = {
    pediatri: 'Ayşe',
    kardiyoloji: 'Mehmet',
    noroloji: 'Elif',
    dahiliye: 'Zeynep',
    psikiyatri: 'Deniz',
    'genel-cerrahi': 'Hakan',
    ortopedi: 'Burak',
    // BUG A'nın tam konusu: dermatoloji ASLA Ayşe değil, kendi uzmanı Selin.
    dermatoloji: 'Selin',
    'kulak-burun-bogaz': 'Emre',
    'goz-hastaliklari': 'İrem',
    'kadin-hastaliklari-dogum': 'Fatma',
    uroloji: 'Murat',
    radyoloji: 'Caner',
    anestezi: 'Pınar',
    'acil-tip': 'Oğuz',
    'fizik-tedavi': 'Aylin',
    'enfeksiyon-hastaliklari': 'Serkan',
    endokrinoloji: 'Gülşah',
    gastroenteroloji: 'Volkan',
    nefroloji: 'Mert',
    romatoloji: 'Nazlı',
    onkoloji: 'Ece',
    'gogus-hastaliklari': 'Barış',
    'gogus-cerrahisi': 'Tolga',
    'plastik-cerrahi': 'Melis',
    'beyin-cerrahisi': 'Kerem',
    'kalp-damar-cerrahisi': 'Sinan',
    'cocuk-cerrahisi': 'Derya',
    'aile-hekimligi': 'Yusuf',
    'spor-hekimligi': 'Cemre',
  }

  it('30 branşın hepsi doğru kendi uzmanını döner, "doktor-brans" kaynaklı, hiçbiri çökmez', () => {
    assert.equal(Object.keys(beklenen).length, 30, 'liste 30 branşı kapsamalı (lib/doktor/specialties.ts ile aynı sayı)')
    for (const [brans, isim] of Object.entries(beklenen)) {
      const p = bransAsistanPersonasiBul(brans)
      assert.equal(p.kisaAd, isim, `${brans} → ${isim} bekleniyordu, ${p.kisaAd} geldi`)
      assert.equal(p.kaynak, 'doktor-brans', `${brans} kaynağı doktor-brans olmalı`)
      assert.ok(p.voiceId, `${brans} için voiceId eksik`)
      assert.ok(p.gender === 'female' || p.gender === 'male', `${brans} için gender eksik/geçersiz`)
    }
  })

  it('"kadin-dogum" (eski veri anahtarı) de "kadin-hastaliklari-dogum" ile AYNI kişiyi (Fatma) döner — bransAnahtari takma adı çözer', () => {
    assert.equal(bransAsistanPersonasiBul('kadin-dogum').kisaAd, 'Fatma')
  })
})

describe('bransAsistanPersonasiBul — Klinik rosteri (10/10 dal, kendi adı — Doktor rosteriyle karışmaz)', () => {
  // NOT: "dermatoloji" anahtarı bu listede YOK — iki rosterde de kullanılan ortak bir kelime
  // (Doktor: TDD dermatoloji uzmanı Selin Aksoy; Klinik: ayrı bir ürün olan "Klinik dermatoloji"
  // dalının uzmanı Selin Çelik — klinikDikey.ts: "dermatoloji (TDD) ≠ klinik-dermatoloji").
  // `bransAnahtari('dermatoloji')` Doktor'un kanonik branş anahtarına çözüldüğü için Doktor rosteri
  // ÖNCELİKLİDİR (bkz. aşağıdaki "iki rosterde de olan ortak anahtar" testi) — bu panel yalnız
  // Doktor dikeyinde mount edildiği için (app/dashboard/doktor/…) bu, gerçek çağıranlar için doğru
  // davranıştır; Klinik kendi "dermatoloji" dalını AYRI bir yüzeyden (app/asistan/ozel-branslar) okur.
  const beklenen: Record<string, string> = {
    'estetik-cerrahi': 'Leyla Arslan',
    'sac-ekimi': 'Emre Kaya',
    'medikal-estetik': 'Ceren Yıldız',
    longevity: 'Alp Tekin',
    fizyoterapi: 'Aylin Doğan',
    'klinik-psikolog': 'Berk Yılmaz',
    diyetisyen: 'Deniz Şahin',
    ergoterapi: 'Fatma Kılıç',
    odyoloji: 'Can Demir',
  }

  it('9 dalın hepsi (Doktor rosteriyle çakışmayan anahtarlar) kendi uzmanını döner, "klinik-dali" kaynaklı, hiçbiri çökmez', () => {
    for (const [dal, isim] of Object.entries(beklenen)) {
      const p = bransAsistanPersonasiBul(dal)
      assert.equal(p.kisaAd, isim, `${dal} → ${isim} bekleniyordu, ${p.kisaAd} geldi`)
      assert.equal(p.kaynak, 'klinik-dali', `${dal} kaynağı klinik-dali olmalı`)
      assert.ok(p.voiceId, `${dal} için voiceId eksik`)
    }
  })

  it('"dermatoloji" anahtarı iki rosterde de var — Doktor branş anahtarına çözüldüğü için Doktor kazanır (Selin Aksoy), Klinik\'in Selin Çelik\'i bu ortak anahtarla ERİŞİLEMEZ (bilinen, belgelenen veri çakışması — icat değil)', () => {
    const p = bransAsistanPersonasiBul('dermatoloji')
    assert.equal(p.kaynak, 'doktor-brans')
    assert.equal(p.kisaAd, 'Selin')
  })
})

describe('bransAsistanPersonasiBul — bilinmeyen branş: ASLA icat etmez, bayrak gemisine (Ayşe) düşer', () => {
  it('null / boş / tanınmayan bir dal → baseline Ayşe, kaynak "varsayilan"', () => {
    for (const giris of [null, undefined, '', 'bu-rosterde-olmayan-yeni-dal']) {
      const p = bransAsistanPersonasiBul(giris)
      assert.equal(p.kisaAd, 'Ayşe')
      assert.equal(p.kaynak, 'varsayilan')
    }
  })
})

describe('bransPersonasiBulunamadiMi — raporlama: "isim yok, icat etme" listesi', () => {
  it('her iki rosterde de olan branş/dal için false döner', () => {
    assert.equal(bransPersonasiBulunamadiMi('dermatoloji'), false)
    assert.equal(bransPersonasiBulunamadiMi('sac-ekimi'), false)
    assert.equal(bransPersonasiBulunamadiMi('pediatri'), false)
  })
  it('hiçbir rosterde olmayan bir anahtar için true döner — CEO\'ya "bunun ismi yok" raporlamak için', () => {
    assert.equal(bransPersonasiBulunamadiMi('bu-rosterde-olmayan-yeni-dal'), true)
  })
  it('boş/null için false döner (rapor edilecek bir "branş" yok)', () => {
    assert.equal(bransPersonasiBulunamadiMi(null), false)
    assert.equal(bransPersonasiBulunamadiMi(''), false)
  })
})
