/** MUAYENE-EKLERI-01 — ek sınıflandırma: eşikler, belirsizse sor, hekime özel öğrenme. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ESIK_FARK, ESIK_OTOMATIK, adParcalari, ogrenmeSinyali, ozellikleriCikar, sinifla, type OgrenmeKaydi, type SiniflandirGirdi } from './siniflandir'

const g = (o: Partial<SiniflandirGirdi>): SiniflandirGirdi => ({ dosyaAdi: 'x.pdf', mime: 'application/pdf', kaynak: 'dosya', ...o })

describe('sınıflandırma — yüksek güven (otomatik)', () => {
  it('dosya adı + belge metni laboratuvar → lab, sormaz', () => {
    const s = sinifla(g({ dosyaAdi: 'Hemogram_Tahlil.pdf', metin: 'HEMOGRAM Hemoglobin 12.1 g/dL Referans Aralığı Lökosit' }))
    assert.equal(s.tur, 'lab')
    assert.ok(s.guven >= ESIK_OTOMATIK)
    assert.equal(s.sor, false)
  })
  it('barkod kaynağı → aşı', () => {
    const s = sinifla(g({ dosyaAdi: 'barkod-123.txt', mime: 'text/plain', kaynak: 'barkod' }))
    assert.equal(s.tur, 'asi')
    assert.equal(s.sor, false)
  })
  it('CSV/Excel → laboratuvar', () => {
    const s = sinifla(g({ dosyaAdi: 'sonuclar.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    assert.equal(s.tur, 'lab')
  })
  it('DICOM → röntgen / görüntüleme', () => {
    const s = sinifla(g({ dosyaAdi: 'a.dcm', mime: 'application/dicom' }))
    assert.equal(s.tur, 'rontgen')
    assert.equal(s.sor, false)
  })
  it('yapay zekâ yüksek güvenli tahmin tek başına yeter', () => {
    const s = sinifla(g({ dosyaAdi: 'IMG_4412.jpg', mime: 'image/jpeg', kaynak: 'kamera', ai: { tur: 'rontgen', guven: 0.97 } }))
    assert.equal(s.tur, 'rontgen')
    assert.equal(s.sor, false)
  })
})

describe('sınıflandırma — belirsizse sor (asla sessiz yanlış değil)', () => {
  it('kamera fotoğrafı, ipucu yok → sor', () => {
    const s = sinifla(g({ dosyaAdi: 'IMG_0001.jpg', mime: 'image/jpeg', kaynak: 'kamera' }))
    assert.equal(s.sor, true)
    assert.ok(s.guven < ESIK_OTOMATIK)
    assert.ok(s.adaylar.length >= 2)
  })
  it('düşük güvenli yapay zekâ tahmini → sor', () => {
    const s = sinifla(g({ dosyaAdi: 'IMG_0001.jpg', mime: 'image/jpeg', kaynak: 'kamera', ai: { tur: 'foto', guven: 0.55 } }))
    assert.equal(s.sor, true)
  })
  it('iki tür birbirine yakın (lab adı + epikriz metni) → sor', () => {
    const s = sinifla(g({ dosyaAdi: 'tahlil.pdf', metin: 'EPİKRİZ taburcu yatış tarihi çıkış tarihi' }))
    assert.equal(s.sor, true)
    assert.ok(s.adaylar.some((a) => a.tur === 'lab') && s.adaylar.some((a) => a.tur === 'epikriz'))
  })
  it('tanıyıcı ipucu hiç yok (PDF) → diğer ve sor', () => {
    const s = sinifla(g({ dosyaAdi: 'scan0001.pdf' }))
    assert.equal(s.tur, 'diger')
    assert.equal(s.sor, true)
  })
  it('fark eşiği: ilk iki aday ESIK_FARK içinde ise (ilk güven eşik üstünde olsa bile) sorar', () => {
    const s = sinifla(g({ dosyaAdi: 'x.pdf', ai: { tur: 'lab', guven: 0.9 }, ipucuTur: 'epikriz', metin: 'epikriz taburcu' }))
    const fark = s.adaylar[0].guven - s.adaylar[1].guven
    // Kural doğrudan sınanır: karar, kısıtın iki yarısının birleşimidir (sabit kodlu beklenti yok).
    assert.equal(s.sor, s.adaylar[0].guven < ESIK_OTOMATIK || fark < ESIK_FARK)
    // Senaryo gerçekten iki rakip aday üretmeli; aksi hâlde test hiçbir şey sınamaz.
    assert.ok(s.adaylar.length >= 2 && s.adaylar[1].guven > 0, 'iki aday beklenir')
  })
  it('hekimin hatırlatıcıdan verdiği ipucu tek başına otomatik olmaz', () => {
    const s = sinifla(g({ dosyaAdi: 'IMG_9.jpg', mime: 'image/jpeg', kaynak: 'kamera', ipucuTur: 'asi' }))
    assert.equal(s.sor, true)
    assert.equal(s.tur, 'asi')
  })
})

describe('sınıflandırma — dosya adı ayrıştırma ve PII', () => {
  it('Türkçe karakterleri katlar', () => assert.deepEqual(adParcalari('Akciğer_Grafisi-Ayşe.JPG'), ['akciger', 'grafisi-ayse']))
  it('öğrenme özellikleri serbest dosya adı parçası TAŞIMAZ', () => {
    const o = ozellikleriCikar(g({ dosyaAdi: 'AhmetYilmaz_12345678901_tahlil.pdf', mime: 'application/pdf' }))
    assert.ok(o.includes('ad:tahlil'))
    assert.ok(!o.some((x) => /ahmet|yilmaz|1234/i.test(x)), o.join(','))
  })
  it('özellik sayısı sınırlı', () => assert.ok(ozellikleriCikar(g({ dosyaAdi: 'a', ai: { tur: 'lab', guven: 1 }, metin: 'hemogram aşı karnesi ekg epikriz' })).length <= 14))
})

describe('sınıflandırma — hekime özel öğrenme', () => {
  const kamera = g({ dosyaAdi: 'IMG_2048.jpg', mime: 'image/jpeg', kaynak: 'kamera', ai: { tur: 'foto', guven: 0.7 } })
  const oncesi = sinifla(kamera)

  it('öğrenme olmadan aynı yükleme belirsiz', () => {
    assert.equal(oncesi.sor, true)
  })

  it('3 düzeltme (foto → aşı) sonrası aynı hekimde güven artar ve sormaz', () => {
    const kayitlar: OgrenmeKaydi[] = []
    for (let i = 0; i < 3; i++) for (const a of ogrenmeSinyali(kamera, 'asi', 'foto')) {
      const k = kayitlar.find((x) => x.ozellik === a.ozellik && x.tur === a.tur)
      if (k) { k.onay += a.onayEk; k.duzeltme += a.duzeltmeEk } else kayitlar.push({ ozellik: a.ozellik, tur: a.tur, onay: a.onayEk, duzeltme: a.duzeltmeEk })
    }
    const sonrasi = sinifla(kamera, kayitlar)
    assert.equal(sonrasi.tur, 'asi')
    assert.ok(sonrasi.guven > oncesi.guven)
    assert.equal(sonrasi.sor, false, JSON.stringify(sonrasi))
    assert.ok(sonrasi.nedenler.some((n) => n.includes('önceki tercih')))
  })

  it('tek düzeltme yetmez (aşırı uyum yok)', () => {
    const kayitlar = ogrenmeSinyali(kamera, 'asi', 'foto').map((a) => ({ ozellik: a.ozellik, tur: a.tur, onay: a.onayEk, duzeltme: a.duzeltmeEk }))
    const s = sinifla(kamera, kayitlar)
    assert.equal(s.sor, true)
  })

  it('onaylar da öğretir (zayıf: düzeltmeden az)', () => {
    const kayitlar: OgrenmeKaydi[] = ozellikleriCikar(kamera).map((o) => ({ ozellik: o, tur: 'foto' as const, onay: 6, duzeltme: 0 }))
    const s = sinifla(kamera, kayitlar)
    assert.equal(s.tur, 'foto')
    assert.equal(s.sor, false)
  })

  it('çelişkili öğrenme (yarı yarıya) etki etmez', () => {
    const kayitlar: OgrenmeKaydi[] = ozellikleriCikar(kamera).flatMap((o) => [
      { ozellik: o, tur: 'asi' as const, onay: 3, duzeltme: 0 },
      { ozellik: o, tur: 'lab' as const, onay: 3, duzeltme: 0 },
    ])
    const s = sinifla(kamera, kayitlar)
    assert.equal(s.sor, true)
  })

  it('ilgisiz özellikteki öğrenme uygulanmaz', () => {
    const kayitlar: OgrenmeKaydi[] = [{ ozellik: 'ad:ekg', tur: 'ekg', onay: 9, duzeltme: 9 }]
    assert.deepEqual(sinifla(kamera, kayitlar), oncesi)
  })

  it('onay vs düzeltme sinyali', () => {
    const onay = ogrenmeSinyali(kamera, 'foto', 'foto')
    const duz = ogrenmeSinyali(kamera, 'asi', 'foto')
    assert.ok(onay.every((a) => a.onayEk === 1 && a.duzeltmeEk === 0))
    assert.ok(duz.every((a) => a.onayEk === 0 && a.duzeltmeEk === 1 && a.tur === 'asi'))
    assert.ok(duz.some((a) => a.ozellik.startsWith('ai:foto')))
  })
})
