/**
 * KAYNAK-BIRLESTIRME-ESC (2026-11-26) — fix for the 2026-11-24 regression ("GO 2"): the registry stack REPLACED the richer
 * static TR stacks for every branş. Now merged: registry (numbered, edition-aware, hidden "k" numbers) + every static item the
 * registry does not name with a confirmed edition. Plus the current ESC guideline set in the registry and the ESC citation lock.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  PROTOKOL_BELGELERI, TUM_BRANSLAR, belgeBul, birlesikKaynakYigini, bransDogrulanmisKaynaklar, kapsanmayanParcalar,
  kaynakNumaralariniCoz, takipHedefleri, turkKaynakYigini, kaynakCipleri, type BransKodu,
} from './index'
import { ESC_BELGELERI, ESC_LISTESI } from './uluslararasi'
import { TURKISH_REFS } from '../../asistan/turkishSpecialtyRefs'
import { KLINIK_TURKISH_REFS, klinikKaynakCumlesi } from '../../klinik/klinikTurkishRefs'
import { PERSONAS, turkKaynakListesi } from '../../asistan/personaEngine'
import { protokolKaynakTemizle } from '../../doktor/kaynakKilidi'

const KOK = join(__dirname, '..', '..', '..')
const statik = (b: BransKodu): string[] => (TURKISH_REFS as Record<string, string[]>)[b] || (KLINIK_TURKISH_REFS as Record<string, string[]>)[b]
const parcalar = (s: string) => s.split(';').map((p) => p.trim()).filter(Boolean)

describe('merge, never replace — all 40 branşlar', () => {
  test('registry lines first (numbered part = registry ids), then the static extras', () => {
    for (const b of TUM_BRANSLAR) {
      const y = birlesikKaynakYigini(b, statik(b))
      const kayit = turkKaynakYigini(b)
      assert.deepEqual(y.satirlar.slice(0, kayit.length), kayit, b)
      assert.equal(y.belgeIdleri.length, kayit.length, b)
      assert.deepEqual(y.satirlar.slice(kayit.length), y.ekler, b)
    }
  })

  test('no static part is lost except the ones a CONFIRMED registry document names (pinned list)', () => {
    const dusen: string[] = []
    for (const b of TUM_BRANSLAR) {
      const ekParcalari = new Set(birlesikKaynakYigini(b, statik(b)).ekler.flatMap(parcalar))
      for (const p of statik(b).flatMap(parcalar)) if (!ekParcalari.has(p)) dusen.push(`${b}: ${p}`)
    }
    assert.deepEqual(dusen.sort(), [
      'endokrinoloji: TEMD Adrenal-Gonadal (2025)', // dernek-temd-adrenal-gonadal-2025 (source verification 2026-11-28)
      'endokrinoloji: TEMD Tiroid Hastalıkları Tanı ve Tedavi Kılavuzu (2025)', // dernek-temd-tiroid-2025
      'kardiyoloji: ESC 2023 Akut Koroner Sendrom (AKS) Kılavuzu',
      'kardiyoloji: ESC 2023 Diyabet ve KVH',
      'kardiyoloji: ESC 2024 Atriyal Fibrilasyon',
      'kardiyoloji: ESC 2024 Hipertansiyon',
      'kardiyoloji: ESC 2026 Kalp Yetersizliği (2021 kılavuzu + 2023 odak güncellemesinin yerine)',
      'kardiyoloji: ESC/EAS 2019 Dislipidemi + 2025 Odak Güncellemesi',
      'noroloji: TND Migren Klinik Protokolü',
      'uroloji: TÜD — EAU kılavuzlarının Türkiye pratiğine uyarlanmış yorumları',
    ].sort())
  })

  test('an unconfirmed registry entry never covers a richer static line', () => {
    const yon = PROTOKOL_BELGELERI.filter((b) => b.id === 'yonetmelik-serbest-meslek-icrasi')
    assert.equal(kapsanmayanParcalar('Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik — fizyoterapist, tanı/reçete yok', yon).length, 0, 'the raw name match would cover it')
    const y = birlesikKaynakYigini('fizyoterapi', KLINIK_TURKISH_REFS.fizyoterapi)
    assert.ok(y.ekler.some((e) => e.includes('tanı/reçete yok')), 'scope line kept because the yönetmelik entry is unconfirmed')
  })

  test('Ayşe persona (30 branşlar): merged stack, k numbers map only to registry lines, prompt lists extras unnumbered', () => {
    for (const p of Object.values(PERSONAS)) {
      const y = birlesikKaynakYigini(p.primarySpecialty, TURKISH_REFS[p.primarySpecialty])
      assert.deepEqual(p.turkishGuidelines, y.satirlar, p.id)
      assert.deepEqual(p.kaynakBelgeIdleri, y.belgeIdleri, p.id)
      p.kaynakBelgeIdleri.forEach((id, i) => assert.ok(p.turkishGuidelines[i].startsWith(belgeBul(id)!.kisaAd), `${p.id} #${i + 1}`))
      const liste = turkKaynakListesi(p)
      assert.ok(liste.startsWith('1. '), p.id)
      if (y.ekler.length) {
        assert.ok(liste.includes('Ek pratik kaynaklar (numarasız'), p.id)
        assert.ok(!new RegExp(`\\n${p.kaynakBelgeIdleri.length + 1}\\. `).test(liste), `${p.id}: extras must not be numbered`)
      }
    }
    const kardiyo = Object.values(PERSONAS).find((p) => p.primarySpecialty === 'kardiyoloji')!
    const af = kardiyo.turkishGuidelines.indexOf('ESC Atriyal Fibrilasyon Kılavuzu — 2024')
    assert.ok(af >= 0 && af < kardiyo.kaynakBelgeIdleri.length)
    assert.deepEqual(kaynakNumaralariniCoz(kardiyo.kaynakBelgeIdleri, [af + 1]), ['esc-atriyal-fibrilasyon-2024'])
    assert.deepEqual(kaynakNumaralariniCoz(kardiyo.kaynakBelgeIdleri, [kardiyo.kaynakBelgeIdleri.length + 1]), [], 'an extra has no k number')
    assert.ok(kardiyo.turkishGuidelines.includes('T.C. SB göğüs ağrısı/AKS acil protokolleri; SGK kardiyak ilaç-stent-rapor'), 'static extra restored')
    assert.ok(kardiyo.textbooks.some((t) => t.startsWith("Braunwald's Heart Disease")), 'Braunwald stays in the textbook block')
  })

  test('Özel Branşlar (Notya Klinik): registry + static in the source sentence', () => {
    const f = klinikKaynakCumlesi('fizyoterapi')
    assert.ok(f.includes('ESC Kardiyak Rehabilitasyon Kılavuzu — 2026'))
    assert.ok(f.includes('Türkiye Fizyoterapistler Derneği (TFTD)'))
    assert.ok(f.includes('tanı/reçete yok'))
    assert.ok(klinikKaynakCumlesi('Saç Ekimi').includes('TPRECD'))
  })
})

describe('ESC guidelines in the registry (escardio.org listing, 2026-11-26)', () => {
  const guncel = ESC_BELGELERI.filter((b) => b.durum === 'guncel')

  test('kardiyoloji stack carries the current ESC guidelines with their years', () => {
    const k = turkKaynakYigini('kardiyoloji')
    for (const satir of [
      'ESC Kalp Yetersizliği Kılavuzu — 2026', 'ESC KVH ve Kronik Böbrek Hastalığı Kılavuzu — 2026', 'ESC Kardiyak Rehabilitasyon Kılavuzu — 2026',
      'ESC/EACTS Kapak Hastalıkları Kılavuzu — 2025', 'ESC Miyokardit ve Perikardit Kılavuzu — 2025', 'ESC Gebelik ve Kardiyovasküler Hastalık Kılavuzu — 2025',
      'ESC/EAS Dislipidemi Kılavuzu — 2019 + 2025 Odak Güncellemesi', 'ESC Atriyal Fibrilasyon Kılavuzu — 2024', 'ESC Kronik Koroner Sendromlar Kılavuzu — 2024',
      'ESC Hipertansiyon Kılavuzu — 2024', 'ESC Periferik Arter ve Aort Hastalıkları Kılavuzu — 2024', 'ESC Akut Koroner Sendromlar Kılavuzu — 2023',
      'ESC Kardiyomiyopatiler Kılavuzu — 2023', 'ESC Diyabet ve KVH Kılavuzu — 2023', 'ESC Endokardit Kılavuzu — 2023', 'ESC Kardiyo-Onkoloji Kılavuzu — 2022',
      'ESC Kardiyak Olmayan Cerrahi Kılavuzu — 2022', 'ESC/ERS Pulmoner Hipertansiyon Kılavuzu — 2022', 'ESC Ventriküler Aritmiler ve Ani Kardiyak Ölüm Kılavuzu — 2022',
      'ESC Kardiyak Pacing ve CRT Kılavuzu — 2021', 'ESC KVH Önleme Kılavuzu — 2021', 'ESC Erişkin Konjenital Kalp Hastalıkları Kılavuzu — 2020',
      'ESC Akut Pulmoner Emboli Kılavuzu — 2019', 'ESC Supraventriküler Taşikardi Kılavuzu — 2019', 'ESC Senkop Kılavuzu — 2018',
    ]) assert.ok(k.includes(satir), satir)
    assert.ok(!k.some((s) => s.includes('Kalp Yetersizliği Kılavuzu (2021)')), 'superseded HF edition never in the stack')
  })

  test('each entry: official ESC page, listed title carries the year, ESC lock code, honest TKD note', () => {
    for (const b of ESC_BELGELERI) {
      assert.ok(b.url?.startsWith('https://www.escardio.org/guidelines/clinical-practice-guidelines/'), b.id)
      assert.ok(b.ozgunBaslik?.includes(String(b.yil)), `${b.id}: title year`)
      assert.deepEqual(b.kurumKodlari, ['ESC'])
      assert.ok(b.not?.includes('TKD Türkçe sürümü') && b.not.includes('doğrulanamadı'), b.id)
      assert.ok(b.branslar.includes('kardiyoloji'), b.id)
      assert.ok(b.yalnizTakipUrl && b.takipUrl?.[0] === ESC_LISTESI, b.id)
    }
    assert.ok(guncel.length >= 29)
    const eski = belgeBul('esc-kalp-yetersizligi-2021')!
    assert.equal(eski.durum, 'yerine-yenisi-geldi')
    assert.equal(eski.yerineGelen, 'esc-kalp-yetersizligi-2026')
    assert.deepEqual(eski.odakGuncellemeleri?.map((o) => o.yil), [2023], 'the HF focused update is 2023, not 2024')
  })

  test('the old static kardiyoloji years are corrected', () => {
    const s = readFileSync(join(KOK, 'lib/asistan/turkishSpecialtyRefs.ts'), 'utf8')
    const kardiyo = TURKISH_REFS.kardiyoloji.join(' | ')
    assert.ok(!kardiyo.includes('2024 Odak') && !kardiyo.includes('ESC/TKD') && !kardiyo.includes('ESC 2021 KY'), kardiyo)
    assert.ok(kardiyo.includes('ESC 2026 Kalp Yetersizliği') && kardiyo.includes('ESC/EAS 2019 Dislipidemi + 2025 Odak Güncellemesi'))
    assert.ok(s.includes('KAYNAK-BIRLESTIRME-ESC'))
  })

  test('monthly check reads the ESC listing once, never each guideline page', () => {
    const h = takipHedefleri()
    const esc = h.filter((x) => x.url.includes('escardio.org'))
    assert.equal(esc.length, 1)
    assert.equal(esc[0].url, ESC_LISTESI)
    assert.equal(esc[0].belgeIdleri.length, guncel.length)
  })

  test('source chips: an ESC citation chips the right guideline and edition', () => {
    const c = kaynakCipleri('NOAK için ESC 2024 Atriyal Fibrilasyon kılavuzu; LDL hedefi ESC/EAS 2019 dislipidemi.')
    assert.deepEqual(c.map((x) => [x.belgeId, x.surum]), [['esc-atriyal-fibrilasyon-2024', '2024'], ['esc-dislipidemi-2019', '2019 + 2025 Odak Güncellemesi']])
  })
})

describe('citation lock verifies ESC (and GOLD) against the registry', () => {
  const L = bransDogrulanmisKaynaklar('kardiyoloji')
  const temiz = (t: string) => protokolKaynakTemizle(t, L)

  test('confirmed ESC year + topic in the same clause survives', () => {
    for (const t of [
      'AF hastasında ESC 2024 Atriyal Fibrilasyon kılavuzuna göre NOAK başlanır.',
      'ESC/TKD 2024 Atriyal Fibrilasyon kılavuzu.',
      'ESC 2026 kalp yetersizliği kılavuzuna göre SGLT2i.',
      'LDL hedefi ESC/EAS 2019 dislipidemi ve ESC 2025 dislipidemi odak güncellemesi.',
      'ESC/ERS 2022 pulmoner hipertansiyon kılavuzu.',
      'GOLD 2027 raporuna göre KOAH alevlenmesi.',
    ]) assert.deepEqual(temiz(t), { metin: t, bulgular: [] }, t)
  })

  test('invented or superseded ESC years are stripped (organisation kept)', () => {
    const af = temiz('ESC 2019 AF kılavuzuna göre antikoagülasyon.')
    assert.equal(af.metin, 'ESC AF kılavuzuna göre antikoagülasyon.')
    assert.equal(af.bulgular[0].neden, 'konu-uyusmuyor') // 2019 is an ESC year (dislipidemi / PE / SVT) — not for AF
    assert.equal(temiz('2019 ESC AF kılavuzu.').metin, 'ESC AF kılavuzu.')
    assert.equal(temiz('ESC 2021 KY kılavuzuna göre.').metin, 'ESC KY kılavuzuna göre.')
    assert.equal(temiz('ESC 2023 KY odak güncellemesi.').metin, 'ESC KY odak güncellemesi.')
    assert.equal(temiz('ESC 2017 STEMI kılavuzu.').bulgular[0].neden, 'dogrulanmamis')
    assert.equal(temiz('GOLD 2024 raporuna göre KOAH.').metin, 'GOLD raporuna göre KOAH.')
  })

  test('the lock list carries focused-update years', () => {
    assert.ok(L.some((d) => d.aile === 'ESC' && d.numara === 2025 && d.etiket.startsWith('ESC/EAS Dislipidemi')))
    assert.ok(!L.some((d) => d.aile === 'ESC' && d.numara === 2023 && d.etiket.includes('Kalp Yetersizliği')), 'superseded FU not confirmed')
  })
})
