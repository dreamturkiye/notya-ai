import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TURKISH_REFS } from '@/lib/asistan/turkishSpecialtyRefs'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import {
  KLINIK_TURKISH_REFS,
  KLINIK_SECONDARY_TEXTBOOKS,
  klinikTurkishRefs,
  klinikKaynakCumlesi,
} from './klinikTurkishRefs'

const TUS_SIZINTI = [
  'Türkiye Fiziksel Tıp ve Rehabilitasyon Derneği',
  'TFTRD',
  'FTR’m',
  'Türkiye Psikiyatri Derneği tedavi',
  'yeşil-turuncu reçete',
  'PHQ-9',
  'Türk Kulak Burun Boğaz ve Baş Boyun Cerrahisi Derneği klinik kılavuzları',
  'koklear implant',
  'TUS Derim',
  'yanık merkezi',
  'OR HIS',
  'Hedef Boy',
  'Neyzi',
]

describe('KLINIK_TURKISH_REFS — TR clinician golden stack', () => {
  it('10 dal × 5 TR kaynak; secondary her dalda var', () => {
    assert.equal(KLINIK_YENI_SLUGS.length, 10)
    for (const slug of KLINIK_YENI_SLUGS) {
      assert.equal(KLINIK_TURKISH_REFS[slug].length, 5, slug)
      assert.ok(KLINIK_SECONDARY_TEXTBOOKS[slug].length >= 2, slug)
      assert.ok(KLINIK_TURKISH_REFS[slug].every((r) => r.length > 20), slug)
    }
  })

  it('Doktor TURKISH_REFS Klinik slug taşımaz', () => {
    const keys = Object.keys(TURKISH_REFS)
    for (const slug of KLINIK_YENI_SLUGS) {
      assert.equal(keys.includes(slug), false, slug)
    }
    assert.ok(keys.includes('dermatoloji'))
    assert.ok(keys.includes('plastik-cerrahi'))
    assert.ok(keys.includes('fizik-tedavi'))
    assert.ok(keys.includes('psikiyatri'))
    assert.ok(keys.includes('kulak-burun-bogaz'))
  })

  it('müttefik / sızıntı: FTR, psikiyatri, KBB, Neyzi, TUS Derim birincil değil', () => {
    const hepsi = KLINIK_YENI_SLUGS.flatMap((s) => KLINIK_TURKISH_REFS[s]).join('\n')
    for (const yasak of TUS_SIZINTI) {
      assert.equal(hepsi.includes(yasak), false, yasak)
    }
    assert.ok(KLINIK_TURKISH_REFS.fizyoterapi.some((r) => r.includes('Türkiye Fizyoterapistler Derneği')))
    assert.ok(KLINIK_TURKISH_REFS['klinik-psikolog'].some((r) => r.includes('Türk Psikologlar Derneği')))
    assert.ok(KLINIK_TURKISH_REFS.odyoloji.some((r) => r.includes('Odyologlar')))
    assert.ok(KLINIK_TURKISH_REFS.ergoterapi.some((r) => r.includes('Ergoterapi Derneği')))
    assert.ok(KLINIK_TURKISH_REFS.diyetisyen.some((r) => r.includes('Türkiye Diyetisyenler Derneği')))
  })

  it('29.03.2025 yalnız müttefik 5 dalda birincil SB satırı', () => {
    for (const slug of ['fizyoterapi', 'klinik-psikolog', 'diyetisyen', 'ergoterapi', 'odyoloji'] as const) {
      assert.ok(KLINIK_TURKISH_REFS[slug][0].includes('29.03.2025'), slug)
    }
    for (const slug of ['sac-ekimi', 'estetik-cerrahi', 'medikal-estetik', 'klinik-dermatoloji', 'longevity'] as const) {
      assert.equal(KLINIK_TURKISH_REFS[slug][0].includes('29.03.2025'), false, slug)
    }
  })

  it('landing dermatoloji Klinik derm stack’ini alır; çıplak TUS çözülmez', () => {
    assert.deepEqual(klinikTurkishRefs('klinik-dermatoloji'), KLINIK_TURKISH_REFS['klinik-dermatoloji'])
    assert.deepEqual(klinikTurkishRefs('dermatoloji'), KLINIK_TURKISH_REFS['klinik-dermatoloji'])
    assert.equal(klinikKaynakCumlesi('Saç Ekimi').includes('TPRECD'), true)
    assert.equal(klinikTurkishRefs('kardiyoloji').length, 0)
    assert.equal(klinikTurkishRefs('plastik-cerrahi').length, 0)
  })
})
