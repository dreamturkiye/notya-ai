/**
 * KAYIT-BRANS-01 (Kaan, 2026-11-07) — "when doktors sign up to the free trial in the turkish site they need to choose
 * their specialty." The list, the rule, the /kayit form, the onboarding select and the "Branşınızı seçin" gate.
 *
 *   npm test (--experimental-test-module-mocks)
 */
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BRANS_ETIKETLERI } from '../intake/bransSorulari'
import { SPECIALTIES } from '../doktor/specialties'
import { KLINIK_ETIKET, KLINIK_YENI_SLUGS } from '../specialties/klinikDikey'
import { HEKIM_MESLEKLERI, KAYIT_BRANS_ANAHTARLARI, KAYIT_BRANS_GRUPLARI, KAYIT_BRANS_MESAJ, kayitBransiMi, kayitBransMeslegi, profilBransiCoz } from './kayitBransi'
import { bransSecimiGerekli, etkinBrans, kayitliBransVarMi } from './bransKapisi'

const KOK = resolve(__dirname, '../..')
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')

mock.module('next/navigation', {
  namedExports: { useRouter: () => ({ push: () => {}, replace: () => {} }), useSearchParams: () => new URLSearchParams(''), usePathname: () => '/kayit' },
})

describe('the 40-branch list (core: all 30 medical branches + 10 Özel Branşlar)', () => {
  it('two groups, "Tıp Branşları" then "Özel Branşlar"', () => {
    assert.deepEqual(KAYIT_BRANS_GRUPLARI.map((g) => g.baslik), ['Tıp Branşları', 'Özel Branşlar'])
  })
  it('the medical group is exactly the 30 canonical keys, in the catalogue order, with the canonical labels', () => {
    const tip = KAYIT_BRANS_GRUPLARI[0].secenekler
    assert.deepEqual(tip.map((s) => s.anahtar), SPECIALTIES.map((s) => s.key))
    assert.deepEqual([...tip.map((s) => s.anahtar)].sort(), Object.keys(BRANS_ETIKETLERI).sort())
    for (const s of tip) assert.equal(s.ad, (BRANS_ETIKETLERI as Record<string, string>)[s.anahtar], s.anahtar)
  })
  it('the Özel Branşlar group is exactly the 10 slugs with their labels', () => {
    const ozel = KAYIT_BRANS_GRUPLARI[1].secenekler
    assert.deepEqual(ozel.map((s) => s.anahtar), [...KLINIK_YENI_SLUGS])
    for (const s of ozel) assert.equal(s.ad, KLINIK_ETIKET[s.anahtar as keyof typeof KLINIK_ETIKET])
  })
  it('40 keys, no duplicates, no catch-all ("Diğer", "genel")', () => {
    assert.equal(KAYIT_BRANS_ANAHTARLARI.length, 40)
    assert.equal(new Set(KAYIT_BRANS_ANAHTARLARI).size, 40)
    for (const k of ['Diğer', 'diger', 'genel', 'default']) assert.equal(kayitBransiMi(k), false, k)
  })
  it('kayitBransiMi accepts exactly the keys — no label, no alias, no other type', () => {
    for (const k of KAYIT_BRANS_ANAHTARLARI) assert.equal(kayitBransiMi(k), true, k)
    for (const k of ['', ' ', 'Pediatri', 'Kardiyoloji', 'kadin-dogum', 'Sac Ekimi', 'pediatri ', null, undefined, 3, {}]) assert.equal(kayitBransiMi(k), false, String(k))
  })
  it('each key belongs to one onboarding profession', () => {
    assert.equal(kayitBransMeslegi('pediatri'), 'doktor')
    assert.equal(kayitBransMeslegi('sac-ekimi'), 'klinik-uzman')
    assert.equal(kayitBransMeslegi('fizyoterapi'), 'saglik-uzmani')
    assert.equal(kayitBransMeslegi('Diğer'), null)
  })
  it('profile bodies: doktor needs an exact key; the Özel Branş professions are normalised as the route always did', () => {
    assert.deepEqual(HEKIM_MESLEKLERI, ['doktor', 'klinik-uzman', 'saglik-uzmani', 'psikolog'])
    assert.equal(profilBransiCoz('doktor', 'kardiyoloji'), 'kardiyoloji')
    assert.equal(profilBransiCoz('doktor', 'longevity'), 'longevity')
    assert.equal(profilBransiCoz('doktor', 'Kardiyoloji'), null)
    assert.equal(profilBransiCoz('doktor', 'Diğer'), null)
    assert.equal(profilBransiCoz('klinik-uzman', 'Sac Ekimi'), 'sac-ekimi')
    assert.equal(profilBransiCoz('psikolog', 'Psikoloji'), 'klinik-psikolog')
    assert.equal(profilBransiCoz('saglik-uzmani', 'kardiyoloji'), null, 'an allied profession cannot pick a medical branch')
  })
})

describe('the gate decision (server side)', () => {
  it('no branch the app can read → must choose; nothing is guessed', () => {
    for (const s of [null, undefined, '', 'genel', 'Diğer', 'Diger', 'xyz']) assert.equal(bransSecimiGerekli({ specialty: s, profession_type: 'doktor' }), true, String(s))
    assert.equal(bransSecimiGerekli({}), true, 'no profession, no branch')
  })
  it('a real branch — canonical key or an old label real accounts carry — is enough', () => {
    for (const s of ['pediatri', 'Pediatri', 'kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'Sac Ekimi', 'klinik-dermatoloji', ...KAYIT_BRANS_ANAHTARLARI]) {
      assert.equal(kayitliBransVarMi(s), true, s)
      assert.equal(bransSecimiGerekli({ specialty: s, profession_type: 'doktor' }), false, s)
    }
  })
  it('exempt: staff, mali, avukat', () => {
    assert.equal(bransSecimiGerekli({ specialty: null, personel: true }), false)
    for (const p of ['mali', 'mali_musavirlik', 'avukat']) assert.equal(bransSecimiGerekli({ specialty: 'Muhasebe', profession_type: p }), false, p)
  })
  it('the effective value: the row, unless it is the leftover "genel"; then metadata', () => {
    assert.equal(etkinBrans('pediatri', 'kardiyoloji'), 'pediatri')
    assert.equal(etkinBrans('genel', 'kardiyoloji'), 'kardiyoloji')
    assert.equal(etkinBrans('genel', null), 'genel')
    assert.equal(etkinBrans(null, null), null)
  })
})

describe('/kayit: the branch is a required choice (SSR + source)', async () => {
  const { default: KayitPage } = await import('../../app/kayit/page')
  const html = renderToStaticMarkup(React.createElement(KayitPage))
  const kayit = oku('app/kayit/page.tsx')

  it('a required select with the 40 branches in two groups and an empty, disabled placeholder (no preselected default)', () => {
    assert.match(html, /<select[^>]*id="kayit-brans"[^>]*required=""/)
    assert.match(html, /<option value="" disabled="" selected="">Branşınızı seçin<\/option>/)
    assert.equal((html.match(/<option value="[a-z-]+"/g) || []).length, 40)
    assert.ok(html.includes('<optgroup label="Tıp Branşları">') && html.includes('<optgroup label="Özel Branşlar">'))
    assert.ok(!/<option[^>]*value="(Diğer|genel)"/.test(html))
    assert.equal((html.match(/ selected=""/g) || []).length, 1, 'only the placeholder is selected')
  })
  it('the submit button is disabled until a branch is chosen', () => {
    assert.match(html, /<button type="submit" disabled=""/)
    assert.match(kayit, /disabled=\{loading \|\| !kayitBransiMi\(brans\)\}/)
    assert.match(kayit, /const \[brans, setBrans\] = useState\(''\)/)
  })
  it('an empty branch is refused with a Turkish message before the account is created', () => {
    const gonder = kayit.slice(kayit.indexOf('const handleSubmit'), kayit.indexOf('supabase.auth.signUp'))
    assert.match(gonder, /if \(!kayitBransiMi\(brans\)\) \{\s*setBransHatasi\(KAYIT_BRANS_MESAJ\.gerekli\)/)
    assert.equal(KAYIT_BRANS_MESAJ.gerekli, 'Lütfen branşınızı seçin.')
  })
  it('the choice is carried in the sign-up metadata as kayit_bransi (not `specialty`, which would skip onboarding)', () => {
    assert.match(kayit, /kayit_bransi: brans,/)
    assert.ok(!/\bspecialty:/.test(kayit.slice(kayit.indexOf('supabase.auth.signUp'), kayit.indexOf('if (signUpError)'))))
  })
  it('trial rules unchanged: 15 days, no card, no invitation code', () => {
    assert.ok(html.includes('15 günlük tam erişim — kredi kartı gerekmez'))
    assert.ok(!/davet|invitation/i.test(html))
  })
})

describe('onboarding step 2 uses the same select; "Diğer" is gone', () => {
  const sayfa = oku('app/onboarding/page.tsx')
  it('shared component, key values, preselected only from the doctor\'s own /kayit choice', () => {
    assert.match(sayfa, /<BransSecimi kimlik="onboarding-brans"/)
    assert.ok(!sayfa.includes('value="Diğer"') && !sayfa.includes("'Diğer']"))
    assert.match(sayfa, /return !!unvan && kayitBransiMi\(specialty\);/)
    assert.match(sayfa, /if \(kayitBransiMi\(kayitBransi\) && \(!validPreset \|\| validPreset === 'doktor'\)\)/)
  })
})

describe('the "Branşınızı seçin" gate of the doctor application', async () => {
  const { default: BransSecimKapisi } = await import('../../components/doktor/BransSecimKapisi')
  const html = renderToStaticMarkup(React.createElement(BransSecimKapisi, { onCikis: () => {} }))
  const chrome = oku('components/doktor/DoktorChrome.tsx')

  it('renders the heading, the 40-branch select with no default, a disabled button and sign-out — nothing else', () => {
    assert.ok(html.includes('Branşınızı seçin</h1>'))
    assert.equal((html.match(/<option value="[a-z-]+"/g) || []).length, 40)
    assert.match(html, /<option value="" disabled="" selected="">Branşınızı seçin<\/option>/)
    assert.match(html, /<button type="submit" disabled="" data-eylem="brans-kaydet"/)
    assert.ok(html.includes('Çıkış Yap'))
    assert.ok(!html.includes('Ana Sayfa') && !html.includes('Hastalar'), 'no app navigation behind the gate')
  })
  it('DoktorChrome replaces the whole app with the gate while the server says brans_gerekli', () => {
    assert.match(chrome, /setBransGerekli\(u\?\.brans_gerekli === true\)/)
    const i = chrome.indexOf("if (bransGerekli && rol === 'doktor') {")
    assert.ok(i > 0)
    assert.match(chrome.slice(i, i + 120), /return <BransSecimKapisi onCikis=\{handleCikis\} \/>;/)
    assert.ok(i < chrome.indexOf('<KabukGorunumu'), 'decided before the chrome and the page render')
  })
  it('the gate saves through the server route; it never writes a branch itself', () => {
    const kapi = oku('components/doktor/BransSecimKapisi.tsx')
    assert.match(kapi, /fetch\('\/api\/users\/brans'/)
    assert.ok(!kapi.includes('supabase'))
  })
})
