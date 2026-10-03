/**
 * NOTYA-AYSE-GERI-05 — records on screen (vaccine table, anthropometrics, exam summaries). Pure: the request
 * matcher and the answer builders over the chart-event index. Stored values only — a number that is not in the
 * fixture must never appear, and what an exam lacks is written "kayıt yok".
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kayitIstegiBul, kayitCevabi, olcumCevabi, olcumVarMi, muayeneCevabi, SESLI_MUAYENE_SINIRI, type KayitIstegi } from './kayitTablosu'
import { asiKaydiSorusuMu, asiTablosuCevabi } from './asiTablosu'
import { asiKarnesiOlustur } from '@/lib/asi/karneBelgesi'
import { olaylariKur, type HamDosya } from '@/lib/doktor/dosyaOlaylari'
import { sozCumleleri, SOZ_BEAT_SINIRI } from './konusma'

const BUGUN = '2026-10-01'
const AD = 'QA Bebek Ölçüm'

const HAM: HamDosya = {
  hasta: { ad: AD, dogumIso: '2024-07-10', cinsiyet: 'Kız' },
  brans: 'Pediatri',
  vizitler: [
    { id: 'v1', tarih: '2025-01-10', subjektif: '6 aylık rutin sağlam çocuk kontrolü.', tani: 'Sağlam çocuk izlemi', plan: 'Ek gıdaya başlandı.', vitaller: { kilo: 7.2, boy: 66, basCevresi: 43 } },
    { id: 'v2', tarih: '2025-04-12', subjektif: 'İki gündür ateş ve burun akıntısı.', tani: 'Akut nazofarenjit', plan: 'Semptomatik tedavi.', vitaller: { kilo: 8.4, boy: 71, basCevresi: 44.5, ates: 38.4 } },
    { id: 'v3', tarih: '2025-07-15', subjektif: 'Sağ kulak ağrısı.', tani: 'Akut otitis media', plan: 'Amoksisilin 10 gün.', vitaller: { kilo: 9.1 } },
    { id: 'v4', tarih: '2025-10-20', subjektif: '15 aylık kontrol.', tani: 'Sağlam çocuk izlemi', vitaller: { kilo: 9.8, boy: 76 } },
    { id: 'v5', tarih: '2026-01-18', subjektif: 'Döküntü.', degerlendirme: 'Viral ekzantem düşünüldü.', plan: 'İzlem.', vitaller: {} },
    { id: 'v6', tarih: '2026-04-05', subjektif: '21 aylık kontrol.', tani: 'Sağlam çocuk izlemi', plan: '6 ay sonra kontrol.', vitaller: { kilo: 10.9, boy: 81, basCevresi: 47 } },
  ],
  cihaz: [{ id: 'c1', tur: 'kilo', deger: '10.2', birim: 'kg', alindi: '2025-12-01T09:00:00Z' }],
}
const olaylar = olaylariKur(HAM, BUGUN)
/** Every anthropometric value stored in the fixture, as the table prints it. */
const KAYITLI = new Set(['7,2', '8,4', '9,1', '9,8', '10,9', '10,2', '66', '71', '76', '81', '43', '44,5', '47'])

const hucreler = (ekran: string): string[][] => ekran.split('\n').filter((s) => s.startsWith('|') && !/^\|\s*-/.test(s)).map((s) => s.split('|').slice(1, -1).map((h) => h.trim()))
const istek = (m: string): KayitIstegi => { const i = kayitIstegiBul(m); assert.ok(i, m); return i! }

describe('kayıt isteği — hangi cümle tablo / özet ister', () => {
  it('antropometri: tek muayene, seri, tüm muayeneler', () => {
    const b: [string, object][] = [
      ['Bütün muayenelerdeki kilo ölçümlerini sırayla göster', { tur: 'olcum', olcumler: ['kilo'], kapsam: { tip: 'tum' }, tekDeger: false }],
      ['Kilo, boy ve baş çevresi ölçümlerini tablo yap', { tur: 'olcum', olcumler: ['kilo', 'boy', 'basCevresi'], kapsam: { tip: 'tum' }, tekDeger: false }],
      ['Tüm antropometrik ölçümlerini göster', { tur: 'olcum', olcumler: ['kilo', 'boy', 'basCevresi'], kapsam: { tip: 'tum' }, tekDeger: false }],
      ['Baş çevresi ölçümleri neler', { tur: 'olcum', olcumler: ['basCevresi'], kapsam: { tip: 'tum' }, tekDeger: false }],
      ['Son muayenedeki boy ve kilo ölçümlerini göster', { tur: 'olcum', olcumler: ['kilo', 'boy'], kapsam: { tip: 'son', adet: 1 }, tekDeger: false }],
      ['Son üç muayenedeki kiloları sırayla söyle', { tur: 'olcum', olcumler: ['kilo'], kapsam: { tip: 'son', adet: 3 }, tekDeger: false }],
      ['İlk muayenedeki boyu neydi', { tur: 'olcum', olcumler: ['boy'], kapsam: { tip: 'ilk', adet: 1 }, tekDeger: false }],
      ['2025 yılındaki kilo ölçümlerini listele', { tur: 'olcum', olcumler: ['kilo'], kapsam: { tip: 'yil', yil: 2025 }, tekDeger: false }],
      ['Ölçümlerini tablo olarak göster', { tur: 'olcum', olcumler: ['kilo', 'boy', 'basCevresi'], kapsam: { tip: 'tum' }, tekDeger: false }],
      ['Boyu kaç?', { tur: 'olcum', olcumler: ['boy'], kapsam: { tip: 'son', adet: 1 }, tekDeger: true }],
      ['Baş çevresi kaç santim', { tur: 'olcum', olcumler: ['basCevresi'], kapsam: { tip: 'son', adet: 1 }, tekDeger: true }],
    ]
    for (const [m, beklenen] of b) assert.deepEqual(kayitIstegiBul(m), beklenen, m)
  })
  it('muayene özeti: birkaç ya da tüm muayeneler', () => {
    const b: [string, object][] = [
      ['Son üç muayenesini özetle', { tur: 'muayene', kapsam: { tip: 'son', adet: 3 } }],
      ['Son 2 vizitini anlat', { tur: 'muayene', kapsam: { tip: 'son', adet: 2 } }],
      ['İlk iki muayenesini özetle', { tur: 'muayene', kapsam: { tip: 'ilk', adet: 2 } }],
      ['Bütün muayenelerini tek tek özetle', { tur: 'muayene', kapsam: { tip: 'tum' } }],
      ['Muayenelerini sırayla anlat', { tur: 'muayene', kapsam: { tip: 'tum' } }],
      ['Muayene geçmişini göster', { tur: 'muayene', kapsam: { tip: 'tum' } }],
      ['2025’teki muayenelerini özetle', { tur: 'muayene', kapsam: { tip: 'yil', yil: 2025 } }],
    ]
    for (const [m, beklenen] of b) assert.deepEqual(kayitIstegiBul(m), beklenen, m)
  })
  it('tek bilgi, değerlendirme ve tek adlı muayene bu yol değildir', () => {
    for (const m of [
      'Ateşi kaçtı?', 'Büyümesi nasıl gidiyor?', 'Kilo alıyor mu?', 'Persentilleri nasıl', 'Boyu yaşına göre normal mi',
      'Son muayenesini özetle', '6 aylık muayenesini anlat', 'Aşıları tam mı?', 'Alerjisi var mı?', 'Tansiyon ölçümleri neler', 'Kontrole ne zaman gelecek',
      'Otitte ilk seçenek nedir', 'Merhaba',
    ]) assert.equal(kayitIstegiBul(m), null, m)
  })
  // NOTYA-OLCUM-TEK-01: a single weight is a measurement question too; the route answers it only when a stored value exists.
  it('tek değer: kilo da bu yoldadır; kayıtlı değer yoksa yol karta bırakır (olcumVarMi)', () => {
    assert.deepEqual(kayitIstegiBul('Kilosu kaç?'), { tur: 'olcum', olcumler: ['kilo'], kapsam: { tip: 'son', adet: 1 }, tekDeger: true })
    const bos = olaylariKur({ ...HAM, vizitler: [], cihaz: [] }, BUGUN)
    for (const m of ['Kilosu kaç?', 'Boyu kaç?', 'Baş çevresi kaç santim']) {
      const i = istek(m)
      assert.ok(i.tur === 'olcum')
      assert.equal(olcumVarMi(i, olaylar), true, m)
      assert.equal(olcumVarMi(i, bos), false, m)
    }
  })
})

describe('antropometri tablosu — yalnız kayıtlı değer, eksik işaretli', () => {
  it('tüm muayeneler: her muayene bir satır, cihaz ölçümü ayrı satır, olmayan ölçüm "kayıt yok"', () => {
    const c = kayitCevabi(istek('Kilo, boy ve baş çevresi ölçümlerini tablo yap'), olaylar, AD)
    const h = hucreler(c.ekran)
    assert.deepEqual(h[0], ['Tarih', 'Kaynak', 'Kilo (kg)', 'Boy (cm)', 'Baş çevresi (cm)'])
    assert.deepEqual(h.slice(1), [
      ['10.01.2025', 'muayene', '7,2', '66', '43'],
      ['12.04.2025', 'muayene', '8,4', '71', '44,5'],
      ['15.07.2025', 'muayene', '9,1', 'kayıt yok', 'kayıt yok'],
      ['20.10.2025', 'muayene', '9,8', '76', 'kayıt yok'],
      ['01.12.2025', 'cihaz ölçümü', '10,2', '', ''],
      ['18.01.2026', 'muayene', 'kayıt yok', 'kayıt yok', 'kayıt yok'],
      ['05.04.2026', 'muayene', '10,9', '81', '47'],
    ])
    // Never a value that is not stored: no BMI, no percentile, no interpolation.
    for (const satir of h.slice(1)) for (const hucre of satir.slice(2)) assert.ok(hucre === '' || hucre === 'kayıt yok' || KAYITLI.has(hucre), hucre)
    assert.ok(!/persentil|vki|bmi/i.test(c.ekran))
    assert.match(c.ekran, /Yalnız dosyada kayıtlı değerler gösterilir/)
  })
  it('seri: yalnız kilo, zaman sırasıyla; sesli cevap kısa ve son değeri söyler', () => {
    const c = kayitCevabi(istek('Bütün muayenelerdeki kilo ölçümlerini sırayla göster'), olaylar, AD)
    const h = hucreler(c.ekran)
    assert.deepEqual(h[0], ['Tarih', 'Kaynak', 'Kilo (kg)'])
    assert.deepEqual(h.slice(1).map((s) => s[0]), ['10.01.2025', '12.04.2025', '15.07.2025', '20.10.2025', '01.12.2025', '18.01.2026', '05.04.2026'])
    assert.equal(c.konusma, `${AD}'ün kilo ölçümlerini tablo olarak ekrana getirdim Hocam; 7 kayıt var. Son kilo 10,9 kg (05.04.2026).`)
    assert.ok(sozCumleleri(c.konusma).length <= SOZ_BEAT_SINIRI)
    assert.ok(!c.konusma.includes('|'))
  })
  it('tek muayene: son / ilk; seçilen muayenede olmayan ölçüm söylenir', () => {
    const son = kayitCevabi(istek('Son muayenedeki boy ve kilo ölçümlerini göster'), olaylar, AD)
    assert.deepEqual(hucreler(son.ekran).slice(1), [['05.04.2026', '10,9', '81']])
    assert.equal(son.konusma, `${AD}, son muayene (05.04.2026): kilo 10,9 kg ve boy 81 cm.`)
    const uc = kayitCevabi(istek('Son üç muayenedeki kilo ve boy ölçümlerini sırayla göster'), olaylar, AD)
    assert.deepEqual(hucreler(uc.ekran).slice(1), [['20.10.2025', '9,8', '76'], ['18.01.2026', 'kayıt yok', 'kayıt yok'], ['05.04.2026', '10,9', '81']])
    assert.match(uc.ekran, /son 3 muayene; toplam 6 muayene kayıtlı/)
    const ilk = kayitCevabi(istek('İlk muayenedeki baş çevresi ölçümünü göster'), olaylar, AD)
    assert.deepEqual(hucreler(ilk.ekran).slice(1), [['10.01.2025', '43']])
  })
  it('tek değer: quick card’da olmayan boy / baş çevresi — son kayıtlı değer ve tarihi', () => {
    assert.equal(kayitCevabi(istek('Boyu kaç?'), olaylar, AD).ekran, `${AD} — son boy 81 cm (05.04.2026).`)
    assert.equal(kayitCevabi(istek('Baş çevresi kaç santim'), olaylar, AD).ekran, `${AD} — son baş çevresi 47 cm (05.04.2026).`)
  })
  it('hiç kaydı olmayan ölçüm uydurulmaz: açıkça söylenir', () => {
    const baslamamis: HamDosya = { ...HAM, vizitler: HAM.vizitler.map((v) => ({ ...v, vitaller: { kilo: (v.vitaller as { kilo?: number }).kilo } })), cihaz: [] }
    const o = olaylariKur(baslamamis, BUGUN)
    const yalniz = olcumCevabi({ tur: 'olcum', olcumler: ['basCevresi'], kapsam: { tip: 'tum' }, tekDeger: false }, o, AD)
    assert.equal(yalniz.ekran, `${AD} için kayıtlı baş çevresi ölçümü yok Hocam.`)
    const karisik = olcumCevabi({ tur: 'olcum', olcumler: ['kilo', 'boy', 'basCevresi'], kapsam: { tip: 'tum' }, tekDeger: false }, o, AD)
    assert.match(karisik.ekran, /Boy ve baş çevresi: hiçbir kayıtta ölçüm yok\./)
    assert.match(karisik.konusma, /Boy ve baş çevresi için kayıtlı ölçüm yok\.$/)
    assert.ok(hucreler(karisik.ekran).slice(1).every((s) => s[2] === 'kayıt yok' && s[3] === 'kayıt yok'))
    const bos = olcumCevabi({ tur: 'olcum', olcumler: ['kilo'], kapsam: { tip: 'tum' }, tekDeger: false }, olaylariKur({ ...HAM, vizitler: [], cihaz: [] }, BUGUN), AD)
    assert.equal(bos.ekran, `${AD} için onaylı muayene kaydı yok Hocam; kilo ölçümü de kayıtlı değil.`)
  })
})

describe('muayene özetleri — tarihli bloklar, onaylı notlardan', () => {
  it('son üç muayene: üç tarihli blok, şikayet / tanı / plan; olmayan bölüm "kayıt yok"', () => {
    const c = kayitCevabi(istek('Son üç muayenesini özetle'), olaylar, AD)
    assert.deepEqual(c.ekran.match(/^\*\*\d+\. \d{2}\.\d{2}\.\d{4}\*\*$/gm), ['**1. 20.10.2025**', '**2. 18.01.2026**', '**3. 05.04.2026**'])
    assert.match(c.ekran, /\*\*QA Bebek Ölçüm — son 3 muayene\*\* \(toplam 6 onaylı muayene\)/)
    assert.match(c.ekran, /\*\*1\. 20\.10\.2025\*\*\n- Şikayet: 15 aylık kontrol\.\n- Tanı: Sağlam çocuk izlemi\n- Plan: kayıt yok/)
    // No diagnosis field on that note: the assessment is shown in its place, never an invented diagnosis.
    assert.match(c.ekran, /\*\*2\. 18\.01\.2026\*\*\n- Şikayet: Döküntü\.\n- Tanı: Viral ekzantem düşünüldü\.\n- Plan: İzlem\./)
    assert.ok(SESLI_MUAYENE_SINIRI >= 3)
    assert.match(c.konusma, /^QA Bebek Ölçüm, son 3 muayene\. 20 Ekim 2025 muayenesi\. Şikayet: 15 aylık kontrol\. Tanı: Sağlam çocuk izlemi\. Plan: kayıt yok\. 18 Ocak 2026 muayenesi\./)
  })
  it('tüm muayeneler: altı blok, eskiden yeniye; ses yalnız yönlendirir', () => {
    const c = kayitCevabi(istek('Bütün muayenelerini tek tek özetle'), olaylar, AD)
    assert.equal((c.ekran.match(/^\*\*\d+\. /gm) || []).length, 6)
    assert.ok(c.ekran.indexOf('10.01.2025') < c.ekran.indexOf('05.04.2026'))
    assert.equal(c.konusma, `${AD}'ün 6 muayenesinin özetini ekrana getirdim Hocam; 10 Ocak 2025 ile 5 Nisan 2026 arası. Sesli dinlemek isterseniz "bana anlat" deyin.`)
  })
  it('istenen kadar muayene yoksa söylenir; olmayan yıl için özet uydurulmaz', () => {
    const on = muayeneCevabi({ tur: 'muayene', kapsam: { tip: 'son', adet: 10 } }, olaylar, AD)
    assert.match(on.ekran, /son 6 muayene\*\* — dosyada yalnız 6 muayene kayıtlı/)
    const yil = kayitCevabi(istek('2023’teki muayenelerini özetle'), olaylar, AD)
    assert.equal(yil.ekran, `${AD} için 2023 yılında onaylı muayene notu yok Hocam; dosyada 10.01.2025 – 05.04.2026 arasında 6 muayene kayıtlı.`)
    const yok = muayeneCevabi({ tur: 'muayene', kapsam: { tip: 'tum' } }, olaylariKur({ ...HAM, vizitler: [] }, BUGUN), AD)
    assert.equal(yok.ekran, `${AD} için onaylı muayene notu yok Hocam.`)
  })
})

describe('aşı tablosu — karnenin kendi satırları', () => {
  const karne = asiKarnesiOlustur({
    asilar: [
      { asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2024-07-10' },
      { asi_adi: 'KKK', doz_no: 1, uygulama_tarihi: '2025-07-12' },
      { asi_adi: 'BCG', doz_no: null, uygulama_tarihi: null },
    ],
    hasta: { adSoyad: AD, dogumTarihi: '2024-07-10' }, hekim: { ad: null, klinik: null }, bugunIso: BUGUN,
  })
  it('kayıt isteği: liste / karne / tablo / sayı; değerlendirme ve adlı aşı değil', () => {
    for (const m of [
      'Aşılarını göster',
      'Aşı karnesini tablo olarak göster',
      'Aşı kayıtlarını getir',
      'Uygulanmış aşılar',
      'Aşıları neler',
      'Toplam kaç aşısı var',
      'Kaç aşı yapılmış',
      "Bu Umucan Türküoğlu'nun, eee, aşı karnesini bana bir gösterir misin?",
    ]) assert.equal(asiKaydiSorusuMu(m), true, m)
    for (const m of [
      'Aşıları tam mı?',
      'Eksik aşısı var mı',
      'Sıradaki aşı ne zaman',
      'KKK aşısı ne zaman yapıldı',
      'Hepatit B kaç doz oldu',
      'Aşıyı dosyaya gir',
      'Aşı takvimini anlat',
      'Kilosu kaç',
      'Aşı karnesini değerlendir',
      'Aşı karnesi değerlendirmesini yap',
    ]) assert.equal(asiKaydiSorusuMu(m), false, m)
  })
  it('tablo: aşı, tarih, doz, yaş; tarihsiz kayıt öyle yazılır; ses tek cümle', () => {
    const c = asiTablosuCevabi(AD, karne)
    assert.deepEqual(c.sutunlar, ['Aşı', 'Tarih', 'Doz', 'Yaş'])
    assert.deepEqual(c.satirlar, [['Hepatit B', '10.07.2024', '1. doz', 'doğumda'], ['KKK', '12.07.2025', '1. doz', '12 aylık'], ['BCG', 'Tarih kayıtlı değil', '', '']])
    assert.match(c.ekran, /^\*\*QA Bebek Ölçüm — Aşı Karnesi\*\* \(3 kayıt\)\n\n\| Aşı \| Tarih \| Doz \| Yaş \|\n\| --- \| --- \| --- \| --- \|/)
    assert.equal(c.konusma, `${AD}'ün aşı karnesini ekrana getirdim Hocam; 3 kayıt var.`)
    assert.equal(sozCumleleri(c.konusma).length, 1)
    assert.ok(!/eksik|gecik|sıradaki/i.test(c.ekran), 'takvim yorumu yok')
  })
  it('kayıt yoksa tablo değil tek cümle', () => {
    const bos = asiTablosuCevabi(AD, { yapilanlar: [], hasta: { adSoyad: AD, dogumTarihi: null } })
    assert.equal(bos.ekran, `${AD} için kayıtlı aşı yok Hocam.`)
  })
})
