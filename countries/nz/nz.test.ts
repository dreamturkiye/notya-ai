/**
 * NOTYA-ULKE-EN-01 — New Zealand (`nz`): the pack's own tests. The tests every English-speaking pack runs on itself
 * (countries/_dil/en/testing/paketSinamasi.ts), with what is New Zealand's: New Zealand spelling (the British base,
 * unchanged), SI units, two time zones, the tools it keeps as slots, and the words of the other English-speaking
 * countries that must not show here.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { EN_ROLLER } from '../_dil/en/klinik/roller'
import { ingilizcePaketSinamasi, kaynakOku } from '../_dil/en/testing/paketSinamasi'
import { enYaz } from '../_dil/en/varyant'
import { NZ_ARAYUZ } from './arayuz'
import { NZ_GIRDI, NZ_ROLLER } from './ayarlar'
import derleme from './derleme.mjs'
import { NZ_PAKETI, nzAramaKatla } from './index'
import { NZ_KLINIK } from './klinik'
import { NZ_KENDI_BASLIKLI_ROLLER } from './klinik/hastaFormu'

const D = 'en-NZ'
const BUGUN = '2026-10-10'

ingilizcePaketSinamasi({
  paket: NZ_PAKETI,
  arayuz: NZ_ARAYUZ,
  klinik: NZ_KLINIK,
  bicim: D,
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United Kingdom, United States, Canada, Australia: their systems, identifiers, currencies, names, usage
  yabanci: /\b(NHS|GBP|USD|CAD|AUD|United Kingdom|United States|Canada|Canadian|provincial|Quebec|Australia|Australian|HIPAA|Medicaid|Medicare|health card|Anaesthetics|Anesthesiology|Pulmonology|Respirology|Respiratory and sleep medicine|Physical therapist|attending physician|staff physician|consultant)\b|£/,
  // off by Kaan's order of 2026-10-10 as well (NOTYA-ULKE-ARAC-01b): all five; 'doz-hesabi' was on here until that day
  kapaliAraclar: ['doz-hesabi', 'esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'],
  birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' },
  labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L', crp: 'mg/L', psa: 'ug/L' },
  kidemliHekim: 'specialist',
  // a range reserved for fiction where this job is certain of one; otherwise a shape that is no number (see ./ayarlar.ts)
  ornekTelefon: /^\+64 2X XXX XXXX$/,
  // NOTYA-ULKE-UYGULA-NZ: the country's own role list
  rolDegisimi: NZ_ROLLER,
})

const ad = (rol: string) => NZ_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]

describe('nz: what is New Zealand\'s', () => {
  it('code nz, served at /nz; day first; week from Monday; 12-hour clock; SI units; New Zealand dollars', () => {
    assert.equal(NZ_PAKETI.kod, 'nz')
    assert.equal(NZ_PAKETI.yolOnEki, '/nz')
    assert.equal(derleme.yolOnEki, '/nz')
    assert.equal(derleme.saatDilimi, NZ_PAKETI.saatDilimi)
    assert.equal(NZ_PAKETI.bicim.tarihDeseni, 'DD/MM/YYYY')
    assert.equal(NZ_PAKETI.bicim.haftaBasi, 1)
    assert.equal(NZ_PAKETI.uygulama!.saatBicimi, 12)
    assert.equal(NZ_PAKETI.paraBirimi.kod, 'NZD')
    assert.equal(NZ_ARAYUZ.randevuMetinleri![D]!.form.tarihOrnek, 'DD/MM/YYYY')
  })

  it('two time zones: the default is one of them, an account is asked, and the calendar names no single zone', () => {
    const dilimler = [...NZ_PAKETI.uygulama!.saatDilimleri]
    assert.deepEqual(dilimler, ['Pacific/Auckland', 'Pacific/Chatham'])
    assert.ok(dilimler.includes(NZ_PAKETI.saatDilimi))
    assert.equal(NZ_ARAYUZ.metinler[D]!.ayarlar.saatDilimi, 'Time zone')
    assert.equal(NZ_ARAYUZ.randevuMetinleri![D]!.duzen.saatDilimi, 'Times are shown in the time zone set for your account.')
  })

  it('New Zealand spelling on the screens — the British base, "programme" kept — and the country\'s own names for its specialties', () => {
    const ad = (rol: string) => NZ_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]
    assert.equal(ad('paediatrics'), 'Paediatrics')
    assert.equal(ad('anaesthesia'), 'Anaesthesia')
    assert.equal(ad('family-medicine'), 'General practice')
    assert.equal(ad('internal-medicine'), 'Internal medicine')
    assert.equal(ad('respiratory-medicine'), 'Respiratory medicine')
    assert.equal(NZ_ARAYUZ.randevuMetinleri![D]!.durum.iptal, 'Cancelled')
    assert.equal(enYaz('a rehabilitation programme', D), 'a rehabilitation programme')
    assert.match(NZ_KLINIK.notTalimati(D, 'general') ?? '', /You are an experienced specialist\.[\s\S]*in New Zealand spelling/)
  })

  it('the patient identifier is labelled "NHI number"; the guardian age is the pack\'s setting in both halves', () => {
    assert.equal(NZ_PAKETI.ulusalKimlik?.ad, 'NHI number')
    assert.equal(NZ_ARAYUZ.metinler[D]!.yeniHasta.ulusalKimlik, 'NHI number')
    assert.equal(NZ_PAKETI.uygulama!.veliYasi, NZ_GIRDI.veliYasi)
    assert.equal(NZ_PAKETI.uygulama!.veliYasi, 16)
  })

  it('prostate-specific antigen is written in µg/L; the consent stamp is New Zealand\'s own draft', () => {
    const a = NZ_ARAYUZ.araclar!
    assert.equal(a.labBirimleri.psa, 'ug/L')
    assert.equal(a.birimler['ug/L'][D], 'µg/L')
    assert.equal(a.birimler['ug/L/yil'][D], 'µg/L per year')
    assert.ok(!('ng/mL' in a.birimler), 'no tool shows ng/mL here')
    assert.equal(NZ_KLINIK.riza.surum, 'nz-draft-2026-10-09')
    assert.equal(NZ_ARAYUZ.metinler[D]!.muayene.riza, NZ_GIRDI.sozler.kayitRizasi)
  })
})

// ───────────────────────── NOTYA-ULKE-DENETIM-NZ (2026-10-09): the localisation audit, carried ─────────────────────────
// What the audit of the built pack compared with an official source and fixed or confirmed (its branch: audit/nz).
describe('nz: the localisation audit of 2026-10-09, carried into this pack', () => {
  it('AUDIT: the emergency number is 111, a setting and never a sentence; the two zones are the two times the law sets', () => {
    assert.equal(NZ_PAKETI.uygulama!.portal!.acilNumara, '111')
    const sayfa = NZ_ARAYUZ.portalMetinleri![D]!.sayfa
    assert.doesNotMatch(sayfa.acil + sayfa.acilNumara, /\d/)
    // main islands: UTC+12 in winter, +13 in summer; Chatham Islands: 45 minutes ahead of them all year
    const ofset = (dilim: string, an: string) => new Intl.DateTimeFormat('en-GB', { timeZone: dilim, timeZoneName: 'longOffset' }).formatToParts(new Date(an)).find((x) => x.type === 'timeZoneName')?.value
    assert.equal(ofset('Pacific/Auckland', '2026-07-01T00:00:00Z'), 'GMT+12:00')
    assert.equal(ofset('Pacific/Auckland', '2026-12-01T00:00:00Z'), 'GMT+13:00')
    assert.equal(ofset('Pacific/Chatham', '2026-07-01T00:00:00Z'), 'GMT+12:45')
    assert.equal(ofset('Pacific/Chatham', '2026-12-01T00:00:00Z'), 'GMT+13:45')
    assert.equal(NZ_PAKETI.saatDilimi, 'Pacific/Auckland')
  })

  it('AUDIT: an NHI number of either form is kept as typed (letters and digits), and nothing asks for a tax number', () => {
    const k = NZ_PAKETI.ulusalKimlik!
    // test numbers of the two forms: three letters, three digits, check digit; three letters, two digits, letter, check letter
    for (const ornek of ['ZZZ0016', 'ZZZ00AX']) assert.equal(k.gecerliMi(ornek), true, ornek)
    assert.equal(NZ_PAKETI.uygulama!.kimlikNumarasi.dogrula, false)
    assert.equal(k.hane, 0)
    const sorular = [...NZ_KLINIK.hastaFormu!.cekirdek.bolumler.flatMap((b) => b.sorular), ...Object.values(NZ_KLINIK.hastaFormu!.roller).flatMap((r) => r.sorular)]
    for (const q of sorular) assert.doesNotMatch(q.metin[D], /\b(IRD|tax number|tax file)\b/i, q.anahtar)
    assert.doesNotMatch(JSON.stringify(NZ_ARAYUZ.metinler[D]), /\bIRD\b|tax number/i)
  })

  it('AUDIT: dates day first with slashes, decimal point, comma for thousands, dollars with two decimals; a name with a macron is kept', () => {
    assert.deepEqual(NZ_PAKETI.bicim, { yerel: 'en-NZ', tarihDeseni: 'DD/MM/YYYY', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 1 })
    assert.deepEqual(NZ_PAKETI.paraBirimi, { kod: 'NZD', simge: '$', ondalikHane: 2 })
    assert.equal(NZ_GIRDI.acilis.aylikTutarKalibi, '$% a month')
    // the pack's own locale sorts and compares a macron as its letter: "Pōtae" files beside "Potae", and is not altered
    const isim = 'Wiremu Pōtae'
    assert.equal(isim.normalize('NFC'), isim)
    assert.equal(new Intl.Collator(NZ_PAKETI.bicim.yerel, { sensitivity: 'base' }).compare('Pōtae', 'Potae'), 0)
  })

  it('AUDIT: a name with a macron is found with or without it, and the name itself is never changed', () => {
    assert.equal(NZ_PAKETI.uygulama!.aramaKatla, nzAramaKatla)
    assert.equal(nzAramaKatla('Wiremu Pōtae'), 'wiremu potae')
    assert.equal(nzAramaKatla('PŌTAE'), nzAramaKatla('potae'))
    assert.equal(nzAramaKatla('Ngāti Whātua Ōrākei'), 'ngati whatua orakei')
    assert.equal(nzAramaKatla('O’Brien'), nzAramaKatla("O'Brien"))
    assert.ok(nzAramaKatla('Wiremu Pōtae').includes(nzAramaKatla('Potae')))
    // digits and plain letters pass through: an NHI number typed into the search box is not altered beyond its case
    assert.equal(nzAramaKatla('ZZZ00AX'), 'zzz00ax')
  })

  it('AUDIT: the mobile rule takes the common spellings of a mobile number and refuses a landline and the emergency number', () => {
    const t = NZ_PAKETI.telefon
    assert.equal(t.ulkeOnEki, '+64')
    for (const ham of ['+64 21 123 4567', '021 123 4567', '027 123 4567', '+64 22 123 4567', '0064 21 123 4567', '021 123 456', '021 1234 5678']) assert.equal(t.cepGecerliMi(ham), true, ham)
    for (const ham of ['', '09 123 4567', '+64 9 123 4567', '111', '0800 611 116', 'abc']) assert.equal(t.cepGecerliMi(ham), false, ham)
  })

  it('AUDIT: the triage tool of another scale stays off, and its slot says which scale is used here', () => {
    assert.match(NZ_GIRDI.araclar.kapali['esi-triyaj'].eksik, /Australasian triage scale/)
    assert.ok(!NZ_ARAYUZ.araclar!.araclar.some((x) => x.anahtar === 'esi-triyaj'))
  })
})

// ───────────────────────── NOTYA-ULKE-UYGULA-NZ: specialties and clinic roles ─────────────────────────
describe('nz: the role list is New Zealand\'s own — 53 roles, the shared forty and thirteen more', () => {
  /**
   * SOURCE (opened 2026-10-10): Medical Council of New Zealand, "Types of vocational scope",
   * https://www.mcnz.org.nz/registration/scopes-of-practice/vocational-and-provisional-vocational/types-of-vocational-scope/
   * — 36 vocational scopes. The names below are written as that list writes them.
   */
  const KAPSAMLAR: Readonly<Record<string, string>> = {
    // roles of the shared set that are scopes of the council's list, by the council's name
    'emergency-medicine': 'Emergency medicine', 'family-medicine': 'General practice', anaesthesia: 'Anaesthesia', neurosurgery: 'Neurosurgery',
    'paediatric-surgery': 'Paediatric surgery', 'internal-medicine': 'Internal medicine', dermatology: 'Dermatology', 'general-surgery': 'General surgery',
    'thoracic-surgery': 'Cardiothoracic surgery', ophthalmology: 'Ophthalmology', 'obstetrics-gynaecology': 'Obstetrics and gynaecology',
    'cardiovascular-surgery': 'Vascular surgery', otolaryngology: 'Otolaryngology, head and neck surgery', orthopaedics: 'Orthopaedic surgery',
    paediatrics: 'Paediatrics', 'plastic-surgery': 'Plastic and reconstructive surgery', psychiatry: 'Psychiatry',
    radiology: 'Diagnostic and interventional radiology', urology: 'Urology', 'sports-medicine': 'Sport and exercise medicine',
    'rehabilitation-medicine': 'Rehabilitation medicine',
    // the nine scopes only this country's pack has
    'urgent-care-medicine': 'Urgent care medicine', 'rural-hospital-medicine': 'Rural hospital medicine', 'musculoskeletal-medicine': 'Musculoskeletal medicine',
    'occupational-medicine': 'Occupational medicine', 'pain-medicine': 'Pain medicine', 'sexual-health-medicine': 'Sexual health medicine',
    'family-planning-reproductive-health': 'Family planning and reproductive health', 'palliative-medicine': 'Palliative medicine',
    'oral-maxillofacial-surgery': 'Oral and maxillofacial surgery',
  }

  it('SIX RENAMES AND NINE ADDED SCOPES are named exactly as the medical council\'s list of vocational scopes writes them', () => {
    for (const [rol, beklenen] of Object.entries(KAPSAMLAR)) assert.equal(ad(rol), beklenen, rol)
    // "medical oncology" is an area the list names inside the scope "Internal medicine", not a scope of its own
    assert.equal(ad('oncology'), 'Medical oncology')
    // the names the audits replaced must not come back
    const adlar = NZ_ARAYUZ.roller.map((r) => r.ad[D])
    for (const eski of ['General medicine', 'Thoracic surgery', 'Cardiac and vascular surgery', 'Oncology', 'Plastic surgery', 'Radiology', 'Family medicine', 'Dermatology (clinic)']) assert.ok(!adlar.includes(eski), eski)
    // the dermatology clinic role is the same scope as the doctor role, and carries the scope's name
    assert.equal(ad('clinic-dermatology'), 'Dermatology')
  })

  it('the allied professions are named as the profession: the set\'s five, and the four regulated professions this country adds', () => {
    // SOURCE (opened 2026-10-10): Ministry of Health, "Responsible authorities", last updated 26 January 2026,
    // https://www.health.govt.nz/regulation-legislation/health-practitioners/responsible-authorities
    // — podiatry, osteopathy, chiropractic and psychotherapy each have an authority there.
    assert.deepEqual(['physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'audiology'].map(ad), ['Physiotherapist', 'Clinical psychologist', 'Dietitian', 'Occupational therapist', 'Audiologist'])
    assert.deepEqual(['podiatry', 'osteopathy', 'chiropractic', 'psychotherapy'].map(ad), ['Podiatrist', 'Osteopath', 'Chiropractor', 'Psychotherapist'])
    for (const rol of ['podiatry', 'osteopathy', 'chiropractic', 'psychotherapy']) assert.equal(NZ_ARAYUZ.roller.find((r) => r.anahtar === rol)?.taraf, 'klinik-muttefik', rol)
  })

  it('A PROFESSION THAT IS NOT A DOCTOR\'S NEVER BEHAVES LIKE A DOCTOR\'S ROLE: the nurse practitioner, the midwife and the optometrist are not roles here until the kit can address them', () => {
    // The kit's one opening for such a professional says "not a doctor" and "make no medical diagnosis", and sends a
    // referring doctor's diagnosis to a field a doctor's template does not have (see NZ_ROLLER in ./ayarlar.ts).
    const tarafi = (rol: string) => NZ_ARAYUZ.roller.find((r) => r.anahtar === rol)?.taraf
    for (const r of NZ_ROLLER.ekle ?? []) if (r.taraf === 'klinik-muttefik') assert.equal(tarafi(r.gibi as string), 'klinik-muttefik', `${r.anahtar} behaves like ${r.gibi}, a doctor's role`)
    for (const rol of ['nurse-practitioner', 'midwifery', 'optometry']) assert.ok(!NZ_PAKETI.uygulama!.roller!.includes(rol), rol)
    for (const rol of ['podiatry', 'osteopathy', 'chiropractic', 'psychotherapy']) assert.match(NZ_KLINIK.notTalimati(D, rol) ?? '', /^Your colleague is a health professional and not a doctor/, rol)
  })

  it('53 roles: 39 doctor specialties, 5 clinic doctors, 9 allied professions — and the list is ACTIVE in the pack', () => {
    const roller = NZ_ARAYUZ.roller
    assert.equal(roller.length, 53)
    assert.deepEqual([roller.filter((r) => r.taraf === 'doktor').length, roller.filter((r) => r.taraf === 'klinik-hekim').length, roller.filter((r) => r.taraf === 'klinik-muttefik').length], [39, 5, 9])
    assert.deepEqual([...NZ_PAKETI.uygulama!.roller!], roller.map((r) => r.anahtar))
    assert.equal(new Set(roller.map((r) => r.anahtar)).size, 53)
    // no two roles OF THE SAME KIND share a name (the dermatology clinic role shares its name with the doctor role on purpose)
    for (const taraf of ['doktor', 'klinik-hekim', 'klinik-muttefik']) { const adlar = roller.filter((r) => r.taraf === taraf).map((r) => r.ad[D]); assert.equal(new Set(adlar).size, adlar.length, taraf) }
  })

  it('A STORED ACCOUNT STILL LOADS: no shared role is taken out or split, so every one of the forty keys is still a role here, with its name, its note template and its intake questions', () => {
    assert.deepEqual([...(NZ_ROLLER.cikar ?? [])], [], 'New Zealand takes no shared role out: a key that leaves this list needs a mapping for the accounts stored under it, and a test of it')
    const roller = NZ_PAKETI.uygulama!.roller!
    for (const k of EN_ROLLER) {
      assert.ok(roller.includes(k), `${k}: an account stored under this key would no longer load`)
      assert.ok(ad(k)?.trim(), `${k}: no name`)
      assert.ok(NZ_KLINIK.notTalimati(D, k), `${k}: no instruction for its note`)
      assert.ok(NZ_KLINIK.hastaFormu!.roller[k], `${k}: no intake questions`)
    }
    // the two roles whose NAME changed most keep their keys: an account stored as "thoracic-surgery" or "cardiovascular-surgery" is the same account
    assert.equal(ad('thoracic-surgery'), 'Cardiothoracic surgery')
    assert.equal(ad('cardiovascular-surgery'), 'Vascular surgery')
  })

  it('EVERY ROLE THIS COUNTRY ADDS says which shared role it behaves like, and writes its notes and asks its questions through it', () => {
    const eklenen = NZ_ROLLER.ekle ?? []
    assert.equal(eklenen.length, 13)
    for (const r of eklenen) {
      assert.ok(r.gibi && (EN_ROLLER as readonly string[]).includes(r.gibi), `${r.anahtar}: behaves like no shared role`)
      const tanim = NZ_ARAYUZ.roller.find((x) => x.anahtar === r.anahtar)
      assert.equal(tanim?.gibi, r.gibi, r.anahtar)
      // its note is written with the template of the role it behaves like, under its own name
      const talimat = NZ_KLINIK.notTalimati(D, r.anahtar) ?? ''
      assert.ok(talimat.length > 0, `${r.anahtar}: no instruction`)
      const yetiskin = { dogumTarihi: '1980-01-01', muayeneTarihi: BUGUN }
      assert.deepEqual([...NZ_KLINIK.notAlanlari!(r.anahtar, yetiskin)], [...NZ_KLINIK.notAlanlari!(r.gibi as string, yetiskin)], `${r.anahtar}: its note fields are those of ${r.gibi}`)
      assert.ok(NZ_KLINIK.notAlanlari!(r.anahtar, yetiskin).length > 0, `${r.anahtar}: no note fields`)
      assert.ok(talimat.includes(r.ad.toLocaleUpperCase('en')), `${r.anahtar}: the instruction names the role itself, not the one it behaves like`)
    }
    assert.match(NZ_KLINIK.notTalimati(D, 'podiatry') ?? '', /^Your colleague is a health professional and not a doctor: their profession is "Podiatrist"\./)
    assert.match(NZ_KLINIK.notTalimati(D, 'urgent-care-medicine') ?? '', /^You are an experienced specialist\./)
  })

  it('A PATIENT NEVER READS ANOTHER PROFESSION\'S NAME ABOVE THE QUESTIONS: eleven added roles ask the questions of the role they behave like under a heading and keys of their own', () => {
    const f = NZ_KLINIK.hastaFormu!
    const eklenen = NZ_ROLLER.ekle ?? []
    assert.equal(NZ_KENDI_BASLIKLI_ROLLER.length, 11)
    for (const rol of NZ_KENDI_BASLIKLI_ROLLER) {
      const gibi = eklenen.find((r) => r.anahtar === rol)!.gibi as string
      const kendi = f.roller[rol], onun = f.roller[gibi]
      assert.ok(kendi && onun, rol)
      // the heading is this country's own and names no profession that is not the role's
      assert.notEqual(kendi.baslik[D], onun.baslik[D], rol)
      assert.doesNotMatch(kendi.baslik[D], /family doctor|physiotherap|plastic|rehabilitation|internal medicine|emergency|oncolog/i, rol)
      // the questions are the set's, word for word, each under a key of the role's own
      assert.deepEqual(kendi.sorular.map((q) => q.metin[D]), onun.sorular.map((q) => q.metin[D]), rol)
      for (const q of kendi.sorular) assert.match(q.anahtar, /^nz_[a-z]+_[a-z0-9_]+$/, `${rol}: ${q.anahtar}`)
      assert.deepEqual(kendi.inceleme, { makineYazimi: true, klinisyen: null }, rol)
    }
    assert.equal(f.roller['occupational-medicine'].baslik[D], 'For your doctor')
    assert.equal(f.roller.podiatry.baslik[D], 'Before your appointment')
    // the other two ask under the heading of the role they behave like, which names no other profession
    const digerleri = eklenen.filter((r) => !NZ_KENDI_BASLIKLI_ROLLER.includes(r.anahtar))
    assert.deepEqual(digerleri.map((r) => r.anahtar), ['family-planning-reproductive-health', 'psychotherapy'])
    for (const r of digerleri) assert.equal(f.roller[r.anahtar], undefined, `${r.anahtar}: found through the role it behaves like`)
    assert.deepEqual(digerleri.map((r) => f.roller[r.gibi as string].baslik[D]), ['Women\'s health', 'Before the first conversation'])
    // every question key is still unique in the whole pack
    const anahtarlar = [...f.cekirdek.bolumler.flatMap((x) => x.sorular), ...Object.values(f.roller).flatMap((r) => r.sorular)].map((q) => q.anahtar)
    assert.equal(new Set(anahtarlar).size, anahtarlar.length)
  })
})
