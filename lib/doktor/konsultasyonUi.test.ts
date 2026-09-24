/**
 * KONSULTASYON-01 — arayüz, gerçek react-dom/server çıktısıyla (sentetik veri):
 *   • zaman çizelgesi: durum rozeti, hedef branş, klinik soru, istem tarihi; yanıtlandıysa özet + tarih + 📎 rapor +
 *     "Muayene notuna eklendi"; açıksa N gündür + Yanıt ekle / Hatırlat / Yanıtsız kapat; eski kayıt rozeti
 *   • terim: UI "Konsültasyon" der, "sevk" yalnız SGK uyarı cümlesinde geçer
 *   • istem formu kağıdı: başlık Konsültasyon İstem Formu, SGK sevk belgesi olmadığı notu, TTB alanları, veli satırı yaşa bağlı
 *   • evrensel: hiçbir branşa özgü alan (Baş Çevresi, Neyzi…) taşımaz; dokunma hedefleri ≥ 44 px
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AracVurguSaglayici, VURGU_TEAL } from './aracUi'
import { AyseTaslakDurumu, KonsultasyonCizelgesi, KonsultasyonKarti, IstemDuzenleFormu, YanitFormu, YeniKonsultasyonFormu, type KonsultasyonGorunumu } from '../../components/doktor/HastaKonsultasyonlar'
import KonsultasyonIstemFormuKagidi, { type IstemFormuVerisi } from '../../components/doktor/KonsultasyonIstemFormuKagidi'
import { hedefSecenekleri } from './konsultasyon'
import { KonsultasyonKohortListesi } from '../../components/doktor/KonsultasyonKohortSatiri'
import { BekleyenKonsultasyonListesi } from '../../components/doktor/araclar/BekleyenKonsultasyonlar'
import { BekleyenKonsultasyonOzetiKarti } from '../../components/doktor/BekleyenKonsultasyonOzeti'
import type { BekleyenKonsultasyon } from './konsultasyon'
import { YonlendirmelerView } from '../../app/portal/_components/VisitsView'
import { emptyPortalBundle } from '../portal/emptyBundle'
import { specialtyProfile } from '../specialties/registry'

const satir = (o: Partial<KonsultasyonGorunumu>): KonsultasyonGorunumu => ({
  id: 'k', patient_id: 'p', hedef: 'kulak-burun-bogaz', hedef_brans: 'kulak-burun-bogaz', hedef_hekim: null, klinik_soru: 'İşitme kaybı var mı?',
  not_metni: null, aciliyet: 'rutin', tanilar: null, mevcut_durum: null, istem_tarihi: '2026-09-12', yanit_tarihi: null, yanit_ozeti: null,
  belge_id: null, note_id: null, kaynak: 'konsultasyon', durum: 'yanit_bekleniyor', son_hatirlatma_at: null, created_at: '2026-09-12T08:00:00Z',
  hedefEtiketi: 'KBB', eskiKayit: false, gun: 7, belge: null, belgeTaslagi: null, ...o,
})
const LISTE: KonsultasyonGorunumu[] = [
  satir({ id: 'bekleyen', aciliyet: 'oncelikli' }),
  satir({ id: 'yanitli', hedef_brans: 'goz-hastaliklari', hedefEtiketi: 'Göz Hastalıkları', klinik_soru: 'Şaşılık var mı?', durum: 'yanitlandi', yanit_tarihi: '2026-09-18', yanit_ozeti: 'Şaşılık saptanmadı.', hedef_hekim: 'Dr. QA Konsültan', belge_id: 'b1', belge: { id: 'b1', ad: 'goz-raporu.pdf', tur: 'application/pdf', tarih: '2026-09-18T10:00:00Z', silindi: false }, note_id: 'n1' }),
  satir({ id: 'yanitli-notsuz', durum: 'yanitlandi', yanit_tarihi: '2026-09-17', yanit_ozeti: 'İşitme kaybı saptanmadı.' }),
  satir({ id: 'kapali', hedef_brans: 'cocuk-cerrahisi', hedefEtiketi: 'Çocuk Cerrahisi', durum: 'kapandi_yanitsiz' }),
  satir({ id: 'eski', hedef_brans: null, hedef: 'nefroloji', hedefEtiketi: 'Nefroloji', klinik_soru: null, not_metni: 'eGFR düşüşü', durum: 'acik', kaynak: 'hekim', istem_tarihi: null, eskiKayit: true, gun: 40 }),
]
const hedefler = hedefSecenekleri(specialtyProfile('pediatri').konsultasyonHedefleri)
const sar = (el: ReturnType<typeof createElement>) => renderToStaticMarkup(createElement(AracVurguSaglayici, { vurgu: VURGU_TEAL, children: el }))

describe('KONSULTASYON-01 — zaman çizelgesi (SSR)', () => {
  const h = sar(createElement(KonsultasyonCizelgesi, { patientId: 'p', liste: LISTE, hedefler, setListe: () => {} }))
  const kart = (id: string) => {
    const bas = h.indexOf(`data-konsultasyon="${id}"`)
    assert.ok(bas >= 0, id)
    const son = h.indexOf('data-konsultasyon="', bas + 20)
    return h.slice(bas, son < 0 ? undefined : son)
  }
  it('başlık ve sayım', () => {
    assert.match(h, /Konsültasyonlar/)
    assert.match(h, /2 yanıt bekliyor · 2 yanıtlandı/)
    assert.match(h, /\+ Yeni konsültasyon/)
  })
  it('yanıt bekleyen: kaç gündür, aciliyet, Yanıt ekle / Hatırlat / Yanıtsız kapat, istem formu', () => {
    const k = kart('bekleyen')
    assert.match(k, /Yanıt bekleniyor · 7 gündür/)
    assert.match(k, /Öncelikli/)
    assert.match(k, /İşitme kaybı var mı\?/)
    assert.match(k, /İstem: 12\.09\.2026/)
    for (const d of ['Yanıt ekle', 'Hatırlat', 'Yanıtsız kapat', 'İstem formu']) assert.ok(k.includes(d), d)
    assert.match(k, /\/dashboard\/doktor\/hastalar\/p\/konsultasyon\/bekleyen\/yazdir/)
  })
  it('"show proof": yanıt özeti + tarih + konsültan + 📎 rapor + muayene notu bağlantısı', () => {
    const k = kart('yanitli')
    assert.match(k, /Yanıtlandı/)
    assert.match(k, /Yanıt · 18\.09\.2026 · Dr\. QA Konsültan/)
    assert.match(k, /Şaşılık saptanmadı\./)
    assert.match(k, /📎 goz-raporu\.pdf · 18\.09\.2026/)
    assert.match(k, /Muayene notuna eklendi →/)
    assert.match(k, /href="\/dashboard\/doktor\/notlar\/n1"/)
    assert.ok(!k.includes('Hatırlat') && !k.includes('Yanıtsız kapat'), 'yanıtlanmış kayıtta bekleme eylemleri yok')
  })
  it('yanıtlanmış ama nota eklenmemiş: "Bugünkü muayene formuna ekle" (hekim basar)', () => {
    const k = kart('yanitli-notsuz')
    assert.match(k, /Bugünkü muayene formuna ekle/)
    assert.ok(!k.includes('Muayene notuna eklendi'))
  })
  it('yanıtsız kapatılmış: geç gelen rapor eklenebilir; Sil görünür', () => {
    const k = kart('kapali')
    assert.match(k, /Yanıtsız kapatıldı/)
    assert.match(k, /Geç gelen raporu ekle/)
    assert.match(k, />Sil</)
  })
  it('uzun istem metni varsayılan daraltılır (Devamını göster); kısa metin açık kalır', () => {
    const mektup = Array.from({ length: 12 }, (_, i) => `Sayın Meslektaşım, satır ${i + 1} klinik ayrıntı ve muayene bulgusu.`).join('\n')
    const uzun = sar(createElement(KonsultasyonCizelgesi, {
      patientId: 'p',
      liste: [satir({ id: 'uzun', klinik_soru: mektup, durum: 'yanitlandi', yanit_tarihi: '2026-09-18', yanit_ozeti: 'Kısa yanıt.' })],
      hedefler,
      setListe: () => {},
    }))
    assert.match(uzun, /Devamını göster/)
    assert.match(uzun, /Sayın Meslektaşım, satır 1/)
    assert.doesNotMatch(uzun, /satır 12 klinik/)
    const kisa = kart('bekleyen')
    assert.match(kisa, /İşitme kaybı var mı\?/)
    assert.doesNotMatch(kisa, /Devamını göster/)
  })
  it('eski dahiliye kaydı: "eski kayıt" rozeti, not metni soru yerine, istem formu yok (klinik soru yok)', () => {
    const k = kart('eski')
    assert.match(k, /eski kayıt/)
    assert.match(k, /Nefroloji/)
    assert.match(k, /eGFR düşüşü/)
    assert.match(k, /40 gündür/)
    assert.ok(!k.includes('İstem formu'))
  })
  it('terim: arayüz "sevk" demez; branşa özgü alan taşımaz; dokunma hedefi 44 px', () => {
    assert.doesNotMatch(h, /sevk/i)
    assert.doesNotMatch(h, /Baş Çevresi|Neyzi|gebelik haftası|PASI|logMAR|veli\b/i)
    assert.match(h, /min-height:44px/)
  })
  it('boş durum ve tablo hazır değil durumu dürüst', () => {
    const bos = sar(createElement(KonsultasyonCizelgesi, { patientId: 'p', liste: [], hedefler, setListe: () => {} }))
    assert.match(bos, /Bu hasta için konsültasyon kaydı yok/)
    const hazirDegil = sar(createElement(KonsultasyonCizelgesi, { patientId: 'p', liste: [], hedefler, setListe: () => {}, tabloHazir: false }))
    assert.match(hazirDegil, /henüz hazır değil/)
    assert.doesNotMatch(hazirDegil, /\+ Yeni konsültasyon/)
  })
})

describe('KONSULTASYON-01 — yeni istem formu (SSR)', () => {
  const h = sar(createElement(YeniKonsultasyonFormu, { patientId: 'p', hedefler, olustu: () => {} }))
  it('önerilen branşlar üstte, tüm branşlar altta', () => {
    const on = h.indexOf('label="Önerilen"'), tum = h.indexOf('label="Tüm branşlar"')
    assert.ok(on > 0 && tum > on)
    assert.ok(h.slice(on, tum).includes('KBB') && h.slice(on, tum).includes('Çocuk Cerrahisi'))
  })
  it('TTB alanları: klinik soru (kısaltmasız ipucu), aciliyet, tanılar, mevcut durum', () => {
    assert.match(h, /Klinik soru \(konsültasyonun nedeni\)/)
    assert.match(h, /Açık ve kısaltmasız yazın/)
    for (const a of ['Rutin', 'Öncelikli', 'Acil']) assert.ok(h.includes(a), a)
    assert.match(h, /aria-checked="true"[^>]*>Rutin/)
    assert.match(h, /İstem formu ayrıntıları/)
  })
  it('boşken kaydet pasif; SGK sevki olmadığı yazılı', () => {
    assert.match(h, /disabled=""[^>]*>Konsültasyon istemi oluştur/)
    assert.match(h, /SGK sevk belgesi değildir/)
    assert.match(h, /MEDULA/)
    assert.doesNotMatch(h, /<textarea[^>]*>[^<]+<\/textarea>/, 'alanlar boş başlar')
  })
})

describe('KONSULTASYON-01 — Konsültasyon İstem Formu kağıdı (SSR)', () => {
  const v = (veli: boolean): IstemFormuVerisi => ({
    konsultasyon: { id: 'k', hedefEtiketi: 'KBB', hedef_hekim: 'Dr. QA Konsültan', klinik_soru: 'İşitme kaybı var mı?', not_metni: null, aciliyet: 'oncelikli', tanilar: 'İşitme kaybı şüphesi', mevcut_durum: null, istem_tarihi: '2026-09-12', created_at: '2026-09-12T08:00:00Z' },
    hasta: { adSoyad: 'QA Çocuk', dogumTarihi: '2020-05-01', cinsiyet: 'Erkek', veliSatiri: veli },
    baslik: { hekim: 'Dr. QA Müdavi', brans: 'Çocuk Sağlığı ve Hastalıkları', satirlar: ['Dr. QA Müdavi', 'QA Muayenehanesi'], logoDataUrl: '', diplomaNo: '123' },
  })
  const h = renderToStaticMarkup(createElement(KonsultasyonIstemFormuKagidi, { v: v(true) }))
  it('başlık Konsültasyon İstem Formu; SGK sevk belgesi olmadığı notu altta', () => {
    // NOTYA-YENI-GORUNUM-03 (Kaan, 2026-09-24): başlık bütün yazdırılabilir belgelerde ALL-CAPS'ten
    // Title Case'e geçti (Fraunces başlık slebi ile tutarlı — Muayene Notu, Epikriz, Gebe İzlem
    // Kartı aynı düzeltmeyi aldı), bu yüzden regex de güncellendi; anlam değişmedi.
    assert.match(h, /Konsültasyon İstem Formu/)
    assert.doesNotMatch(h, /HASTA SEVK FORMU|SEVK BELGESİ/, 'SGK formu başlığı taklit edilmez')
    assert.match(h, /Bu belge SGK sevk belgesi \(SUT EK-2\/F Hasta Sevk Formu \/ e-sevk\) değildir/)
    assert.match(h, /MEDULA üzerinden düzenlenir/)
    // "sevk" kelimesi yalnız o uyarı cümlesinde geçer
    const sevkler = h.match(/sevk/gi) || []
    assert.equal(sevkler.length, (h.match(/Bu belge SGK sevk belgesi[^<]*/)![0].match(/sevk/gi) || []).length)
  })
  it('TTB istem içeriği: hasta tanımlayıcıları, tanılar, mevcut durum, neden, tarih, aciliyet; imza + yanıt alanı', () => {
    for (const x of ['QA Çocuk', '01.05.2020', 'Erkek', '12.09.2026', 'KBB', '☒ Öncelikli', '☐ Rutin', 'İşitme kaybı var mı?', 'İşitme kaybı şüphesi', 'Hastanın mevcut durumu', 'Konsültasyon nedeni (klinik soru)', 'İstem yapan hekim · kaşe / imza', 'Konsültan hekim yanıtı', 'Dr. QA Müdavi', 'Diploma No: 123']) {
      assert.ok(h.includes(x), x)
    }
  })
  it('veli / yasal temsilci satırı yaşa bağlı (VELI-YASAL-ONAM)', () => {
    assert.match(h, /Veli \/ yasal temsilci/)
    assert.doesNotMatch(renderToStaticMarkup(createElement(KonsultasyonIstemFormuKagidi, { v: v(false) })), /Veli \/ yasal temsilci/)
  })
})

describe('KONSULTASYON-01 — kohort satırı (SSR, mevcut panellere takılır)', () => {
  it('en uzun bekleyen, gün rozeti, hasta dosyasına bağlantı, SKS medyanı; boş durum dürüst', () => {
    const h = sar(createElement(KonsultasyonKohortListesi, { bekleyenler: [
      { id: 'x', patientId: 'p1', hastaAdi: 'QA Hasta', hedef: 'KBB', klinikSoru: 'İşitme kaybı var mı?', istemTarihi: '2026-08-10', gun: 40, aciliyet: 'acil', eskiKayit: false, sonHatirlatmaAt: null },
      { id: 'y', patientId: 'p2', hastaAdi: 'QA Diğer', hedef: 'Nefroloji', klinikSoru: 'eGFR düşüşü', istemTarihi: '2026-09-15', gun: 4, aciliyet: null, eskiKayit: true, sonHatirlatmaAt: null },
    ], yanitSuresi: { adet: 3, medyanGun: 6, enUzunGun: 12 } }))
    assert.match(h, /Yanıt bekleyen konsültasyonlar \(2\)/)
    assert.match(h, /40 gündür açık/)
    assert.match(h, /href="\/dashboard\/doktor\/hastalar\/p1\?tab=konsultasyon"/)
    assert.match(h, /istem 10\.08\.2026 · acil/)
    assert.match(h, /eski kayıt/)
    assert.match(h, /istem → yanıt medyanı 6 gün/)
    assert.match(h, /min-height:44px/)
    assert.doesNotMatch(h, /sevk/i)
    assert.match(sar(createElement(KonsultasyonKohortListesi, { bekleyenler: [] })), /Yanıt bekleyen konsültasyon yok/)
  })
  it('yedi mevcut kohort paneli satırı taşır; tek konsültasyon aracı evrensel Bekleyen Konsültasyonlar (KONSULTASYON-02)', async () => {
    const { readFileSync, existsSync } = await import('node:fs')
    for (const d of ['dahiliye-kohort', 'derm-kohort', 'goz-kohort', 'kbb-kohort', 'kd-kohort', 'pedi-kohort', 'psik-kohort']) {
      assert.match(readFileSync(`app/doktor-tools/${d}/page.tsx`, 'utf8'), /<KonsultasyonKohortSatiri \/>/, d)
    }
    assert.equal(existsSync('app/doktor-tools/konsultasyon'), false)
    // KONSULTASYON-01 "yeni araç yok" diyordu; Kaan (2026-09-19) seçenek #1 ile TEK evrensel araç açtı — branşa özel konsültasyon aracı yine yok.
    const { ORTAK_DOKTOR_ARACLARI, BRANS_DOKTOR_ARACLARI } = await import('./doktorAraclari')
    assert.ok(!BRANS_DOKTOR_ARACLARI.some((a) => /konsult/i.test(a.route)))
    assert.deepEqual(ORTAK_DOKTOR_ARACLARI.filter((a) => /konsult/i.test(a.route)).map((a) => [a.route, a.branslar]), [['/doktor-tools/bekleyen-konsultasyonlar', null]])
  })
  it('kohort satırı ve araç aynı eşik fonksiyonunu kullanır; satır araca bağlanır', () => {
    const h = sar(createElement(KonsultasyonKohortListesi, { bekleyenler: [] }))
    assert.match(h, /href="\/doktor-tools\/bekleyen-konsultasyonlar"/)
    const { readFileSync } = require('node:fs') as typeof import('node:fs')
    for (const f of ['components/doktor/KonsultasyonKohortSatiri.tsx', 'components/doktor/araclar/BekleyenKonsultasyonlar.tsx']) {
      const k = readFileSync(f, 'utf8')
      assert.match(k, /beklemeVurgusu\(/, f)
      assert.doesNotMatch(k, /gun >= (14|30)/, `${f} eşiği yeniden tanımlamamalı`)
    }
  })
})

describe('KONSULTASYON-02 — Araçlar › Bekleyen Konsültasyonlar (SSR, evrensel)', () => {
  const B = (o: Partial<BekleyenKonsultasyon>): BekleyenKonsultasyon => ({
    id: 'k', patientId: 'p1', hastaAdi: 'QA Hasta GIZLI-A', hedef: 'KBB', klinikSoru: 'İşitme kaybı var mı?', istemTarihi: '2026-08-10',
    gun: 40, aciliyet: 'rutin', eskiKayit: false, sonHatirlatmaAt: null, ...o,
  })
  const LISTE2 = [
    B({ id: 'kirmizi', aciliyet: 'acil' }),
    B({ id: 'dikkat', patientId: 'p2', hastaAdi: 'QA İkinci', hedef: 'Nefroloji', klinikSoru: 'eGFR düşüşü', istemTarihi: '2026-09-01', gun: 18, aciliyet: 'oncelikli', eskiKayit: true }),
    B({ id: 'yeni', gun: 3, istemTarihi: '2026-09-16', sonHatirlatmaAt: new Date().toISOString() }),
  ]
  const islemYap = async () => ({ ok: true, metin: '' })
  const h = sar(createElement(BekleyenKonsultasyonListesi, { bekleyenler: LISTE2, yanitSuresi: { adet: 3, medyanGun: 6, enUzunGun: 12 }, islemYap }))
  const kart = (id: string) => { const i = h.indexOf(`data-bekleyen-konsultasyon="${id}"`); const j = h.indexOf('data-bekleyen-konsultasyon="', i + 10); return h.slice(i, j < 0 ? undefined : j) }

  it('her satır: hasta adı, hedef branş, klinik soru, istem tarihi, gün, aciliyet rozeti', () => {
    const k = kart('kirmizi')
    assert.match(k, /QA Hasta GIZLI-A/)
    assert.match(k, /→ KBB/)
    assert.match(k, /İşitme kaybı var mı\?/)
    assert.match(k, /İstem: 10\.08\.2026/)
    assert.match(k, /40 gündür bekliyor/)
    assert.match(k, />Acil</)
    assert.match(kart('dikkat'), />Öncelikli</)
    assert.match(kart('dikkat'), /eski kayıt/)
    assert.match(kart('yeni'), />Rutin</)
  })
  it('bekleme vurgusu: ≥30 kırmızı, 14–29 dikkat, altı nötr; sıra verildiği gibi (sunucu sıralar)', () => {
    assert.match(kart('kirmizi'), /data-vurgu="kirmizi"/)
    assert.match(kart('dikkat'), /data-vurgu="uyari"/)
    assert.match(kart('yeni'), /data-vurgu="notr"/)
    assert.ok(h.indexOf('"kirmizi"') < h.indexOf('"dikkat"') && h.indexOf('"dikkat"') < h.indexOf('"yeni"'))
    assert.match(h, /klinik bir süre sınırı değildir/)
  })
  it('eylemler: Yanıt ekle (hasta dosyasındaki form açık gelir), Hasta dosyası, Hatırlat, Yanıtsız kapat — ≥44 px', () => {
    const k = kart('kirmizi')
    assert.match(k, /href="\/dashboard\/doktor\/hastalar\/p1\?tab=konsultasyon&amp;yanit=kirmizi"[^>]*>Yanıt ekle</)
    assert.match(k, /href="\/dashboard\/doktor\/hastalar\/p1\?tab=konsultasyon"[^>]*>Hasta dosyası</)
    assert.match(k, />Hatırlat</)
    assert.match(k, />Yanıtsız kapat</)
    for (const m of k.match(/<(a|button)\b[^>]*>/g) || []) assert.match(m, /min-height:44px/, m)
    // 7 gün içinde hatırlatılmışsa düğme pasif ve neden yazılı
    assert.match(kart('yeni'), /disabled=""[^>]*>Hatırlat</)
    assert.match(kart('yeni'), /Sonraki hatırlatma/)
    assert.doesNotMatch(k, /disabled=""[^>]*>Hatırlat</)
  })
  it('üst sayaçlar aynı özetten; SKS medyanı yalnız ölçüm', () => {
    assert.match(h, /yanıt bekleyen/)
    assert.match(h, /14–29 gündür/)
    assert.match(h, /30 gün ve üzeri/)
    assert.match(h, /6 gün/)
  })
  it('boş / hazır değil / yükleniyor dürüst; hasta seçici yok; branş alanı ve "sevk" yok', () => {
    assert.match(sar(createElement(BekleyenKonsultasyonListesi, { bekleyenler: [], islemYap })), /Yanıt bekleyen konsültasyonunuz yok/)
    assert.match(sar(createElement(BekleyenKonsultasyonListesi, { bekleyenler: [], hazir: false, islemYap })), /henüz hazır değil/)
    assert.match(sar(createElement(BekleyenKonsultasyonListesi, { bekleyenler: null, islemYap })), /Yükleniyor/)
    assert.doesNotMatch(h, /Hasta seçilmedi|<select/)
    assert.doesNotMatch(h, /Baş Çevresi|Neyzi|gebelik haftası|PASI|logMAR|SCORE2|veli\b/i)
    assert.doesNotMatch(h, /sevk/i)
  })
})

describe('KONSULTASYON-02 — ana sayfa özeti (yalnız sayı > 0)', () => {
  it('sayı 0 / null iken hiçbir şey çizilmez', () => {
    assert.equal(renderToStaticMarkup(createElement(BekleyenKonsultasyonOzetiKarti, { ozet: null })), '')
    assert.equal(renderToStaticMarkup(createElement(BekleyenKonsultasyonOzetiKarti, { ozet: { sayi: 0, dikkat: 0, kirmizi: 0, enUzunGun: null } })), '')
  })
  it('sayı > 0: sayı + en uzun bekleme, araca götürür, 44 px; hasta adı taşımaz', () => {
    const h = renderToStaticMarkup(createElement(BekleyenKonsultasyonOzetiKarti, { ozet: { sayi: 3, dikkat: 1, kirmizi: 1, enUzunGun: 32 } }))
    assert.match(h, /href="\/doktor-tools\/bekleyen-konsultasyonlar"/)
    assert.match(h, />3</)
    assert.match(h, /yanıt bekleyen konsültasyon/)
    assert.match(h, /en uzun 32 gündür/)
    assert.match(h, /min-height:44px/)
  })
  it('doktor ana sayfasına bağlı (her branş — branş koşulu yok)', async () => {
    const { readFileSync } = await import('node:fs')
    const sayfa = readFileSync('app/dashboard/doktor/page.tsx', 'utf8')
    assert.match(sayfa, /\n\s*<BekleyenKonsultasyonOzeti \/>/)
    assert.doesNotMatch(sayfa, /&&\s*<BekleyenKonsultasyonOzeti/)
  })
})

describe('KONSULTASYON-01 — Sağlığım › Ziyaretler › Yönlendirmeleriniz (SSR)', () => {
  // Portal ui.tsx klasik JSX çalışma zamanı için React'i kapsamda bekler (Next derleyicisi otomatik sağlar)
  ;(globalThis as { React?: unknown }).React = React
  it('yalnız branş + tarih + durum cümlesi; liste boşsa bölüm yok', () => {
    const data = { ...emptyPortalBundle(), yonlendirmeler: [
      { id: 'a', brans: 'KBB', tarih: '2026-09-12', durum: 'sonuc_alindi' as const, sonucTarihi: '2026-09-18' },
      { id: 'b', brans: 'Göz Hastalıkları', tarih: '2026-09-15', durum: 'bekliyor' as const, sonucTarihi: null },
    ] }
    const h = renderToStaticMarkup(createElement(YonlendirmelerView, { data }))
    assert.match(h, /Yönlendirmeleriniz/)
    assert.ok(h.includes("KBB&#x27;ye yönlendirildiniz (12.09.2026) · Sonuç alındı (18.09.2026)"), h)
    assert.ok(h.includes("Göz Hastalıkları&#x27;na yönlendirildiniz (15.09.2026) · Sonuç bekleniyor"))
    assert.doesNotMatch(h, /sevk|tanı|tanı/i)
    assert.equal(renderToStaticMarkup(createElement(YonlendirmelerView, { data: emptyPortalBundle() })), '')
  })
})

describe('AYSE-KONSULTASYON-01 — istem düzenleme ve düzenleme geçmişi (SSR)', () => {
  const kart = (o: Partial<KonsultasyonGorunumu>) => sar(createElement(KonsultasyonKarti, { k: satir(o), patientId: 'p', guncelle: () => {} }))
  const IZ = [{ id: 'r1', alan: 'klinik_soru' as const, onceki: 'İlk istem metni.', sonraki: 'İşitme kaybı var mı?', created_at: '2026-09-13T09:00:00Z' }]
  it("yanıt beklerken 'Düzenle' var; yanıtlandıysa yok ve istem kilitli yazar", () => {
    const bekleyen = kart({})
    assert.match(bekleyen, />Düzenle</)
    assert.doesNotMatch(bekleyen, /istem kilitli/)
    const eski = kart({ durum: 'acik', hedef_brans: null, eskiKayit: true, klinik_soru: null, not_metni: 'eGFR düşüşü' })
    assert.match(eski, />Düzenle</, "eski 'acik' kayıt da düzenlenir")
    const yanitli = kart({ durum: 'yanitlandi', yanit_ozeti: 'İşitme kaybı saptanmadı.', yanit_tarihi: '2026-09-18' })
    assert.doesNotMatch(yanitli, />Düzenle</)
    assert.match(yanitli, /istem kilitli \(yanıt geldi\)/)
    assert.match(yanitli, /Yanıtı düzelt/, 'yanıt tarafı düzeltilebilir kalır')
    assert.doesNotMatch(kart({ durum: 'kapandi_yanitsiz' }), />Düzenle</)
  })
  it('düzenleme geçmişi her durumda görülebilir (yanıtlanmış kayıt dahil); iz yoksa hiç çizilmez', () => {
    assert.doesNotMatch(kart({}), /Düzenleme geçmişi/)
    const h = kart({ durum: 'yanitlandi', yanit_ozeti: 'Olağan.', duzenlemeler: IZ })
    assert.match(h, /Düzenleme geçmişi/)
    assert.match(h, />1</)
  })
  it('düzenleme formu: mevcut metin dolu, kaydet/vazgeç ≥ 44 px, kısaltma uyarısı engellemez', () => {
    const h = sar(createElement(IstemDuzenleFormu, { k: satir({ klinik_soru: 'KBB değerlendirmesi — OME şüphesi var mı?' }), kaydedildi: () => {}, vazgec: () => {} }))
    assert.match(h, /KBB değerlendirmesi — OME şüphesi var mı\?<\/textarea>/)
    assert.match(h, /Değişiklikleri kaydet/)
    assert.match(h, /Vazgeç/)
    assert.match(h, /Kısaltma olabilir: KBB, OME/)
    assert.match(h, /önceki metin düzenleme geçmişinde saklanır/)
    for (const b of h.match(/<button[^>]*>/g) || []) assert.match(b, /min-height:(4[4-9]|[5-9]\d)px|min-height:40px/, b)
  })
})

describe('AYSE-KONSULTASYON-01 — Ayşe taslağı arayüzü (SSR)', () => {
  const d = (t: Parameters<typeof AyseTaslakDurumu>[0]['t'], yon: 'istem' | 'yanit' = 'istem') => sar(createElement(AyseTaslakDurumu, { t, yon, taslagiKullan: () => {} }))
  it('yeni istem formu: branş seçilmeden taslak yok, Ayşe\'nin ne yapacağı yazıyor; "Oluştur" düğmesi', () => {
    const h = sar(createElement(YeniKonsultasyonFormu, { patientId: 'p', hedefler, olustu: () => {} }))
    assert.match(h, /Branşı seçtiğinizde Ayşe hasta dosyasından \(son muayene ağırlıklı\) istem taslağını yazar/)
    assert.match(h, /Konsültasyon istemi oluştur/)
    assert.doesNotMatch(h, /TASLAK · Ayşe/)
    assert.match(h, /Klinik soru \(konsültasyonun nedeni\)/)
  })
  it('taslak hazır: TASLAK rozeti + hekim onayı dili (TaslakNotu); düzenlenince rozet değişir', () => {
    const h = d({ durum: 'hazir', duzenlendi: false, bilgi: 'Son muayene 12.09.2026 ağırlıklı · 3 vizit okundu' })
    assert.match(h, /TASLAK · Ayşe · hekim onayı bekliyor/)
    assert.match(h, />TASLAK</, 'ortak TaslakNotu rozeti')
    assert.match(h, /tanı, evre, doz eklemez/)
    assert.match(h, /“Oluştur”a basmadan hiçbir şey kaydedilmez/)
    assert.match(h, /3 vizit okundu/)
    assert.match(d({ durum: 'hazir', duzenlendi: true }), /Ayşe taslağı · düzenlendi/)
  })
  it('HATA YOLU: "Taslak oluşturulamadı, elle yazabilirsiniz" — metin alanı ve Oluştur düğmesi yerinde', () => {
    const h = d({ durum: 'hata', mesaj: 'Taslak oluşturulamadı, elle yazabilirsiniz.' })
    assert.match(h, /Taslak oluşturulamadı, elle yazabilirsiniz\./)
    assert.doesNotMatch(h, /disabled/)
  })
  it('yazıyor: hekim beklemek zorunda değil; korundu: hekimin metni ezilmez, "Ayşe\'nin taslağını kullan" ≥ 44 px', () => {
    assert.match(d({ durum: 'yaziyor' }), /Beklemeden kendiniz de yazabilirsiniz/)
    const k = d({ durum: 'korundu', bekleyen: 'x' })
    assert.match(k, /metninizin üstüne yazılmadı/)
    assert.match(k, /Ayşe&#x27;nin taslağını kullan|Ayşe'nin taslağını kullan/)
    assert.match(k, /min-height:44px/)
  })
  it('yanıt: taslak dili "Notya tanı iddia etmez", "onaylamadan yanıtlandı olmaz"; form "Onayla ve kaydet"', () => {
    const h = d({ durum: 'hazir', duzenlendi: false, bilgi: 'konsültan raporundan' }, 'yanit')
    assert.match(h, /Notya tanı iddia etmez/)
    assert.match(h, /Onaylamadan konsültasyon “yanıtlandı” olmaz/)
    const f = sar(createElement(YanitFormu, { k: satir({ belge_id: 'b1' }), patientId: 'p', kaydedildi: () => {}, vazgec: () => {} }))
    assert.match(f, /Onayla ve kaydet/)
    assert.match(f, /Yanıt özeti — kendi cümleniz/)
  })
  it('bekleyen kart: rapor bağlıysa Ayşe\'nin özet taslağına yönlendirir', () => {
    const h = sar(createElement(KonsultasyonKarti, { k: satir({ belge_id: 'b1', belge: { id: 'b1', ad: 'kbb.pdf', tur: 'application/pdf', tarih: '2026-09-18T10:00:00Z', silindi: false } }), patientId: 'p', guncelle: () => {} }))
    assert.match(h, /Ayşe(&#x27;|')nin özet taslağını görün, onaylayın/)
  })
})
