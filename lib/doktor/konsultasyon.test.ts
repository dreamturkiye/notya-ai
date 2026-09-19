/**
 * KONSULTASYON-01 — saf kurallar: istem/yanıt doğrulama, durum geçişleri, eski kayıt eşdeğerliği, not bloğu,
 * hasta portalında klinik içerik sızmaması. Sentetik veri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  BEKLEME_DIKKAT_GUN,
  BEKLEME_KIRMIZI_GUN,
  HATIRLATMA_ARALIGI_GUN,
  beklemeGunu,
  beklemeVurgusu,
  bekleyenListesi,
  bekleyenOzeti,
  hatirlatmaBeklemesi,
  durumGrubu,
  gecisIzinli,
  duzenlemeDogrula,
  yanitRevizyonu,
  ISTEM_KILITLI_YANITLANDI,
  hedefEtiketi,
  hedefSecenekleri,
  istemDogrula,
  konsultasyonHatirlatmaMesaji,
  konsultasyonNotBlogu,
  olasiKisaltmalar,
  portalYonlendirmeleri,
  portalYonlendirmeMetni,
  yanitDogrula,
  yonelmeEki,
  yanitSuresiOzeti,
  type KonsultasyonSatiri,
} from './konsultasyon'
import { specialtyProfile } from '@/lib/specialties/registry'
import { SPECIALTIES } from './specialties'

const BUGUN = '2026-09-19'
const satir = (o: Partial<KonsultasyonSatiri> = {}): KonsultasyonSatiri => ({
  id: 'k1', patient_id: 'p1', hedef: 'kulak-burun-bogaz', hedef_brans: 'kulak-burun-bogaz', hedef_hekim: null,
  klinik_soru: 'İşitme kaybı var mı? GIZLI-SORU', not_metni: null, aciliyet: 'rutin', tanilar: 'Seröz otit şüphesi GIZLI-TANI',
  mevcut_durum: 'GIZLI-DURUM', istem_tarihi: '2026-09-12', yanit_tarihi: null, yanit_ozeti: null, belge_id: null, note_id: null,
  kaynak: 'konsultasyon', durum: 'yanit_bekleniyor', son_hatirlatma_at: null, created_at: '2026-09-12T09:00:00Z', ...o,
})

describe('KONSULTASYON-01 — istem doğrulama (TTB: açık, kısaltmasız, aciliyet + tarih)', () => {
  it('geçerli istem: kanonik branş, klinik soru, varsayılan aciliyet rutin ve bugünün tarihi', () => {
    const d = istemDogrula({ hedefBrans: 'kulak-burun-bogaz', klinikSoru: '  İşitme kaybı var mı?  ' }, BUGUN)
    assert.ok('girdi' in d)
    assert.equal(d.girdi.hedef_brans, 'kulak-burun-bogaz')
    assert.equal(d.girdi.klinik_soru, 'İşitme kaybı var mı?')
    assert.equal(d.girdi.aciliyet, 'rutin')
    assert.equal(d.girdi.istem_tarihi, BUGUN)
    assert.equal(d.girdi.hedef_hekim, null)
  })
  it('serbest metin hedef reddedilir — yalnız lib/doktor/specialties.ts anahtarları', () => {
    for (const h of ['KBB', 'kbb', 'goz', 'perinatoloji', '', 'Kulak Burun Boğaz']) {
      assert.ok('hata' in istemDogrula({ hedefBrans: h, klinikSoru: 'İşitme kaybı var mı?' }, BUGUN), h)
    }
    for (const s of SPECIALTIES) assert.ok('girdi' in istemDogrula({ hedefBrans: s.key, klinikSoru: 'Açık bir klinik soru' }, BUGUN), s.key)
  })
  it('klinik soru zorunlu ve açık olmalı; aciliyet ve tarih denetlenir', () => {
    assert.ok('hata' in istemDogrula({ hedefBrans: 'goz-hastaliklari', klinikSoru: 'KBB?' }, BUGUN))
    assert.ok('hata' in istemDogrula({ hedefBrans: 'goz-hastaliklari', klinikSoru: 'Görme keskinliği?', aciliyet: 'hemen' }, BUGUN))
    assert.ok('hata' in istemDogrula({ hedefBrans: 'goz-hastaliklari', klinikSoru: 'Görme keskinliği?', istemTarihi: '2026-09-20' }, BUGUN))
    assert.ok('hata' in istemDogrula({ hedefBrans: 'goz-hastaliklari', klinikSoru: 'Görme keskinliği?', istemTarihi: '2026-02-30' }, BUGUN))
    const d = istemDogrula({ hedefBrans: 'goz-hastaliklari', klinikSoru: 'Görme keskinliği?', aciliyet: 'acil', istemTarihi: '2026-09-10' }, BUGUN)
    assert.ok('girdi' in d && d.girdi.aciliyet === 'acil' && d.girdi.istem_tarihi === '2026-09-10')
  })
  it('olası kısaltmaları işaretler (engellemez), düz Türkçe cümlede yanlış alarm yok', () => {
    assert.deepEqual(olasiKisaltmalar('ÜSYE sonrası OME? KBB görüşü'), ['ÜSYE', 'OME', 'KBB'])
    assert.deepEqual(olasiKisaltmalar('İşitme kaybı var mı, yok mu.'), [])
    assert.deepEqual(olasiKisaltmalar('Sağ kulakta 3 aydır akıntı; timpanostomi tüpü gerekir mi?'), [])
  })
})

describe('KONSULTASYON-01 — durumlar ve geçişler', () => {
  it('eski değerler çalışır: acik = bekliyor, kapandi = yanıtsız kapandı', () => {
    assert.equal(durumGrubu('acik'), 'bekliyor')
    assert.equal(durumGrubu('yanit_bekleniyor'), 'bekliyor')
    assert.equal(durumGrubu('yanitlandi'), 'yanitlandi')
    assert.equal(durumGrubu('kapandi_yanitsiz'), 'kapandi')
    assert.equal(durumGrubu('kapandi'), 'kapandi')
    assert.equal(durumGrubu('bilinmeyen'), 'bekliyor', 'bilinmeyen durum gizlenmez, açık sayılır')
  })
  it('geçiş kuralı', () => {
    assert.equal(gecisIzinli('yanit_bekleniyor', 'kapat').ok, true)
    assert.equal(gecisIzinli('acik', 'kapat').ok, true)
    assert.equal(gecisIzinli('yanitlandi', 'kapat').ok, false, 'yanıtlanmış konsültasyon yanıtsız kapatılamaz')
    assert.equal(gecisIzinli('kapandi', 'kapat').ok, false)
    assert.equal(gecisIzinli('kapandi_yanitsiz', 'yanit').ok, true, 'geç gelen rapor yine eklenebilir')
    assert.equal(gecisIzinli('yanitlandi', 'yanit').ok, true, 'yanıt düzeltilebilir')
    assert.equal(gecisIzinli('yanit_bekleniyor', 'nota_ekle').ok, false, 'yanıtsız nota eklenmez')
    assert.equal(gecisIzinli('yanitlandi', 'nota_ekle').ok, true)
    assert.equal(gecisIzinli('yanitlandi', 'hatirlat').ok, false)
    assert.equal(gecisIzinli('acik', 'hatirlat').ok, true)
  })
  it('yanıt: hekimin cümlesi zorunlu; tarih istemden önce ya da ileri olamaz', () => {
    const s = satir()
    assert.ok('hata' in yanitDogrula({ yanitOzeti: '' }, s, BUGUN))
    assert.ok('hata' in yanitDogrula({ yanitOzeti: 'İşitme kaybı saptanmadı.', yanitTarihi: '2026-09-11' }, s, BUGUN))
    assert.ok('hata' in yanitDogrula({ yanitOzeti: 'İşitme kaybı saptanmadı.', yanitTarihi: '2026-09-25' }, s, BUGUN))
    const v = yanitDogrula({ yanitOzeti: ' İşitme kaybı saptanmadı. ', yanitTarihi: '2026-09-18' }, s, BUGUN)
    assert.deepEqual(v, { yanit_ozeti: 'İşitme kaybı saptanmadı.', yanit_tarihi: '2026-09-18' })
  })
  it('bekleme günü istem tarihinden (yoksa oluşturma gününden) sayılır', () => {
    assert.equal(beklemeGunu(satir(), BUGUN), 7)
    assert.equal(beklemeGunu(satir({ istem_tarihi: null, created_at: '2026-09-01T08:00:00Z' }), BUGUN), 18)
  })
})

describe('KONSULTASYON-01 — hedef branş etiketleri ve öneriler', () => {
  it('eski dahiliye/göz/KD hedef anahtarları okunur ad alır', () => {
    assert.equal(hedefEtiketi({ hedef: 'goz' }), 'Göz Hastalıkları')
    assert.equal(hedefEtiketi({ hedef: 'nefroloji' }), 'Nefroloji')
    assert.equal(hedefEtiketi({ hedef: 'gogus' }), 'Göğüs Hastalıkları')
    assert.equal(hedefEtiketi({ hedef: 'perinatoloji' }), 'Perinatoloji')
    assert.equal(hedefEtiketi({ hedef: 'x', hedef_brans: 'kulak-burun-bogaz' }), 'KBB')
  })
  it('pediatri önerileri: KBB, göz, çocuk cerrahisi üstte; tüm branşlar yine seçilebilir', () => {
    const p = hedefSecenekleri(specialtyProfile('pediatri').konsultasyonHedefleri)
    assert.deepEqual(p.onerilen.map(([k]) => k), ['kulak-burun-bogaz', 'goz-hastaliklari', 'cocuk-cerrahisi'])
    assert.equal(p.onerilen.length + p.diger.length, SPECIALTIES.length)
    // Kardiyoloji hekiminin kendi önerisi yok → hepsi alfabetik "diğer"
    const k = hedefSecenekleri(specialtyProfile('kardiyoloji').konsultasyonHedefleri)
    assert.equal(k.onerilen.length, 0)
    assert.equal(k.diger.length, SPECIALTIES.length)
  })
})

describe('KONSULTASYON-01 — "Bugünkü muayene formuna ekle" bloğu', () => {
  it('yalnız hekimin soru + yanıt cümlesi, rapor adı; T.C. kimlik benzeri dizi maskelenir', () => {
    const b = konsultasyonNotBlogu(satir({ durum: 'yanitlandi', yanit_ozeti: 'İşitme kaybı saptanmadı. 12345678901', yanit_tarihi: '2026-09-18', hedef_hekim: 'Dr. QA Konsultan' }), 'kbb-raporu.pdf', BUGUN)
    assert.ok(b)
    const satirlar = b!.split('\n')
    assert.equal(satirlar[0], '[2026-09-19] Konsültasyon yanıtı — KBB (hekim ekledi)')
    assert.ok(satirlar[1].startsWith('- Soru (12.09.2026): İşitme kaybı var mı?'))
    assert.ok(satirlar[2].startsWith('- Yanıt (18.09.2026, Dr. QA Konsultan): İşitme kaybı saptanmadı.'))
    assert.ok(!b!.includes('12345678901'))
    assert.equal(satirlar[3], "- Rapor: Kasa'da — kbb-raporu.pdf")
    assert.ok(!b!.includes('GIZLI-TANI') && !b!.includes('GIZLI-DURUM'), 'istem formundaki tanı/durum nota kopyalanmaz')
  })
  it('yanıt yoksa blok yok', () => {
    assert.equal(konsultasyonNotBlogu(satir(), null, BUGUN), null)
  })
})

describe('KONSULTASYON-01 — Sağlığım: branş + tarih + durum, klinik içerik YOK', () => {
  const kayitlar = [
    satir({ id: 'a', durum: 'yanitlandi', yanit_tarihi: '2026-09-18', yanit_ozeti: 'GIZLI-YANIT', hedef_hekim: 'Dr. GIZLI-HEKIM', belge_id: 'GIZLI-BELGE' }),
    satir({ id: 'b', hedef_brans: 'goz-hastaliklari', hedef: 'goz-hastaliklari', istem_tarihi: '2026-09-15' }),
    satir({ id: 'c', hedef_brans: 'cocuk-cerrahisi', hedef: 'cocuk-cerrahisi', durum: 'kapandi_yanitsiz', istem_tarihi: '2026-08-01' }),
    // eski dahiliye hesaplayıcı satırı (hedef_brans yok) — hastaya gösterilmez
    satir({ id: 'd', hedef_brans: null, hedef: 'gastroenteroloji', klinik_soru: null, not_metni: 'FIB-4 GIZLI-ESKI', durum: 'acik', istem_tarihi: null }),
  ]
  const p = portalYonlendirmeleri(kayitlar)
  it('yalnız yeni akış kayıtları, en yeni üstte', () => {
    assert.deepEqual(p.map((x) => x.id), ['b', 'a', 'c'])
  })
  it('JSON\'da klinik soru, tanı, mevcut durum, yanıt özeti, belge, konsültan adı yok', () => {
    const j = JSON.stringify(p)
    for (const g of ['GIZLI-SORU', 'GIZLI-TANI', 'GIZLI-DURUM', 'GIZLI-YANIT', 'GIZLI-HEKIM', 'GIZLI-BELGE', 'GIZLI-ESKI', 'İşitme']) assert.ok(!j.includes(g), g)
    assert.deepEqual(Object.keys(p[0]).sort(), ['brans', 'durum', 'id', 'sonucTarihi', 'tarih'])
  })
  it('Kaan\'ın cümlesi', () => {
    assert.equal(portalYonlendirmeMetni(p[1]), "KBB'ye yönlendirildiniz (12.09.2026) · Sonuç alındı (18.09.2026)")
    assert.equal(portalYonlendirmeMetni(p[0]), "Göz Hastalıkları'na yönlendirildiniz (15.09.2026) · Sonuç bekleniyor")
    assert.equal(portalYonlendirmeMetni(p[2]), "Çocuk Cerrahisi'ne yönlendirildiniz (01.08.2026) · Takip kapatıldı")
  })
  it('yönelme eki', () => {
    assert.equal(yonelmeEki('KBB'), "KBB'ye")
    assert.equal(yonelmeEki('Pediatri'), "Pediatri'ye")
    assert.equal(yonelmeEki('Acil Tıp'), "Acil Tıp'a")
    assert.equal(yonelmeEki('Aile Hekimliği'), "Aile Hekimliği'ne")
    assert.equal(yonelmeEki('Nöroloji'), "Nöroloji'ye")
    assert.equal(yonelmeEki('Kadın Hastalıkları ve Doğum'), "Kadın Hastalıkları ve Doğum'a")
    assert.equal(yonelmeEki('Genel Cerrahi'), "Genel Cerrahi'ye")
    assert.equal(yonelmeEki('Üroloji'), "Üroloji'ye")
  })
  it('hatırlatma mesajı klinik soru / tanı taşımaz', () => {
    const m = konsultasyonHatirlatmaMesaji('KBB')
    assert.ok(m.metin.includes("KBB'ye yönlendirildiğiniz"))
    assert.ok(!/işitme|tanı|şüphe/i.test(m.metin))
  })
})

describe('KONSULTASYON-01 — SKS yanıt süresi (yalnız ölçüm)', () => {
  it('medyan ve en uzun gün; yanıtsız / tarihsiz kayıtlar sayılmaz', () => {
    const r = yanitSuresiOzeti([
      satir({ durum: 'yanitlandi', istem_tarihi: '2026-09-01', yanit_tarihi: '2026-09-03' }),
      satir({ durum: 'yanitlandi', istem_tarihi: '2026-09-01', yanit_tarihi: '2026-09-11' }),
      satir({ durum: 'yanitlandi', istem_tarihi: '2026-09-01', yanit_tarihi: '2026-09-05' }),
      satir({ durum: 'yanitlandi', istem_tarihi: '2026-09-01', yanit_tarihi: '2026-09-07' }),
      satir({ durum: 'yanit_bekleniyor' }),
      satir({ durum: 'yanitlandi', yanit_tarihi: null }),
    ])
    assert.deepEqual(r, { adet: 4, medyanGun: 5, enUzunGun: 10 })
    assert.deepEqual(yanitSuresiOzeti([]), { adet: 0, medyanGun: null, enUzunGun: null })
  })
})

describe('KONSULTASYON-02 — bekleyen listesi: sıralama, eşik, özet (tek tanım)', () => {
  const ADLAR = new Map([['p1', 'QA Hasta Bir'], ['p2', 'QA Hasta İki']])

  it('bekleme vurgusu: <14 nötr, 14–29 dikkat, ≥30 kırmızı (sınırlar dahil)', () => {
    assert.equal(BEKLEME_DIKKAT_GUN, 14)
    assert.equal(BEKLEME_KIRMIZI_GUN, 30)
    for (const [gun, v] of [[0, 'notr'], [13, 'notr'], [14, 'uyari'], [29, 'uyari'], [30, 'kirmizi'], [365, 'kirmizi']] as const) {
      assert.equal(beklemeVurgusu(gun), v, String(gun))
    }
  })

  it('en uzun bekleyen üstte; aynı günde acil → öncelikli → rutin; id ile kararlı', () => {
    const l = bekleyenListesi([
      satir({ id: 'yeni', istem_tarihi: '2026-09-18' }),
      satir({ id: 'eski-rutin', istem_tarihi: '2026-08-01', aciliyet: 'rutin' }),
      satir({ id: 'eski-acil', istem_tarihi: '2026-08-01', aciliyet: 'acil' }),
      satir({ id: 'orta', patient_id: 'p2', istem_tarihi: '2026-09-01', aciliyet: 'oncelikli' }),
      satir({ id: 'eski-oncelikli', istem_tarihi: '2026-08-01', aciliyet: 'oncelikli' }),
    ], ADLAR, BUGUN)
    assert.deepEqual(l.map((b) => b.id), ['eski-acil', 'eski-oncelikli', 'eski-rutin', 'orta', 'yeni'])
    assert.deepEqual(l.map((b) => b.gun), [49, 49, 49, 18, 1])
    assert.deepEqual(l.map((b) => beklemeVurgusu(b.gun)), ['kirmizi', 'kirmizi', 'kirmizi', 'uyari', 'notr'])
    assert.equal(l[3].hastaAdi, 'QA Hasta İki')
    assert.equal(l[0].hedef, 'KBB')
  })

  it('yalnız bekleyen durumlar (eski "acik" dahil); yanıtlanan / kapanan / bilinmeyen durum listede yok', () => {
    const l = bekleyenListesi([
      satir({ id: 'a', durum: 'yanit_bekleniyor' }),
      satir({ id: 'b', durum: 'acik', hedef_brans: null, hedef: 'nefroloji', klinik_soru: null, not_metni: 'eGFR düşüşü' }),
      satir({ id: 'c', durum: 'yanitlandi' }),
      satir({ id: 'd', durum: 'kapandi_yanitsiz' }),
      satir({ id: 'e', durum: 'kapandi' }),
      satir({ id: 'f', durum: 'taslak' }),
    ], ADLAR, BUGUN)
    assert.deepEqual(l.map((b) => b.id).sort(), ['a', 'b'])
    const eski = l.find((b) => b.id === 'b')!
    assert.equal(eski.eskiKayit, true)
    assert.equal(eski.klinikSoru, 'eGFR düşüşü') // eski kayıtta soru not metninden
    assert.equal(eski.hedef, 'Nefroloji')
  })

  it('HASTA-IZOLASYON: ad haritasında olmayan hastanın (başka hekimin) satırı düşer', () => {
    const l = bekleyenListesi([satir({ id: 'kendi' }), satir({ id: 'yabanci', patient_id: 'baska-hekimin-hastasi' })], ADLAR, BUGUN)
    assert.deepEqual(l.map((b) => b.id), ['kendi'])
    assert.deepEqual(bekleyenListesi([satir()], new Map(), BUGUN), [])
  })

  it('satır alanları: istem tarihi yoksa created_at; uzun soru kısaltılır; son hatırlatma taşınır', () => {
    const [b] = bekleyenListesi([satir({ istem_tarihi: null, created_at: '2026-09-05T10:00:00Z', klinik_soru: 'Ş'.repeat(900), son_hatirlatma_at: '2026-09-15T08:00:00Z' })], ADLAR, BUGUN)
    assert.equal(b.istemTarihi, '2026-09-05')
    assert.equal(b.gun, 14)
    assert.equal(b.klinikSoru.length, 300)
    assert.ok(b.klinikSoru.endsWith('…'))
    assert.equal(b.sonHatirlatmaAt, '2026-09-15T08:00:00Z')
  })

  it('özet aynı listeden sayılır: sayı, dikkat, kırmızı, en uzun', () => {
    assert.deepEqual(bekleyenOzeti([{ gun: 3 }, { gun: 14 }, { gun: 29 }, { gun: 30 }, { gun: 61 }]), { sayi: 5, dikkat: 2, kirmizi: 2, enUzunGun: 61 })
    assert.deepEqual(bekleyenOzeti([]), { sayi: 0, dikkat: 0, kirmizi: 0, enUzunGun: null })
  })

  it('hatırlatma sıklık sınırı: 7 gün dolmadıysa sonraki gün, dolduysa null', () => {
    const simdi = Date.parse('2026-09-19T09:00:00Z')
    assert.equal(HATIRLATMA_ARALIGI_GUN, 7)
    assert.equal(hatirlatmaBeklemesi('2026-09-15T09:00:00Z', simdi), '2026-09-22')
    assert.equal(hatirlatmaBeklemesi('2026-09-10T09:00:00Z', simdi), null)
    assert.equal(hatirlatmaBeklemesi(null, simdi), null)
    assert.equal(hatirlatmaBeklemesi('gecersiz', simdi), null)
  })
})

describe('AYSE-KONSULTASYON-01 — istem düzenleme kuralları (saf)', () => {
  const satir = { klinik_soru: 'İşitme kaybı var mı? Okul başarısı düştü.', aciliyet: 'rutin', hedef_hekim: null, tanilar: null, mevcut_durum: null, not_metni: null }
  it("istem yalnız yanıt beklerken düzenlenir; 'yanitlandi' ve kapanmış kayıtta KİLİTLİ", () => {
    assert.deepEqual(gecisIzinli('yanit_bekleniyor', 'duzenle'), { ok: true })
    assert.deepEqual(gecisIzinli('acik', 'duzenle'), { ok: true }, "eski 'acik' = yanıt bekleniyor")
    assert.deepEqual(gecisIzinli('yanitlandi', 'duzenle'), { ok: false, hata: ISTEM_KILITLI_YANITLANDI })
    for (const d of ['kapandi_yanitsiz', 'kapandi']) assert.equal(gecisIzinli(d, 'duzenle').ok, false, d)
    // yanıt tarafı yanıtlanmış kayıtta düzeltilebilir kalır
    assert.deepEqual(gecisIzinli('yanitlandi', 'yanit'), { ok: true })
  })
  it('yalnız değişen alanlar güncellenir ve her biri için önceki → sonraki izi üretilir', () => {
    const d = duzenlemeDogrula({ klinikSoru: 'İşitme kaybı açısından değerlendirmenizi rica ederim.', aciliyet: 'rutin', tanilar: 'İşitme kaybı şüphesi' }, satir)
    assert.ok(!('hata' in d))
    if ('hata' in d) return
    assert.deepEqual(d.guncelleme, { klinik_soru: 'İşitme kaybı açısından değerlendirmenizi rica ederim.', tanilar: 'İşitme kaybı şüphesi' })
    assert.deepEqual(d.revizyonlar, [
      { alan: 'klinik_soru', onceki: satir.klinik_soru, sonraki: 'İşitme kaybı açısından değerlendirmenizi rica ederim.' },
      { alan: 'tanilar', onceki: null, sonraki: 'İşitme kaybı şüphesi' },
    ])
  })
  it('değişiklik yoksa, soru kısaysa ya da aciliyet geçersizse hata — boş iz yazılmaz', () => {
    assert.deepEqual(duzenlemeDogrula({ klinikSoru: satir.klinik_soru }, satir), { hata: 'Değişiklik yok.' })
    assert.deepEqual(duzenlemeDogrula({}, satir), { hata: 'Değişiklik yok.' })
    assert.ok('hata' in duzenlemeDogrula({ klinikSoru: 'KBB?' }, satir))
    assert.ok('hata' in duzenlemeDogrula({ aciliyet: 'cok-acil' }, satir))
  })
  it('çok satırlı istem (mektup biçimi) satır sonlarını korur', () => {
    const mektup = 'Sayın Meslektaşım,\n\nHastamız üç gündür kulak ağrısı ile başvurdu.\n\nSaygılarımla,'
    const d = duzenlemeDogrula({ klinikSoru: mektup }, satir)
    assert.ok(!('hata' in d) && d.guncelleme.klinik_soru === mektup)
  })
  it('yanıt özeti düzeltmesi: önceki özet varsa ve değiştiyse iz; ilk yanıt iz değildir', () => {
    assert.equal(yanitRevizyonu(null, 'İşitme kaybı saptanmadı.'), null)
    assert.equal(yanitRevizyonu('Aynı.', 'Aynı.'), null)
    assert.deepEqual(yanitRevizyonu('Eski özet.', 'Yeni özet.'), { alan: 'yanit_ozeti', onceki: 'Eski özet.', sonraki: 'Yeni özet.' })
  })
})
