/**
 * ARACLAR-CILA-01 — Doktor Araçları ortak UI kütüphanesi TEK kaynaktır.
 *
 * Beş branş kabuğu (Göz, Dermatoloji, Dahiliye, Kadın Hastalıkları ve Doğum, Pediatri) aynı parçaların
 * beş ayrı kopyasını taşıyordu; parçalar lib/doktor/aracUi.tsx'e taşındı. Bu bekçi iki şeyi korur:
 *   1. hiçbir kabuk ortak bir bileşeni yeniden tanımlamaz (kopya geri sızmasın),
 *   2. eski `gozStil` / `dermStil` / `dahStil` / `kdStil` / `pediStil` dışa aktarımları durur —
 *      27 aracın importu kırılmaz (bu bir refactor, davranış değişikliği değil).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const KOK = join(import.meta.dirname, '../..')
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')

const KUTUPHANE = 'lib/doktor/aracUi.tsx'

const KABUKLAR: Array<{ yol: string; stil: string; vurgu: string }> = [
  { yol: 'specialties/goz-hastaliklari/ui/araclar/GozAracKabugu.tsx', stil: 'gozStil', vurgu: 'GOZ_VURGU' },
  { yol: 'specialties/dermatoloji/ui/araclar/DermAracKabugu.tsx', stil: 'dermStil', vurgu: 'DERM_VURGU' },
  { yol: 'specialties/dahiliye/ui/araclar/DahiliyeAracKabugu.tsx', stil: 'dahStil', vurgu: 'DAH_VURGU' },
  { yol: 'specialties/kadin-dogum/ui/araclar/KdAracKabugu.tsx', stil: 'kdStil', vurgu: 'KD_VURGU' },
  { yol: 'specialties/pediatri/ui/araclar/PediAracKabugu.tsx', stil: 'pediStil', vurgu: 'PEDI_VURGU' },
]

/** Kütüphanede yaşayan, hiçbir kabukta yeniden tanımlanmaması gereken parçalar. */
const ORTAK_BILESENLER = [
  'Alan', 'Etiketli', 'Secim', 'Segment', 'Onay', 'Kutu', 'Sayi', 'Katlanir',
  'TaslakNotu', 'Rozet', 'OneriRozet', 'Istatistik', 'KopyalaButonu', 'HastaSecici',
]

/** Stil sözlüğünün her anahtarı — araçlar bunları destructuring ile alıyor. */
const STIL_ANAHTARLARI = ['kutu', 'etiket', 'kucuk', 'metin', 'satir', 'btn', 'ghost', 'input', 'hata', 'uyari', 'kirmizi', 'iyi', 'kaydir']

describe('ARACLAR-CILA-01 ortak araç kütüphanesi', () => {
  const kutuphane = oku(KUTUPHANE)

  it('her ortak bileşen tek kaynakta tanımlı', () => {
    for (const ad of ORTAK_BILESENLER) {
      assert.match(kutuphane, new RegExp(`export function ${ad}\\b`), `${ad} lib/doktor/aracUi.tsx'te tanımlı olmalı`)
    }
    for (const kanca of ['useUrlHasta', 'useHastaVerisi', 'useAracStil', 'useVurgu']) {
      assert.match(kutuphane, new RegExp(`export function ${kanca}\\b`), kanca)
    }
    assert.match(kutuphane, /export function aracStil\(/)
    assert.match(kutuphane, /export function AracVurguSaglayici\(/)
  })

  it('stil sözlüğü her anahtarı taşır', () => {
    for (const k of STIL_ANAHTARLARI) {
      assert.match(kutuphane, new RegExp(`\\n\\s{4}${k}:`), `aracStil ${k} anahtarını üretmeli`)
    }
  })

  it('hiçbir branş kabuğu ortak bir bileşeni yeniden tanımlamaz', () => {
    for (const { yol } of KABUKLAR) {
      const kod = oku(yol)
      for (const ad of ORTAK_BILESENLER) {
        assert.doesNotMatch(
          kod,
          new RegExp(`export function ${ad}(<|\\()`),
          `${yol}: ${ad} kopyası — ortak parça lib/doktor/aracUi.tsx'ten gelmeli`,
        )
      }
      // Kendi stil sözlüğünü elle kurmaz; paylaşılan aracStil()'e delege eder.
      assert.doesNotMatch(kod, /kutu: \{ background: 'rgba\(255,255,255,0\.04\)'/, `${yol}: stil sözlüğü kopyası`)
    }
  })

  it('her kabuk paylaşılan stile delege eder ve eski adı dışa aktarır', () => {
    for (const { yol, stil, vurgu } of KABUKLAR) {
      const kod = oku(yol)
      assert.match(kod, new RegExp(`from '@/lib/doktor/aracUi'`), `${yol}: ortak kütüphaneyi içe aktarmalı`)
      assert.match(kod, new RegExp(`export const ${stil} = aracStil\\(${vurgu}\\)`), `${yol}: ${stil} korunmalı`)
      assert.match(kod, /<AracVurguSaglayici vurgu=/, `${yol}: branş vurgusunu bağlama vermeli`)
      // Branş kapısı refactor'dan sonra da yerinde.
      assert.match(kod, /doktorAraciBransaUygun\(route/, `${yol}: branş kapısı`)
      assert.match(kod, /router\.replace\('\/doktor-tools'\)/, yol)
    }
  })

  it('branşa özel hasta seçicileri ortak seçiciye delege eder', () => {
    for (const { yol } of KABUKLAR) {
      const kod = oku(yol)
      assert.doesNotMatch(kod, /fetch\('\/api\/doktor\/hastalar'/, `${yol}: hasta listesi isteği ortak seçicide olmalı`)
    }
  })
})

describe('ARACLAR-CILA-01 geriye doldurma: göz / dermatoloji / dahiliye araçları olgun parçaları kullanır', () => {
  const GERI_DOLDURULAN = [
    'specialties/goz-hastaliklari/ui/araclar/GilKodAraci.tsx',
    'specialties/goz-hastaliklari/ui/araclar/VaAraci.tsx',
    'specialties/goz-hastaliklari/ui/araclar/SutVegfAraci.tsx',
    'specialties/goz-hastaliklari/ui/araclar/SgkRaporAraci.tsx',
    'specialties/dermatoloji/ui/araclar/PasiEasiAraci.tsx',
    'specialties/dermatoloji/ui/araclar/GopKapiAraci.tsx',
    'specialties/dermatoloji/ui/araclar/FototerapiDefteriAraci.tsx',
    'specialties/dermatoloji/ui/araclar/YamaAraci.tsx',
    'specialties/dahiliye/ui/araclar/Score2Araci.tsx',
    'specialties/dahiliye/ui/araclar/CkdAraci.tsx',
    'specialties/dahiliye/ui/araclar/PolifarmasiAraci.tsx',
    'specialties/dahiliye/ui/araclar/AntikoagAraci.tsx',
    'specialties/dahiliye/ui/araclar/SgkRaporAraci.tsx',
  ]

  it('her klinik çıktı üreten araçta manşet sayı (Istatistik) ve taslak rozeti var', () => {
    for (const yol of GERI_DOLDURULAN) {
      const kod = oku(yol)
      assert.match(kod, /<Istatistik /, `${yol}: manşet sayı kartı (Istatistik) eksik`)
      assert.match(kod, /<TaslakNotu/, `${yol}: hekim kilidi rozeti (TaslakNotu) eksik`)
    }
  })

  it('ticari metin: mühendislik jargonu / kişi adı / audit bağlantısı yok', () => {
    for (const yol of [...GERI_DOLDURULAN, KUTUPHANE]) {
      const kod = oku(yol).split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*\*)/.test(l)).join('\n')
      assert.doesNotMatch(kod, /\bsprint\b|Gökhan|Gokhan|\baudit\b|\.html/i, yol)
    }
  })
})
