/**
 * KONSULTASYON-01 — arayüz, gerçek react-dom/server çıktısıyla (sentetik veri):
 *   • zaman çizelgesi: durum rozeti, hedef branş, klinik soru, istem tarihi; yanıtlandıysa özet + tarih + 📎 rapor +
 *     "Muayene notuna eklendi"; açıksa N gündür + Yanıt ekle / Hatırlat / Yanıtsız kapat; eski kayıt rozeti
 *   • terim: UI "Konsültasyon" der, "sevk" yalnız SGK uyarı cümlesinde geçer
 *   • istem formu kağıdı: başlık KONSÜLTASYON İSTEM FORMU, SGK sevk belgesi olmadığı notu, TTB alanları, veli satırı yaşa bağlı
 *   • evrensel: hiçbir branşa özgü alan (Baş Çevresi, Neyzi…) taşımaz; dokunma hedefleri ≥ 44 px
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AracVurguSaglayici, VURGU_TEAL } from './aracUi'
import { KonsultasyonCizelgesi, YeniKonsultasyonFormu, type KonsultasyonGorunumu } from '../../components/doktor/HastaKonsultasyonlar'
import KonsultasyonIstemFormuKagidi, { type IstemFormuVerisi } from '../../components/doktor/KonsultasyonIstemFormuKagidi'
import { hedefSecenekleri } from './konsultasyon'
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
  it('yanıtsız kapatılmış: geç gelen rapor eklenebilir', () => {
    const k = kart('kapali')
    assert.match(k, /Yanıtsız kapatıldı/)
    assert.match(k, /Geç gelen raporu ekle/)
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

describe('KONSULTASYON-01 — KONSÜLTASYON İSTEM FORMU kağıdı (SSR)', () => {
  const v = (veli: boolean): IstemFormuVerisi => ({
    konsultasyon: { id: 'k', hedefEtiketi: 'KBB', hedef_hekim: 'Dr. QA Konsültan', klinik_soru: 'İşitme kaybı var mı?', not_metni: null, aciliyet: 'oncelikli', tanilar: 'İşitme kaybı şüphesi', mevcut_durum: null, istem_tarihi: '2026-09-12', created_at: '2026-09-12T08:00:00Z' },
    hasta: { adSoyad: 'QA Çocuk', dogumTarihi: '2020-05-01', cinsiyet: 'Erkek', veliSatiri: veli },
    baslik: { hekim: 'Dr. QA Müdavi', brans: 'Çocuk Sağlığı ve Hastalıkları', satirlar: ['Dr. QA Müdavi', 'QA Muayenehanesi'], logoDataUrl: '', diplomaNo: '123' },
  })
  const h = renderToStaticMarkup(createElement(KonsultasyonIstemFormuKagidi, { v: v(true) }))
  it('başlık KONSÜLTASYON İSTEM FORMU; SGK sevk belgesi olmadığı notu altta', () => {
    assert.match(h, /KONSÜLTASYON İSTEM FORMU/)
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
