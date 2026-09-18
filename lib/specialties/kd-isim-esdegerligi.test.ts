/**
 * KD-ISIMLENDIRME-01 (Kaan 2026-09-18) — "Kadın Hastalıkları ve Doğum" tek ad, veri bozulmadan.
 *
 * `'kadin-dogum'` eski bir etiket DEĞİL: üretimde gerçek KD hekimlerinin `users.specialty` değeri (2026-09-18 salt-okunur
 * sayım: 2 hesap, biri canlı beta hekim). `'kadin-hastaliklari-dogum'` kanonik anahtar, seanslar onunla açılıyor.
 * İkisi, "Kadın Hastalıkları ve Doğum" ve eski serbest metin "Kadın Doğum" AYNI branştır.
 *
 * Bu test kırıldıysa: birisi eski değeri bir çözücüden "temizledi" ya da yeni bir yerel `=== 'kadin-dogum'` / regex
 * kontrolü yazdı. Eşdeğerliği kaldırmak mevcut KD hesaplarını branşsız bırakır (profil çözülmez, Araçlar kaybolur,
 * prompts kilidi düşer, portal modülü kapanır). Değeri tekilleştirmek bir veri göçüdür — OPEN KD-ISIMLENDIRME-02,
 * Kaan onayı olmadan yapılmaz. Ledger: docs/KD-ISIMLENDIRME-LEDGER.md
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { bransAnahtari, bransKapsami } from './kapsam'
import { bransAnahtari as tekCozucu } from './bransAnahtari'
import { specialtyProfile } from './registry'
import { KADIN_DOGUM_PROFILE } from './kadin-dogum'
import { portalBransAnahtari, portalModulleri } from '@/lib/portal/moduller'
import { doktorAracBransi, doktorAraclariListesi } from '@/lib/doktor/doktorAraclari'
import { findSpecialistForSpecialty } from '@/lib/asistan/specialistsCatalog'
import { varsayilanPersonaId } from '@/lib/asistan/personaEngine'
import { bransEtiketi, klinikAdi, resmiUzmanlikAdi } from '@/lib/doktor/bransAdlari'
import { KADIN_HASTALIKLARI_DOGUM_ETIKETI, KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI, SPECIALTY_MAP } from '@/lib/doktor/specialties'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import { bransAnahtari as belgeBransAnahtari, bransKurali } from '@/core/belgeler/router'
import { kadinDogumMi } from '@/specialties/kadin-dogum/prompts'
import { KADIN_DOGUM_MANIFEST } from '@/specialties/kadin-dogum/manifest'

const KD = 'kadin-hastaliklari-dogum'
const NEDEN =
  "KD-ISIMLENDIRME-01: 'kadin-dogum' canlı users.specialty değeridir (gerçek KD hekimleri). Bu girdiyi KD'ye çözmeyi " +
  'bırakmak o hesapları branşsız bırakır. Değeri tekilleştirmek veri göçüdür (OPEN KD-ISIMLENDIRME-02, Kaan onayı) — ' +
  'çözücüden "temizlenmez".'

/** Kaan'ın saydığı dört girdi + üretimde/eski hesaplarda görülen biçimleri. */
const KD_GIRDILERI = [
  'kadin-dogum',
  'kadin-hastaliklari-dogum',
  'Kadın Hastalıkları ve Doğum',
  'Kadın Doğum',
  ' kadin-dogum ',
  'KADIN DOĞUM',
  'Kadın Doğum Uzmanı',
  'kadin_hastaliklari',
  'Jinekoloji ve Obstetrik',
]

describe('KD-ISIMLENDIRME-01 — dört girdi tek kanonik anahtara çözülür', () => {
  for (const ham of KD_GIRDILERI) {
    it(`"${ham}" → ${KD} (her çözücü aynı yoldan)`, () => {
      assert.equal(bransAnahtari(ham), KD, `kapsam.bransAnahtari — ${NEDEN}`)
      assert.equal(tekCozucu(ham), KD, `bransAnahtari — ${NEDEN}`)
      assert.equal(portalBransAnahtari(ham), KD, `portalBransAnahtari (Sağlığım modülü) — ${NEDEN}`)
      assert.equal(doktorAracBransi(ham), KD, `doktorAracBransi (Araçlar) — ${NEDEN}`)
      assert.equal(kadinDogumMi(ham), true, `kadinDogumMi (SOAP / Asistan / ses prompts kilidi) — ${NEDEN}`)
      assert.equal(specialtyProfile(ham), KADIN_DOGUM_PROFILE, `specialtyProfile (bölüm profili) — ${NEDEN}`)
      assert.equal(varsayilanPersonaId(ham), 'fatmacelik', `varsayilanPersonaId (Asistan meslektaşı) — ${NEDEN}`)
      assert.equal(belgeBransAnahtari(ham), 'kadin_dogum', `core/belgeler/router bransAnahtari (belge motoru) — ${NEDEN}`)
    })
  }

  it("'kadin-dogum' eşdeğerlik tablosunda TAM eşleşme olarak durur (yalnız serbest metin yedeğine kalmaz)", () => {
    assert.equal(findSpecialistForSpecialty('kadin-dogum')?.specialtyKey, KD, `specialistsCatalog LABEL_ALIASES['kadin-dogum'] — ${NEDEN}`)
    assert.equal(findSpecialistForSpecialty('Kadın Doğum')?.specialtyKey, KD, NEDEN)
  })

  it("canlı KD hekimi ('kadin-dogum' profili) branşsız kalmaz: kapsam, Araçlar, portal modülü", () => {
    assert.equal(bransKapsami({ seansBransi: 'genel', doktorBransi: 'kadin-dogum' }).brans, KD, NEDEN)
    const araclar = doktorAraclariListesi('kadin-dogum').map((a) => a.route)
    assert.ok(araclar.includes('/doktor-tools/kd-gebelik-takvim') && araclar.includes('/doktor-tools/kd-kohort'), `KD Araçları görünmüyor — ${NEDEN}`)
    const girdi = { hastaYasYil: 30, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false }
    assert.deepEqual(portalModulleri({ ...girdi, doktorBransi: 'kadin-dogum' }), portalModulleri({ ...girdi, doktorBransi: KD }), NEDEN)
  })

  it('başka branşlar KD olmaz (eşdeğerlik geniş tutulmadı)', () => {
    for (const ham of ['pediatri', 'dahiliye', 'goz-hastaliklari', 'dermatoloji', 'kardiyoloji', 'genel-cerrahi', 'cocuk-cerrahisi', 'genel', '', null]) {
      assert.notEqual(bransAnahtari(ham), KD, String(ham))
      assert.equal(kadinDogumMi(ham), false, String(ham))
    }
  })
})

describe('KD-ISIMLENDIRME-01 — tek ad: "Kadın Hastalıkları ve Doğum"', () => {
  it('kaynak lib/doktor/specialties.ts label; diğer etiketler ondan okur', () => {
    assert.equal(KADIN_HASTALIKLARI_DOGUM_ETIKETI, 'Kadın Hastalıkları ve Doğum')
    assert.equal(SPECIALTY_MAP[KD].label, KADIN_HASTALIKLARI_DOGUM_ETIKETI)
    assert.equal(KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI, 'Kadın Hast. ve Doğum')
    assert.equal(BRANS_ETIKETLERI[KD], KADIN_HASTALIKLARI_DOGUM_ETIKETI)
    assert.equal(KADIN_DOGUM_PROFILE.etiket, KADIN_HASTALIKLARI_DOGUM_ETIKETI)
    assert.equal(KADIN_DOGUM_PROFILE.resmiUnvan, KADIN_HASTALIKLARI_DOGUM_ETIKETI)
    assert.equal(KADIN_DOGUM_MANIFEST.displayName, KADIN_HASTALIKLARI_DOGUM_ETIKETI)
    assert.equal(bransKurali('kadin_dogum').ad, KADIN_HASTALIKLARI_DOGUM_ETIKETI)
  })

  it('ham anahtar hiçbir yüzeye yazılmaz: seans/profil değeri → görünen ad', () => {
    for (const ham of ['kadin-dogum', KD, 'Kadın Doğum']) {
      assert.equal(bransEtiketi(ham), KADIN_HASTALIKLARI_DOGUM_ETIKETI, ham)
      assert.equal(bransEtiketi(ham, { kisa: true }), KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI, ham)
      assert.equal(klinikAdi(ham), KADIN_HASTALIKLARI_DOGUM_ETIKETI, ham)
      assert.equal(resmiUzmanlikAdi(ham), KADIN_HASTALIKLARI_DOGUM_ETIKETI, ham)
    }
    // diğer branşlar değişmedi
    assert.equal(bransEtiketi('pediatri'), 'Pediatri')
    assert.equal(bransEtiketi('pediatri', { kisa: true }), 'Pediatri')
    assert.equal(bransEtiketi('genel'), 'Genel')
    assert.equal(bransEtiketi(''), 'Genel')
    assert.equal(bransEtiketi('vergi_danismanligi'), 'Vergi danismanligi')
  })

  it('hekim/hasta gören kaynakta sabit "Kadın Doğum" yok (yorumlar ve kd yolu `kadin-dogum` hariç)', () => {
    const kok = resolve(__dirname, '../..')
    const dosyalar = execSync('git ls-files app components lib specialties core bridges', { cwd: kok, encoding: 'utf8' })
      .split('\n')
      .filter((f) => /\.(tsx?|md)$/.test(f) && !/\.test\.tsx?$/.test(f) && (!f.endsWith('.md') || f.includes('/prompts/')))
    const desen = /kad[ıi]n[ -]do[ğg]um/gi
    const bulgular: string[] = []
    for (const f of dosyalar) {
      readFileSync(resolve(kok, f), 'utf8').split('\n').forEach((satir, i) => {
        const t = satir.trim()
        if (/^(\/\/|\*|\/\*|\{\/\*)/.test(t)) return
        const kod = satir.replace(/\{\/\*.*?\*\/\}/g, '').replace(/\/\*.*?\*\//g, '').replace(/\s\/\/\s.*$/, '')
        const eslesme = (kod.match(desen) || []).filter((m) => m !== 'kadin-dogum')
        if (eslesme.length) bulgular.push(`${f}:${i + 1} ${eslesme.join(', ')}`)
      })
    }
    assert.deepEqual(bulgular, [], 'Metinde "Kadın Doğum" yerine KADIN_HASTALIKLARI_DOGUM_ETIKETI (dar alanda …_KISA_ETIKETI) kullanın')
  })
})
