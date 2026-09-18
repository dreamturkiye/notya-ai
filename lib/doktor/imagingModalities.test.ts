/**
 * GORUNTULEME-BRANS-SIRALI (Kaan, 2026-09-18) — modalite seçicisi branşa göre SIRALANIR, asla KISITLANMAZ.
 * Bu bir brans-alan-sizmasi kapısı değildir: göz hekimi pre-op EKG'yi, kardiyolog dış merkez MR'ını yükleyebilmeli.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BRANS_GORUNTULEME_ONCELIGI,
  IMAGING_MODALITIES,
  bransGoruntulemeGruplari,
  bransGoruntulemeSirasi,
  imagingPortalKind,
  normalizeImagingModality,
} from './imagingModalities'
import { BRANS_ETIKETLERI } from '../intake/bransSorulari'
import { bransAnahtari } from '../specialties/kapsam'
import type { SpecialtyKey } from '../asistan/turkishSpecialtyRefs'

const TUM_KODLAR = IMAGING_MODALITIES.map((m) => m.code)
const TUM_BRANSLAR = Object.keys(BRANS_ETIKETLERI) as SpecialtyKey[]

describe('GORUNTULEME-BRANS-SIRALI — branşın sık modaliteleri önde', () => {
  const beklenen: Array<[SpecialtyKey, string[]]> = [
    ['goz-hastaliklari', ['oct', 'fundus', 'on_segment', 'us']],
    ['kardiyoloji', ['ekg', 'eko', 'bt', 'xray']],
    ['dermatoloji', ['dermatoskopi', 'derm', 'yara']],
    ['dahiliye', ['xray', 'us', 'bt', 'ekg']],
    ['pediatri', ['xray', 'us', 'ekg']],
    ['kadin-hastaliklari-dogum', ['us', 'mamografi', 'mri']],
  ]
  for (const [brans, onde] of beklenen) {
    it(`${brans}: ${onde.join(', ')} listenin başında`, () => {
      const sira = bransGoruntulemeSirasi(brans)
      assert.deepEqual(sira.slice(0, onde.length), onde)
      assert.deepEqual(bransGoruntulemeGruplari(brans).oncelikli.map((m) => m.code), onde)
    })
  }

  it("geri kalanlar varsayılan IMAGING_MODALITIES sırasını korur, 'diger' en sonda", () => {
    const sira = bransGoruntulemeSirasi('goz-hastaliklari')
    const kalan = sira.slice(4)
    assert.deepEqual(kalan, TUM_KODLAR.filter((c) => !['oct', 'fundus', 'on_segment', 'us'].includes(c)))
    assert.equal(sira[sira.length - 1], 'diger')
  })

  it('eski / serbest branş değeri (kadin-dogum) bransAnahtari ile kanonik anahtara çözülür ve sıralanır', () => {
    assert.deepEqual(bransGoruntulemeSirasi(bransAnahtari('kadin-dogum')).slice(0, 3), ['us', 'mamografi', 'mri'])
  })
})

describe('GORUNTULEME-BRANS-SIRALI — SIRALA, ASLA KISITLAMA (anti-regresyon korkuluğu)', () => {
  it('HER branş için HER kanonik modalite listede, tam bir kez', () => {
    for (const brans of [...TUM_BRANSLAR, null, undefined, '', 'bilinmeyen-brans']) {
      const sira = bransGoruntulemeSirasi(brans)
      const eksik = TUM_KODLAR.filter((c) => !sira.includes(c))
      assert.deepEqual(
        eksik,
        [],
        `Branş "${brans}" için modalite(ler) düşmüş: ${eksik.join(', ')}. Görüntüleme modaliteleri branşa göre SIRALANIR, ` +
          'asla KISITLANMAZ/GİZLENMEZ — bu brans-alan-sizmasi kapısı değildir (göz hekimi pre-op EKG, kardiyolog dış merkez MR ' +
          'yükleyebilmeli). Bkz. docs/OPEN-COMMITMENTS.md GORUNTULEME-BRANS-SIRALI.',
      )
      assert.equal(sira.length, TUM_KODLAR.length, `Branş "${brans}": tekrar eden kod var — ${sira.join(', ')}`)
      const { oncelikli, digerleri } = bransGoruntulemeGruplari(brans)
      assert.equal(oncelikli.length + digerleri.length, TUM_KODLAR.length, `Branş "${brans}": gruplar birlikte tam listeyi vermeli`)
    }
  })

  it('eşlemedeki her kod kanonik bir kod ve her anahtar gerçek bir branş anahtarı (uydurma kod/anahtar yok)', () => {
    for (const [brans, kodlar] of Object.entries(BRANS_GORUNTULEME_ONCELIGI)) {
      assert.ok(TUM_BRANSLAR.includes(brans as SpecialtyKey), `bilinmeyen branş anahtarı: ${brans}`)
      for (const k of kodlar ?? []) assert.ok(TUM_KODLAR.includes(k), `${brans}: kanonik olmayan kod ${k}`)
    }
  })

  it('yükleme rotası branşa bakmaz — saklama katmanında modalite kapısı yok', () => {
    const rota = readFileSync(join(import.meta.dirname, '../../app/api/doktor/goruntuleme/yukle/route.ts'), 'utf8')
    assert.doesNotMatch(rota, /specialty|brans|BRANS_GORUNTULEME/i)
  })
})

describe('GORUNTULEME-BRANS-SIRALI — eşlemesiz / bilinmeyen branş', () => {
  for (const brans of [null, undefined, '', 'bilinmeyen-brans', 'psikiyatri']) {
    it(`${JSON.stringify(brans)} → hata yok, öncelikli grup boş, tam varsayılan sıra`, () => {
      assert.deepEqual(bransGoruntulemeSirasi(brans), TUM_KODLAR)
      const g = bransGoruntulemeGruplari(brans)
      assert.equal(g.oncelikli.length, 0)
      assert.deepEqual(g.digerleri, IMAGING_MODALITIES)
    })
  }
})

describe('GORUNTULEME-BRANS-SIRALI — göz hekimi EKG seçebilir ve EKG aynen saklanır', () => {
  it("göz hekiminin seçicisinde EKG var (Diğer görüntülemeler grubunda) ve etiketi 'ekg' koduna normalleşir", () => {
    const { oncelikli, digerleri } = bransGoruntulemeGruplari('goz-hastaliklari')
    assert.ok(!oncelikli.some((m) => m.code === 'ekg'))
    const ekg = digerleri.find((m) => m.code === 'ekg')
    assert.ok(ekg, 'göz hekimi EKG seçemiyor — sıralama kısıtlamaya dönüşmüş')
    // Sayfa çipin ETİKETİNİ gönderir; /api/doktor/goruntuleme/yukle normalizeImagingModality ile saklar.
    assert.equal(normalizeImagingModality(ekg.label), 'ekg')
    assert.equal(imagingPortalKind(ekg.label), 'ekg')
  })

  it('normalizeImagingModality davranışı değişmedi (her etiket kendi koduna, bilinmeyen → diger)', () => {
    for (const m of IMAGING_MODALITIES) assert.equal(normalizeImagingModality(m.label), m.code, m.label)
    for (const m of IMAGING_MODALITIES) assert.equal(normalizeImagingModality(m.code), m.code, m.code)
    assert.equal(normalizeImagingModality('EEG'), 'diger')
    assert.equal(normalizeImagingModality(''), 'diger')
  })
})
