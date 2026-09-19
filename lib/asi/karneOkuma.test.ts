/**
 * ASI-KARNESI-01 — aşı karnesi okuma: saf kilitler.
 *  - Okunamayan satır "okunamadı" gelir; tarih/doz UYDURULMAZ (model emin değilse verdiği değer de atılır).
 *  - Satırlar SB Ulusal Aşı Takvimi'ne pediatri aşı motorunun eşleştirmesiyle bağlanır; eşleşmeyen ayrı gruptadır.
 *  - Onay: okunamadı satır hekim düzeltmeden geçmez; hekimin düzelttiği değer aynen kaydedilene gider.
 *  - Görsel ayrım: karneden aktarılan (beyan + kanıt izi) ≠ klinikte uygulanan.
 * Sentetik veri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  karneYanitiniCoz, karneJsonuAyikla, KarneOkumaHatasi, asiTarihiDogrula, takvimEslestir, onaySatirlariniDogrula,
  karneKimlikUyarisi, karneKategorisi, asiKaynakTuru, asiKaynakRozeti, KARNE_ROZETI, KARNE_NOT_ONEKI, KARNE_SISTEM, OKUNAMADI_ETIKETI,
} from './karneOkuma'

const BAG = { bugunIso: '2026-09-19', dogumIso: '2024-03-10' }
const yanit = (satirlar: unknown[], ek: Record<string, unknown> = {}) => JSON.stringify({ asi_karnesi: true, okunabilirlik: 'kismi', dogum_tarihi: '2024-03-10', satirlar, not: null, ...ek })

describe('okuma: okuyamadığını uydurmaz', () => {
  it('net satır aynen gelir (ad · doz · tarih), okunamadı değil', () => {
    const s = karneYanitiniCoz(yanit([{ asi_adi: 'KKK', doz_no: 1, uygulama_tarihi: '2025-03-12', ham_metin: 'KKK 12.03.2025', emin: true, okunamayan_alanlar: [] }]), BAG)
    assert.equal(s.satirlar.length, 1)
    assert.deepEqual({ ad: s.satirlar[0].asiAdi, doz: s.satirlar[0].dozNo, tarih: s.satirlar[0].uygulamaTarihi, ok: s.satirlar[0].okunamadi }, { ad: 'KKK', doz: 1, tarih: '2025-03-12', ok: false })
  })

  it('model "emin değilim" dediyse verdiği tarih ve doz ATILIR, satır okunamadı', () => {
    const s = karneYanitiniCoz(yanit([{ asi_adi: 'KPA', doz_no: 2, uygulama_tarihi: '2024-05-10', ham_metin: 'KPA ?', emin: false, okunamayan_alanlar: [] }]), BAG)
    const r = s.satirlar[0]
    assert.equal(r.uygulamaTarihi, null)
    assert.equal(r.dozNo, null)
    assert.equal(r.okunamadi, true)
    assert.match(String(r.okunamadiNedeni), /belirsiz/)
  })

  it('okunamayan alan bildirildiyse o alan null (model yine de değer yazsa bile)', () => {
    const s = karneYanitiniCoz(yanit([{ asi_adi: '6lı karma', doz_no: 3, uygulama_tarihi: '2024-09-10', ham_metin: '6lı karma — tarih silik', emin: true, okunamayan_alanlar: ['uygulama_tarihi'] }]), BAG)
    assert.equal(s.satirlar[0].uygulamaTarihi, null)
    assert.equal(s.satirlar[0].dozNo, 3)
    assert.equal(s.satirlar[0].okunamadi, true)
    assert.match(String(s.satirlar[0].okunamadiNedeni), /tarih okunamadı/)
  })

  it('eksik tarih (yalnız ay/yıl), takvim dışı gün, gelecek ve doğumdan önceki tarih tahminle doldurulmaz', () => {
    for (const [t, neden] of [['2024-09', /tam okunamadı/], ['2024-02-30', /tam okunamadı/], ['2027-01-01', /gelecek/], ['2023-12-01', /doğum/]] as const) {
      const s = karneYanitiniCoz(yanit([{ asi_adi: 'OPA', doz_no: 1, uygulama_tarihi: t, ham_metin: 'OPA', emin: true, okunamayan_alanlar: [] }]), BAG)
      assert.equal(s.satirlar[0].uygulamaTarihi, null, t)
      assert.equal(s.satirlar[0].okunamadi, true, t)
      assert.match(String(s.satirlar[0].okunamadiNedeni), neden, t)
    }
  })

  it('aşı adı okunamayan satır boş adla gelir, okunamadı — ad uydurulmaz', () => {
    const s = karneYanitiniCoz(yanit([{ asi_adi: null, doz_no: null, uygulama_tarihi: '2024-05-10', ham_metin: '??? 10.05.2024', emin: true, okunamayan_alanlar: ['asi_adi'] }]), BAG)
    assert.equal(s.satirlar[0].asiAdi, '')
    assert.equal(s.satirlar[0].okunamadi, true)
    assert.equal(s.satirlar[0].uygulamaTarihi, '2024-05-10')
  })

  it('geçersiz doz (0, 11, "rapel") null + okunamadı; karnede yazmayan doz null ama okunamadı sayılmaz', () => {
    for (const d of [0, 11, 'rapel']) {
      const s = karneYanitiniCoz(yanit([{ asi_adi: 'Td', doz_no: d, uygulama_tarihi: '2025-01-01', ham_metin: 'Td', emin: true, okunamayan_alanlar: [] }]), BAG)
      assert.equal(s.satirlar[0].dozNo, null)
      assert.equal(s.satirlar[0].okunamadi, true)
    }
    const s = karneYanitiniCoz(yanit([{ asi_adi: 'Td', doz_no: null, uygulama_tarihi: '2025-01-01', ham_metin: 'Td rapel', emin: true, okunamayan_alanlar: [] }]), BAG)
    assert.equal(s.satirlar[0].dozNo, null)
    assert.equal(s.satirlar[0].okunamadi, false)
  })

  it('kısmi okuma normaldir: iyi satırlar gelir, okunamayanlar işaretli yanlarında', () => {
    const s = karneYanitiniCoz(yanit([
      { asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2024-03-10', ham_metin: 'Hep B', emin: true, okunamayan_alanlar: [] },
      { asi_adi: 'BCG', doz_no: null, uygulama_tarihi: null, ham_metin: 'BCG — kaşe soluk', emin: false, okunamayan_alanlar: ['uygulama_tarihi'] },
    ]), BAG)
    assert.deepEqual(s.satirlar.map((r) => r.okunamadi), [false, true])
    assert.equal(s.okunabilirlik, 'kismi')
  })

  it('bozuk / kesik yanıt KarneOkumaHatasi (hekime ham JSON gösterilmez)', () => {
    assert.throws(() => karneJsonuAyikla('{"satirlar": [ {"asi_adi": "KKK"'), KarneOkumaHatasi)
    assert.throws(() => karneJsonuAyikla('Üzgünüm, okuyamadım.'), KarneOkumaHatasi)
  })

  it('aşı karnesi olmayan belge: asiKarnesiMi false, satır yok, okunabilirlik düşük', () => {
    const s = karneYanitiniCoz(JSON.stringify({ asi_karnesi: false, okunabilirlik: 'iyi', satirlar: [] }), BAG)
    assert.equal(s.asiKarnesiMi, false)
    assert.equal(s.satirlar.length, 0)
    assert.equal(s.okunabilirlik, 'dusuk')
  })

  it('model talimatı uydurma yasağını ve null kuralını açıkça taşır', () => {
    assert.match(KARNE_SISTEM, /Uydurma yok/)
    assert.match(KARNE_SISTEM, /TAHMİN ETME/)
    assert.match(KARNE_SISTEM, /T\.C\. kimlik no/)
    assert.equal(OKUNAMADI_ETIKETI, 'Okunamadı — elle girin')
  })

  it('karnedeki doğum tarihi hastanınkinden farklıysa kimlik uyarısı', () => {
    assert.equal(karneKimlikUyarisi('2024-03-10', '2024-03-10'), null)
    assert.match(String(karneKimlikUyarisi('2023-01-02', '2024-03-10')), /eşleşmiyor/)
    assert.equal(karneKimlikUyarisi(null, '2024-03-10'), null)
  })
})

describe('SB Ulusal Aşı Takvimi eşleştirmesi (pediatri aşı motoru — takvim kopyalanmaz)', () => {
  it('takvim aşıları seriye bağlanır', () => {
    for (const ad of ['KKK', 'KPA', 'DaBT-İPA-Hib-HepB', 'Hexaxim', 'BCG', 'Hepatit B', 'Td', 'OPA', 'Suçiçeği', 'Hepatit A']) {
      assert.equal(takvimEslestir(ad).grup, 'takvim', ad)
    }
    const e = takvimEslestir('KKK')
    assert.ok(e.grup === 'takvim' && e.seri === 'kkk')
  })
  it('özel aşılar ayrı grupta, takvimde olmayan her şey "takvim dışı"', () => {
    assert.equal(takvimEslestir('Rotateq').grup, 'ozel')
    assert.equal(takvimEslestir('Bexsero').grup, 'ozel')
    assert.equal(takvimEslestir('Grip aşısı').grup, 'ozel')
    assert.equal(takvimEslestir('Kuduz').grup, 'takvim_disi')
    assert.equal(takvimEslestir('Sarı humma').grup, 'takvim_disi')
    assert.equal(takvimEslestir('').grup, 'takvim_disi')
  })
})

describe('toplu onay + satır düzeltme (sunucu kuralı)', () => {
  it('onaylanacak satır yoksa ya da dizi değilse reddedilir', () => {
    assert.ok('hata' in onaySatirlariniDogrula([], BAG))
    assert.ok('hata' in onaySatirlariniDogrula(null, BAG))
  })
  it('okunamadı satır hekim düzeltmeden geçmez — tüm istek reddedilir (yarım kayıt yok)', () => {
    const d = onaySatirlariniDogrula([
      { asiAdi: 'KKK', dozNo: 1, uygulamaTarihi: '2025-03-12' },
      { asiAdi: 'BCG', dozNo: null, uygulamaTarihi: null, okunamadi: true },
    ], BAG)
    assert.ok('hata' in d)
    assert.match((d as { hata: string }).hata, /2\. satır "okunamadı"/)
  })
  it('hekimin düzelttiği değer AYNEN kaydedilecek satıra geçer', () => {
    const d = onaySatirlariniDogrula([
      { asiAdi: '  BCG  ', dozNo: null, uygulamaTarihi: '2024-03-12', okunamadi: true, hekimDuzeltti: true },
      { asiAdi: 'KPA', dozNo: '2', uygulamaTarihi: '2024-05-11' },
    ], BAG)
    assert.ok('satirlar' in d)
    assert.deepEqual((d as { satirlar: unknown[] }).satirlar, [
      { asiAdi: 'BCG', dozNo: null, uygulamaTarihi: '2024-03-12' },
      { asiAdi: 'KPA', dozNo: 2, uygulamaTarihi: '2024-05-11' },
    ])
  })
  it('boş ad, geçersiz doz, gelecekteki / doğum öncesi tarih reddedilir', () => {
    assert.ok('hata' in onaySatirlariniDogrula([{ asiAdi: ' ', dozNo: 1, uygulamaTarihi: '2025-01-01' }], BAG))
    assert.ok('hata' in onaySatirlariniDogrula([{ asiAdi: 'KKK', dozNo: 0, uygulamaTarihi: '2025-01-01' }], BAG))
    assert.ok('hata' in onaySatirlariniDogrula([{ asiAdi: 'KKK', dozNo: 1, uygulamaTarihi: '2027-01-01' }], BAG))
    assert.ok('hata' in onaySatirlariniDogrula([{ asiAdi: 'KKK', dozNo: 1, uygulamaTarihi: '2023-01-01' }], BAG))
  })
  it('tarih kuralı okuma ve onayda aynı fonksiyon', () => {
    assert.deepEqual(asiTarihiDogrula('2025-03-12', BAG.bugunIso, BAG.dogumIso), { tarih: '2025-03-12', neden: null })
    assert.deepEqual(asiTarihiDogrula('', BAG.bugunIso, BAG.dogumIso), { tarih: null, neden: null })
  })
  it('kategori uygulandığı yaşa göre (çocukken yapılan pediatrik, 18 sonrası yetişkin)', () => {
    assert.equal(karneKategorisi('2000-05-01', '2010-01-01', '2026-09-19', 'Td'), 'pediatrik')
    assert.equal(karneKategorisi('2000-05-01', '2019-01-01', '2026-09-19', 'Td'), 'yetiskin')
    assert.equal(karneKategorisi(null, null, '2026-09-19', 'KKK'), 'pediatrik')
    assert.equal(karneKategorisi(null, null, '2026-09-19', 'Td'), 'yetiskin')
  })
})

describe('görsel ayrım: karneden aktarılan ≠ klinikte uygulanan (Kaan)', () => {
  it('kaynak türü', () => {
    assert.equal(asiKaynakTuru({ kaynak: 'kayit' }), 'klinik')
    assert.equal(asiKaynakTuru({ kaynak: 'beyan', belge_id: 'b1' }), 'karne')
    assert.equal(asiKaynakTuru({ kaynak: 'beyan', notlar: KARNE_NOT_ONEKI }), 'karne')
    assert.equal(asiKaynakTuru({ kaynak: 'beyan', notlar: null }), 'beyan')
  })
  it('rozetler birbirinden farklı metin ve tonda', () => {
    const k = asiKaynakRozeti('karne', 'Hasta beyanı'), c = asiKaynakRozeti('klinik', 'Hasta beyanı'), b = asiKaynakRozeti('beyan', 'Hasta beyanı')
    assert.equal(k.metin, KARNE_ROZETI)
    assert.equal(KARNE_ROZETI, 'Karneden aktarıldı · hekim onaylı')
    assert.equal(c.metin, 'Bu klinikte uygulandı')
    assert.equal(b.metin, 'Hasta beyanı')
    assert.equal(new Set([k.ton, c.ton, b.ton]).size, 3)
  })
})

describe('UI ve rota kilitleri (kaynak)', () => {
  const kok = join(import.meta.dirname, '../..')
  const oku = (r: string) => readFileSync(join(kok, r), 'utf8')
  it('Aşılar sekmesinde "Aşı karnesi yükle": mobilde kamera (capture) + PDF seçimi, mevcut Kasa yolu', () => {
    const ui = oku('components/doktor/AsiKarnesiOkuma.tsx')
    assert.match(ui, /type="file" accept="image\/\*" capture="environment"/)
    assert.match(ui, /application\/pdf/)
    assert.match(ui, /fetch\('\/api\/doktor\/documents'/, 'yeni saklama yolu açılmaz — Kasa')
    assert.match(ui, /hekimOnayi: true/)
    assert.match(ui, /Hepsini onayla ve kaydet/)
    assert.match(ui, /Özel \/ takvim dışı aşılar/)
    const liste = oku('components/doktor/HastaAsilar.tsx')
    assert.match(liste, /<AsiKarnesiOkuma/)
    assert.match(liste, /asiKaynakRozeti\(tur, hitap\.beyanEtiketi\)/)
    assert.match(liste, /<Rozet ton=\{rozet\.ton\}>\{rozet\.metin\}<\/Rozet>/, 'paylaşılan Rozet — yeni tasarım dili yok')
  })
  it("karne okuma görevi 'goruntu-inceleme' (GÜÇLÜ); model adı rotada yazılmaz; hasta verisi system bloğunda değil", () => {
    const rota = oku('app/api/doktor/asilar/karne/route.ts')
    assert.match(rota, /gorev: 'goruntu-inceleme'/)
    assert.doesNotMatch(rota, /claude-(sonnet|haiku|opus)/)
    assert.equal((rota.match(/gorev: '/g) || []).length, 1, 'tek model çağrısı, tek görev')
    assert.match(rota, /system: \[\{ metin: KARNE_SISTEM, onbellek: true \}\]/)
    assert.match(rota, /sadeceDoktor\(oturum\)/)
  })
})
