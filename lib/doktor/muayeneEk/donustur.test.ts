/** MUAYENE-EKLERI-01 — motor çıktısı → EkSonuc: değer uydurma yok, görüntüleme yalnız gözlem, aşı onaysız yazılmaz. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { asiSonucu, atlandiSonucu, genelSonucu, GORUNTU_SINIRI, goruntuSonucu, hataSonucu, karneSatirlariniCevir, labSonucu } from './donustur'
import type { LabSatir } from '@/core/lab/trend'
import type { LabRapor } from '@/core/lab/yorum'
import type { BelgeRaporu } from '@/core/belgeler/types'

const satir = (o: Partial<LabSatir>): LabSatir => ({
  raw_name: 'Hemoglobin', canonical_key: 'Hb', loinc: null, value_num: 11.2, value_text: null, unit: 'g/dL', kanonik_deger: 11.2, kanonik_birim: 'g/dL',
  ref_low: 12, ref_high: 15.5, flag: 'L', kritik: false, kritik_neden: null, prior_value: null, prior_date: null, prior_series: [], delta: null, delta_pct: null,
  trend: 'no_prior', page: 1, dogrulanacak: false, dogrulama_notu: null, doctor_corrected: false, ...o,
})
const rapor = (o: Partial<LabRapor>): LabRapor => ({
  ozet: 'Hemoglobin 11,2 g/dL ile referansın altında.', kritik: [], yeni_bozulanlar: [], duzelenler: [], kronik: [],
  tanilar: [{ ad: 'Demir eksikliği anemisi', icd10: null, guven_pct: 55, guven_bant: 'orta', destek: ['Hb düşük'] }],
  klinik_iliski: 'Ferritin 8 ng/mL olduğundan demir eksikliği düşündürür.', oneri: 'Ferritin ile birlikte değerlendirin.', recete_ipucu: null, sinirlar: ['Tek ölçüm.'], acil_bayrak: false, ...o,
})

describe('lab → EkSonuc (değer uydurma yok)', () => {
  it('belgeden gelen değerler aynen; modelin uydurduğu Ferritin 8 cümlesi çıkarılır', () => {
    const s = labSonucu({ satirlar: [satir({})], rapor: rapor({}), labAdi: 'X Lab', numuneTarihi: '2026-10-12' })
    assert.equal(s.durum, 'tamam')
    assert.equal(s.labDegerleri![0].deger, '11.2')
    assert.ok(!s.bulgular.some((x) => /Ferritin 8/.test(x.metin)), 'uydurma değer cümlesi kaldı')
    assert.ok(s.uyarilar.some((u) => /çıkarıldı/.test(u)))
    assert.ok(s.baslik.includes('12.10.2026'))
  })
  it('sistem bulgusu kaynak=belge, model yorumu kaynak=yorum', () => {
    const s = labSonucu({ satirlar: [satir({})], rapor: rapor({}) })
    assert.ok(s.bulgular.some((x) => x.kaynak === 'belge' && /Hemoglobin.*düşük/.test(x.metin)))
    assert.ok(s.bulgular.some((x) => x.kaynak === 'yorum' && /uyumlu olabilir/.test(x.metin)))
  })
  it('kritik değer kritik düzeyde ve acil uyarısı', () => {
    const s = labSonucu({ satirlar: [satir({ flag: 'critical', kritik: true, kritik_neden: 'Hb < 7', value_num: 6.5 })], rapor: rapor({ acil_bayrak: true, ozet: 'Hb 6,5', klinik_iliski: '', oneri: '', tanilar: [] }) })
    assert.ok(s.bulgular.some((x) => x.duzey === 'kritik'))
    assert.ok(s.uyarilar[0].startsWith('Acil bayrağı'))
  })
  it('model yoksa (yorum başarısız) değerler yine de döner, sessiz düşme yok', () => {
    const s = labSonucu({ satirlar: [satir({})], rapor: null })
    assert.equal(s.durum, 'tamam')
    assert.equal(s.labDegerleri!.length, 1)
    assert.ok(/Klinik yorum üretilemedi/.test(s.ozet))
    assert.ok(s.uyarilar.some((u) => /Yeniden değerlendir/.test(u)))
  })
  it('basılı referansı olmayan değer için aralık uydurulmaz ve uyarılır', () => {
    const s = labSonucu({ satirlar: [satir({ ref_low: null, ref_high: null, flag: 'unknown' })], rapor: null })
    assert.equal(s.labDegerleri![0].referans, null)
    assert.ok(s.uyarilar.some((u) => /referans aralığı yok/.test(u)))
  })
  it('belirsiz okunan değer işaretlenir', () => {
    const s = labSonucu({ satirlar: [satir({ dogrulanacak: true })], rapor: null })
    assert.equal(s.labDegerleri![0].dogrulanacak, true)
    assert.ok(s.uyarilar.some((u) => /okuması belirsiz/.test(u)))
  })
  it('kimlik uyarısı en başa konur', () => {
    assert.equal(labSonucu({ satirlar: [], rapor: null, kimlikUyarisi: 'Kimlik eşleşmiyor' }).uyarilar[0], 'Kimlik eşleşmiyor')
  })
  it('boş tablo → okunamadı uyarısı', () => {
    assert.ok(labSonucu({ satirlar: [], rapor: null }).uyarilar.some((u) => /çıkarılamadı/.test(u)))
  })
})

const br = (o: Partial<BelgeRaporu> = {}): BelgeRaporu => ({
  modalite: 'Akciğer grafisi', kalite: 'iyi', ozet: 'Sağ alt zonda opasite artışı izlenmektedir.', bulgular: ['Sağ alt zonda hafif opasite'],
  tanilar: [{ ad: 'Pnömoni ile uyumlu görünüm', guven_pct: 60, guven_bant: 'orta', destek: [], karsi: [] }], acil_bayrak: false, oneri: 'Klinikle korelasyon', sinirlar: ['Tek pozisyon'],
  hekim_tanisi: [], engines_used: ['claude-vision'], ...o,
})

describe('görüntüleme → yalnız gözlem', () => {
  it('tanı çekinceli, sınır ve ölçüm uyarısı var', () => {
    const s = goruntuSonucu('rontgen', br())
    assert.ok(s.bulgular.some((x) => /uyumlu olabilecek durum.*kesin tanı değildir/.test(x.metin)))
    assert.equal(s.sinirlar[0], GORUNTU_SINIRI)
    assert.ok(s.uyarilar.some((u) => /ölçüm ve sayılar doğrulanamaz/.test(u)))
    assert.ok(s.bulgular.every((x) => x.kaynak === 'yorum'))
  })
  it('düşük kalite uyarılır; acil bayrağı yansır', () => {
    const s = goruntuSonucu('ekg', br({ kalite: 'dusuk', acil_bayrak: true }))
    assert.ok(s.uyarilar.some((u) => /kalitesi düşük/.test(u)))
    assert.ok(s.uyarilar.some((u) => /Acil bayrağı/.test(u)))
  })
})

describe('aşı → hekim onayına kadar yazma yok', () => {
  const bugun = '2026-10-16'
  it('karne satırları takvimle eşleşir, geçmiş kayıt olarak işaretlenir', () => {
    const [a] = karneSatirlariniCevir([{ anahtar: 'k1', asiAdi: 'KPA', dozNo: 2, uygulamaTarihi: '2025-01-10', okunamadi: false, okunamadiNedeni: null, hamMetin: null }], 'karne', bugun)
    assert.equal(a.kaynakTuru, 'karne')
    assert.ok(a.eslesme.length > 0)
  })
  it('okunamayan satır tahmin edilmez ve işaretli kalır', () => {
    const sonuc = asiSonucu({ bugunIso: bugun, satirlar: karneSatirlariniCevir([{ anahtar: 'k1', asiAdi: '', dozNo: null, uygulamaTarihi: null, okunamadi: true, okunamadiNedeni: 'aşı adı okunamadı', hamMetin: 'x' }], 'karne', bugun) })
    assert.equal(sonuc.asiSatirlari![0].okunamadi, true)
    assert.equal(sonuc.asiSatirlari![0].uygulamaTarihi, null)
    assert.ok(/onaylamadan yazılmaz/.test(sonuc.ozet))
  })
  it('süresi geçmiş lot uyarılır', () => {
    const sonuc = asiSonucu({ bugunIso: bugun, satirlar: [{ anahtar: 'a1', asiAdi: 'Hexaxim', dozNo: null, uygulamaTarihi: null, lotNo: 'L1', skt: '2026-01-01', okunamadi: false, neden: null, hamMetin: null, eslesme: 'SB takvimi', kaynakTuru: 'bu_muayene' }] })
    assert.ok(sonuc.uyarilar.some((u) => /son kullanma tarihi.*geçmiş/.test(u)))
  })
  it('gelecek tarihli satır nedenle işaretlenir', () => {
    const [a] = karneSatirlariniCevir([{ anahtar: 'k1', asiAdi: 'KPA', dozNo: 1, uygulamaTarihi: '2027-01-01', okunamadi: false, okunamadiNedeni: null, hamMetin: null }], 'karne', bugun)
    assert.equal(a.neden, 'gelecekte bir tarih')
  })
})

describe('genel belge / hata / atlanan', () => {
  it('genel belge çıkarımı belgeden; ilaçlar "belgede geçen" olarak', () => {
    const s = genelSonucu('epikriz', { belge_turu: 'Epikriz', tarih: '01.10.2026', ozet: 'Bronşiolit nedeniyle 3 gün yatış.', onemli_bulgular: ['SpO2 94'], ilaclar: ['Salbutamol'], takip: ['1 hafta sonra kontrol'], okunamayan: [] })
    assert.ok(s.bulgular.some((x) => /Belgede geçen ilaç: Salbutamol/.test(x.metin)))
    assert.ok(s.bulgular.every((x) => x.kaynak === 'belge'))
  })
  it('hata ve atlanan durumlar içerik taşımaz', () => {
    const h = hataSonucu('lab', 'Zaman aşımı')
    assert.equal(h.durum, 'hata'); assert.equal(h.bulgular.length, 0); assert.equal(h.hataNedeni, 'Zaman aşımı')
    assert.equal(atlandiSonucu('foto', 'x').durum, 'atlandi')
  })
})
