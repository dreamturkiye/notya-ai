import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import { doktorAraclariListesi } from '@/lib/doktor/doktorAraclari'
import { klinikAraciDalaUygun, klinikAraclariListesi } from '@/lib/klinik/klinikAraclari'
import { OZEL_ARACLAR, portalSatirlari } from '@/lib/klinik/ozelAracCalistir'
import { ozelAracDogrula } from '@/lib/klinik/ozelAracDogrula'
import { kohortAcilBirlestir } from '@/lib/klinik/kohortAcil'
import { ozelSonucDuzeni } from '@/lib/klinik/ozelSonucDuzeni'
import { STUDYO_KOPYA } from '@/lib/klinik/ozelStudyoKopya'

const CEKIRDEK = new Set(['/ozel-branslar/hasta-portali', '/ozel-branslar/kayit-kvkk', '/ozel-branslar/enabiz'])

describe('Özel Branş araçları — her dalın kendi motoru', () => {
  it('40 araç, dal başına 4, mutlu yol ve ret', () => {
    assert.equal(OZEL_ARACLAR.length, 40)
    assert.deepEqual(ozelAracDogrula(), [])
    for (const slug of KLINIK_YENI_SLUGS) {
      assert.equal(OZEL_ARACLAR.filter((a) => a.slug === slug).length, 4, slug)
      assert.deepEqual(ozelAracDogrula(slug), [], slug)
    }
  })

  it('portal satırı greft, doz, tanı, dB ve kcal taşımaz', () => {
    const s = portalSatirlari([
      { iso: '2026-10-20', ad: '3200 greft' },
      { iso: '2026-10-21', ad: '2 mL doz' },
      { iso: '2026-10-22', ad: 'tanı notu' },
      { iso: '2026-10-23', ad: '40 dB' },
      { iso: '2026-10-24', ad: '1800 kcal' },
      { iso: '2026-10-25', ad: 'Kontrol' },
    ], '2026-10-18')
    assert.deepEqual(s.map((x) => x.ad), ['Kontrol · 2026-10-25'])
  })

  it('yabancı branş bu araçları görmez; sahip branş görür', () => {
    for (const yaban of ['kardiyoloji', 'pediatri', 'dermatoloji', 'fizik-tedavi', 'psikiyatri', 'kulak-burun-bogaz', 'plastik-cerrahi'] as const) {
      assert.equal(doktorAraclariListesi(yaban).some((a) => a.route.startsWith('/ozel-branslar/')), false, yaban)
      assert.equal(klinikAraciDalaUygun('/ozel-branslar/sac-cizgi', yaban), false, yaban)
    }
    assert.equal(klinikAraciDalaUygun('/ozel-branslar/sac-cizgi', 'sac-ekimi'), true)
    assert.equal(klinikAraciDalaUygun('/ozel-branslar/sac-cizgi', 'estetik-cerrahi'), false)
    assert.equal(klinikAraciDalaUygun('/ozel-branslar/estetik-vaskuler', 'medikal-estetik'), true)
    assert.equal(klinikAraciDalaUygun('/ozel-branslar/estetik-vaskuler', 'klinik-dermatoloji'), false)
    for (const slug of KLINIK_YENI_SLUGS) {
      const liste = klinikAraclariListesi(slug)
      const ozel = liste.filter((a) => !CEKIRDEK.has(a.route) && !a.route.endsWith('-kohort'))
      assert.ok(ozel.length >= 4, `${slug} ${ozel.length}`)
      assert.ok(ozel.every((a) => a.dallar.length === 1 && a.dallar[0] === slug), slug)
      for (const diger of KLINIK_YENI_SLUGS) {
        if (diger === slug) continue
        assert.equal(liste.some((a) => a.route === `/ozel-branslar/${OZEL_ARACLAR.find((x) => x.slug === diger)!.route.split('/').pop()}`), false, `${diger} → ${slug}`)
      }
    }
  })

  it('plan rotası hasta sahipliğini sorar', () => {
    const kaynak = fs.readFileSync(path.join(process.cwd(), 'app/api/ozel-brans/plan/route.ts'), 'utf8')
    assert.match(kaynak, /hastaSahibiMi/)
    assert.match(kaynak, /klinikSlugCoz/)
    assert.doesNotMatch(kaynak, /status: 403/)
  })

  it('her aracın sonuç düzeni var; her dal en az iki düzen kullanır', () => {
    const kopya = new Set<string>()
    for (const slug of KLINIK_YENI_SLUGS) {
      const duzen = new Set(OZEL_ARACLAR.filter((a) => a.slug === slug).map((a) => ozelSonucDuzeni(a.route)))
      assert.ok(duzen.size >= 2, slug)
      assert.equal(duzen.has(null), false, slug)
      assert.ok(STUDYO_KOPYA[slug].length > 20, slug)
      kopya.add(STUDYO_KOPYA[slug])
    }
    assert.equal(kopya.size, 10)
    for (const a of OZEL_ARACLAR) assert.ok(ozelSonucDuzeni(a.route), a.route)
    const tuvaller = new Set<string>()
    for (const slug of KLINIK_YENI_SLUGS) {
      const dosya = fs.readFileSync(path.join(process.cwd(), 'specialties', slug, 'ui', 'Tuval.tsx'), 'utf8')
      assert.match(dosya, new RegExp(`data-tuval="${slug}"`), slug)
      tuvaller.add(dosya)
    }
    assert.equal(tuvaller.size, 10)
  })

  it('kohort, sunucu acil bandını 112 satırına alır ve çiftlemez', () => {
    const once = kohortAcilBirlestir(
      [{ patientId: 'a', ad: 'A', durum: 'gecikti', ozet: 'vade' }],
      [{ patient_id: 'b', acil: '112 bandı' }, { patient_id: 'a', acil: 'ikinci' }, { patient_id: '', acil: 'yok' }],
      new Map([['b', 'B']]),
    )
    assert.equal(once.filter((s) => s.durum === '112').length, 2)
    assert.equal(once.find((s) => s.patientId === 'b')?.ad, 'B')
    const tekrar = kohortAcilBirlestir(once, [{ patient_id: 'b', acil: 'yine' }], new Map())
    assert.equal(tekrar.filter((s) => s.patientId === 'b' && s.durum === '112').length, 1)
  })
})
