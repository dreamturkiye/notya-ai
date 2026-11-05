/**
 * AU-KURUCU-01 / AU-RIZA-01 / AU-DEMO-02 (2026-11-03) - Australia's founding-doctor page settings, the places-left counter,
 * the consent-before-recording wording and the demo link. Pure: no Stripe, no network.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ULKE_TICARI } from '@/lib/billing/ulkeTicari'
import { kalanOnbelleginiTemizle, kurucuKalanKoltuk, fiyatOnbelleginiTemizle, type FiyatStripe } from '@/lib/billing/kurucuTeklifi'
import { demoBaglantisiCoz } from '@/lib/ulke/demo/baglanti'
import { sayacMetni } from '@/components/ulke/acilis/KurucuSayfasi'
import { AU_ARAYUZ } from './arayuz'
import { AU_GIRDI } from './ayarlar'
import { AU_KLINIK } from './klinik'
import { AU_PAKETI } from './index'

const KOK = join(__dirname, '..', '..')
const oku = (p: string): string => readFileSync(join(KOK, p), 'utf8')
const AU = ULKE_TICARI.au
const M = AU.kurucuSayfasi!
const metin = (x: unknown): string => (typeof x === 'string' ? x : Array.isArray(x) ? x.map(metin).join('\n') : x && typeof x === 'object' ? Object.values(x).map(metin).join('\n') : '')

/** A Stripe stand-in: `dolu` subscriptions holding a seat on the founding monthly price. */
function sahteStripe(dolu: number, hata = false): FiyatStripe & { cagri: number } {
  const s = {
    cagri: 0,
    prices: { list: async (p: { lookup_keys: string[] }) => { s.cagri++; if (hata) throw new Error('down'); return { data: p.lookup_keys.map((k) => ({ id: `price_${k}`, lookup_key: k })) } } },
    subscriptions: { list: async (p: { price: string }) => ({ data: p.price.endsWith('monthly') ? Array.from({ length: dolu }, (_, i) => ({ id: `sub_${i}`, status: i % 2 ? 'active' : 'trialing' })) : [], has_more: false }) },
  }
  return s
}

describe('AU founding page: every fact matches the settings that checkout and the trial enforce', () => {
  it('seats, founding and regular prices, trial days and caps appear as set', () => {
    const t = metin(M)
    assert.equal(AU.kurucu!.koltuk, 20)
    for (const x of [AU.fiyatlar!.kurucu!.month, AU.fiyatlar!.kurucu!.year, AU.fiyatlar!.normal.month, AU.fiyatlar!.normal.year]) assert.ok(t.includes(x), x)
    assert.match(t, new RegExp(`\\b${AU.deneme!.gun}-day free trial|${AU.deneme!.gun} days`))
    assert.match(t, new RegExp(`\\b${AU.deneme!.muayene} recorded visits`))
    assert.match(t, new RegExp(`\\b${AU.sesDakika!.denemeDakika} minutes of live voice`))
    assert.match(t, new RegExp(`\\b${AU.sesDakika!.aylikDakika} minutes a month`))
    assert.match(t, /no card/i)
    // AU-HUKUK-YANIT-01 (2026-11-05): the lawyer-approved pricing and scarcity wording.
    assert.match(M.teklif.govde, /Monthly prices may change with 30 days’ notice/)
    assert.match(M.teklif.govde, /Annual prices are locked for the prepaid year/)
    assert.match(M.teklif.govde, /while places remain/)
    assert.equal(M.birinciDugme, 'Start your free trial')
    assert.equal(M.ikinciDugme, 'Book a 30-minute private demo')
  })
  it('no diagnosis or treatment claim, no regulator, no competitor, no invented testimonial', () => {
    const t = metin(M)
    assert.doesNotMatch(t, /\b(TGA|Ahpra|AHPRA|RACGP|compliant|certified|approved by|endorsed|clinically (proven|validated)|guarantee)\b/i)
    for (const s of t.split('\n')) if (/diagnos|treatment/i.test(s)) assert.match(s, /\b(not|no|never)\b/i, s)
    assert.match(M.karsilik.govde, /with your permission/)
  })
  it('/founding is an AU route; the counter text', () => {
    assert.ok(AU_PAKETI.rotalar !== 'hepsi' && AU_PAKETI.rotalar.sayfalar.includes('/founding'))
    assert.equal(sayacMetni(M, 7, 20), '7 of 20 founding places left')
    assert.equal(sayacMetni(M, 1, 20), '1 of 20 founding places left')
    assert.equal(sayacMetni(M, 0, 20), 'All 20 founding places have been taken.')
    assert.equal(sayacMetni(M, null, 20), null)
  })
})

describe('AU founding counter: places left from Stripe, cached five minutes, never a guess', () => {
  beforeEach(() => { kalanOnbelleginiTemizle(); fiyatOnbelleginiTemizle() })
  it('counts seat-holding subscriptions; 20 taken = 0 left (the page then shows the regular price)', async () => {
    assert.equal(await kurucuKalanKoltuk(sahteStripe(3), 'au', 1_000), 17)
    kalanOnbelleginiTemizle(); fiyatOnbelleginiTemizle()
    assert.equal(await kurucuKalanKoltuk(sahteStripe(20), 'au', 1_000), 0)
    kalanOnbelleginiTemizle(); fiyatOnbelleginiTemizle()
    assert.equal(await kurucuKalanKoltuk(sahteStripe(25), 'au', 1_000), 0, 'never negative')
  })
  it('Stripe down or no key = null (no counter), and that answer is cached too', async () => {
    const s = sahteStripe(0, true)
    assert.equal(await kurucuKalanKoltuk(s, 'au', 1_000), null)
    assert.equal(await kurucuKalanKoltuk(s, 'au', 2_000), null)
    assert.equal(s.cagri, 1, 'the failed read is not repeated inside five minutes')
    kalanOnbelleginiTemizle()
    assert.equal(await kurucuKalanKoltuk(null, 'au', 1_000), null)
    assert.equal(await kurucuKalanKoltuk(sahteStripe(0), 'us', 1_000), null, 'no founding offer in that country')
  })
  it('one Stripe read per five minutes; a new read after that', async () => {
    const s = sahteStripe(4)
    assert.equal(await kurucuKalanKoltuk(s, 'au', 0), 16)
    assert.equal(await kurucuKalanKoltuk(s, 'au', 5 * 60 * 1000 - 1), 16)
    assert.equal(s.cagri, 1)
    fiyatOnbelleginiTemizle()
    await kurucuKalanKoltuk(s, 'au', 5 * 60 * 1000 + 1)
    assert.equal(s.cagri, 2)
  })
  it('the page reads the counter only through the cached function, never on an application route', () => {
    assert.match(oku('app/founding/page.ulke.tsx'), /kurucuKalanKoltuk\(stripe, /)
    assert.doesNotMatch(oku('app/api/ulke/muayene/route.ulke.ts') + oku('app/api/ulke/deneme/route.ulke.ts'), /kurucuKalanKoltuk/)
  })
})

describe('AU demo link: the 30-minute Cal.com event, hidden where it is not a real calendar', () => {
  it('the setting is a valid Cal.com address and the AU words say 30 minutes', () => {
    assert.ok(AU.demo && demoBaglantisiCoz(AU.demo.adres), AU.demo?.adres)
    assert.equal(AU.demoDugmesi, 'Book a 30-minute private demo')
  })
  it('the founding page and the upgrade prompt show the button only through demoIstegi (null = hidden)', () => {
    assert.match(oku('components/ulke/acilis/KurucuSayfasi.tsx'), /const demo = demoIstegi\(dil\)[\s\S]*\{demo \? \(/)
    assert.match(oku('components/ulke/uygulama/YukseltmeIstemi.tsx'), /const demo = demoIstegi\(\)[\s\S]*\{demo \? <a /)
    const d = oku('lib/ulke/demo/index.ts')
    assert.match(d, /if \(!etiket \|\| !demoSayfasiVar\(\) \|\| !demoBaglantisi\(\)\) return null/)
    assert.match(d, /return kendi \? demoBaglantisiCoz\(kendi\.adres\) : ortamBaglantisi\(\)/)
  })
})

describe('AU consent before recording (Ahpra AI guidance): patient, or parent / guardian under 18', () => {
  it('the guardian sentence names the parent or guardian, AI processing, overseas services, approval and lawful recording', () => {
    const s = AU_GIRDI.sozler.kayitRizasiVeli!
    assert.match(s, /parent or guardian/)
    assert.match(s, /artificial intelligence/)
    assert.match(s, /outside Australia/)
    assert.match(s, /read and approve/)
    assert.match(s, /lawful where this visit takes place/)
  })
  it('the screen gets both sentences and the stored stamp knows a guardian sentence exists', () => {
    const v = AU_ARAYUZ.metinler['en-AU']!.muayene
    assert.equal(v.riza, AU_GIRDI.sozler.kayitRizasi)
    assert.equal(v.rizaVeli, AU_GIRDI.sozler.kayitRizasiVeli)
    assert.equal(AU_KLINIK.riza.veliMetni, true)
  })
  it('the box chooses the sentence by age, gates the start button, and the server stores which one was confirmed', () => {
    const ekran = oku('components/ulke/uygulama/Muayene.tsx')
    assert.match(ekran, /\{veli && v\.rizaVeli \? v\.rizaVeli : v\.riza\}/)
    assert.match(ekran, /veli=\{rizaVeliMi\(hasta\.dogumTarihi\)\}/)
    assert.match(ekran, /<SeansBaslatDugmesi onClick=\{baslat\} disabled=\{!riza\}>/)
    const sunucu = oku('lib/ulke/uygulama/muayeneKaydi.ts')
    assert.match(sunucu, /if \(g\.riza !== true\) return \{ tamam: false, kod: 'RIZA_GEREKLI' \}/)
    assert.match(sunucu, /riza_surumu: rizaSurumuYaz\(klinik\.riza\.surum, klinik\.riza\.veliMetni === true && rizaVeliMi\(hasta\.dogumTarihi, /)
  })
})
