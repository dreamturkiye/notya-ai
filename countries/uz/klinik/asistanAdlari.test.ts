/**
 * NOTYA-ULKE-01 · NOTYA-UZ-FIYAT-UNVAN-01 — the 40 assistant names of Uzbekistan.
 *
 *   1. The owner's list: 30 + 5 + 5, given name and family name EXACTLY as he wrote them (a fingerprint of the list
 *      taken before the titles changed; no name is repeated in this file).
 *   2. TITLES FOLLOW THE TURKISH PRODUCT'S CONVENTION, role by role (the owner, 2026-10-09). The Turkish lists are
 *      READ AS TEXT, never imported: lib/asistan/specialistsCatalog.ts (30 doctor specialties) and
 *      lib/ai/personas/klinik_uzmanlar.ts (10 clinic roles). A title changed there fails this test by name.
 *   3. The full and the short form in each of the three text forms; titles come from the catalogue of titles.
 *   4. Leak test over every name and every title in all three forms.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import { uzKirillga, uzRuschaYozuvga } from '../yozuv'
import { UZ_ASISTAN_ADLARI, uzAsistanAdi, type AsistanUnvani } from './asistanAdlari'
import { uzAsistanKimligi } from './asistanKimligi'
import { UZ_ASISTAN_UNVANLARI } from './asistanUnvanlari'
import { uzRolMu } from './rolAdlari'

const KOK = resolve(__dirname, '../../..')
const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const

/**
 * The Turkish product's title for each role, read from its two lists. The clinic list calls its dermatology
 * "dermatoloji"; the product key of that clinic role is "klinik-dermatoloji" (lib/specialties/klinikDikey.ts).
 */
function turkUnvanlari(): { doktor: Map<string, string>; klinik: Map<string, string> } {
  const unvan = (tamAd: string) => { const p = tamAd.split(' '); assert.ok(p.length >= 3, tamAd); return p.slice(0, -2).join(' ') }
  const katalog = readFileSync(join(KOK, 'lib/asistan/specialistsCatalog.ts'), 'utf8')
  const doktor = new Map([...katalog.matchAll(/specialtyKey: '([^']+)',\s*name: '([^']+)',\s*shortName: '([^']+)'/g)].map((m) => { assert.equal(m[2].split(' ').slice(-2)[0], m[3], `${m[1]}: the short name is the given name`); return [m[1], unvan(m[2])] as const }))
  const klinikKaynak = readFileSync(join(KOK, 'lib/ai/personas/klinik_uzmanlar.ts'), 'utf8')
  const klinik = new Map([...klinikKaynak.matchAll(/^  "([a-z-]+)": \{ name: "([^"]+)", title: "[^"]+"/gm)].map((m) => [m[1] === 'dermatoloji' ? 'klinik-dermatoloji' : m[1], unvan(m[2])] as const))
  return { doktor, klinik }
}

/** Turkish title → the title an Uzbek assistant carries. "Uzm." has no Uzbek or Russian equivalent: the profession's own title stands. */
const KARSILIK: Readonly<Record<string, AsistanUnvani>> = { 'Prof. Dr.': 'prof-dr', 'Dr.': 'dr', 'Uzm.': 'meslek' }

test('owner list: 30 doctor specialties, 5 clinic doctors, 5 clinic allied roles', () => {
  const say = (t: string) => UZ_ASISTAN_ADLARI.filter((a) => a.taraf === t).length
  assert.equal(UZ_ASISTAN_ADLARI.length, 40)
  assert.equal(say('doktor'), 30)
  assert.equal(say('klinik-hekim'), 5)
  assert.equal(say('klinik-muttefik'), 5)
})

test('keys, given names and full names are unique; one word each; no Turkish letters anywhere', () => {
  for (const alan of ['bransAnahtari', 'kisaAd'] as const) {
    const degerler = UZ_ASISTAN_ADLARI.map((a) => a[alan])
    assert.equal(new Set(degerler).size, degerler.length, alan)
  }
  assert.equal(new Set(UZ_ASISTAN_ADLARI.map((a) => `${a.kisaAd} ${a.soyad}`)).size, 40)
  for (const a of UZ_ASISTAN_ADLARI) {
    for (const x of [a.kisaAd, a.soyad, ...(a.meslekUnvani === undefined ? [] : [a.meslekUnvani])]) assert.match(x, /^[A-Z][a-z]+$/, `${a.bransAnahtari}: "${x}" is one capitalised word of plain Latin letters`)
    assert.match(a.bransAnahtari, /^[a-z]+(-[a-z]+)*$/)
  }
})

test('the given names and family names are exactly the owner\'s: the list still has the fingerprint it had before the titles changed', () => {
  // sha256 of "key:given family|" for the 40 entries in order, taken from the owner's list as stored on 2026-10-08.
  const iz = createHash('sha256').update(UZ_ASISTAN_ADLARI.map((a) => `${a.bransAnahtari}:${a.kisaAd} ${a.soyad}`).join('|') + '|').digest('hex')
  assert.equal(iz, 'd6cfe4299da27c72a9fb35f8a59f5cb94e1e0adc43a46c9bc4056abfd1a9b06e', 'a key, a given name, a family name or the order of the owner\'s list changed')
})

test('titles follow the Turkish product\'s convention, role by role: the Uzbek assistant carries the title its Turkish counterpart has', () => {
  const tr = turkUnvanlari()
  assert.equal(tr.doktor.size, 30, 'the Turkish catalogue of doctor specialties')
  assert.equal(tr.klinik.size, 10, 'the Turkish list of clinic roles')
  for (const a of UZ_ASISTAN_ADLARI) {
    const turkce = (a.taraf === 'doktor' ? tr.doktor : tr.klinik).get(a.bransAnahtari)
    assert.ok(turkce, `${a.bransAnahtari}: no Turkish counterpart found — the role lists no longer match`)
    const beklenen = KARSILIK[turkce!]
    assert.ok(beklenen, `${a.bransAnahtari}: the Turkish counterpart is titled "${turkce}", a title the Uzbek pack has no form for yet (countries/uz/klinik/asistanUnvanlari.ts)`)
    assert.equal(a.unvan, beklenen, `${a.bransAnahtari}: Turkish "${turkce}" → ${beklenen}, the list says ${a.unvan}`)
    assert.equal(Boolean(a.meslekUnvani), a.unvan === 'meslek', `${a.bransAnahtari}: a profession's title stands exactly where the Turkish title has no equivalent`)
  }
  // The convention as found on 2026-10-09, in numbers: 31 "Prof. Dr.", 5 "Dr.", 4 "Uzm.".
  const say = (u: AsistanUnvani) => UZ_ASISTAN_ADLARI.filter((a) => a.unvan === u).map((a) => a.bransAnahtari)
  assert.equal(say('prof-dr').length, 31)
  assert.deepEqual(say('prof-dr').filter((k) => uzAsistanAdi(k)!.taraf !== 'doktor'), ['estetik-cerrahi'])
  assert.deepEqual(say('dr'), ['sac-ekimi', 'medikal-estetik', 'klinik-dermatoloji', 'longevity', 'klinik-psikolog'])
  assert.deepEqual(say('meslek'), ['fizyoterapi', 'diyetisyen', 'ergoterapi', 'odyoloji'])
  // The owner, 2026-10-09: "Use the common name."
  assert.equal(uzAsistanAdi('fizyoterapi')!.meslekUnvani, 'Fizioterapevt')
})

/**
 * NOTYA-ULKE-UYGULA-UZ (2026-10-10) — THE OWNER'S LIST IS NO LONGER THE ROLE LIST. The audit of the specialties took
 * five of its forty keys off the pack's role list (./rolListesi.ts); the owner's names for them stay in his list and
 * are shown nowhere. What a screen can show is the identity of a role the pack HAS: 35 of the 40.
 */
const GORUNEN = UZ_ASISTAN_ADLARI.filter((a) => uzRolMu(a.bransAnahtari))
const CIKARILAN = UZ_ASISTAN_ADLARI.filter((a) => !uzRolMu(a.bransAnahtari)).map((a) => a.bransAnahtari)

test('35 of the owner\'s 40 names are shown: the five roles the audit took out keep their entry in his list and have no identity on any screen', () => {
  assert.equal(GORUNEN.length, 35)
  assert.deepEqual(CIKARILAN, ['sac-ekimi', 'longevity', 'diyetisyen', 'ergoterapi', 'odyoloji'])
  for (const k of CIKARILAN) { assert.ok(uzAsistanAdi(k), k); for (const f of FORMLAR) assert.equal(uzAsistanKimligi(k, f), null, `${k}/${f}`) }
  // every doctor specialty the owner named is still a doctor specialty, and still carries the professor's title
  for (const a of GORUNEN) if (a.taraf === 'doktor') assert.equal(a.unvan, 'prof-dr', a.bransAnahtari)
})

test('full and short form, as the Turkish product writes them: "Prof. Dr. <given> <family>" and "Prof. <given>"; the given name alone', () => {
  for (const a of GORUNEN) {
    const k = uzAsistanKimligi(a.bransAnahtari, 'uz-Latn')!
    const [tam, kisa] = a.unvan === 'prof-dr' ? ['Prof. Dr.', 'Prof.'] : a.unvan === 'dr' ? ['Dr.', 'Dr.'] : [a.meslekUnvani, a.meslekUnvani]
    assert.deepEqual(k, { tamAd: `${tam} ${a.kisaAd} ${a.soyad}`, kisaAd: a.kisaAd, unvanliKisaAd: `${kisa} ${a.kisaAd}`, makineTuretimi: false }, a.bransAnahtari)
  }
  // In the other two forms: the title is the catalogue's word (or the profession's title converted by rule), the name is converted by rule.
  for (const f of ['uz-Cyrl', 'ru'] as const) {
    const cevir = (x: string) => (f === 'ru' ? uzRuschaYozuvga(uzKirillga(x)) : uzKirillga(x))
    for (const a of GORUNEN) {
      const k = uzAsistanKimligi(a.bransAnahtari, f)!
      const u = a.unvan === 'meslek' ? { tam: cevir(a.meslekUnvani!), kisa: cevir(a.meslekUnvani!) } : UZ_ASISTAN_UNVANLARI[f][a.unvan]
      assert.deepEqual(k, { tamAd: `${u.tam} ${cevir(a.kisaAd)} ${cevir(a.soyad)}`, kisaAd: cevir(a.kisaAd), unvanliKisaAd: `${u.kisa} ${cevir(a.kisaAd)}`, makineTuretimi: true }, `${a.bransAnahtari}/${f}`)
      assert.doesNotMatch(k.tamAd + k.unvanliKisaAd, /[A-Za-z]/, `${a.bransAnahtari}/${f}: a Latin letter is left`)
    }
  }
  // Three examples, written out.
  assert.deepEqual(FORMLAR.map((f) => uzAsistanKimligi('pediatri', f)!.tamAd), ['Prof. Dr. Malika Nazarova', 'Проф. д-р Малика Назарова', 'Проф. д-р Малика Назарова'])
  assert.deepEqual(FORMLAR.map((f) => uzAsistanKimligi('pediatri', f)!.unvanliKisaAd), ['Prof. Malika', 'Проф. Малика', 'Проф. Малика'])
  assert.deepEqual(FORMLAR.map((f) => uzAsistanKimligi('enfeksiyon-hastaliklari', f)!.tamAd), ['Prof. Dr. Otabek Qodirov', 'Проф. д-р Отабек Қодиров', 'Проф. д-р Отабек Кодиров'])
  assert.deepEqual(FORMLAR.map((f) => uzAsistanKimligi('fizyoterapi', f)!.tamAd), ['Fizioterapevt Jasmina Abdullayeva', 'Физиотерапевт Жасмина Абдуллаева', 'Физиотерапевт Жасмина Абдуллаева'])
  assert.deepEqual(FORMLAR.map((f) => uzAsistanKimligi('klinik-psikolog', f)!.tamAd), ['Dr. Doniyor Saidov', 'Д-р Дониёр Саидов', 'Д-р Дониёр Саидов'])
})

test('the catalogue of titles: three forms, each in its own script, marked machine-written; nothing of another country in any title or name', () => {
  const bas = readFileSync(join(KOK, 'countries/uz/klinik/asistanUnvanlari.ts'), 'utf8').slice(0, 1200)
  assert.match(bas, /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW\./)
  assert.deepEqual(Object.keys(UZ_ASISTAN_UNVANLARI), [...FORMLAR])
  for (const f of FORMLAR) {
    assert.deepEqual(Object.keys(UZ_ASISTAN_UNVANLARI[f]), ['prof-dr', 'dr'])
    for (const u of Object.values(UZ_ASISTAN_UNVANLARI[f])) for (const x of [u.tam, u.kisa]) {
      assert.ok(x.trim().length >= 3, `${f}: an empty title`)
      if (f === 'uz-Latn') assert.doesNotMatch(x, /[Ѐ-ӿ]/, `${f}: Cyrillic in "${x}"`)
      else assert.doesNotMatch(x, /[A-Za-z]/, `${f}: Latin in "${x}"`)
      // A title is an abbreviation, never a rank or a career written out.
      assert.doesNotMatch(x, /professor|профессор|\d/i, x)
      assert.deepEqual(sizintiTara(x, { hedefUlke: 'uz', kaynak: `title ${f}` }), [])
    }
    for (const a of GORUNEN) {
      const k = uzAsistanKimligi(a.bransAnahtari, f)!
      for (const x of [k.tamAd, k.unvanliKisaAd, k.kisaAd]) {
        assert.deepEqual(sizintiTara(x, { hedefUlke: 'uz', kaynak: `assistant ${a.bransAnahtari}/${f}` }), [])
        assert.doesNotMatch(x, /[çğıöşüİÇĞÖŞÜ]/, `${a.bransAnahtari}/${f}: a Turkish letter`)
      }
      if (f === 'ru') assert.doesNotMatch(k.tamAd, /[ўқғҳЎҚҒҲ]/, `${a.bransAnahtari}: the Russian form has an Uzbek-only letter`)
    }
  }
})

test('lookup: known key answers, unknown key is null (no fallback to another specialty)', () => {
  assert.equal(uzAsistanAdi('pediatri')?.soyad, 'Nazarova')
  assert.equal(uzAsistanAdi('odyoloji')?.kisaAd, 'Rayhon')
  assert.equal(uzAsistanAdi('yok-boyle-brans'), null)
  for (const f of FORMLAR) assert.equal(uzAsistanKimligi('yok-boyle-brans', f), null)
})
