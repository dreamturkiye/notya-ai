/**
 * TR-PARITE-01 — her branşın kendi istem / yönlendirme listesi: 40 branş, katalog adları birebir, müttefik meslek tetkik
 * isteyemez, branşlar arası sızıntı yok (iki yönde), bilinmeyen branş → liste yok (pediatri değil).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BRANS_ISTEMLERI, ISTEM_MUTTEFIK, bransIstemleri, type IstemBransi } from './bransIstemleri'
import { TUM_TETKIKLER } from './tetkikKatalogu'
import { SPECIALTIES } from './specialties'
import { KLINIK_YENI_SLUGS, KLINIK_MUTTEFIK_SLUGS } from '@/lib/specialties/klinikDikey'

const TUS = SPECIALTIES.map((s) => s.key)
const KIRK: string[] = [...TUS, ...KLINIK_YENI_SLUGS]
const KATALOG = new Set(TUM_TETKIKLER.map((t) => t.ad))
const tumu = (b: IstemBransi) => { const l = BRANS_ISTEMLERI[b]; return [...l.lab, ...l.goruntuleme, ...l.sevk] }

describe('bransIstemleri — 40 branş, kendi listesi', () => {
  it('30 tıp branşı + 10 Özel Branş = 40 anahtar, fazlası yok', () => {
    assert.equal(TUS.length, 30)
    assert.equal(KLINIK_YENI_SLUGS.length, 10)
    assert.deepEqual(Object.keys(BRANS_ISTEMLERI).sort(), [...KIRK].sort())
  })

  it('her lab adı Tetkik kataloğunda birebir var (kâğıtta numune / açlık bilgisi katalogdan gelir)', () => {
    for (const b of KIRK as IstemBransi[]) for (const ad of BRANS_ISTEMLERI[b].lab) assert.ok(KATALOG.has(ad), `${b}: "${ad}" katalogda yok`)
  })

  it('her branşın listesi dolu ve kendi içinde tekrarsız; iki branşın listesi aynı değil', () => {
    const imzalar = new Map<string, string>()
    for (const b of KIRK as IstemBransi[]) {
      const l = tumu(b)
      assert.ok(BRANS_ISTEMLERI[b].sevk.length >= 3, `${b}: yönlendirme listesi kısa`)
      assert.equal(new Set(l).size, l.length, `${b}: tekrar eden kalem`)
      const imza = JSON.stringify(BRANS_ISTEMLERI[b])
      assert.ok(!imzalar.has(imza), `${b} ile ${imzalar.get(imza)} aynı liste`)
      imzalar.set(imza, b)
    }
  })

  it('tıp branşları ve Özel Branş hekimleri tetkik ve görüntüleme ister (radyoloji dahil)', () => {
    for (const b of KIRK.filter((k) => !ISTEM_MUTTEFIK.has(k as IstemBransi)) as IstemBransi[]) {
      assert.ok(BRANS_ISTEMLERI[b].lab.length >= 4, `${b}: lab`)
      assert.ok(BRANS_ISTEMLERI[b].goruntuleme.length >= 2, `${b}: görüntüleme`)
    }
  })

  it('müttefik meslek (yönetmelik md.16 — tetkik isteyemez): yalnız hekime yönlendirme', () => {
    assert.deepEqual([...ISTEM_MUTTEFIK].sort(), [...KLINIK_MUTTEFIK_SLUGS].sort())
    for (const b of ISTEM_MUTTEFIK) {
      assert.equal(BRANS_ISTEMLERI[b].lab.length, 0, b)
      assert.equal(BRANS_ISTEMLERI[b].goruntuleme.length, 0, b)
      for (const s of BRANS_ISTEMLERI[b].sevk) assert.match(s, /hekim|112|acil|KBB|psikiyatri|sosyal hizmet/i, `${b}: "${s}" bir yönlendirme değil`)
    }
  })

  it('pediatriye özgü kalemler (kemik yaşı, kalça USG, pediatrik IgE paneli, selofan bant) başka hiçbir branşta yok', () => {
    const PEDI = ['El-bilek grafisi (kemik yaşı)', 'Kalça USG (gelişimsel kalça displazisi)', 'Spesifik IgE — pediatrik panel', 'Selofan bant (Enterobius)']
    for (const k of PEDI) assert.ok(tumu('pediatri').includes(k), k)
    for (const b of KIRK.filter((x) => x !== 'pediatri') as IstemBransi[]) for (const k of PEDI) assert.ok(!tumu(b).includes(k), `${b}: pediatri kalemi "${k}"`)
    // Pediatri-only clinical words never appear in another branch's list (veli wording, Hedef Boy, Aşı Onam, Neyzi, büyüme).
    for (const b of KIRK as IstemBransi[]) for (const k of tumu(b)) assert.doesNotMatch(k, /\bveli\b|hedef boy|aşı onam|neyzi|büyüme|baş çevresi/i, `${b}: "${k}"`)
  })

  it('branşa özgü kalemler kendi branşında kalır (iki yön): odyometri KBB, OCT göz, PSA üroloji, obstetrik USG KD, PET-BT onko/göğüs cerrahisi', () => {
    const SAHIP: Array<[string, IstemBransi[]]> = [
      ['Saf ses odyometri', ['kulak-burun-bogaz']],
      ['Optik koherens tomografi (OCT)', ['goz-hastaliklari']],
      ['Total PSA', ['uroloji', 'onkoloji']],
      ['Obstetrik USG', ['kadin-hastaliklari-dogum']],
      ['Grup B streptokok taraması (vajinal/rektal)', ['kadin-hastaliklari-dogum']],
      ['Yama testi', ['dermatoloji']],
      ['Polisomnografi', ['kulak-burun-bogaz', 'gogus-hastaliklari']],
      ['Trikoskopi fotoğraf kaydı', ['sac-ekimi']],
    ]
    for (const [kalem, sahipler] of SAHIP) {
      for (const b of KIRK as IstemBransi[]) assert.equal(tumu(b).includes(kalem), sahipler.includes(b), `${kalem} / ${b}`)
    }
  })
})

describe('bransIstemleri — çözücü (users.specialty → liste)', () => {
  it('her anahtar kendi listesine çözülür', () => {
    for (const b of KIRK) assert.equal(bransIstemleri(b)?.brans, b, b)
  })
  it('eski / serbest değerler: kadin-dogum → KD; "Dermatoloji" TUS dermatolojidir, klinik-dermatoloji değil', () => {
    assert.equal(bransIstemleri('kadin-dogum')?.brans, 'kadin-hastaliklari-dogum')
    assert.equal(bransIstemleri('Dermatoloji')?.brans, 'dermatoloji')
    assert.equal(bransIstemleri('klinik-dermatoloji')?.brans, 'klinik-dermatoloji')
  })
  it('bilinmeyen / boş branş → liste yok (asla pediatri)', () => {
    for (const h of ['', null, undefined, 'yok-boyle-brans', 'genel']) assert.equal(bransIstemleri(h as string), null, String(h))
  })
})

describe('bransIstemleri — ekranlar', () => {
  it('Tetkik İstek sayfası listeyi hekimin kendi branşından çözer (sabit liste yok)', () => {
    const src = readFileSync(join(process.cwd(), 'app/doktor-tools/tetkik/page.tsx'), 'utf8')
    assert.match(src, /bransIstemleri\(baslik\.brans\)/)
    assert.match(src, /<BransIstemSecici/)
  })
  it('Özel Branşlar istem sayfası müttefik meslekte tetkik bölümünü çizmez (liste boş) ve aynı seçiciyi kullanır', () => {
    const sayfa = readFileSync(join(process.cwd(), 'app/ozel-branslar/istem-listesi/page.tsx'), 'utf8')
    assert.match(sayfa, /KlinikIstemPaneli/)
    const src = readFileSync(join(process.cwd(), 'components/klinik/KlinikIstemPaneli.tsx'), 'utf8')
    assert.match(src, /<BransIstemSecici/)
    assert.match(src, /bransIstemleri\(slug\)/)
    assert.match(src, /ISTEM_MUTTEFIK\.has/)
  })
})
