/**
 * ARACLAR-CILA-01 — Doktor Araçları ortak UI kütüphanesi TEK kaynaktır.
 *
 * Branş kabukları (Göz, Dermatoloji, Dahiliye, Kadın Hastalıkları ve Doğum, Pediatri, Psikiyatri) aynı
 * parçaların ayrı kopyalarını taşıyordu; parçalar lib/doktor/aracUi.tsx'e taşındı. Bu bekçi iki şeyi korur:
 *   1. hiçbir kabuk ortak bir bileşeni yeniden tanımlamaz (kopya geri sızmasın),
 *   2. eski `gozStil` / `dermStil` / `dahStil` / `kdStil` / `pediStil` / `psikStil` dışa aktarımları durur —
 *      27 aracın importu kırılmaz (bu bir refactor, davranış değişikliği değil).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
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
  { yol: 'specialties/psikiyatri/ui/araclar/PsikAracKabugu.tsx', stil: 'psikStil', vurgu: 'PSIK_VURGU' },
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

describe('ARACLAR-CILA-01 geriye doldurma: göz / dermatoloji / dahiliye / psikiyatri araçları olgun parçaları kullanır', () => {
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
    'specialties/psikiyatri/ui/araclar/PhqGadAraci.tsx',
    'specialties/psikiyatri/ui/araclar/RiskAraci.tsx',
    'specialties/psikiyatri/ui/araclar/IlacIzlemAraci.tsx',
    'specialties/psikiyatri/ui/araclar/PsikSgkAraci.tsx',
    'specialties/psikiyatri/ui/araclar/PsikKohortAraci.tsx',
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

/**
 * ARACLAR-CILA-01 Faz 2 — "Bugünkü muayene formuna ekle" klinik çıktı üreten HER araçta.
 * Bu bekçi hem kapsamı hem de hekim kilidini korur: tek yazma yolu ortak bileşendir, hasta
 * seçilmeden eylem pasiftir ve hiçbir araç kendi yazma isteğini icat etmez.
 */
describe('ARACLAR-CILA-01 Faz 2: bugünkü muayene formuna ekle', () => {
  /** Klinik çıktı üreten araçlar — her biri ortak eylemi taşır. */
  const NOTA_EKLEYEN = [
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
    'specialties/pediatri/ui/araclar/DozAraci.tsx',
    'specialties/pediatri/ui/araclar/BuyumeStudyosu.tsx',
    'specialties/pediatri/ui/araclar/AsiPlanlayici.tsx',
    'specialties/kadin-dogum/ui/araclar/GebelikTakvimAraci.tsx',
    'specialties/kadin-dogum/ui/araclar/DogumRaporAraci.tsx',
    'specialties/kadin-dogum/ui/araclar/MecAraci.tsx',
    'specialties/kadin-dogum/ui/araclar/RiskAraci.tsx',
    // Psikiyatri: ölçek ve güvenlik kaydı zaten kendi uçlarından bugünün notuna yazılır
    // (POST /api/doktor/psikiyatri) — ikinci yazma yolu açılmadı; kopyala-yapıştırla kalan iki araç burada.
    'specialties/psikiyatri/ui/araclar/IlacIzlemAraci.tsx',
    'specialties/psikiyatri/ui/araclar/PsikSgkAraci.tsx',
  ]

  it('her klinik araç ortak "Bugünkü muayene formuna ekle" eylemini taşır', () => {
    for (const yol of NOTA_EKLEYEN) {
      const kod = oku(yol)
      assert.match(kod, /<MuayeneFormunaEkle\b/, `${yol}: nota ekleme eylemi yok`)
      assert.match(kod, /hastaId=\{/, `${yol}: eylem seçili hastayı almalı`)
    }
  })

  it('hiçbir araç kendi yazma isteğini icat etmez — tek yol ortak bileşendir', () => {
    for (const yol of NOTA_EKLEYEN) {
      const kod = oku(yol)
      assert.doesNotMatch(kod, /fetch\([^)]*nota-ekle/, `${yol}: nota yazma isteği ortak bileşende olmalı`)
      assert.doesNotMatch(kod, /gununNotunaEkle/, `${yol}: sunucu yardımcısı istemciden çağrılamaz`)
    }
  })

  it('ortak eylem: hasta seçilmeden pasif, nedenini söyler, otomatik yazmaz', () => {
    const kod = oku(KUTUPHANE)
    assert.match(kod, /export function MuayeneFormunaEkle\(/)
    assert.match(kod, /Önce hasta seçin/)
    assert.match(kod, /const kapali = !hastaId \|\| !temiz\.length \|\| gonderiyor/)
    assert.match(kod, /disabled=\{kapali\}/)
    assert.match(kod, /siz basmadan yazılmaz/)
    // Yazma yalnız düğmenin tıklama yolunda; başka bir efekt tetiklemez.
    assert.doesNotMatch(kod, /useEffect\([^)]*nota-ekle/)
    assert.equal((kod.match(/'\/api\/doktor\/araclar\/nota-ekle'/g) || []).length, 1)
    assert.match(kod, /MuayeneFormunaDon/)
  })

  it('sunucu: hasta sahipliği doğrulanmadan hiçbir şey yazılmaz', () => {
    const rota = oku('app/api/doktor/araclar/nota-ekle/route.ts')
    assert.match(rota, /hastaSahibiMi\(supabase, user\.id, patientId\)/)
    assert.match(rota, /status: 404/)
    // Sahiplik kontrolü not yazımından ÖNCE gelir.
    assert.ok(rota.indexOf('hastaSahibiMi(supabase') < rota.indexOf('gununNotunaEkle(supabase'), 'sahiplik kontrolü yazmadan önce olmalı')
    assert.match(rota, /gununNotunaEkle\(supabase, user\.id, patientId/)
  })
})

/**
 * ARACLAR-CILA-01 Faz 3 — seri klinik değerler kalıcı.
 *
 * Araçlar durumsuzdu: VA aracını yenileyince önceki vizit değerleri gidiyordu. Kalıcılık YENİ bir
 * tablo açarak değil, her branşın ZATEN sahip olduğu kayıt yoluna yazarak sağlandı. Bu bekçi üç şeyi
 * korur: (1) yazma mevcut branş ucuna gider, (2) hasta seçiliyse son kayıt okunup ön doldurulur,
 * (3) kaydetme hekimin açık eylemidir — sessiz arka plan yazması yoktur.
 */
describe('ARACLAR-CILA-01 Faz 3: seri değerlerin kalıcılığı', () => {
  const KALICI = [
    { yol: 'specialties/goz-hastaliklari/ui/araclar/VaAraci.tsx', uc: '/api/doktor/goz', yazma: "adim: 'olcum'" },
    { yol: 'specialties/dermatoloji/ui/araclar/PasiEasiAraci.tsx', uc: '/api/doktor/dermatoloji', yazma: "action: 'skor'" },
    { yol: 'specialties/dahiliye/ui/araclar/Score2Araci.tsx', uc: '/api/doktor/dahiliye', yazma: "adim: 'kvr'" },
    { yol: 'specialties/dahiliye/ui/araclar/CkdAraci.tsx', uc: '/api/doktor/dahiliye', yazma: "adim: 'ckd'" },
  ]

  it('kayıt mevcut branş kaydına yazar — araçlar için yeni tablo açılmadı', () => {
    for (const { yol, uc, yazma } of KALICI) {
      const kod = oku(yol)
      assert.ok(kod.includes(uc), `${yol}: mevcut branş ucunu kullanmalı (${uc})`)
      assert.ok(kod.includes(yazma), `${yol}: mevcut yazma adımını kullanmalı (${yazma})`)
    }
    // Araçlara özel genel bir ölçüm tablosu AÇILMADI — branş tabloları kullanıldı.
    const migrasyonlar = readdirSync(join(KOK, 'lib/db/migrations')).join('\n')
    assert.doesNotMatch(migrasyonlar, /arac_olcumleri/, 'Faz 3 mevcut branş tablolarını kullanır; yeni genel tablo yok')
  })

  it('ön doldurma: hasta seçiliyse son kayıt okunur ve "önceki vizit" gösterilir', () => {
    for (const { yol } of KALICI) {
      const kod = oku(yol)
      assert.match(kod, /<OncekiVizit/, `${yol}: önceki vizit şeridi yok`)
      assert.match(kod, /ÖN DOLDUR/, `${yol}: ön doldurma yolu işaretlenmeli (hekim üzerine yazabilir)`)
    }
    // Pediatri büyüme ve KD gebelik: kalıcılık zaten mevcut kayıttan geliyordu — okuma + ön doldurma yerinde.
    const buyume = oku('specialties/pediatri/ui/araclar/BuyumeStudyosu.tsx')
    assert.match(buyume, /buyume-egrileri/)
    assert.match(buyume, /<OncekiVizit/)
    const gebelik = oku('specialties/kadin-dogum/ui/araclar/GebelikTakvimAraci.tsx')
    assert.match(gebelik, /kdHastaOzeti/)
    assert.match(gebelik, /Gebelik kaydından dolduruldu/)
  })

  it('kaydetme hekimin açık eylemidir — sessiz arka plan yazması yok', () => {
    for (const { yol } of KALICI) {
      const kod = oku(yol)
      assert.match(kod, /<KayitButonu/, `${yol}: açık kaydet düğmesi yok`)
      const postlar = kod.match(/method: 'POST'/g) || []
      assert.equal(postlar.length, 1, `${yol}: araçta tek yazma isteği olmalı`)
      assert.ok(kod.indexOf('kaydet') < kod.indexOf("method: 'POST'"), `${yol}: yazma yalnız kaydet eyleminde`)
    }
    const kutuphane = oku(KUTUPHANE)
    assert.match(kutuphane, /export function KayitButonu\(/)
    assert.match(kutuphane, /Önce hasta seçin — değerler ancak seçili hastanın dosyasına kaydedilir/)
    assert.match(kutuphane, /arka planda sessizce yazılmaz/)
  })
})
