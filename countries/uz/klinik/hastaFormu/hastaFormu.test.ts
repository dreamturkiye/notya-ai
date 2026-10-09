/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: THE INTAKE FORM's content — the core questions, the questions of each of the 40
 * roles, the consent sentence, and the text of the form's screens. Table-driven: every check on a role runs for
 * every role.
 *
 * What is Uzbekistan's own here (the form's rules, storage, routes and screens are the kit's and are tested for every
 * pack: lib/ulke/intake/intake.paket.test.ts, components/ulke/portal/formEkranlari.paket.test.ts):
 *
 *   1. LEAK TEST over every new string and every question, in the three forms: nothing empty, each form in its own
 *      script (Uzbek Latin with ʻ and ʼ, never a typewriter apostrophe; no Latin letter in the Cyrillic and Russian
 *      forms; no Uzbek-only letter in Russian), no Turkish word or letter, and the three forms really are three texts.
 *   2. THE 40 ROLES: each has a set of its own, marked machine-written and read by no clinician; its keys carry the
 *      role's own mark; a form of one role holds the core questions and that role's — never another role's.
 *   3. THE GUARDIAN FORM: begins with who is filling it in; the parents' marital status is asked there and nowhere
 *      else; an adult's smoking, alcohol and emergency contact are never asked about a child.
 *   4. NOTHING OF TÜRKİYE, NO REFERENCE CONTENT: no identity or insurance number is asked; no dose, no drug list, no
 *      schedule; the unit of a measure is never written into a question. What a form would need is a slot — empty
 *      and switched off — and every slot is a row of the country's record.
 *   5. THE RECORD: docs/COUNTRY-PACK-UZBEKISTAN.md states each role's status, and lists every patient-facing
 *      sentence of the screens and the consent sentence exactly as they stand in the code.
 *
 * No network, no database, no provider: content only.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import { formBolumleri, formGorunumu, formIcerigiSorunlari, formSorulari, ROL_BOLUMU } from '@/lib/ulke/intake/sorular'
import type { Soru } from '@/lib/ulke/intake/tipler'
import { UZ_ROLLER } from '../rolAdlari'
import { UZ_FORM_YEREL_ICERIK, UZ_HASTA_FORMU } from './index'

const KOK = resolve(__dirname, '../../../..')
const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
type Form = (typeof FORMLAR)[number]
type Uc = Readonly<Record<string, string>>
const BIRIMLER = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' } as const

/** Every text of one question, with a name that says where it is. */
function soruMetinleri(yer: string, q: Soru): [string, Uc][] {
  const c: [string, Uc][] = [[`${yer}.${q.anahtar}`, q.metin as Uc]]
  if (q.veliMetni) c.push([`${yer}.${q.anahtar} (guardian wording)`, q.veliMetni as Uc])
  if (q.yardim) c.push([`${yer}.${q.anahtar} (help)`, q.yardim as Uc])
  if (q.tur === 'evet-hayir' && q.ayrinti) c.push([`${yer}.${q.anahtar} (detail)`, q.ayrinti as Uc])
  if (q.tur === 'tek-secim' || q.tur === 'cok-secim') for (const o of q.secenekler) c.push([`${yer}.${q.anahtar} → ${o.anahtar}`, o.ad as Uc])
  if (q.tur === 'sayi' && !q.olcu) c.push([`${yer}.${q.anahtar} (unit)`, q.birim as Uc])
  return c
}
/** Every text of the form's clinical content: consent, headings, questions, help, detail labels, options, units. */
function butunMetinler(): [string, Uc][] {
  const F = UZ_HASTA_FORMU
  const c: [string, Uc][] = [['consent', F.riza.metin as Uc], ['consent (guardian)', F.riza.veliMetni as Uc]]
  for (const b of F.cekirdek.bolumler) {
    c.push([`core/${b.anahtar} (heading)`, b.baslik as Uc])
    if (b.veliBasligi) c.push([`core/${b.anahtar} (guardian heading)`, b.veliBasligi as Uc])
    for (const q of b.sorular) c.push(...soruMetinleri(`core/${b.anahtar}`, q))
  }
  for (const [rol, r] of Object.entries(F.roller)) {
    c.push([`${rol} (heading)`, r.baslik as Uc])
    if (r.veliBasligi) c.push([`${rol} (guardian heading)`, r.veliBasligi as Uc])
    for (const q of r.sorular) c.push(...soruMetinleri(rol, q))
  }
  return c
}
function yaprak(o: unknown, on = ''): [string, string][] {
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === 'string' ? [[`${on}${k}`, v] as [string, string]] : yaprak(v, `${on}${k}.`)))
}

/** One string of one form: in its own script, with nothing of another country in it. */
function bicimTemiz(f: Form, v: string, yer: string) {
  assert.ok(typeof v === 'string' && v.trim().length > 0, `${f}/${yer} is empty`)
  assert.equal(v, v.trim(), `${f}/${yer} begins or ends with a space`)
  assert.deepEqual(sizintiTara(v, { hedefUlke: 'uz', kaynak: `${f}/${yer}` }), [])
  assert.doesNotMatch(v, /[çğıİşĞŞöüÖÜâîû]/, `${f}/${yer} has a Turkish letter: "${v}"`)
  assert.doesNotMatch(v, /'|`|’|‘/, `${f}/${yer}: a typewriter or curly apostrophe (Uzbek Latin uses ʻ and ʼ): "${v}"`)
  assert.doesNotMatch(v, /hasta|randevu|doktor|hekim|muayene|veli\b|sigorta|kimlik/i, `${f}/${yer} carries a Turkish word: "${v}"`)
  if (f === 'uz-Latn') assert.doesNotMatch(v, /[Ѐ-ӿ]/, `uz-Latn/${yer} has a Cyrillic letter: "${v}"`)
  if (f === 'uz-Cyrl') assert.doesNotMatch(v, /[A-Za-zʻʼ]/, `uz-Cyrl/${yer} has a Latin letter: "${v}"`)
  if (f === 'ru') assert.doesNotMatch(v, /[A-Za-zʻʼўқғҳЎҚҒҲ]/, `ru/${yer} has a Latin or Uzbek-only letter: "${v}"`)
}

describe('Uzbekistan — the intake form: questions of the core set and of the 40 roles, in three forms', () => {
  let FM: typeof import('../../uygulama/formMetinleri')
  let A: typeof import('@/lib/ulke/arayuz')
  before(async () => { FM = await import('../../uygulama/formMetinleri'); A = await import('@/lib/ulke/arayuz') })

  it('every file of the content says, at its top, that it is machine-written and what it waits for', () => {
    const bas = (d: string, n = 2600) => readFileSync(join(KOK, d), 'utf8').slice(0, n)
    assert.match(bas('countries/uz/klinik/hastaFormu/index.ts'), /MACHINE-WRITTEN, EVERY SET\. AWAITS A LOCAL CLINICIAN\./)
    assert.match(bas('countries/uz/klinik/hastaFormu/index.ts'), /THE CONSENT SENTENCE IS A DRAFT\. NOT READ BY A LAWYER/)
    assert.match(bas('countries/uz/klinik/hastaFormu/cekirdek.ts'), /MACHINE-WRITTEN\. AWAITS A LOCAL CLINICIAN AND A NATIVE READER\./)
    for (const d of ['roller1.ts', 'roller2.ts', 'roller3.ts']) {
      const t = bas(`countries/uz/klinik/hastaFormu/${d}`)
      assert.match(t, /MACHINE-WRITTEN\. EVERY SET AWAITS A LOCAL CLINICIAN/, d); assert.match(t, /PATIENT-FACING/, d); assert.match(t, /no reference content|Everything said at the top of \.\/roller1\.ts holds here/i, d)
    }
    const katalog = bas('countries/uz/uygulama/formMetinleri.ts')
    assert.match(katalog, /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW\./); assert.match(katalog, /PATIENT-FACING/); assert.match(katalog, /THE PIN IS NEVER IN THE INVITATION/)
    // The pack's own marks: no set is called reviewed, and the consent sentence is not called read by a lawyer.
    assert.equal(UZ_HASTA_FORMU.riza.hukukcuInceledi, false)
    assert.deepEqual(UZ_HASTA_FORMU.cekirdek.inceleme, { makineYazimi: true, klinisyen: null })
    assert.match(UZ_HASTA_FORMU.surum, /^uz-taslak-/); assert.match(UZ_HASTA_FORMU.riza.surum, /^uz-taslak-/)
  })

  it('LEAK TEST over every question, heading, option, help line, unit and the consent sentence, in all three forms', () => {
    const hepsi = butunMetinler()
    assert.ok(hepsi.length >= 800, `only ${hepsi.length} texts were found`)
    for (const [yer, m] of hepsi) {
      assert.deepEqual(Object.keys(m).sort(), [...FORMLAR].sort(), `${yer}: exactly the three forms of this country`)
      for (const f of FORMLAR) bicimTemiz(f, m[f], yer)
      // The three forms really are three texts.
      assert.notEqual(m['uz-Cyrl'], m['uz-Latn'], `${yer}: uz-Cyrl is the Latin line`)
      if (m['uz-Cyrl'].length > 14) assert.notEqual(m['uz-Cyrl'], m.ru, `${yer}: uz-Cyrl and ru are the same sentence ("${m.ru}")`)
      // What stands in one form stands in all: digits, and the mark that ends a question.
      const rakam = (s: string) => (s.match(/\d+/g) ?? []).join(',')
      assert.equal(rakam(m['uz-Cyrl']), rakam(m['uz-Latn']), `${yer}: digits differ in uz-Cyrl`); assert.equal(rakam(m.ru), rakam(m['uz-Latn']), `${yer}: digits differ in ru`)
      assert.equal(m['uz-Cyrl'].endsWith('?'), m['uz-Latn'].endsWith('?'), `${yer}: one Uzbek form asks, the other does not`)
    }
    const yigin = (f: Form) => hepsi.map((x) => x[1][f]).join(' ')
    // Uzbek is written as Uzbek: the Latin form uses its own letters, the Cyrillic form its own.
    assert.match(yigin('uz-Latn'), /ʻ/); assert.match(yigin('uz-Latn'), /ʼ/); assert.match(yigin('uz-Cyrl'), /[ўқғҳ]/)
    // Nothing is to be supplied later by way of a marker: a missing piece is a SLOT, not a sentence on a patient's screen.
    for (const f of FORMLAR) assert.doesNotMatch(yigin(f), /TODO|EKSIK|XXX|\?\?\?|…{2,}/i, f)
  })

  it('LEAK TEST over every sentence of the form\'s screens, in all three forms: same keys, each form in its own script, same placeholders', () => {
    const [lat, kir, ru] = FORMLAR.map((f) => yaprak(FM.UZ_FORM_METINLERI[f]))
    assert.equal(lat.length, 30 + 4 + 29 + 3, `the form catalogue has ${lat.length} entries per form`)
    assert.deepEqual(kir.map((x) => x[0]), lat.map((x) => x[0])); assert.deepEqual(ru.map((x) => x[0]), lat.map((x) => x[0]))
    for (let i = 0; i < lat.length; i++) {
      const k = lat[i][0]
      const birimMi = k.startsWith('birim.')
      for (const [f, v] of [['uz-Latn', lat[i][1]], ['uz-Cyrl', kir[i][1]], ['ru', ru[i][1]]] as const) bicimTemiz(f, v, k)
      if (!birimMi) {
        assert.notEqual(kir[i][1], lat[i][1], `${k}: uz-Cyrl is the Latin line`)
        if (kir[i][1].length > 14) assert.notEqual(kir[i][1], ru[i][1], `${k}: uz-Cyrl and ru are the same sentence`)
      }
      const yer = (s: string) => [...s.matchAll(/%\d?/g)].map((x) => x[0]).sort()
      assert.deepEqual(yer(kir[i][1]), yer(lat[i][1]), `${k}: placeholders differ in uz-Cyrl`); assert.deepEqual(yer(ru[i][1]), yer(lat[i][1]), `${k}: placeholders differ in ru`)
    }
    for (const f of FORMLAR) {
      const m = FM.UZ_FORM_METINLERI[f]
      // The kit reads exactly these three.
      assert.equal(A.formMetni(f), m)
      // The invitation: the address is the last thing in it, and the PIN is never a place in it.
      assert.match(m.davet.metin, /%2$/, f); assert.match(m.davet.metinAdsiz, /%$/, f)
      assert.doesNotMatch(m.davet.baglantisiz + m.davet.baglantisizAdsiz, /%\d/, f)
      for (const [k, v] of yaprak(m.davet)) assert.doesNotMatch(v.replace(/%\d?/g, ''), /\d/, `${f}/davet.${k}: a digit in an invitation`)
      // The doctor's view says, in every form, that the answers are the patient's words and are not verified.
      assert.ok(m.hekim.beyan.length > 10 && m.hekim.veliBeyani.length > 10 && m.hekim.notaGirmez.length > 10, f)
      // The units the pack measures in have a name in every form; a unit it does not use has none.
      assert.deepEqual(Object.keys(m.birim).sort(), ['C', 'cm', 'kg'], f)
    }
    assert.equal(A.formMetni('tr'), FM.UZ_FORM_METINLERI['uz-Latn'], 'an unknown form is the pack\'s default, never another country')
  })

  it('THE KIT\'S OWN CHECK finds nothing wrong with the content: types, keys, options, ranges, a set for every role', () => {
    assert.deepEqual(formIcerigiSorunlari(UZ_HASTA_FORMU, UZ_ROLLER, FORMLAR), [])
  })

  it('THE 40 ROLES, one by one: a set of its own, machine-written and read by no clinician, keys under the role\'s own mark, never another role\'s question', () => {
    assert.equal(UZ_ROLLER.length, 40)
    assert.deepEqual(Object.keys(UZ_HASTA_FORMU.roller).sort(), [...UZ_ROLLER].sort(), 'a set for each of the 40 roles, and for nothing else')
    const cekirdek = new Set(UZ_HASTA_FORMU.cekirdek.bolumler.flatMap((b) => b.sorular.map((q) => q.anahtar)))
    assert.equal(cekirdek.size, 23, 'the core questions')
    const isaretler = new Map<string, string>()
    const sahibi = new Map<string, string>()
    let toplam = 0
    for (const rol of UZ_ROLLER) {
      const r = UZ_HASTA_FORMU.roller[rol]
      assert.deepEqual(r.inceleme, { makineYazimi: true, klinisyen: null }, `${rol}: the set must say it is machine-written and unread`)
      assert.ok(r.sorular.length >= 4 && r.sorular.length <= 9, `${rol}: ${r.sorular.length} questions`)
      toplam += r.sorular.length
      // One mark per role, and every key of the role under it: a key can belong to one set only.
      const isaret = new Set(r.sorular.map((q) => q.anahtar.split('_')[0]))
      assert.equal(isaret.size, 1, `${rol}: keys under more than one mark: ${[...isaret].join(', ')}`)
      const m = [...isaret][0]
      assert.match(m, /^[a-z]{2}$/, `${rol}: mark "${m}"`)
      assert.ok(!isaretler.has(m), `${rol}: the mark "${m}" is also ${isaretler.get(m)}'s`)
      isaretler.set(m, rol)
      for (const q of r.sorular) {
        assert.ok(!cekirdek.has(q.anahtar), `${rol}.${q.anahtar} is a core key`)
        assert.ok(!sahibi.has(q.anahtar), `${q.anahtar} is listed by ${rol} and by ${sahibi.get(q.anahtar)}`)
        sahibi.set(q.anahtar, rol)
      }
      // A FORM of this role, for an adult and for a guardian, for each recorded sex and for none.
      for (const veli of [false, true]) for (const cinsiyet of ['female', 'male', ''] as const) {
        const bolumler = formBolumleri(UZ_HASTA_FORMU, { rol, veli, cinsiyet })
        const son = bolumler[bolumler.length - 1]
        assert.equal(son.anahtar, ROL_BOLUMU, `${rol}: the role's section comes last`)
        assert.equal(bolumler.filter((b) => b.anahtar === ROL_BOLUMU).length, 1)
        const kendi = new Set(r.sorular.map((q) => q.anahtar))
        for (const q of formSorulari(UZ_HASTA_FORMU, { rol, veli, cinsiyet })) assert.ok(cekirdek.has(q.anahtar) || kendi.has(q.anahtar), `${rol}: the form holds "${q.anahtar}", which is ${sahibi.get(q.anahtar) ?? 'nobody'}'s`)
        assert.ok(son.sorular.length >= 3, `${rol}: only ${son.sorular.length} role question(s) on the ${veli ? 'guardian' : 'adult'} form (${cinsiyet || 'no sex recorded'})`)
        // Drawn in each form: every question has text, every choice its options, every number its unit and range.
        for (const f of FORMLAR) {
          for (const b of formGorunumu(UZ_HASTA_FORMU, { rol, veli, cinsiyet }, f, BIRIMLER, { cm: 'cm', kg: 'kg', C: 'C' })) {
            assert.ok(b.baslik.length > 0, `${rol}/${f}: a section without a heading`)
            for (const q of b.sorular) {
              assert.ok(q.metin.length > 0, `${rol}/${f}/${q.anahtar}: no text`)
              if (q.secenekler) assert.ok(q.secenekler.length >= 2 && q.secenekler.every((o) => o.ad.length > 0), `${rol}/${f}/${q.anahtar}: options`)
              if (q.birim) assert.ok(q.birim.ad.length > 0 && q.birim.enAz < q.birim.enCok, `${rol}/${f}/${q.anahtar}: unit or range`)
            }
          }
        }
      }
    }
    assert.equal(toplam, 228, 'the role questions of the 40 sets')
    assert.equal(isaretler.size, 40)
    // A role the country does not have, and no role at all: the core questions only.
    for (const rol of ['pediatri-yok', 'toString', '__proto__', null]) assert.ok(formBolumleri(UZ_HASTA_FORMU, { rol, veli: false, cinsiyet: '' }).every((b) => b.anahtar !== ROL_BOLUMU), String(rol))
  })

  it('THE GUARDIAN FORM: begins with who is filling it in; the parents\' marital status is asked there only; an adult\'s habits and emergency contact are never asked about a child', () => {
    for (const rol of UZ_ROLLER) {
      const cocuk = formBolumleri(UZ_HASTA_FORMU, { rol, veli: true, cinsiyet: '' })
      const yetiskin = formBolumleri(UZ_HASTA_FORMU, { rol, veli: false, cinsiyet: '' })
      assert.equal(cocuk[0].anahtar, 'toldiruvchi', `${rol}: the guardian form does not begin with who fills it in`)
      assert.deepEqual(cocuk[0].sorular.map((q) => q.anahtar), ['vakil_kim', 'vakil_ism', 'vakil_telefon', 'ota_ona_holati'])
      assert.deepEqual(cocuk[0].sorular.filter((q) => q.zorunlu).map((q) => q.anahtar), ['vakil_kim', 'vakil_ism'])
      const ck = new Set(cocuk.flatMap((b) => b.sorular.map((q) => q.anahtar))), yk = new Set(yetiskin.flatMap((b) => b.sorular.map((q) => q.anahtar)))
      for (const k of ['vakil_kim', 'vakil_ism', 'vakil_telefon', 'ota_ona_holati', 'uyda_chekish']) { assert.ok(ck.has(k), `${rol}: guardian form lacks ${k}`); assert.ok(!yk.has(k), `${rol}: an adult is asked ${k}`) }
      for (const k of ['chekish', 'alkogol', 'homiladorlik']) { assert.ok(yk.has(k), `${rol}: adult form lacks ${k}`); assert.ok(!ck.has(k), `${rol}: a guardian is asked ${k} about a child`) }
      assert.ok(yetiskin.some((b) => b.anahtar === 'yaqin') && !cocuk.some((b) => b.anahtar === 'yaqin'), `${rol}: the emergency contact is an adult's section`)
      assert.ok(!yetiskin.some((b) => b.anahtar === 'toldiruvchi'))
    }
    // Pregnancy is asked of a woman, and where no sex is recorded — never of a man.
    const anahtarlar = (cinsiyet: 'female' | 'male' | '') => formSorulari(UZ_HASTA_FORMU, { rol: null, veli: false, cinsiyet }).map((q) => q.anahtar)
    assert.ok(anahtarlar('female').includes('homiladorlik') && anahtarlar('').includes('homiladorlik') && !anahtarlar('male').includes('homiladorlik'))
    // Every core question that speaks to its reader ("your …") has a second wording for a parent, in the three forms.
    for (const b of UZ_HASTA_FORMU.cekirdek.bolumler) for (const q of b.sorular) {
      if (b.kime || q.kime) continue
      const m = q.metin as Uc
      if (/ingiz|siz\b/.test(m['uz-Latn']) || /\b(вы|вас|вам|ваш|ваша|ваше|ваши|у вас)\b/i.test(m.ru)) {
        assert.ok(q.veliMetni, `core/${q.anahtar} speaks to the patient ("${m['uz-Latn']}") and has no wording for a guardian`)
        for (const f of FORMLAR) assert.notEqual((q.veliMetni as Uc)[f], m[f], `core/${q.anahtar}: the guardian wording is the adult's (${f})`)
      }
    }
    // A ROLE's question is written impersonally. Where one does speak of the reader's own body or habits ("how many hours
    // do you sleep?"), it has a second wording for a parent, or belongs to the adult form only.
    for (const [rol, r] of Object.entries(UZ_HASTA_FORMU.roller)) for (const q of r.sorular) {
      const m = q.metin as Uc
      if (/(Sogʻligʻingiz|uxlaysiz|ovqatlanasiz|ichasiz|chekasiz|yeysiz|vazningiz|boʻyingiz)/.test(m['uz-Latn']) || /вы (спите|едите|пьёте|курите)|вашего здоровья|в отношении здоровья\?/i.test(m.ru)) assert.ok(q.veliMetni || q.kime === 'yetiskin', `${rol}.${q.anahtar} speaks of the reader's own habits ("${m['uz-Latn']}") and has no wording for a guardian`)
      if (q.veliMetni) for (const f of FORMLAR) assert.notEqual((q.veliMetni as Uc)[f], m[f], `${rol}.${q.anahtar}: the guardian wording is the adult's (${f})`)
    }
    // The consent sentence a guardian reads is its own sentence, and names the child.
    for (const f of FORMLAR) assert.notEqual((UZ_HASTA_FORMU.riza.veliMetni as Uc)[f], (UZ_HASTA_FORMU.riza.metin as Uc)[f])
    assert.match((UZ_HASTA_FORMU.riza.veliMetni as Uc)['uz-Latn'], /bolaning/); assert.match((UZ_HASTA_FORMU.riza.veliMetni as Uc).ru, /ребёнка/)
  })

  it('NOTHING OF TÜRKİYE AND NO REFERENCE CONTENT: no identity or insurance number, no dose, no schedule; the unit of a measure is never in a question', () => {
    const hepsi = butunMetinler()
    for (const [yer, m] of hepsi) {
      const lat = m['uz-Latn'], kirVeRu = `${m['uz-Cyrl']} ${m.ru}`
      // Identity, payer, insurance: not asked in any wording.
      assert.doesNotMatch(lat, /pasport|JSHSHIR|PINFL|sugʻurta|polis\b|guvohnoma|T\.?C\.?\b|SGK|KVKK|e-?Nabız/i, `${yer}: identity or insurance ("${lat}")`)
      assert.doesNotMatch(kirVeRu, /паспорт|ЖШШИР|ПИНФЛ|суғурта|страхов|полис(?!ист)|гувоҳнома|свидетельств/i, `${yer}: identity or insurance ("${kirVeRu}")`)
      // No dose, strength or frequency of a medicine; no percentage; no age band that would be a schedule.
      assert.doesNotMatch(`${lat} ${kirVeRu}`, /\d\s*(mg|mkg|ml|мг|мкг|мл|ME\b|МЕ\b|ХБ\b|%)/, `${yer}: a dose or a percentage`)
      assert.doesNotMatch(`${lat} ${kirVeRu}`, /\d+\s*[-–]\s*\d+\s*(yosh|oy|ёш|ой|лет|мес)/, `${yer}: an age band`)
      // An emergency number, a web address or a phone number is never part of a question.
      assert.doesNotMatch(`${lat} ${kirVeRu}`, /\b10[1-4]\b|\b112\b|https?:|www\.|\+\d/, `${yer}: a number to call or an address`)
    }
    // Digits appear only where a scale's two ends are described in words (0 … 10), and nowhere else.
    const rakamli = hepsi.filter(([, m]) => /\d/.test(m['uz-Latn']))
    for (const [yer, m] of rakamli) assert.match(m['uz-Latn'], /\(0 — [^)]+, 10 — [^)]+\)/, `${yer}: a digit outside a described 0–10 scale ("${m['uz-Latn']}")`)
    // A measure is asked in the PACK's unit: the kit writes the unit beside the field, the question never does.
    const olculer: [string, Soru][] = [...UZ_HASTA_FORMU.cekirdek.bolumler.flatMap((b) => b.sorular.map((q) => [`core/${b.anahtar}`, q] as [string, Soru])), ...Object.entries(UZ_HASTA_FORMU.roller).flatMap(([rol, r]) => r.sorular.map((q) => [rol, q] as [string, Soru]))].filter(([, q]) => q.tur === 'sayi' && Boolean(q.olcu))
    for (const o of ['boy', 'agirlik', 'sicaklik']) assert.ok(olculer.some(([, q]) => q.tur === 'sayi' && q.olcu === o), `no question asks the measure "${o}" in the pack's unit`)
    for (const [yer, q] of olculer) for (const [ad, m] of soruMetinleri(yer, q)) {
      assert.doesNotMatch(m['uz-Latn'], /\b(sm|kg|gramm|santimetr|kilogramm|daraja)\b|°/i, `${ad}: the unit is written into the question`)
      assert.doesNotMatch(`${m['uz-Cyrl']} ${m.ru}`, /(^|[^а-яёўқғҳ])(см|кг|грамм|сантиметр|килограмм|даража|градус)[а-я]*($|[^а-яёўқғҳ])|°/i, `${ad}: the unit is written into the question`)
    }
    // Every choice offers everyday words, never a list a clinician would have to keep current: no option names a
    // medicine group by a trade or generic name (those are free text), and no choice is long enough to be a catalogue.
    for (const [rol, r] of Object.entries(UZ_HASTA_FORMU.roller)) for (const q of r.sorular) {
      if (q.tur === 'tek-secim' || q.tur === 'cok-secim') assert.ok(q.secenekler.length <= 10, `${rol}.${q.anahtar}: ${q.secenekler.length} options`)
    }
  })

  it('THE MARKED SLOTS: 18, every one empty and switched off, each naming who must supply it and the roles that wait for it', () => {
    assert.equal(UZ_FORM_YEREL_ICERIK.length, 18)
    assert.equal(new Set(UZ_FORM_YEREL_ICERIK.map((y) => y.anahtar)).size, 18)
    for (const y of UZ_FORM_YEREL_ICERIK) {
      assert.equal(y.acik, false, `${y.anahtar} is switched on`); assert.equal(y.icerik, null, `${y.anahtar} holds content`)
      assert.match(y.anahtar, /^[a-z_]+$/)
      assert.ok(y.eksik.length > 40 && y.bugun.length > 5, `${y.anahtar}: says what is missing and what the form does today`)
      assert.ok(['a local clinician', 'a lawyer', 'the owner, with a local source'].includes(y.kimden))
      assert.ok(y.roller.length > 0)
      for (const r of y.roller) assert.ok(r === 'core' || UZ_ROLLER.includes(r), `${y.anahtar}: "${r}" is not a role of this country`)
      assert.doesNotMatch(y.eksik + y.bugun, /[çğıİşĞŞöüÖÜ]/, `${y.anahtar}: a Turkish letter`)
    }
    // No question reads a slot: the content holds no reference to them.
    for (const d of ['cekirdek.ts', 'roller1.ts', 'roller2.ts', 'roller3.ts']) assert.doesNotMatch(readFileSync(join(KOK, `countries/uz/klinik/hastaFormu/${d}`), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), /UZ_FORM_YEREL_ICERIK|yerelIcerik/, d)
  })

  it('THE RECORD: docs/COUNTRY-PACK-UZBEKISTAN.md states each role\'s status and every slot, and lists every patient-facing sentence exactly as it stands in the code', () => {
    const kayit = readFileSync(join(KOK, 'docs/COUNTRY-PACK-UZBEKISTAN.md'), 'utf8')
    assert.match(kayit, /^## The intake form/m)
    // Per role, in the roles table: how many questions, written by a machine, read by no clinician.
    for (const rol of UZ_ROLLER) {
      const satir = kayit.split('\n').find((x) => x.startsWith('| ') && x.includes(`| \`${rol}\` |`) && x.includes('| yes |'))
      assert.ok(satir, `${rol}: no status row`)
      const n = UZ_HASTA_FORMU.roller[rol].sorular.length
      assert.ok(satir!.endsWith(`| ${n} questions, machine-written, read by no clinician |`), `${rol}: the status row does not end with the intake status (${n} questions): …${satir!.slice(-90)}`)
    }
    // Every slot is a row, with who supplies it.
    for (const y of UZ_FORM_YEREL_ICERIK) {
      const satir = kayit.split('\n').find((x) => x.startsWith('| F') && x.includes(`| \`${y.anahtar}\` |`))
      assert.ok(satir, `the record has no row for the slot ${y.anahtar}`)
      assert.ok(satir!.includes(`| ${y.kimden} |`), `${y.anahtar}: the row does not say who supplies it`)
      assert.ok(satir!.includes(y.eksik) && satir!.includes(y.bugun), `${y.anahtar}: the row is not the text of countries/uz/klinik/hastaFormu/yerelIcerik.ts`)
    }
    // The consent sentence, both wordings, and every patient-facing sentence of the screens, in three forms.
    let n = 0
    for (const f of FORMLAR) {
      for (const v of [(UZ_HASTA_FORMU.riza.metin as Uc)[f], (UZ_HASTA_FORMU.riza.veliMetni as Uc)[f]]) { assert.ok(kayit.includes(v), `the record does not list the consent sentence (${f}): "${v}"`); n++ }
      for (const grup of ['davet', 'hasta'] as const) for (const [k, v] of yaprak(FM.UZ_FORM_METINLERI[f][grup])) {
        assert.ok(kayit.includes(v), `docs/COUNTRY-PACK-UZBEKISTAN.md does not list ${f} ${grup}.${k}: "${v}" — the list in the record must be the text in countries/uz/uygulama/formMetinleri.ts`)
        n++
      }
    }
    assert.equal(n, (2 + 4 + 29) * 3, 'the consent sentence and every patient-facing sentence, in three forms')
    assert.match(kayit, /countries\/uz\/klinik\/hastaFormu\//)
    assert.match(kayit, /not read by a lawyer/i)
  })
})
