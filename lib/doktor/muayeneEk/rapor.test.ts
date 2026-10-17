/** MUAYENE-EKLERI-01 — rapor blokları: kaynak ayrımı, kimlik sızmaması, onaylı aşı aktarımı. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { EK_BLOK_BASLIGI, asiListeleriniBirlestir, ekAiMetni, ekPromptBlogu, ekleriNumarala, onayliAsilariNotaCevir } from './rapor'
import type { EkSonuc } from './tipler'

const lab: EkSonuc = {
  tur: 'lab', durum: 'tamam', baslik: 'Hemogram', ozet: 'Hemoglobin referansın altında.',
  bulgular: [{ id: 'x', metin: 'Hb 11,2 g/dL, referans altı; demir eksikliği ile uyumlu olabilir.', kaynak: 'yorum', duzey: 'uyari' }],
  uyarilar: ['1 değerin okuması doğrulanmalı'], sinirlar: ['Tek ölçümle tanı konmaz.'],
  labDegerleri: [{ test: 'Hb', deger: '11,2', birim: 'g/dL', referans: '12–15.5', bayrak: 'L', dogrulanacak: false }],
  izinliSayilar: ['11.2', '12', '15.5'], surum: 'ek-v1',
}
const hata: EkSonuc = { tur: 'rontgen', durum: 'hata', baslik: '', ozet: '', bulgular: [], uyarilar: [], sinirlar: [], izinliSayilar: [], surum: 'ek-v1', hataNedeni: 'Zaman aşımı' }
const ekler = ekleriNumarala([
  { belgeId: 'b1', dosyaAdi: 'AhmetYilmaz_tahlil.pdf', sonuc: lab },
  { belgeId: 'b2', dosyaAdi: 'grafi.jpg', sonuc: hata },
])

describe('ekleri numaralama', () => {
  it('EK-n etiketleri ve bulgu kimlikleri', () => {
    assert.deepEqual(ekler.map((e) => e.etiket), ['EK-1', 'EK-2'])
    assert.equal(ekler[0].sonuc.bulgular[0].id, 'EK-1.1')
  })
})

describe('SOAP istem bloğu', () => {
  const b = ekPromptBlogu(ekler)
  it('başlık, kurallar ve etiketler var', () => {
    assert.ok(b.includes(EK_BLOK_BASLIGI))
    assert.ok(b.includes('KONUŞMADI'))
    assert.ok(b.includes('[EK-1]') && b.includes('[EK-1.1]'))
    assert.ok(b.includes('Hb: 11,2 g/dL, ref 12–15.5 ↓'))
  })
  it('DOSYA ADI (olası hasta kimliği) modele gitmez', () => {
    assert.ok(!/ahmet|yilmaz|\.pdf|\.jpg/i.test(b))
  })
  it('başarısız ek "değerlendirilemedi" olarak bildirilir, içerik uydurulmaz', () => {
    assert.ok(b.includes('[EK-2] Röntgen / görüntüleme: değerlendirilemedi.'))
  })
  it('boş ek listesi boş blok', () => assert.equal(ekPromptBlogu([]), ''))
  it('uzunluk sınırı', () => {
    const cok = ekleriNumarala(Array.from({ length: 12 }, (_, i) => ({ belgeId: `b${i}`, dosyaAdi: 'a', sonuc: { ...lab, ozet: 'u'.repeat(1500), bulgular: Array.from({ length: 12 }, () => ({ id: 'x', metin: 'm'.repeat(300), kaynak: 'yorum' as const, duzey: 'bilgi' as const })) } })))
    assert.ok(ekPromptBlogu(cok).length <= 9100)
  })
})

describe('ai_degerlendirme bloğu (doktora özel, belirlenimli)', () => {
  const m = ekAiMetni(ekler)
  it('doktorun sözü olmadığını söyler ve her bulguya kimlik verir', () => {
    assert.ok(m.includes('doktorun sözü değildir'))
    assert.ok(m.includes('• [EK-1.1]'))
  })
  it('kaynak dosya adı doktora görünür (kaynak bağlantısı)', () => assert.ok(m.includes('AhmetYilmaz_tahlil.pdf')))
  it('hata ve atlanan ek sessizce düşmez', () => {
    assert.ok(m.includes('Değerlendirilemedi (Zaman aşımı)'))
    const atlanan = ekleriNumarala([{ belgeId: 'b', dosyaAdi: 'x.pdf', sonuc: { ...hata, durum: 'atlandi' } }])
    assert.ok(ekAiMetni(atlanan).includes('Atlandı'))
  })
})

describe('onaylı aşıların nota aktarımı', () => {
  it('yalnız "bu muayenede" satırları; tarih boşsa muayene günü', () => {
    const l = onayliAsilariNotaCevir([{ belgeId: 'b', satirlar: [
      { asiAdi: 'KPA', dozNo: 2, kaynakTuru: 'bu_muayene', lotNo: 'A123' },
      { asiAdi: 'Hepatit B', dozNo: 1, uygulamaTarihi: '2024-01-05', kaynakTuru: 'karne' },
    ] }], '2026-10-16')
    assert.equal(l.length, 1)
    assert.equal(l[0].uygulama_tarihi, '2026-10-16')
    assert.equal(l[0].lot_no, 'A123')
    assert.equal(l[0].doz_no, 2)
  })
  it('onay yoksa liste boş', () => assert.deepEqual(onayliAsilariNotaCevir(undefined, '2026-10-16'), []))
  it('aynı aşı iki kez eklenmez', () => {
    const a = onayliAsilariNotaCevir([{ belgeId: 'b', satirlar: [{ asiAdi: 'KPA', dozNo: 2, kaynakTuru: 'bu_muayene' }] }], '2026-10-16')
    assert.equal(asiListeleriniBirlestir(a, a).length, 1)
  })
  it('adı boş satır atılır', () => {
    assert.deepEqual(onayliAsilariNotaCevir([{ belgeId: 'b', satirlar: [{ asiAdi: '', kaynakTuru: 'bu_muayene' }] }], '2026-10-16'), [])
  })
})
