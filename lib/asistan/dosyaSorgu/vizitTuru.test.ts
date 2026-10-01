/**
 * NOTYA-DOSYA-SORU-TUR-01 — regresyon: hekim belirli bir vizit TÜRÜ / yaş-dönümü adıyla sorduğunda (örn. "6
 * aylık sağlam çocuk muayenesi") doğru vizit dönsün, en son (alakasız) vizite SESSİZCE düşmesin. Gerçek Dr.
 * Gökhan paneli (Umutcan Türkoğlu) production verisindeki gerçek not biçimiyle ("N aylık ... rutin sağlam
 * çocuk kontrolü / izlemi") birebir, sentetik dosya üzerinden.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kanitBlogu } from './kanit'
import { olaylariKur, hastaKur, type HamDosya } from '@/lib/doktor/dosyaOlaylari'

const BUGUN = '2026-01-01'

const HAM: HamDosya = {
  hasta: { ad: 'QA Test Çocuk VIZIT-TUR', dogumIso: '2024-05-15', cinsiyet: 'Erkek' },
  brans: 'Pediatri',
  vizitler: [
    { id: 'v-2ay', tarih: '2024-07-15', subjektif: '2 aylık erkek bebeğin rutin sağlam çocuk kontrolü.', tani: '2 aylık sağlam çocuk — rutin kontrol', plan: 'Takip planlanmadı.' },
    { id: 'v-6ay', tarih: '2024-11-15', subjektif: '6 aylık erkek bebeğin rutin sağlam çocuk kontrolü.', tani: '6 aylık sağlam çocuk izlemi', plan: 'Demir profilaksisi önerildi.' },
    { id: 'v-9ay', tarih: '2025-02-15', subjektif: '9 aylık rutin sağlam çocuk izlemi.', tani: '9 aylık sağlam çocuk izlemi', plan: 'Tamamlayıcı gıdaya geçildi.' },
    { id: 'v-akut', tarih: '2025-09-25', subjektif: '3-4 gündür burun akıntısı ve hafif öksürük; dün gece ateş ve sağ kulak ağrısı.', tani: 'Sağ akut otitis media', plan: 'Amoksisilin 10 gün.' },
  ],
}

function dosya() {
  const olaylar = olaylariKur(HAM, BUGUN)
  const hasta = hastaKur(HAM, BUGUN)
  return { olaylar, hasta }
}

describe('NOTYA-DOSYA-SORU-TUR-01 — vizit türü / yaş-dönümü filtreli özet', () => {
  it('"6 aylık sağlam çocuk muayenesi" → 6 aylık vizit döner, en son (akut) vizit DEĞİL', () => {
    const { olaylar, hasta } = dosya()
    const blok = kanitBlogu('ozet', olaylar, hasta, { mesaj: 'Umutcan\'ın 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın?' })
    assert.match(blok, /6 aylık sağlam çocuk izlemi/)
    assert.doesNotMatch(blok, /akut otitis media/i)
  })

  it('"9 aylık sağlam çocuk izlemi" → 9 aylık vizit döner', () => {
    const { olaylar, hasta } = dosya()
    const blok = kanitBlogu('ozet', olaylar, hasta, { mesaj: '9 aylık sağlam çocuk izlemini özetler misin?' })
    assert.match(blok, /9 aylık rutin sağlam çocuk izlemi/)
    assert.doesNotMatch(blok, /akut otitis media/i)
  })

  it('eşleşmeyen yaş-dönümü (15 aylık yok) → açık "bulamadım", SESSİZCE en son vizite düşmez', () => {
    const { olaylar, hasta } = dosya()
    const blok = kanitBlogu('ozet', olaylar, hasta, { mesaj: '15 aylık sağlam çocuk kontrolünü özetler misin?' })
    assert.match(blok, /bulamadım/)
    assert.doesNotMatch(blok, /akut otitis media/i)
  })

  it('tür / yaş belirtilmeyen genel "özet" sorusu → davranış DEĞİŞMEDİ (tüm dosya özeti)', () => {
    const { olaylar, hasta } = dosya()
    const blok = kanitBlogu('ozet', olaylar, hasta, { mesaj: 'Genel bir özet alabilir miyim?' })
    assert.match(blok, /VİZİTLER: 4 onaylı vizit/)
  })
})
