/**
 * NOTYA-ULKE-OZEL-01 — EVERY EXTENSION POINT A COUNTRY HAS, ON A COMPLETE PACK: the kit's test country "xx"
 * (lib/ulke/testing/ornekUlke/), which takes the English language set as a real English-speaking country does and
 * uses everything one country may now state without touching another. It is in no build; nothing in it is clinical
 * content. Each rule on the kit's own functions: lib/ulke/araclar/ulkeyeOzel.test.ts. That none of it reaches a real
 * country: lib/ulke/ulkeyeOzel.paket.test.ts (once per country folder) and wall rule D7.
 *
 *   0. THE PACK IS COMPLETE          the whole pack check finds nothing
 *   1. ROLES OF ITS OWN              add, rename, remove, split, merge; a role behaves like another for its note
 *                                    template, its instruction to the model and its intake questions — unless it
 *                                    brings its own; the role table
 *   2. A TOOL CATALOGUE OF ITS OWN   tools only it has; who sees a shared tool; every doctor role; renamed and
 *                                    relabelled; another number of bands and of options; a kit tool the set has not
 *                                    written
 *   3. NUMBERS WITH THEIR UNITS      a limit and a table in the country's unit; two accepted units, chosen explicitly;
 *                                    a missing unit gives no result
 *   4. BY THE PATIENT                age and sex, beside the role
 *   5. LICENCE                       stated for every tool and placeholder; the notice under a result; a link-out
 *                                    tile; what is not free or permitted cannot be switched on
 *   6. ITS KEYS ARE ITS OWN          every key it adds carries its code and is on the list wall rule D7 enforces
 *   7. THE PACK CHECK IS NOT BLIND   each mistake a country could make with these, refused by name
 *   8. THE SHARED TOOLS, OPENED      (NOTYA-ULKE-ARAC-DUZELTME-01) a country's own steps, frequencies, grade table,
 *                                    asymmetry rule and bands on a tool of the kit; numbers it may state
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { EN_ROL_ARACLARI } from '@/countries/_dil/en/araclar'
import { EN_ROL_ALANLARI } from '@/countries/_dil/en/klinik/notSablonlari'
import { EN_ROLLER, enRolAnahtarlari, enRolTanimlari } from '@/countries/_dil/en/klinik/roller'
import { enArayuz } from '@/countries/_dil/en/arayuz'
import { enKlinik } from '@/countries/_dil/en/klinik'
import { birimAnahtari, type BirimOrtami } from './araclar/birimler'
import { girdiyiCoz, okunamayanAlanlar } from './araclar/girdi'
import { kitAraci } from './araclar/katalog'
import { aracCalistir, aracinKapisi, hekimRolleri, hesabinAraci, hesabinAraclari, lisansBildirimi, paketinAraci } from './araclar/paket'
import { LISANS_ACIK, LISANS_DURUMLARI, type PaketAraci, type UlkeAraclari } from './araclar/tipler'
import { ulkeyeOzelAnahtarlar } from './araclar/ulkeyeOzel'
import { icerikAnahtari } from './arayuz/rolIcerigi'
import { rolSablonAlanlari, sablonAlanlari, sablonlar, sablonMu } from './arayuz/notSablonu'
import type { UlkeArayuzu } from './arayuz/tipler'
import { formBolumleri } from './intake/sorular'
import { paketiDenetle } from './paketDenetimi'
import { XX, XX_ARAYUZ, XX_GIRDI, XX_KLINIK, XX_OZEL_ARACLAR, XX_OZEL_ROLLER, XX_PAKETI, XX_ROLLER } from './testing/ornekUlke'
import { rolTablosunuOku, rolTablosuSorunlari } from './testing/rolTablosu'
import { ULKE_KODLARI, type UlkeKlinigi } from './tipler'

const KOK = resolve(__dirname, '../..')
const D = 'en-GB'
const A = XX_ARAYUZ.araclar as UlkeAraclari
const ROLLER = XX_PAKETI.uygulama!.roller!
const O: BirimOrtami = { birimler: XX_PAKETI.uygulama!.birimler, lab: A.labBirimleri, sayi: XX_PAKETI.bicim, olculer: A.olculer }
const BUGUN = '2026-10-10'
const araci = (k: string): PaketAraci => A.araclar.find((p) => p.anahtar === k)!
const goren = (k: string): string[] => [null, ...ROLLER].filter((r) => hesabinAraci(A, r, k) !== null).map((r) => r ?? '(no role)')
const sonuc = (k: string, ham: Record<string, string | boolean>) => { const x = paketinAraci(A, k)!; const g = girdiyiCoz(x.tanim.alanlar, ham, O); return { ...aracCalistir(x, g, BUGUN, A), okunamayan: okunamayanAlanlar(x.tanim.alanlar, ham, g, O) } }
const sorunlar = (arayuz: UlkeArayuzu = XX_ARAYUZ, klinik: UlkeKlinigi = XX_KLINIK, paket = XX_PAKETI) => paketiDenetle(paket, arayuz, klinik).map((x) => `${x.yer}: ${x.sorun}`)

describe('0. the test country is a complete pack', () => {
  it('THE WHOLE PACK CHECK FINDS NOTHING: every extension point in use, and the pack would build', () => {
    assert.deepEqual(sorunlar(), [])
  })
  it('it is no country of the product, and it is in no build', () => {
    assert.equal(XX_PAKETI.kod, XX)
    assert.ok(!(ULKE_KODLARI as readonly string[]).includes(XX))
    for (const d of ['index.ts', 'klinik.ts', 'arayuz.ts']) assert.doesNotMatch(readFileSync(join(KOK, 'countries/active', d), 'utf8'), /'xx'|ornekUlke/, d)
    assert.doesNotMatch(readFileSync(join(KOK, 'countries/tumu.ts'), 'utf8'), /ornekUlke|\bxx\b/)
  })
})

describe('1. roles of its own', () => {
  const tanim = (k: string) => XX_ARAYUZ.roller.find((r) => r.anahtar === k)

  it('the list: the shared forty, without the four it takes out, with the five it adds — the kinds kept together', () => {
    assert.equal(ROLLER.length, 40 - 4 + 5)
    assert.deepEqual([...ROLLER], [...enRolAnahtarlari(XX_ROLLER)])
    assert.deepEqual(XX_ARAYUZ.roller.map((r) => r.anahtar), [...ROLLER])
    for (const k of ['cardiovascular-surgery', 'hair-transplant', 'aesthetic-medicine', 'clinic-dermatology']) assert.ok(!ROLLER.includes(k), `${k} was taken out`)
    for (const k of XX_OZEL_ROLLER) assert.ok(ROLLER.includes(k), `${k} was added`)
    // where it said: the two halves of the split specialty stand before cardiology, in the order they were written
    assert.deepEqual(ROLLER.slice(ROLLER.indexOf('xx-cardiac'), ROLLER.indexOf('xx-cardiac') + 3), ['xx-cardiac', 'xx-vascular', 'cardiology'])
    // the rest: last of its kind
    const taraflar = XX_ARAYUZ.roller.map((r) => r.taraf)
    assert.deepEqual([...new Set(taraflar)], ['doktor', 'klinik-hekim', 'klinik-muttefik'], 'the three kinds are not mixed')
    assert.equal(taraflar.lastIndexOf('doktor') + 1, taraflar.indexOf('klinik-hekim'))
    assert.equal(ROLLER[taraflar.lastIndexOf('doktor')], 'xx-geriatrics')
    assert.equal(ROLLER[ROLLER.length - 1], 'xx-nurse')
  })

  it('names: its own roles as it wrote them; a shared role renamed; every other as the set has it', () => {
    assert.equal(tanim('xx-cardiac')!.ad[D], 'Cardiac surgery')
    assert.equal(tanim('xx-nurse')!.ad[D], 'Nurse practitioner')
    assert.equal(tanim('family-medicine')!.ad[D], 'General practice')
    assert.equal(tanim('cardiology')!.ad[D], 'Cardiology')
  })

  it('A COUNTRY THAT STATES NO DIFFERENCE HAS THE SHARED LIST ITSELF: the same keys, the same definitions, nothing added', () => {
    assert.equal(enRolAnahtarlari(), EN_ROLLER)
    assert.equal(enRolAnahtarlari({}), EN_ROLLER)
    assert.equal(enRolAnahtarlari({ cikar: [], ekle: [] }), EN_ROLLER)
    for (const r of enRolTanimlari('en-GB', {})) assert.deepEqual(Object.keys(r), ['anahtar', 'taraf', 'ad'])
    assert.deepEqual(enRolTanimlari('en-GB', {}, { cikar: [], ekle: [] }), enRolTanimlari('en-GB', {}))
  })

  it('A SPLIT, A MERGE AND AN ADDED ROLE write their notes with the template of the role they behave like — under their own key', () => {
    const v = XX_ARAYUZ.notSablonlari
    for (const [rol, gibi] of [['xx-cardiac', 'cardiovascular-surgery'], ['xx-vascular', 'cardiovascular-surgery'], ['xx-geriatrics', 'internal-medicine'], ['xx-aesthetics', 'aesthetic-medicine']] as const) {
      assert.equal(tanim(rol)!.gibi, gibi)
      assert.equal(sablonMu(v, XX_ARAYUZ.roller, rol), true, rol)
      assert.equal(icerikAnahtari(XX_ARAYUZ.roller, rol, v.rolAlanlari), gibi)
      assert.deepEqual([...rolSablonAlanlari(v, XX_ARAYUZ.roller, rol)], [...EN_ROL_ALANLARI[gibi]], rol)
      assert.deepEqual([...sablonAlanlari(v, XX_ARAYUZ.roller, XX_PAKETI.uygulama!.veliYasi, rol, { dogumTarihi: '1950-01-01', muayeneTarihi: BUGUN })], [...EN_ROL_ALANLARI[gibi]], rol)
      // the server's decision point (the clinical half) agrees
      assert.deepEqual([...XX_KLINIK.notAlanlari!(rol, { dogumTarihi: '1950-01-01', muayeneTarihi: BUGUN })], [...EN_ROL_ALANLARI[gibi]], rol)
    }
    assert.ok(sablonlar(v, XX_ARAYUZ.roller).includes('xx-vascular'))
    assert.deepEqual([...XX_KLINIK.sablonlar], [...sablonlar(v, XX_ARAYUZ.roller)])
  })

  it('…and the instruction to the model names the role by ITS OWN name, with the fields of the role it behaves like', () => {
    const t = XX_KLINIK.notTalimati(D, 'xx-vascular') ?? ''
    assert.match(t, /^You are an experienced consultant\./)
    assert.match(t, /VASCULAR SURGERY/)
    assert.doesNotMatch(t, /Cardiac and vascular surgery/i, 'the name of the role that was split is gone')
    for (const alan of EN_ROL_ALANLARI['cardiovascular-surgery']) assert.ok(t.includes(`- ${alan} — `), alan)
    assert.match(t, /"fields": \{"surgical_history": "…"/)
    // every template of the pack has an instruction (the pack check asks the same)
    for (const s of XX_KLINIK.sablonlar) assert.ok((XX_KLINIK.notTalimati(D, s) ?? '').length > 200, s)
  })

  it('A ROLE THAT IS GONE IS GONE: no template of its own, no instruction, no role — while its content lives on where another role behaves like it', () => {
    const v = XX_ARAYUZ.notSablonlari
    // split: the role is no role, its field list stays as the two halves' content
    assert.equal(sablonMu(v, XX_ARAYUZ.roller, 'cardiovascular-surgery'), false)
    assert.equal(XX_KLINIK.notTalimati(D, 'cardiovascular-surgery'), null)
    assert.ok('cardiovascular-surgery' in v.rolAlanlari)
    assert.ok('cardiovascular-surgery' in XX_KLINIK.hastaFormu!.roller)
    // removed outright, and nobody behaves like it: nothing of it is in the pack
    for (const k of ['clinic-dermatology', 'hair-transplant']) {
      assert.ok(!(k in v.rolAlanlari), k)
      assert.ok(!(k in XX_KLINIK.hastaFormu!.roller), k)
      assert.equal(XX_KLINIK.notTalimati(D, k), null)
    }
  })

  it('A ROLE WITH CONTENT OF ITS OWN uses its own: its own fields (one of them only this country has), its own intake questions', () => {
    const v = XX_ARAYUZ.notSablonlari
    assert.equal(tanim('xx-nurse')!.gibi, undefined)
    assert.deepEqual([...rolSablonAlanlari(v, XX_ARAYUZ.roller, 'xx-nurse')], ['referral_diagnosis', 'functional_status', 'xx_scope_note'])
    assert.deepEqual(v.alanlar.xx_scope_note, { bolum: 'p', ad: { [D]: 'What was referred on, and to whom' } })
    const t = XX_KLINIK.notTalimati(D, 'xx-nurse') ?? ''
    // an allied profession is never addressed as a senior doctor
    assert.ok(t.startsWith('Your colleague is a health professional and not a doctor: their profession is "Nurse practitioner".'), t.split('\n')[0])
    assert.match(t, /- xx_scope_note — What was referred on, and to whom/)
    const bolum = formBolumleri(XX_KLINIK.hastaFormu!, { rol: icerikAnahtari(XX_ARAYUZ.roller, 'xx-nurse', XX_KLINIK.hastaFormu!.roller), veli: false, cinsiyet: '' }).find((b) => b.anahtar === 'rol')!
    assert.deepEqual(bolum.sorular.map((s) => s.anahtar), ['xx_np_reason', 'xx_np_medicines'])
  })

  it('INTAKE: a role asks the questions of the role it behaves like, and of no other; every role of the pack has questions', () => {
    const f = XX_KLINIK.hastaFormu!
    const rolSorulari = (rol: string) => formBolumleri(f, { rol: icerikAnahtari(XX_ARAYUZ.roller, rol, f.roller), veli: false, cinsiyet: '' }).find((b) => b.anahtar === 'rol')?.sorular.map((s) => s.anahtar) ?? []
    assert.deepEqual(rolSorulari('xx-cardiac'), f.roller['cardiovascular-surgery'].sorular.filter((s) => s.kime !== 'cocuk').map((s) => s.anahtar))
    assert.deepEqual(rolSorulari('xx-cardiac'), rolSorulari('xx-vascular'))
    assert.deepEqual(rolSorulari('xx-geriatrics'), rolSorulari('internal-medicine'))
    assert.notDeepEqual(rolSorulari('xx-geriatrics'), rolSorulari('cardiology'))
    for (const r of ROLLER) assert.ok(rolSorulari(r).length > 0, `${r} has no questions`)
    // one key, one question, in the whole pack — also with the country's own set in it
    const hepsi = [...f.cekirdek.bolumler.flatMap((b) => b.sorular), ...Object.values(f.roller).flatMap((r) => r.sorular)].map((s) => s.anahtar)
    assert.equal(new Set(hepsi).size, hepsi.length)
  })

  it('child roles and the landing page follow the country\'s own list', () => {
    assert.deepEqual([...XX_ARAYUZ.notSablonlari.cocukRolleri], ['paediatric-surgery', 'paediatrics'])
    const y = XX_ARAYUZ.acilis!.icerik[D]!.yonalish
    assert.equal(y.royxat.length, ROLLER.length)
    assert.ok(y.royxat.includes('Vascular surgery') && !y.royxat.includes('Cardiac and vascular surgery'))
    for (const m of y.misollar) assert.ok(m.k.trim(), 'an example names a role the country has')
  })

  it('THE ROLE TABLE lists every difference, with the shared role each of its own roles behaves like (countries/rol-eslemesi.json)', () => {
    assert.deepEqual(rolTablosuSorunlari(rolTablosunuOku(), XX, 'en', ROLLER, XX_ARAYUZ.roller), [])
    // …and it is not blind: a role the table does not know, a kind that differs, a role that behaves like another one
    const t = rolTablosunuOku()
    assert.match(rolTablosuSorunlari(t, XX, 'en', [...ROLLER, 'xx-extra'], [...XX_ARAYUZ.roller, { anahtar: 'xx-extra', taraf: 'doktor', ad: {} }]).join('\n'), /the pack has the role "xx-extra" and the table does not/)
    assert.match(rolTablosuSorunlari(t, XX, 'en', ROLLER, XX_ARAYUZ.roller.map((r) => (r.anahtar === 'xx-nurse' ? { ...r, taraf: 'doktor' as const } : r))).join('\n'), /"xx-nurse" is "doktor" in the pack and "klinik-muttefik" in the table/)
    assert.match(rolTablosuSorunlari(t, XX, 'en', ROLLER, XX_ARAYUZ.roller.map((r) => (r.anahtar === 'xx-geriatrics' ? { ...r, gibi: 'cardiology' } : r))).join('\n'), /"xx-geriatrics" behaves like "cardiology" in the pack and like "internal-medicine" in the table/)
    assert.match(rolTablosuSorunlari(t, XX, 'en', ROLLER, XX_ARAYUZ.roller.map((r) => (r.anahtar === 'cardiology' ? { ...r, gibi: 'neurology' } : r))).join('\n'), /"cardiology" behaves like "neurology" in the pack; the table does not list it as a role of the country's own/)
    // 'zz' is a code no country has: a real country (gb, us, …) may be listed in the table as having roles of its own
    assert.match(rolTablosuSorunlari(t, 'zz', 'en', ROLLER, XX_ARAYUZ.roller).join('\n'), /zz: the pack's roles are not the column "en" of the table/, 'a country the table does not list must have exactly its column')
  })
})

describe('2. a tool catalogue of its own', () => {
  it('TOOLS ONLY IT HAS: its own mechanisms, for the roles it names and for no other', () => {
    assert.deepEqual((A.kendiAraclari ?? []).map((t) => t.anahtar), ['xx-erken-uyari', 'xx-kansizlik', 'xx-izgara'])
    assert.deepEqual(goren('xx-kansizlik'), ['internal-medicine', 'xx-geriatrics'])
    assert.deepEqual(goren('xx-izgara'), ['nephrology'])
    assert.equal(paketinAraci(A, 'xx-kansizlik')!.tanim, A.kendiAraclari![1])
    for (const k of XX_OZEL_ARACLAR) assert.equal(kitAraci(k), null, `${k} is no tool of the kit`)
  })

  it('EVERY DOCTOR ROLE is a class of its own: all doctor roles of the country — its own included — and no allied profession, no account without a role', () => {
    const hekimler = hekimRolleri(XX_ARAYUZ.roller)
    assert.equal(hekimler.length, 30 - 1 + 3 + 5 - 3 + 1, 'thirty specialties less one, three of its own; five clinic doctors less three, one of its own')
    for (const k of ['kdigo-evre', 'xx-erken-uyari']) {
      assert.equal(araci(k).sinif, 'hekimler')
      assert.deepEqual(goren(k), hekimler, k)
      assert.ok(goren(k).includes('xx-vascular') && goren(k).includes('xx-aesthetics'))
      for (const r of ['physiotherapy', 'audiology', 'xx-nurse', '(no role)']) assert.ok(!goren(k).includes(r), `${k}: ${r}`)
    }
    // a BASE tool is something else: every role, the allied professions and an account without a role too
    assert.equal(araci('hasta-portali').roller, null)
    assert.equal(goren('hasta-portali').length, ROLLER.length + 1)
  })

  it('WHO SEES A SHARED TOOL is the country\'s to say: the halves of a split specialty take over its tools; one more role; an allied profession', () => {
    assert.deepEqual(goren('kalp-damar-preop'), ['xx-cardiac', 'xx-vascular'])
    assert.deepEqual(goren('greft-yara-izlem'), ['xx-vascular'])
    assert.deepEqual(goren('antikoagulan-vadeleri'), ['xx-cardiac', 'xx-vascular', 'xx-geriatrics'])
    assert.deepEqual(goren('vertigo-notu'), ['family-medicine', 'otolaryngology', 'neurology'])
    assert.deepEqual(goren('vas-fonksiyon'), ['orthopaedics', 'physiotherapy', 'xx-nurse'])
    // a tool the country says nothing about keeps the set's roles
    assert.deepEqual(goren('pasi'), ['dermatology'])
    // no tool is left naming a role the country does not have
    for (const p of A.araclar) for (const r of p.roller ?? []) assert.ok(ROLLER.includes(r), `${p.anahtar}: ${r}`)
    for (const y of A.yuvalar) for (const r of y.roller ?? []) assert.ok(ROLLER.includes(r), `${y.anahtar}: ${r}`)
  })

  it('RENAMED AND RELABELLED: a shared tool under this country\'s own name, option names and line under the result — the same arithmetic', () => {
    const p = araci('asa-preop')
    assert.equal(p.metin.ad[D], 'Pre-anaesthetic record (test)')
    assert.equal(p.metin.not[D], 'TEST DATA: the line under the result, as this country writes it.')
    assert.deepEqual(Object.values(p.metin.secenekler!.asa_sinif).map((x) => x[D]), ['Class one', 'Class two', 'Class three', 'Class four', 'Class five', 'Class six'])
    assert.equal(paketinAraci(A, 'asa-preop')!.tanim, kitAraci('asa-preop'), 'the kit\'s own definition, untouched')
    assert.equal(araci('psa-hizi').metin.aciklama[D], 'TEST: the description, as this country writes it.')
  })

  it('ANOTHER NUMBER OF BANDS AND OF OPTIONS: four bands where the definition has three, four options where it has three', () => {
    const x = paketinAraci(A, 'xx-erken-uyari')!
    const kit = A.kendiAraclari!.find((t) => t.anahtar === 'xx-erken-uyari')!
    assert.deepEqual(kit.cikti.bantlar, ['dusuk', 'orta', 'yuksek'])
    assert.deepEqual(x.tanim.cikti.bantlar, ['sifir', 'bir', 'iki', 'uc'])
    assert.deepEqual(kit.alanlar[0].secenekler, ['a', 'b', 'c'])
    assert.deepEqual(x.tanim.alanlar[0].secenekler, ['ward', 'clinic', 'home', 'other'])
    const bant = (toplam: number) => sonuc('xx-erken-uyari', { solunum: String(Math.min(3, toplam)), nabiz: String(Math.min(3, Math.max(0, toplam - 3))), bilinc: String(Math.max(0, toplam - 6)) }).bant
    assert.deepEqual([0, 1, 4, 5, 6, 7, 9].map(bant), ['sifir', 'bir', 'bir', 'iki', 'iki', 'uc', 'uc'])
    // the country's option is read; the definition's is not an option here
    const g = (ortam: string) => girdiyiCoz(x.tanim.alanlar, { ortam }, O).ortam
    assert.equal(g('home'), 'home')
    assert.equal(g('a'), null)
    // every band and every option has its words
    for (const b of x.tanim.cikti.bantlar) assert.ok(x.paket.metin.bantlar?.[b]?.[D], b)
    for (const o of x.tanim.alanlar[0].secenekler!) assert.ok(x.paket.metin.secenekler?.ortam?.[o]?.[D], o)
  })

  it('A TOOL OF THE KIT THE SHARED SET HAS NOT WRITTEN: the country brings its words and its numbers; the set\'s placeholder for it is gone', () => {
    assert.ok(!EN_ROL_ARACLARI.some((a) => a.anahtar === 'dxa-tekrar'))
    assert.equal(paketinAraci(A, 'dxa-tekrar')!.tanim, kitAraci('dxa-tekrar'))
    assert.ok(!A.yuvalar.some((y) => y.anahtar === 'dxa-tekrar'))
    assert.deepEqual(goren('dxa-tekrar'), ['endocrinology', 'xx-geriatrics'])
    const s = sonuc('dxa-tekrar', { son_dxa: '2026-01-15', risk: 'orta' })
    assert.deepEqual(s.tarihler, [{ anahtar: 'sonraki', tarih: '2029-01-15' }], 'three years, as this country states for the medium group')
  })

  it('the follow-up list goes to every role that has a tool whose result can be kept — the country\'s own roles and tools counted, a link-out tile not', () => {
    const takip = araci('takip-paneli').roller!
    const kayitli = A.araclar.filter((p) => p.anahtar !== 'takip-paneli' && !p.baglanti && kitAraci(p.anahtar)?.tur !== 'ekran')
    assert.deepEqual([...takip], ROLLER.filter((r) => kayitli.some((p) => p.roller?.includes(r))))
    assert.ok(takip.includes('xx-nurse'), 'an allied profession with a tool of its own')
    assert.ok(takip.includes('xx-cardiac'))
    assert.ok(!takip.includes('clinical-psychology'), 'a role with no tool whose result is kept')
  })
})

describe('3. numbers with their units', () => {
  it('TWO ACCEPTED UNITS, chosen explicitly: the same value in either unit gives the same answer against a limit stated in the country\'s unit', () => {
    assert.deepEqual(A.labBirimleri.hemoglobin, ['g/L', 'g/dL'])
    assert.deepEqual(araci('xx-kansizlik').parametreler!.hb_alt, { deger: 110, birim: 'g/L' })
    const u = birimAnahtari('hb')
    for (const [ham, bant] of [[{ hb: '105', [u]: 'g/L' }, 'altinda'], [{ hb: '10.5', [u]: 'g/dL' }, 'altinda'], [{ hb: '110', [u]: 'g/L' }, 'ustunde'], [{ hb: '11', [u]: 'g/dL' }, 'ustunde'], [{ hb: '140', [u]: 'g/L' }, 'ustunde']] as const) {
      const s = sonuc('xx-kansizlik', ham)
      assert.equal(s.tamam, true, JSON.stringify(ham))
      assert.equal(s.bant, bant, JSON.stringify(ham))
    }
    // the unit names the screen needs are all there, and so is the sentence that asks for the unit
    for (const b of ['g/L', 'g/dL', 'mg/mmol', 'mg/g', 'xx-a', 'xx-b']) assert.ok(A.birimler[b]?.[D], b)
    assert.ok(A.metinler[D]!.arac.birimSec)
  })

  it('A MISSING INPUT NEVER GIVES A REASSURING RESULT: a number without its unit gives none — also the optional one', () => {
    const u = birimAnahtari('hb')
    const birimsiz = sonuc('xx-kansizlik', { hb: '140' })
    assert.equal(birimsiz.tamam, false)
    assert.deepEqual(birimsiz.okunamayan, ['hb'])
    // the required value is complete; the OPTIONAL second value is typed without its unit: the screen and the server show and keep nothing
    const yarim = sonuc('xx-kansizlik', { hb: '140', [u]: 'g/L', ikinci: '150' })
    assert.deepEqual(yarim.okunamayan, ['ikinci'])
    assert.equal(yarim.uyarilar.length, 0, 'the warning it would have raised is not silently dropped behind a result: there is no result (the screen and the server refuse on `okunamayan`)')
    // with its unit, the warning is there: 150 on the second scale is 85 on the first, above the limit (100 on the second = 60 on the first)
    assert.deepEqual(sonuc('xx-kansizlik', { hb: '140', [u]: 'g/L', ikinci: '150', [birimAnahtari('ikinci')]: 'xx-b' }).uyarilar, ['ikinci_yuksek'])
    assert.deepEqual(sonuc('xx-kansizlik', { hb: '140', [u]: 'g/L', ikinci: '50', [birimAnahtari('ikinci')]: 'xx-a' }).uyarilar, [])
    assert.deepEqual(sonuc('xx-kansizlik', { hb: '140', [u]: 'g/L', ikinci: '61', [birimAnahtari('ikinci')]: 'xx-a' }).uyarilar, ['ikinci_yuksek'])
    // a unit the country does not accept is no unit
    assert.equal(sonuc('xx-kansizlik', { hb: '140', [u]: 'mmol/L' }).tamam, false)
  })

  it('A SHARED TOOL OF THE KIT with two accepted units: the same ratio typed either way falls in the same category', () => {
    const u = birimAnahtari('uacr')
    const x = paketinAraci(A, 'kdigo-evre')!
    assert.ok(x.tanim.alanlar.some((a) => a.anahtar === 'uacr' && a.lab === 'albuminKreatinin'))
    const dolu = (uacr: string, birim: string | null) => {
      const ham: Record<string, string> = { uacr, ...(birim ? { [u]: birim } : {}) }
      // every other field of the kit's tool at a mid value (the kit's own samples are in its own units and need no choice)
      for (const a of x.tanim.alanlar) if (a.anahtar !== 'uacr' && a.tur === 'sayi') ham[a.anahtar] = String(Math.round(((a.enAz ?? 0) + (a.enCok ?? 100)) / 2))
      for (const a of x.tanim.alanlar) if (a.tur === 'secim') ham[a.anahtar] = a.secenekler![0]
      const g = girdiyiCoz(x.tanim.alanlar, ham, O)
      return { g, s: aracCalistir(x, g, BUGUN, A), okunamayan: okunamayanAlanlar(x.tanim.alanlar, ham, g, O) }
    }
    const mmol = dolu('10', 'mg/mmol'), mgg = dolu(String(Math.round((10 / 0.113) * 100) / 100), 'mg/g')
    assert.ok(Math.abs((mmol.g.uacr as number) - 10 / 0.113) < 1e-9)
    assert.ok(Math.abs((mgg.g.uacr as number) - 10 / 0.113) < 0.01)
    assert.equal(mmol.s.bant, mgg.s.bant)
    assert.deepEqual(dolu('10', null).okunamayan, ['uacr'], 'typed without its unit: not read')
  })

  it('A TABLE THE COUNTRY SUPPLIES, in the country\'s unit: the category of a value typed in either unit', () => {
    assert.deepEqual(araci('xx-izgara').tablolar!.kategoriler.birimler, { alt: 'mg/mmol' })
    const u = birimAnahtari('oran')
    const bant = (oran: string, birim: string) => sonuc('xx-izgara', { oran, [u]: birim }).bant
    assert.deepEqual(['0', '2.9', '3', '29.9', '30', '300'].map((v) => bant(v, 'mg/mmol')), ['k1', 'k1', 'k2', 'k2', 'k3', 'k3'])
    // 3 mg/mmol is 26.55 mg/g: the same limit, read in the other unit
    assert.deepEqual(['26', '27', '265', '266'].map((v) => bant(v, 'mg/g')), ['k1', 'k2', 'k2', 'k3'])
    assert.equal(sonuc('xx-izgara', { oran: '10' }).tamam, false, 'no unit, no category')
  })
})

describe('4. a tool by the patient\'s age and sex', () => {
  const erkek50 = { dogumTarihi: '1976-01-01', cinsiyet: 'male' }, kadin50 = { dogumTarihi: '1976-01-01', cinsiyet: 'female' }, cocuk = { dogumTarihi: '2015-06-01', cinsiyet: 'male' }, bilinmeyen = { dogumTarihi: '', cinsiyet: '' }
  const izgara = (rol: string, hasta: typeof erkek50 | null) => { const x = hesabinAraclari(A, rol, hasta ? { hasta, bugun: BUGUN } : null); return [...x.temel, ...x.rol].map((t) => t.tanim.anahtar) }

  it('opened for a patient, the grid holds only the tools that are for that patient; without a patient, all of the role\'s', () => {
    assert.ok(izgara('urology', null).includes('psa-hizi'))
    assert.ok(izgara('urology', erkek50).includes('psa-hizi'))
    for (const h of [kadin50, cocuk, bilinmeyen]) assert.ok(!izgara('urology', h).includes('psa-hizi'), JSON.stringify(h))
    assert.ok(izgara('xx-geriatrics', erkek50).includes('xx-erken-uyari'))
    assert.ok(!izgara('xx-geriatrics', cocuk).includes('xx-erken-uyari'), 'under 16')
    assert.ok(!izgara('xx-geriatrics', bilinmeyen).includes('xx-erken-uyari'), 'AN UNKNOWN BIRTH DATE NEVER OPENS A TOOL WITH AN AGE LIMIT')
    // a tool without a limit is there for every patient
    for (const h of [erkek50, kadin50, cocuk, bilinmeyen]) assert.ok(izgara('xx-geriatrics', h).includes('xx-kansizlik'))
  })

  it('the address and the server ask the same question; the pack\'s sentence says who the tool is for', () => {
    const x = hesabinAraci(A, 'urology', 'psa-hizi')!
    assert.deepEqual(x.paket.hasta, { cinsiyet: 'male', enAzYas: 18 })
    assert.equal(x.paket.metin.hastaKapisi![D], 'This tool is for men aged 18 and over.')
    assert.equal(aracinKapisi(x, null, BUGUN), 'hastasiz')
    assert.equal(aracinKapisi(x, erkek50, BUGUN), 'uygun')
    for (const h of [kadin50, cocuk, bilinmeyen]) assert.equal(aracinKapisi(x, h, BUGUN), 'degil')
    // the role gate still comes first: another role does not have the tool at all
    assert.equal(hesabinAraci(A, 'cardiology', 'psa-hizi'), null)
  })
})

describe('5. licence', () => {
  it('EVERY TOOL AND EVERY PLACEHOLDER STATES ITS LICENCE, and every tool that is on is free or permitted', () => {
    assert.equal(A.lisansTam, true)
    for (const p of A.araclar) { assert.ok(p.lisans, `${p.anahtar} states no licence`); assert.ok(LISANS_ACIK.includes(p.lisans!.durum), `${p.anahtar}: ${p.lisans!.durum}`) }
    for (const y of A.yuvalar) assert.ok(y.lisans && (LISANS_DURUMLARI as readonly string[]).includes(y.lisans.durum), `${y.anahtar} states no licence`)
    // each of the five states is somewhere in the pack
    const durumlar = new Set([...A.araclar.map((p) => p.lisans!.durum), ...A.yuvalar.map((y) => y.lisans!.durum)])
    assert.deepEqual([...durumlar].sort(), [...LISANS_DURUMLARI].sort())
    // what is not free or permitted is a placeholder, never a tool
    for (const y of A.yuvalar.filter((v) => !LISANS_ACIK.includes(v.lisans!.durum))) assert.ok(!A.araclar.some((p) => p.anahtar === y.anahtar), y.anahtar)
    assert.equal(A.yuvalar.find((y) => y.anahtar === 'xx-triyaj')!.lisans!.durum, 'izin-gerekli')
    assert.equal(A.yuvalar.find((y) => y.anahtar === 'midas')!.lisans!.durum, 'ucretli')
    assert.equal(A.yuvalar.find((y) => y.anahtar === 'doz-hesabi')!.lisans!.durum, 'serbest', 'a tool the country keeps as a placeholder carries its licence too')
  })

  it('THE RIGHTS HOLDER\'S NOTICE stands with the tool that has one, and with no other', () => {
    const x = paketinAraci(A, 'xx-erken-uyari')!
    assert.equal(x.paket.lisans!.durum, 'izin-alindi')
    assert.equal(lisansBildirimi(x, D), 'Test Scale © The Test Scale Society. Used with permission.')
    assert.equal(lisansBildirimi(paketinAraci(A, 'pasi')!, D), '')
  })

  it('A LINK-OUT TILE: nothing but a fixed https address and its words; no field, no result, nothing to keep', () => {
    const x = hesabinAraci(A, 'xx-geriatrics', 'xx-kirik-riski')!
    assert.equal(x.tanim.tur, 'baglanti')
    assert.deepEqual(x.tanim.alanlar, [])
    assert.equal(x.paket.baglanti!.adres, 'https://example.org/calculator')
    assert.equal(x.paket.metin.baglanti![D], 'Open the official calculator')
    assert.equal(aracCalistir(x, {}, BUGUN, A).tamam, false)
    assert.deepEqual(goren('xx-kirik-riski'), ['family-medicine', 'xx-geriatrics'])
  })
})

describe('6. its keys are its own', () => {
  it('every key the country adds carries its code, and all of them are on the list wall rule D7 enforces', () => {
    const liste = JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as Record<string, string[]>
    const kendi = ulkeyeOzelAnahtarlar(A, XX)
    assert.deepEqual(kendi, [...XX_OZEL_ARACLAR].sort())
    assert.deepEqual([...liste.xx].sort(), kendi)
    // …and the tools it takes from the kit carry no code at all
    for (const p of A.araclar) if (!kendi.includes(p.anahtar)) assert.ok(kitAraci(p.anahtar), p.anahtar)
  })
})

describe('8. NOTYA-ULKE-ARAC-DUZELTME-01 — what the tools-correction job opened on the SHARED tools, used by one country', () => {
  const D8 = BUGUN
  it('ITS OWN STEPS OF RETURN TO SPORT: the options and the bands are the rows of its table; the earliest day is counted from the injury', () => {
    const kit = kitAraci('rtp-basamak')!
    assert.deepEqual(kit.alanlar.find((a) => a.anahtar === 'basamak')!.secenekler, [], 'the kit holds no step')
    const x = paketinAraci(A, 'rtp-basamak')!
    assert.deepEqual(x.tanim.alanlar.find((a) => a.anahtar === 'basamak')!.secenekler, ['xa', 'xb', 'xc'])
    assert.deepEqual(x.tanim.cikti.bantlar, ['xa', 'xb', 'xc'])
    // injured 5 days before today: step B (earliest day 3) is open, step C (earliest day 10) is early
    const b = sonuc('rtp-basamak', { yaralanma: '2026-10-05', basamak: 'xb' })
    assert.deepEqual([b.tamam, b.bant, b.uyarilar, b.sayilar.map((n) => [n.anahtar, n.deger]), b.tarihler], [true, 'xb', [], [['gun', 5]], [{ anahtar: 'en_erken', tarih: '2026-10-08' }]])
    const c = sonuc('rtp-basamak', { yaralanma: '2026-10-05', basamak: 'xc' })
    assert.deepEqual([c.bant, c.uyarilar, c.tarihler], ['xc', ['erken'], [{ anahtar: 'en_erken', tarih: '2026-10-15' }]])
    // a step with no earliest day shows no date; exactly on the earliest day is not early
    assert.deepEqual(sonuc('rtp-basamak', { yaralanma: '2026-10-05', basamak: 'xa' }).tarihler, [])
    assert.deepEqual(sonuc('rtp-basamak', { yaralanma: '2026-09-30', basamak: 'xc' }).uyarilar, [])
    // THE COUNTRY HAS STEPS: no result until one is chosen — and never the line "no steps have been set"
    assert.equal(sonuc('rtp-basamak', { yaralanma: '2026-10-05' }).tamam, false)
    assert.equal(sonuc('rtp-basamak', { yaralanma: '2026-10-05', basamak: '0' }).tamam, false, 'a step of nobody\'s list is no step')
    assert.equal(sonuc('rtp-basamak', { yaralanma: '2026-10-11', basamak: 'xa' }).tamam, false, 'an injury dated after today')
    for (const k of ['xa', 'xb', 'xc']) { assert.ok(x.paket.metin.secenekler?.basamak?.[k]?.[D], k); assert.ok(x.paket.metin.bantlar?.[k]?.[D], k) }
    void D8
  })

  it('ITS OWN FREQUENCIES, GRADE TABLE AND ASYMMETRY RULE for the hearing average: three fields where the kit has four', () => {
    const kit = kitAraci('odyometri-pta')!
    const x = paketinAraci(A, 'odyometri-pta')!
    const sayiAlanlari = (t: typeof kit) => t.alanlar.filter((a) => a.tur === 'sayi').map((a) => a.anahtar)
    assert.deepEqual(sayiAlanlari(kit), ['e05', 'e1', 'e2', 'e4', 'onceki_pta', 'karsi_pta'])
    assert.deepEqual(sayiAlanlari(x.tanim), ['e05', 'e1', 'e2', 'onceki_pta', 'karsi_pta'], 'the country\'s three, where the kit\'s four stood')
    assert.ok(!('e4' in x.paket.metin.alanlar), 'no label is left over for a field that is not on this country\'s screen')
    assert.deepEqual(x.tanim.cikti.bantlar, ['xiyi', 'xorta', 'xkotu'])
    // the average of THREE thresholds; a fourth that is typed is not read
    const s = sonuc('odyometri-pta', { e05: '10', e1: '20', e2: '30', e4: '100' })
    assert.deepEqual([s.tamam, s.sayilar[0].deger, s.bant], [true, 20, 'xiyi'])
    assert.equal(sonuc('odyometri-pta', { e05: '10', e1: '20' }).tamam, false, 'each of the country\'s fields is needed')
    assert.equal(sonuc('odyometri-pta', { e05: '20', e1: '20', e2: '21' }).bant, 'xorta')
    // ITS OWN RULE: 20 dB or more — 19.9 is not flagged, though it is greater than the kit's 15
    const fark = (karsi: string) => sonuc('odyometri-pta', { e05: '40', e1: '40', e2: '40', karsi_pta: karsi }).uyarilar
    assert.deepEqual([fark('20.1'), fark('20'), fark('24')], [[], ['asimetri'], []])
    // the kit's own definition is untouched for every other country
    assert.equal(kitAraci('odyometri-pta'), kit)
    assert.deepEqual(kit.hesapla({ kulak: null, e05: 40, e1: 40, e2: 40, e4: 40, onceki_pta: null, karsi_pta: 24 }, { bugun: BUGUN, p: {} }).uyarilar, ['asimetri'])
  })

  it('ITS OWN BANDS over a score the kit names no band for', () => {
    assert.deepEqual(kitAraci('pasi')!.cikti.bantlar, [])
    const x = paketinAraci(A, 'pasi')!
    assert.deepEqual(x.tanim.cikti.bantlar, ['xdusuk', 'xyuksek'])
    const tam = (alan: string) => ({ bas_e: '4', bas_i: '4', bas_d: '4', bas_a: alan, ust_e: '4', ust_i: '4', ust_d: '4', ust_a: alan, govde_e: '4', govde_i: '4', govde_d: '4', govde_a: alan, alt_e: '4', alt_i: '4', alt_d: '4', alt_a: alan })
    assert.deepEqual([sonuc('pasi', tam('1')).sayilar[0].deger, sonuc('pasi', tam('1')).bant], [12, 'xdusuk'])
    assert.deepEqual([sonuc('pasi', tam('2')).sayilar[0].deger, sonuc('pasi', tam('2')).bant], [24, 'xyuksek'])
  })

  it('NUMBERS A COUNTRY MAY STATE: the range of the expected height; the PSA caution turned off', () => {
    assert.deepEqual(sonuc('hedef-boy', { cinsiyet: 'erkek', anne: '160', baba: '180' }).sayilar.map((n) => [n.anahtar, n.deger]), [['hedef', 176.5], ['alt', 167.5], ['ust', 185.5]])
    assert.deepEqual(kitAraci('hedef-boy')!.hesapla({ cinsiyet: 'erkek', anne: 160, baba: 180 }, { bugun: BUGUN, p: {} }).sayilar.map((n) => n.anahtar), ['hedef'], 'a country that states none gets no range')
    // two results six weeks apart: the kit's caution (fewer than 90 days) is not raised here
    const psa = sonuc('psa-hizi', { onceki_deger: '4.5', 'onceki_deger.birim': 'ug/L', onceki_tarih: '2026-01-01', son_deger: '5', 'son_deger.birim': 'ug/L', son_tarih: '2026-02-12' })
    assert.deepEqual([psa.tamam, psa.uyarilar, psa.sayilar[0].birim], [true, [], 'ug/L/yil'])
    assert.ok(A.birimler['ug/L/yil']?.[D] && A.birimler['ng/mL/yil']?.[D], 'the yearly change has a name in every unit the country accepts')
    assert.equal(sonuc('psa-hizi', { onceki_deger: '4.5', onceki_tarih: '2026-01-01', son_deger: '5', son_tarih: '2026-02-12' }).tamam, false, 'a value without its unit is not a value')
  })

  it('HOW A DOSE IS WRITTEN is stated, and travels with the pack', () => {
    assert.deepEqual(A.dozYazimi, { sondaSifir: false })
  })
})

describe('7. the pack check is not blind: each mistake, refused by name', () => {
  /** The test country with one thing changed in what it states. */
  const ile = (degis: (g: typeof XX_GIRDI) => typeof XX_GIRDI) => { const g = degis(XX_GIRDI); return sorunlar(enArayuz(g), enKlinik(g), { ...XX_PAKETI, uygulama: { ...XX_PAKETI.uygulama!, roller: enRolAnahtarlari(g.roller) } }) }
  const araclarla = (degis: (a: typeof XX_GIRDI.araclar) => typeof XX_GIRDI.araclar) => ile((g) => ({ ...g, araclar: degis(g.araclar) }))
  const ekArac = (anahtar: string, degis: (p: PaketAraci) => PaketAraci) => araclarla((a) => ({ ...a, ek: { ...a.ek!, araclar: a.ek!.araclar!.map((p) => (p.anahtar === anahtar ? degis(p) : p)) } }))
  const bekle = (bulunan: string[], desen: RegExp) => assert.ok(bulunan.some((x) => desen.test(x)), `expected ${desen}, found:\n  ${bulunan.slice(0, 12).join('\n  ') || '(nothing)'}`)

  const HATALAR: [string, () => string[], RegExp][] = [
    // ── licence ──
    ['a tool whose licence is unclear, switched on', () => ekArac('xx-kansizlik', (p) => ({ ...p, lisans: { durum: 'belirsiz', hakSahibi: 'X' } })), /xx-kansizlik\.lisans\.durum: "belirsiz": a tool whose licence is not "serbest" or "izin-alindi" cannot be switched on/],
    ['a tool that needs permission, switched on', () => ekArac('xx-izgara', (p) => ({ ...p, lisans: { durum: 'izin-gerekli', hakSahibi: 'X' } })), /xx-izgara\.lisans\.durum: "izin-gerekli": a tool whose licence/],
    ['a paid tool, switched on', () => ekArac('dxa-tekrar', (p) => ({ ...p, lisans: { durum: 'ucretli', hakSahibi: 'X' } })), /dxa-tekrar\.lisans\.durum: "ucretli": a tool whose licence/],
    ['a SHARED tool of the set whose licence the country states as unclear', () => araclarla((a) => ({ ...a, lisanslar: { ...a.lisanslar, pasi: { durum: 'belirsiz', hakSahibi: 'X' } } })), /araclar\.pasi\.lisans\.durum: "belirsiz": a tool whose licence/],
    ['a tool of the country\'s own without a licence', () => ekArac('xx-kansizlik', (p) => ({ ...p, lisans: undefined })), /xx-kansizlik\.lisans: must state its licence/],
    ['a tool of the set without a licence, in a pack that states every licence', () => araclarla((a) => ({ ...a, lisanslar: Object.fromEntries(Object.entries(a.lisanslar!).filter(([k]) => k !== 'pasi')) })), /araclar\.pasi\.lisans: must state its licence/],
    ['a placeholder without a licence', () => araclarla((a) => ({ ...a, lisanslar: Object.fromEntries(Object.entries(a.lisanslar!).filter(([k]) => k !== 'midas')) })), /yuvalar\.midas\.lisans: must state its licence/],
    ['a licence state that is none', () => ekArac('xx-kansizlik', (p) => ({ ...p, lisans: { durum: 'acik' as never } })), /xx-kansizlik\.lisans\.durum: must be one of serbest, izin-gerekli, ucretli, belirsiz, izin-alindi/],
    ['a permission without the rights holder and without its record', () => ekArac('xx-kansizlik', (p) => ({ ...p, lisans: { durum: 'izin-alindi' } })), /xx-kansizlik\.lisans\.(hakSahibi: must name who holds the rights|kaynak: a permission that was granted says where it is recorded)/],
    // ── a link-out tile ──
    ['a link that is not https', () => ekArac('xx-kirik-riski', (p) => ({ ...p, baglanti: { adres: 'http://example.org/calculator' } })), /xx-kirik-riski\.baglanti\.adres: must be a fixed https address/],
    ['a link with a query a value could be put into', () => ekArac('xx-kirik-riski', (p) => ({ ...p, baglanti: { adres: 'https://example.org/calculator?age=70' } })), /xx-kirik-riski\.baglanti\.adres: must be a fixed https address/],
    ['a link without the words of its link', () => ekArac('xx-kirik-riski', (p) => ({ ...p, metin: { ...p.metin, baglanti: undefined } })), /xx-kirik-riski\.baglanti\.en-GB: no text in this language form/],
    ['a tool of the kit turned into a link', () => ekArac('dxa-tekrar', (p) => ({ ...p, baglanti: { adres: 'https://example.org/x' } })), /dxa-tekrar\.baglanti: a link-out tile has no mechanism/],
    // ── whose a key is ──
    ['a key that carries a REAL country\'s code', () => ekArac('xx-kirik-riski', (p) => ({ ...p, anahtar: 'gb-kirik-riski' })), /gb-kirik-riski: the key carries the code "gb": a tool of another country does not exist in this country's build/],
    ['a placeholder that carries another country\'s code', () => araclarla((a) => ({ ...a, ek: { ...a.ek!, yuvalar: [...a.ek!.yuvalar!, { ...a.ek!.yuvalar![0], anahtar: 'us-odeme-formu' }] } })), /yuvalar\.us-odeme-formu: the key carries the code "us"/],
    ['a mechanism of its own under a key without its code', () => araclarla((a) => ({ ...a, ek: { ...a.ek!, tanimlar: [...a.ek!.tanimlar!, { ...a.ek!.tanimlar![0], anahtar: 'erken-uyari' }] } })), /kendiAraclari\.erken-uyari: a tool only this country has carries the country's code \("xx-\.\.\."\)/],
    ['a mechanism of its own under a key of the kit', () => araclarla((a) => ({ ...a, ek: { ...a.ek!, tanimlar: [...a.ek!.tanimlar!, { ...a.ek!.tanimlar![0], anahtar: 'pasi' }] } })), /kendiAraclari\.pasi: is a tool of the kit: a pack cannot bring a mechanism of its own under a key of the kit/],
    ['a mechanism brought and never used', () => araclarla((a) => ({ ...a, ek: { ...a.ek!, tanimlar: [...a.ek!.tanimlar!, { ...a.ek!.tanimlar![0], anahtar: 'xx-kullanilmayan' }] } })), /kendiAraclari\.xx-kullanilmayan: the pack brings this mechanism and neither switches the tool on nor keeps it as a placeholder/],
    ['a tool whose mechanism nobody brings', () => ekArac('xx-kansizlik', (p) => ({ ...p, anahtar: 'xx-yok' })), /araclar\.xx-yok: is not a tool of the kit, and the pack brings no mechanism of its own for it/],
    ['a key the database could not keep', () => ekArac('xx-kirik-riski', (p) => ({ ...p, anahtar: 'xx-Kirik_Riski' })), /a tool key is lower-case letters and digits joined by hyphens, at most 60 characters/],
    ['a quantity of its own without its code', () => araclarla((a) => ({ ...a, ek: { ...a.ek!, olculer: { ...a.ek!.olculer, 'olcek-iki': { kanonik: 'a', birimler: { a: 1 } } } } })), /olculer\.olcek-iki: a quantity of the pack's own carries the country's code/],
    // ── every doctor role ──
    ['a tool of every doctor role that misses one', () => ekArac('xx-erken-uyari', (p) => ({ ...p, roller: p.roller!.filter((r) => r !== 'xx-vascular') })), /xx-erken-uyari\.sinif: a tool of every doctor role, and the doctor role "xx-vascular" is not on its list/],
    ['a tool of every doctor role that names an allied profession', () => ekArac('xx-erken-uyari', (p) => ({ ...p, roller: [...p.roller!, 'physiotherapy'] })), /xx-erken-uyari\.sinif: a tool of every doctor role, and "physiotherapy" is not a doctor role/],
    ['a class that is none', () => ekArac('xx-kansizlik', (p) => ({ ...p, sinif: 'herkes' as never })), /xx-kansizlik\.sinif: the only class is "hekimler"/],
    ['a tool left with no role after its role was taken out', () => araclarla((a) => ({ ...a, gorenler: Object.fromEntries(Object.entries(a.gorenler!).filter(([k]) => k !== 'greft-yara-izlem')) })), /greft-yara-izlem\.roller: must be null \(a base tool: every role sees it\) or name at least one role/],
    ['a tool given to a role the country does not have', () => araclarla((a) => ({ ...a, gorenler: { ...a.gorenler, pasi: ['dermatology', 'clinic-dermatology'] } })), /pasi\.roller: "clinic-dermatology" is not a role of the pack/],
    // ── numbers, tables, bands, options ──
    ['a laboratory limit stated as a bare number', () => ekArac('xx-kansizlik', (p) => ({ ...p, parametreler: { ...p.parametreler, hb_alt: 110 } })), /xx-kansizlik\.parametreler\.hb_alt: this number is a laboratory value \(hemoglobin\): state it with its unit/],
    ['a laboratory limit in a unit the kit cannot convert', () => ekArac('xx-kansizlik', (p) => ({ ...p, parametreler: { ...p.parametreler, hb_alt: { deger: 6.8, birim: 'mmol/L' } } })), /xx-kansizlik\.parametreler\.hb_alt: "mmol\/L" is not a unit the kit can convert \(g\/dL, g\/L\)/],
    ['a unit on a number that is not a laboratory value', () => ekArac('dxa-tekrar', (p) => ({ ...p, parametreler: { ...p.parametreler, yil_orta: { deger: 3, birim: 'yil' } } })), /dxa-tekrar\.parametreler\.yil_orta: this number is not a laboratory value: state it as a plain number/],
    ['a number the tool leaves to the country, not stated', () => ekArac('dxa-tekrar', (p) => ({ ...p, parametreler: { yil_dusuk: 5, yil_orta: 3 } })), /dxa-tekrar\.parametreler\.yil_yuksek: the tool leaves this number to the country and the pack does not state it/],
    ['a table not supplied', () => ekArac('xx-izgara', (p) => ({ ...p, tablolar: undefined })), /xx-izgara\.tablolar\.kategoriler: the tool leaves this table to the country and the pack does not supply it/],
    ['a table whose laboratory column has no unit', () => ekArac('xx-izgara', (p) => ({ ...p, tablolar: { kategoriler: { satirlar: p.tablolar!.kategoriler.satirlar } } })), /xx-izgara\.tablolar\.kategoriler\.birimler\.alt: the column is a laboratory value \(albuminKreatinin\): the table states its unit/],
    ['a table with a row that lacks a column', () => ekArac('xx-izgara', (p) => ({ ...p, tablolar: { kategoriler: { ...p.tablolar!.kategoriler, satirlar: [{ alt: 0, bant: 'k1' }, { alt: 3 }] as never } } })), /xx-izgara\.tablolar\.kategoriler\.satirlar\[1\]\.bant: the column is a key/],
    ['bands whose last row is not open: a value above it would have no band', () => ekArac('xx-erken-uyari', (p) => ({ ...p, uyarlama: { ...p.uyarlama, bantlar: { sayi: 'toplam', satirlar: [{ ust: 1, bant: 'sifir' }, { ust: 4, bant: 'bir' }, { ust: 7, bant: 'iki' }, { ust: 9, bant: 'uc' }] } } })), /xx-erken-uyari\.uyarlama\.bantlar\.satirlar: the last row has no upper limit/],
    ['bands that do not ascend', () => ekArac('xx-erken-uyari', (p) => ({ ...p, uyarlama: { ...p.uyarlama, bantlar: { sayi: 'toplam', satirlar: [{ ust: 4, bant: 'sifir' }, { ust: 4, bant: 'bir' }, { ust: 7, bant: 'iki' }, { ust: null, bant: 'uc' }] } } })), /xx-erken-uyari\.uyarlama\.bantlar\.satirlar\[1\]\.ust: the limits ascend/],
    ['bands over a number the tool does not return', () => ekArac('xx-erken-uyari', (p) => ({ ...p, uyarlama: { ...p.uyarlama, bantlar: { ...p.uyarlama!.bantlar!, sayi: 'puan' } } })), /xx-erken-uyari\.uyarlama\.bantlar\.sayi: must name the number of the result the bands are read from/],
    ['a band the country added and did not name', () => ekArac('xx-erken-uyari', (p) => ({ ...p, metin: { ...p.metin, bantlar: { sifir: p.metin.bantlar!.sifir, bir: p.metin.bantlar!.bir, iki: p.metin.bantlar!.iki } } })), /xx-erken-uyari\.bantlar\.uc\.en-GB: no text in this language form/],
    ['its own bands on a SHARED tool the kit does not mark for it', () => araclarla((a) => ({ ...a, uyarlama: { ...a.uyarlama, 'rapor-taslagi': { bantlar: { sayi: 'isaretli', satirlar: [{ ust: 5, bant: 'hafif' }, { ust: null, bant: 'agir' }] } } } })), /rapor-taslagi\.uyarlama\.bantlar: a warning, a date or a number of this tool may follow from its band: a country cannot restate the bands/],
    // ── NOTYA-ULKE-ARAC-DUZELTME-01: what the tools-correction job opened on the shared tools ──
    ['the fields of a group, on a tool that offers no such group', () => araclarla((a) => ({ ...a, uyarlama: { ...a.uyarlama, pasi: { ...a.uyarlama!.pasi, alanlar: { frekans: ['e05', 'e1'] } } } })), /pasi\.uyarlama\.alanlar\.frekans: the tool offers no such group of fields/],
    ['a field that is not of the group', () => araclarla((a) => ({ ...a, uyarlama: { ...a.uyarlama, 'odyometri-pta': { ...a.uyarlama!['odyometri-pta'], alanlar: { frekans: ['e05', 'e1', 'onceki_pta'] } } } })), /odyometri-pta\.uyarlama\.alanlar\.frekans: "onceki_pta" is not a field of this group/],
    ['fewer fields of a group than the tool needs', () => araclarla((a) => ({ ...a, uyarlama: { ...a.uyarlama, 'odyometri-pta': { ...a.uyarlama!['odyometri-pta'], alanlar: { frekans: ['e1'] } } } })), /odyometri-pta\.uyarlama\.alanlar\.frekans: the tool needs at least 2 field\(s\) of this group/],
    ['a field of a group the country added and did not name', () => araclarla((a) => ({ ...a, uyarlama: { ...a.uyarlama, 'odyometri-pta': { ...a.uyarlama!['odyometri-pta'], alanlar: { frekans: ['e025', 'e05', 'e1', 'e2'] } } } })), /odyometri-pta\.alanlar\.e025\.en-GB: no text in this language form/],
    ['a number the country may state, stated with a unit it does not have', () => araclarla((a) => ({ ...a, parametreler: { ...a.parametreler, 'hedef-boy': { aralik_cm: { deger: 9, birim: 'cm' } } } })), /hedef-boy\.parametreler\.aralik_cm: this number is not a laboratory value: state it as a plain number/],
    ['a number for a key the tool neither needs nor allows', () => araclarla((a) => ({ ...a, parametreler: { ...a.parametreler, 'hedef-boy': { aralik_inc: 4 } } })), /hedef-boy\.parametreler\.aralik_inc: a number for a key this tool does not have/],
    ['its own steps with one step listed twice', () => araclarla((a) => ({ ...a, tablolar: { 'rtp-basamak': { basamaklar: { satirlar: [{ basamak: 'xa', en_erken_gun: 0 }, { basamak: 'xa', en_erken_gun: 3 }, { basamak: 'xc', en_erken_gun: 10 }] } } } })), /rtp-basamak\.tablolar\.basamaklar\.satirlar: the column "basamak" names the options of the field "basamak": a key is listed twice/],
    ['its own steps with a step that has no earliest day', () => araclarla((a) => ({ ...a, tablolar: { 'rtp-basamak': { basamaklar: { satirlar: [{ basamak: 'xa', en_erken_gun: 0 }, { basamak: 'xb' }, { basamak: 'xc', en_erken_gun: 10 }] as never } } } })), /rtp-basamak\.tablolar\.basamaklar\.satirlar\[1\]\.en_erken_gun: the column is a number/],
    ['a step the country supplied and did not name', () => araclarla((a) => ({ ...a, tablolar: { 'rtp-basamak': { basamaklar: { satirlar: [...a.tablolar!['rtp-basamak'].basamaklar.satirlar, { basamak: 'xd', en_erken_gun: 20 }] } } } })), /rtp-basamak\.(secenekler\.basamak|bantlar)\.xd\.en-GB: no text in this language form/],
    ['a tool that writes a dose, in a pack that does not say how a dose is written', () => araclarla((a) => ({ ...a, kapali: {}, dozYazimi: undefined as never })), /araclar\.dozYazimi: the tool "doz-hesabi" writes an amount of a medicine and the pack does not say how this country writes a dose/],
    ['a rule for writing a dose that is no rule', () => araclarla((a) => ({ ...a, dozYazimi: { sondaSifir: 'no' } as never })), /araclar\.dozYazimi: must say whether a zero is written after the decimal mark of a dose/],
    ['its own options on a field the arithmetic reads', () => araclarla((a) => ({ ...a, uyarlama: { 'asa-preop': { secenekler: { asa_sinif: ['1', '2', '3'] } } } })), /asa-preop\.uyarlama\.secenekler\.asa_sinif: the tool's arithmetic reads the options of this field: a country cannot restate them/],
    ['an option the country added and did not name', () => ekArac('xx-erken-uyari', (p) => ({ ...p, uyarlama: { ...p.uyarlama, secenekler: { ortam: ['ward', 'clinic', 'home', 'other', 'transport'] } } })), /xx-erken-uyari\.secenekler\.ortam\.transport\.en-GB: no text in this language form/],
    // ── units ──
    ['an accepted unit the kit cannot convert', () => araclarla((a) => ({ ...a, labBirimleri: { ...a.labBirimleri, hemoglobin: ['g/L', 'mmol/L'] } })), /labBirimleri\.hemoglobin: "mmol\/L" is not a unit the kit can convert \(g\/dL, g\/L\)/],
    ['an accepted unit without a name', () => araclarla((a) => ({ ...a, birimAdlari: { 'xx-a': 'scale A' } })), /araclar\.birimler\.xx-b\.en-GB: no text in this language form/],
    ['a field of a quantity nobody defines', () => araclarla((a) => ({ ...a, ek: { ...a.ek!, olculer: undefined } })), /xx-kansizlik\.alanlar\.ikinci: reads the quantity "xx-olcek", which neither the kit nor the pack \(olculer\) defines/],
    // ── the patient gate ──
    ['a patient gate that limits nothing', () => ekArac('xx-erken-uyari', (p) => ({ ...p, hasta: {} })), /xx-erken-uyari\.hasta: a patient gate states an age limit, a sex, or both/],
    ['a patient gate without the sentence that says who the tool is for', () => ekArac('xx-erken-uyari', (p) => ({ ...p, metin: { ...p.metin, hastaKapisi: undefined } })), /xx-erken-uyari\.hastaKapisi\.en-GB: no text in this language form/],
    ['an age limit upside down', () => ekArac('xx-erken-uyari', (p) => ({ ...p, hasta: { enAzYas: 65, enCokYas: 18 } })), /xx-erken-uyari\.hasta: the youngest age is above the oldest/],
    ['a patient gate on a screen of the kit', () => araclarla((a) => ({ ...a, hasta: { ...a.hasta, 'hasta-portali': { kapi: { enAzYas: 18 }, metin: 'x' } } })), /hasta-portali\.hasta: a screen of the kit is not a tool for one patient/],
    // ── roles ──
    ['a role of its own with no questions and nothing to behave like', () => ile((g) => ({ ...g, roller: { ...g.roller!, ekle: g.roller!.ekle!.map((r) => (r.anahtar === 'xx-nurse' ? { ...r, form: undefined } : r)) } })), /hastaFormu\.roller\.xx-nurse: the role has no questions of its own/],
    ['a role of its own whose template names a field nobody defines', () => ile((g) => ({ ...g, roller: { ...g.roller!, alanlar: {} } })), /notSablonlari\.rolAlanlari\.xx-nurse: names the field "xx_scope_note", which is not defined/],
    ['a role key the database could not keep', () => ile((g) => ({ ...g, roller: { ...g.roller!, ekle: [...g.roller!.ekle!, { anahtar: `xx-${'a'.repeat(60)}`, taraf: 'doktor' as const, ad: 'Long', gibi: 'cardiology' as const }] } })), /a role key is at most 60 characters/],
    ['a role added twice', () => ile((g) => ({ ...g, roller: { ...g.roller!, ekle: [...g.roller!.ekle!, g.roller!.ekle![2]] } })), /arayuz\.roller: a role is listed twice/],
  ]
  for (const [ad, yap, desen] of HATALAR) it(`refused: ${ad}`, () => bekle(yap(), desen))

  it('a role that behaves like itself, like a role that has nothing, or like a role that itself behaves like another, is refused (stated in the kit\'s own shape)', () => {
    const roller = (degis: (r: UlkeArayuzu['roller'][number]) => UlkeArayuzu['roller'][number]) => sorunlar({ ...XX_ARAYUZ, roller: XX_ARAYUZ.roller.map(degis) })
    bekle(roller((r) => (r.anahtar === 'xx-geriatrics' ? { ...r, gibi: 'xx-geriatrics' } : r)), /roller\.xx-geriatrics\.gibi: a role cannot behave like itself/)
    bekle(roller((r) => (r.anahtar === 'xx-geriatrics' ? { ...r, gibi: 'xx-vascular' } : r)), /roller\.xx-geriatrics\.gibi: "xx-vascular" itself behaves like another role/)
    bekle(roller((r) => (r.anahtar === 'xx-geriatrics' ? { ...r, gibi: 'no-such-role' } : r)), /roller\.xx-geriatrics\.gibi: "no-such-role" has neither a note template nor intake questions in this pack: there is nothing to behave like/)
    // (through the language set this cannot happen: the set keeps the template and the questions of every role one of the country's roles behaves like)
    assert.ok('clinic-dermatology' in enArayuz({ ...XX_GIRDI, roller: { ...XX_GIRDI.roller!, ekle: XX_GIRDI.roller!.ekle!.map((r) => (r.anahtar === 'xx-geriatrics' ? { ...r, gibi: 'clinic-dermatology' as const } : r)) } }).notSablonlari.rolAlanlari)
  })
})
