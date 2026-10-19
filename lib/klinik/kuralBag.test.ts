import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import { kanunSatiriMi, kuralBagla, kuralDosyaSatirlari, kuralVitrin, kuralYasaklari, ULUSAL_TAKVIM_YOK } from '@/lib/klinik/kuralBag'

const IZ = {
  'sac-ekimi': 'Hairline',
  'estetik-cerrahi': 'Yaram',
  'medikal-estetik': 'Ünite uydurma',
  'klinik-dermatoloji': 'TUS Derim',
  longevity: 'NAD+',
  fizyoterapi: 'FTR enjeksiyon',
  'klinik-psikolog': 'DSM',
  diyetisyen: 'insülin',
  ergoterapi: 'Neyzi',
  odyoloji: 'KBB motor',
} as const

describe('kural bağı', () => {
  it('on dal kendi mevzuatına bağlanır; yabancı branş null', () => {
    const kaynak = fs.readFileSync(path.join(process.cwd(), 'lib/klinik/kuralBag.ts'), 'utf8')
    assert.match(kaynak, /klinikMevzuat/)
    assert.doesNotMatch(kaynak, /6698/)
    for (const slug of KLINIK_YENI_SLUGS) {
      const bag = kuralBagla(slug)
      assert.ok(bag && bag.length > 8, slug)
      assert.ok(bag!.some((k) => k.dogrulandi), slug)
      assert.ok(bag!.every((k) => k.slug === slug), slug)
      const yasak = kuralYasaklari(slug).join(' ')
      assert.match(yasak, new RegExp(IZ[slug]))
      for (const diger of KLINIK_YENI_SLUGS) {
        if (diger === slug) continue
        assert.equal(yasak.includes(IZ[diger]), false, `${diger} yasak → ${slug}`)
      }
      const dosya = kuralDosyaSatirlari(slug).map((k) => k.metin).join(' ')
      assert.doesNotMatch(dosya, /veli|yasal temsilci/i)
      assert.ok(kuralDosyaSatirlari(slug).every((k) => k.dogrulandi), slug)
    }
    for (const yaban of ['pediatri', 'kardiyoloji', 'dermatoloji', 'fizik-tedavi', 'psikiyatri', 'kulak-burun-bogaz', 'plastik-cerrahi', '']) {
      assert.equal(kuralBagla(yaban), null, yaban)
      assert.deepEqual(kuralDosyaSatirlari(yaban), [])
    }
  })

  it('resmi atıf doğrulanır; ürün takvimi doğrulanmaz', () => {
    assert.equal(kanunSatiriMi('Hasta Hakları Yönetmeliği m.26 iki nüsha'), true)
    assert.equal(kanunSatiriMi('29.03.2025 md.16: hekim tanısı'), true)
    assert.equal(kanunSatiriMi('Onam tarihi, greft bandı, yıkama 1/3/10/14 vadeleri'), false)
    const sac = kuralBagla('sac-ekimi')!
    const takvim = sac.find((k) => /yıkama 1\/3\/10\/14/.test(k.metin))
    assert.ok(takvim)
    assert.equal(takvim!.dogrulandi, false)
    assert.equal(sac.some((k) => /Neyzi|fluence|ICF|GYA/.test(k.metin)), false)
    assert.match(kuralYasaklari('ergoterapi').join(' '), /Neyzi/)
    assert.match(kuralBagla('odyoloji')!.map((k) => k.metin).join(' '), /md\.11/)
    assert.equal(kuralBagla('odyoloji')!.some((k) => /greft/.test(k.metin)), false)
  })

  it('saç 40176 bağlanır; 16 m² ve 72 saat başka branşa sızmaz', () => {
    assert.doesNotMatch(ULUSAL_TAKVIM_YOK, /Neyzi|aşı takvimi/i)
    const sac = kuralBagla('sac-ekimi')!
    const oda = sac.find((k) => /16 m²/.test(k.metin))
    const saat = sac.find((k) => /72 saat/.test(k.metin))
    assert.ok(oda && oda.dogrulandi)
    assert.ok(saat && saat.dogrulandi)
    assert.equal(kuralVitrin('sac-ekimi').some((k) => /m²/.test(k.metin)), false)
    assert.match(kuralVitrin('sac-ekimi').map((k) => k.metin).join(' '), /72 saat/)
    assert.match(kuralDosyaSatirlari('sac-ekimi').map((k) => k.metin).join(' '), /72 saat/)
    for (const yaban of ['pediatri', 'kardiyoloji', 'dermatoloji', 'fizik-tedavi', 'estetik-cerrahi', 'klinik-dermatoloji', 'fizyoterapi', 'odyoloji', 'ergoterapi']) {
      assert.equal(kuralVitrin(yaban).some((k) => /16 m²|72 saat|40176/.test(k.metin)), false, yaban)
    }
    assert.equal(kuralVitrin('odyoloji').some((k) => /m²/.test(k.metin)), false)
    assert.equal(kuralVitrin('fizyoterapi').some((k) => /m²/.test(k.metin)), false)
    assert.match(kuralVitrin('fizyoterapi').map((k) => k.metin).join(' '), /md\.16/)
  })
})
