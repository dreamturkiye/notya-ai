/**
 * NOTYA-ASISTAN-PERSONA-BRANS-LOOKUP-01 — regresyon kilidi: BUG A'nın gerçek kapsamı.
 * CEO düzeltmesi: "Ayşe Kaya" yalnız pediatrinin kendi kimliğidir; başka HİÇBİR branşta
 * görünmemesi gerekir. Bu dosya, repo'da zaten tam olan iki rosterin (Doktor 30 branş + Klinik
 * 10 dal = 40) HER anahtarını tek tek dener — hiçbiri burada icat edilmedi, ikisi de mevcut
 * kaynak dosyalardan (`specialistsCatalog.ts`, `klinik_uzmanlar.ts`) okunuyor.
 *
 * NOTYA-UZ-ASISTAN-PERSONA-DOKTOR-01 (release/uz ONLY): bu dalda `uzAsistanAdi()`
 * (countries/uz/klinik/asistanAdlari.ts) TR Doktor rosterinden ÖNCE denenir ve 30/30 branşı
 * kapsar — bu yüzden release/uz'da "30 branşın hepsi" testi artık TR adlarını (Ayşe/Mehmet/…)
 * DEĞİL, Kaan'ın 2026-10-08/09 UZ adlarını bekler; kaynak 'doktor-brans-uz' olur. TR roster
 * testi (aşağıda, ayrı describe) `getSpecialistForSpecialty`'yi DOĞRUDAN çağırarak TR katalogun
 * kendisinin bozulmadığını ayrıca doğrular — bu dal release/AU/CA/GB/NZ/US/TR'de hâlâ canlı yol.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bransAsistanPersonasiBul, bransPersonasiBulunamadiMi } from './bransAsistanPersonasi'
import { getSpecialistForSpecialty } from './specialistsCatalog'

describe('bransAsistanPersonasiBul — Doktor rosteri (release/uz: 30/30 branş → UZ adı, "doktor-brans-uz")', () => {
  // Kaan'ın 2026-10-08/09 UZ Doktor listesi (countries/uz/klinik/asistanAdlari.ts) — tam 30/30,
  // boşluksuz. "dermatoloji" burada da ASLA Ayşe/Selin değil — kendi UZ uzmanı Sevara.
  const beklenen: Record<string, string> = {
    pediatri: 'Malika',
    kardiyoloji: 'Kamola',
    noroloji: 'Bobur',
    dahiliye: 'Madina',
    psikiyatri: 'Zulfiya',
    'genel-cerrahi': 'Sherzod',
    ortopedi: 'Ulugbek',
    dermatoloji: 'Sevara',
    'kulak-burun-bogaz': 'Nodir',
    'goz-hastaliklari': 'Aziza',
    'kadin-hastaliklari-dogum': 'Shahnoza',
    uroloji: 'Javohir',
    radyoloji: 'Akmal',
    anestezi: 'Bekzod',
    'acil-tip': 'Jasur',
    'fizik-tedavi': 'Laziz',
    'enfeksiyon-hastaliklari': 'Otabek',
    endokrinoloji: 'Dilnoza',
    gastroenteroloji: 'Jamshid',
    nefroloji: 'Mohira',
    romatoloji: 'Saodat',
    onkoloji: 'Nigora',
    'gogus-hastaliklari': 'Gulnoza',
    'gogus-cerrahisi': 'Farrux',
    'plastik-cerrahi': 'Barno',
    'beyin-cerrahisi': 'Alisher',
    'kalp-damar-cerrahisi': 'Temur',
    'cocuk-cerrahisi': 'Sardor',
    'aile-hekimligi': 'Nilufar',
    'spor-hekimligi': 'Sanjar',
  }

  it('30 branşın hepsi UZ uzmanını döner, "doktor-brans-uz" kaynaklı, "Prof. Dr. <ad> <soyad>" tamAd, hiçbiri çökmez', () => {
    assert.equal(Object.keys(beklenen).length, 30, 'liste 30 branşı kapsamalı (lib/doktor/specialties.ts ile aynı sayı)')
    for (const [brans, isim] of Object.entries(beklenen)) {
      const p = bransAsistanPersonasiBul(brans)
      assert.equal(p.kisaAd, isim, `${brans} → ${isim} bekleniyordu, ${p.kisaAd} geldi`)
      assert.equal(p.kaynak, 'doktor-brans-uz', `${brans} kaynağı doktor-brans-uz olmalı`)
      assert.equal(p.tamAd, `Prof. Dr. ${isim} ${p.tamAd.split(' ').pop()}`, `${brans} tamAd "Prof. Dr. …" biçiminde olmalı`)
      assert.ok(p.tamAd.startsWith('Prof. Dr. '), `${brans} tamAd "Prof. Dr." ile başlamalı`)
      assert.ok(p.voiceId, `${brans} için voiceId eksik`)
      assert.ok(p.gender === 'female' || p.gender === 'male', `${brans} için gender eksik/geçersiz`)
    }
  })

  // CEO'nun doğrudan örneği (tam senaryo): dermatoloji → "Sevara Ismailova", ASLA "Ayşe".
  it('dermatoloji → "Prof. Dr. Sevara Ismailova" (release/uz), ASLA "Ayşe" — TR fix\'in direkt UZ paraleli', () => {
    const p = bransAsistanPersonasiBul('dermatoloji')
    assert.equal(p.tamAd, 'Prof. Dr. Sevara Ismailova')
    assert.equal(p.kisaAd, 'Sevara')
    assert.equal(p.kaynak, 'doktor-brans-uz')
    assert.notEqual(p.kisaAd, 'Ayşe')
    assert.notEqual(p.kisaAd, 'Selin') // TR dermatoloji uzmanı — release/uz'da görünmemeli
  })

  it('"kadin-dogum" (eski veri anahtarı) de "kadin-hastaliklari-dogum" ile AYNI kişiyi (UZ: Shahnoza) döner — bransAnahtari takma adı çözer', () => {
    assert.equal(bransAsistanPersonasiBul('kadin-dogum').kisaAd, 'Shahnoza')
  })
})

describe('TR Doktor katalogu (specialistsCatalog.ts) — UZ önceliği onun ÜZERİNE binmiyor, kendisi bozulmadı', () => {
  it('getSpecialistForSpecialty TR katalogdan okumayı sürdürür (bransAsistanPersonasiBul değil) — TR/AU/CA/GB/NZ/US dallarının canlı yolu bu', () => {
    assert.equal(getSpecialistForSpecialty('dermatoloji').shortName, 'Selin')
    assert.equal(getSpecialistForSpecialty('pediatri').shortName, 'Ayşe')
    assert.equal(getSpecialistForSpecialty('kardiyoloji').shortName, 'Mehmet')
  })
})

describe('bransAsistanPersonasiBul — Klinik rosteri (10/10 dal, kendi adı — Doktor rosteriyle karışmaz)', () => {
  // NOT: "dermatoloji" anahtarı bu listede YOK — iki rosterde de kullanılan ortak bir kelime
  // (Doktor: TDD dermatoloji uzmanı Selin Aksoy; Klinik: ayrı bir ürün olan "Klinik dermatoloji"
  // dalının uzmanı Selin Çelik — klinikDikey.ts: "dermatoloji (TDD) ≠ klinik-dermatoloji").
  // `bransAnahtari('dermatoloji')` Doktor'un kanonik branş anahtarına çözüldüğü için Doktor rosteri
  // ÖNCELİKLİDİR (bkz. aşağıdaki "iki rosterde de olan ortak anahtar" testi) — bu panel yalnız
  // Doktor dikeyinde mount edildiği için (app/dashboard/doktor/…) bu, gerçek çağıranlar için doğru
  // davranıştır; Klinik kendi "dermatoloji" dalını AYRI bir yüzeyden (app/asistan/klinik) okur.
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

  it('"dermatoloji" anahtarı iki rosterde de var — Doktor branş anahtarına çözüldüğü için Doktor kazanır; release/uz\'da bu da UZ önceliklidir (Sevara), Klinik\'in Selin Çelik\'i bu ortak anahtarla ERİŞİLEMEZ (bilinen, belgelenen veri çakışması — icat değil)', () => {
    const p = bransAsistanPersonasiBul('dermatoloji')
    assert.equal(p.kaynak, 'doktor-brans-uz')
    assert.equal(p.kisaAd, 'Sevara')
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
