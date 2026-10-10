/**
 * NOTYA-ULKE-EN-01 — writes the RECORD of an English-speaking country: docs/COUNTRY-PACK-<NAME>.md, the filled copy of
 * docs/COUNTRY-PACK-CHECKLIST.md for that country.
 *
 *   NOTYA_COUNTRY=<code> npx --yes tsx scripts/ulke-en-kayit.mts            writes the file
 *   NOTYA_COUNTRY=<code> npx --yes tsx scripts/ulke-en-kayit.mts --denetle   exit 1 if the file on disk is not what would be written
 *   npx --yes tsx scripts/ulke-en-kayit.mts --ulke <code> [--denetle]         the same, the country named as an argument
 *
 * WHY A SCRIPT. Every setting, every tool with the unit each of its inputs takes, and every empty slot is read from
 * the pack itself, so the record cannot drift from the pack; what a machine cannot read from the pack — the open
 * regulatory questions of the country, who each item waits on — is written below, per country, and NONE OF IT IS
 * ANSWERED AS FACT. Scripts and tests only: it reads the active pack and no application code reads it.
 *
 * It changes one file under docs/ and nothing else: no database, no deployment, no setting.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { alanBirimi, alanBirimleri } from '@/lib/ulke/araclar/birimler'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { paketinTanimi } from '@/lib/ulke/araclar/paket'
import { enFormYuvalari } from '@/countries/_dil/en/klinik/hastaFormu'
import { paketMetinleri } from '@/countries/_dil/en/testing/paketSinamasi'
import type { EnUlkeGirdisi } from '@/countries/_dil/en/girdi'
import type { EnBicim } from '@/countries/_dil/en/varyant'

// `--ulke <code>` names the country for a caller that may not read the build variable itself (the tests of a pack)
const ulkeArg = process.argv.indexOf('--ulke')
if (ulkeArg > -1) process.env.NOTYA_COUNTRY = process.argv[ulkeArg + 1]
const { AKTIF_PAKET: p } = await import('@/countries/active')
const { AKTIF_ARAYUZ: a } = await import('@/countries/active/arayuz')
const { AKTIF_KLINIK: k } = await import('@/countries/active/klinik')
const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
if (!a || !k || !p.uygulama || !a.araclar || !a.acilis || !k.hastaFormu) throw new Error(`"${p.kod}" is not an English-speaking pack with the signed-in application`)
const d = p.varsayilanDil
const u = p.uygulama

type Ulke = {
  ad: string; dosya: string; kimlikNotu: string; saatNotu: string; veliNotu: string; kayitRizasiNotu: string
  /** Why the example phone number can be nobody's: a range reserved for fiction, or a shape that is no number. */
  telefonNotu: string
  /** The open regulatory questions. Asked, never answered: each is for a lawyer of the country. */
  hukuk: readonly string[]
  /** What else is specific to this country and still open. */
  ekNotlar: readonly string[]
}
const LAWYER = 'for a lawyer'
const LAB_ADLARI: Readonly<Record<string, string>> = { albuminKreatinin: 'urine albumin-to-creatinine ratio', hemoglobin: 'haemoglobin', kreatinin: 'creatinine', glukoz: 'glucose', kolesterol: 'cholesterol' }
const ULKELER: Readonly<Record<string, Ulke>> = {
  gb: {
    ad: 'United Kingdom', dosya: 'COUNTRY-PACK-UNITED-KINGDOM.md',
    kimlikNotu: 'Label "NHS number". Whether a clinic outside the health service records one, and whether the label fits Scotland and Northern Ireland (which use other identifiers), is unverified.',
    saatNotu: 'One zone (Europe/London). The 24-hour clock is an unverified choice.',
    veliNotu: '16 as a starting value. How capacity and consent of under-16s and of 16 and 17 year olds bear on the guardian wording and on the form a parent fills in differs between the nations of the United Kingdom.',
    telefonNotu: 'The example is from the range the communications regulator sets aside for television and radio drama (07700 900000 to 900999). Unverified.',
    kayitRizasiNotu: 'A draft sentence. Whether recording a consultation needs more than the patient\'s agreement recorded by the doctor (a written form, a notice, a retention rule) is open.',
    hukuk: [
      'UK GDPR and the Data Protection Act 2018: lawful basis and the condition for processing health data; the roles of the clinic and of the product (controller, processor) and the contract between them; a data protection impact assessment; registration with the regulator; transfers of patient data outside the United Kingdom to the database host, the speech provider and the model provider; breach notification deadlines.',
      'THE MEDICAL-DEVICE QUESTION FOR CLINICAL CALCULATORS: whether the tools area (scores, the dose arithmetic, the KDIGO grid, DAS28) or the drafting of a visit note brings the product under the UK medical device regulations, in which class, and what that requires before a doctor uses it with a patient.',
      'Recording a consultation: what consent and what notice are required, and how long a recording may be kept.',
      'Children: who may consent, and at what age, in England, Wales, Scotland and Northern Ireland; what a guardian form may ask.',
      'Whether any rule of the health service or of the professional regulators applies to a private doctor using such a product, and what may be said in marketing to doctors.',
    ],
    ekNotlar: ['FOR A LOCAL CLINICAL LEAD: prostate-specific antigen is shown in ng/mL; the ESI triage record, the two KDIGO tools and the report outline with the BI-RADS assessment categories are kept as slots (below).', 'Public holidays differ between England and Wales, Scotland and Northern Ireland; none is in the pack.', 'A consultant surgeon is addressed as Mr, Ms, Miss or Mrs, not Dr: this matters when an assistant is given a name and a title. No assistant is named today.'],
  },
  us: {
    ad: 'United States', dosya: 'COUNTRY-PACK-UNITED-STATES.md',
    kimlikNotu: 'A neutral label, "Patient identifier" (for example a clinic\'s own record number). NEVER A SOCIAL SECURITY NUMBER: no screen asks for one, and a test fails if any text mentions it.',
    saatNotu: 'Several zones are offered (listed in the row) and an account chooses its own; the default (America/New_York) and the list are unverified choices, and territories are not listed.',
    veliNotu: '18 as a starting value. The age of majority and the rules on a minor\'s own consent differ by state.',
    telefonNotu: 'The example is one of the numbers the North American numbering plan sets aside for fiction (555-0100 to 555-0199 in every area code). Unverified.',
    kayitRizasiNotu: 'A draft sentence. RECORDING-CONSENT LAW DIFFERS BY STATE (some states require the consent of everyone recorded): the sentence must not be relied on in any state until a lawyer has read it for that state.',
    hukuk: [
      'HIPAA: whether and when the product acts as a business associate of a clinic, and THE BUSINESS-ASSOCIATE AGREEMENTS NEEDED WITH EVERY VENDOR THAT WOULD SEE PATIENT DATA — the database host, the speech-recognition provider and the model provider — BEFORE ANY REAL PATIENT; the security and breach-notification duties that follow.',
      'State law: health-privacy laws stricter than the federal rule, consumer health-data laws, and RECORDING-CONSENT LAW, WHICH DIFFERS BY STATE.',
      'Whether any tool (the scores, the KDIGO grid, DAS28) or the drafting of a note is regulated as a medical device or as clinical decision support, and what that requires.',
      'Minors: consent and confidentiality by state; what a guardian form may ask.',
      'Selling to doctors across states: licensing of the doctors who use it, telehealth rules where they apply, and marketing rules.',
    ],
    ekNotlar: ['CONVENTIONAL UNITS: weight in pounds, height in inches, temperature in degrees Fahrenheit; laboratory values in mg/dL and g/dL, the albumin-to-creatinine ratio in mg/g. Each is an unverified setting.', 'FOR A LOCAL CLINICAL LEAD: weight-based dose arithmetic is kept as a slot because this pack measures weight in pounds.', 'FOR A LOCAL CLINICAL LEAD: in DAS28 the C-reactive protein field takes mg/L, and its label says so and how to convert from mg/dL.', 'FOR A LOCAL CLINICAL LEAD: the two KDIGO tools are switched on here because the albumin-to-creatinine ratio is reported in mg/g, the unit the kit classifies in; the ESI triage record and the report outline with the BI-RADS assessment categories are switched on here.', 'The week starts on Sunday and the clock is 12-hour: unverified choices.'],
  },
  ca: {
    ad: 'Canada', dosya: 'COUNTRY-PACK-CANADA.md',
    kimlikNotu: 'Label "Provincial health card number". Format and name differ by province and territory; unverified.',
    saatNotu: 'Several zones are offered (listed in the row) and an account chooses its own; the default (America/Toronto) and the list are unverified choices.',
    veliNotu: '16 as a starting value. Consent of minors is a matter of provincial law and differs by province; Quebec sets its own age.',
    telefonNotu: 'The example is one of the numbers the North American numbering plan sets aside for fiction (555-0100 to 555-0199 in every area code). Unverified.',
    kayitRizasiNotu: 'A draft sentence. Federal and provincial rules on recording a consultation are open.',
    hukuk: [
      'PIPEDA, and THE PROVINCIAL HEALTH-PRIVACY LAWS that apply instead of it or beside it (each province has its own; some are deemed substantially similar): which law governs a private doctor in each province, the roles of the clinic and the product, and storing or processing patient data outside the province or outside Canada.',
      'QUEBEC: its own privacy law and its own language law. FRENCH IS ABSENT from this pack: whether the product may be offered in Quebec, or anywhere in Canada to French-speaking patients, without French is a legal and a commercial question. WAITING ON KAAN.',
      'Whether any tool or the drafting of a note is regulated as a medical device, and what that requires.',
      'Minors: consent by province; what a guardian form may ask.',
      'Recording a consultation: consent and retention, federally and by province.',
    ],
    ekNotlar: ['ENGLISH ONLY. French is not written: no screen, no note, no patient text. Waiting on Kaan.', 'Canadian spelling is a mix stated word by word in the language set (colour, centre; organize, pediatric); no Canadian editor has read it.', 'FOR A LOCAL CLINICAL LEAD: prostate-specific antigen is shown in µg/L (numerically the same as ng/mL).', 'FOR A LOCAL CLINICAL LEAD: the report outline with the BI-RADS assessment categories is switched on here; the ESI triage record and the two KDIGO tools are kept as slots (below).', 'The date is written year first (YYYY-MM-DD), the week starts on Sunday and the clock is 12-hour: unverified choices.'],
  },
  au: {
    ad: 'Australia', dosya: 'COUNTRY-PACK-AUSTRALIA.md',
    kimlikNotu: 'Label "Medicare number". Whether a private clinic should record it in this product at all is unverified.',
    saatNotu: 'Several zones are offered (listed in the row) and an account chooses its own; the default (Australia/Sydney) and the list are unverified choices.',
    veliNotu: '16 as a starting value. Consent of minors differs by state and territory.',
    telefonNotu: 'The example is one of the mobile numbers the communications regulator sets aside for creative works (0491 570 006, 0491 570 110, 0491 570 156 to 159). Unverified.',
    kayitRizasiNotu: 'A draft sentence. Recording a consultation is governed by state and territory law, which differs.',
    hukuk: [
      'The Privacy Act and the Australian Privacy Principles for health information; state and territory health-records laws; sending patient data overseas to the database host, the speech provider and the model provider; breach notification.',
      'MY HEALTH RECORDS RULES: this product has no connection to the national record and claims none; whether anything a doctor copies from it into that record, or reads from it, brings obligations is open.',
      'Whether any tool or the drafting of a note is regulated as a medical device (software as a medical device), and what that requires.',
      'Minors: consent by state and territory; what a guardian form may ask.',
      'Recording a consultation: consent by state and territory; retention.',
      'Advertising rules for health services and for software sold to doctors.',
    ],
    ekNotlar: ['Australian spelling is the British base with "program"; no Australian editor has read it.', 'FOR A LOCAL CLINICAL LEAD: prostate-specific antigen is shown in µg/L (numerically the same as ng/mL).', 'FOR A LOCAL CLINICAL LEAD: the ESI triage record, the two KDIGO tools and the report outline with the BI-RADS assessment categories are kept as slots (below).', 'The 12-hour clock is an unverified choice.'],
  },
  nz: {
    ad: 'New Zealand', dosya: 'COUNTRY-PACK-NEW-ZEALAND.md',
    kimlikNotu: 'Label "NHI number". Unverified wording; whether a private clinic records it here is open.',
    saatNotu: 'Two zones are offered (the main islands and the Chatham Islands) and an account chooses its own.',
    veliNotu: '16 as a starting value, for a lawyer.',
    telefonNotu: 'THE EXAMPLE IS A SHAPE, NOT A NUMBER ("X" in place of digits): this job knows of no range New Zealand reserves for fiction with certainty. It cannot be dialled and can be nobody\'s. A number from a reserved range, if a local source names one, may replace it. Unverified.',
    kayitRizasiNotu: 'A draft sentence. What consent and notice a recording needs is open.',
    hukuk: [
      'THE HEALTH INFORMATION PRIVACY CODE and the Privacy Act: collection, use, storage and disclosure of health information by a private doctor; sending it outside New Zealand to the database host, the speech provider and the model provider; breach notification.',
      'Whether any tool or the drafting of a note is regulated as a medical device or therapeutic product, and what that requires.',
      'Minors: consent; what a guardian form may ask.',
      'Recording a consultation: consent and retention.',
      'Māori data sovereignty and the use of te reo Māori in health services: whether and how they bear on this product is a question for local advice. No te reo Māori text is written.',
    ],
    ekNotlar: ['New Zealand spelling is the British base, unchanged; no New Zealand editor has read it.', 'FOR A LOCAL CLINICAL LEAD: prostate-specific antigen is shown in µg/L (numerically the same as ng/mL).', 'FOR A LOCAL CLINICAL LEAD: the ESI triage record, the two KDIGO tools and the report outline with the BI-RADS assessment categories are kept as slots (below).', 'The 12-hour clock is an unverified choice.'],
  },
}
const U = ULKELER[p.kod]
if (!U) throw new Error(`"${p.kod}" is not one of the English-speaking countries this script records`)

// ───────────────────────── what the pack says about itself ─────────────────────────
const birimAdi = (kod: string | null): string => (kod ? a.araclar!.birimler[kod]?.[d] ?? kod : '—')
const o = { birimler: u.birimler, lab: a.araclar.labBirimleri, sayi: p.bicim, ...(a.araclar.olculer ? { olculer: a.araclar.olculer } : {}) }
// NOTYA-ULKE-OZEL-01: a tool's mechanism is the kit's, or — for a tool only this country has — the pack's own.
const acik = a.araclar.araclar.map((x) => ({ x, t: paketinTanimi(a.araclar!, x)! }))
// A laboratory value the country accepts in several units is written with each of them.
const alaninBirimi = (al: Parameters<typeof alanBirimi>[0]): string => (al.lab ? alanBirimleri(al, o).map(birimAdi).join(' or ') || birimAdi(null) : birimAdi(alanBirimi(al, o)))
const rolAdi = (r: string): string => a.roller.find((y) => y.anahtar === r)?.ad[d] ?? r
const roller = (liste: readonly string[] | null): string => (liste === null ? 'every role' : liste.map(rolAdi).join(', '))
const aracSatirlari = acik.map(({ x, t }) => {
  const olculen = t.alanlar.filter((al) => al.olcu || al.lab || al.birim).map((al) => `${x.metin.alanlar[al.anahtar]?.[d] ?? al.anahtar}: **${alaninBirimi(al)}**`)
  const sonuc = [...(t.sonucBirimleri ?? []).map(birimAdi), ...(t.sonucOlculeri ?? []).map((m) => birimAdi(u.birimler[m]))]
  return `| \`${x.anahtar}\` | ${x.metin.ad[d]} | ${roller(x.roller)} | ${olculen.length ? olculen.join('; ') : 'no measured input'}${sonuc.length ? ` · result in ${[...new Set(sonuc)].join(', ')}` : ''} |`
})
const kendiYuvalari = a.araclar.yuvalar.filter((y) => y.mekanizmaHazir && kitAraci(y.anahtar) && !(kitAraci(y.anahtar)!.parametreler ?? []).length)
const ortakYuvalar = a.araclar.yuvalar.filter((y) => !kendiYuvalari.includes(y))
const yuvaSatiri = (y: (typeof ortakYuvalar)[number]) => `| \`${y.anahtar}\` | ${roller(y.roller)} | ${y.eksik} | ${y.kimden} |`
const formYuvalari = enFormYuvalari(U.ad === 'United Kingdom' || U.ad === 'United States' ? `the ${U.ad}` : U.ad)
const hf = k.hastaFormu
const metinSayisi = paketMetinleri({ paket: p, arayuz: a, klinik: k, bicim: d as EnBicim }).length
// THE COUNTRY'S OWN TEXTS, counted from what it states (countries/<code>/ayarlar.ts), not from its source text: the
// sentences and words it writes itself. Its keys, codes and settings (the language form, unit codes, the speech
// model, thresholds) are not texts and are not counted.
const girdi = (await import(`@/countries/${p.kod}/ayarlar`))[`${p.kod.toUpperCase()}_GIRDI`] as EnUlkeGirdisi
const dizeSayisi = (v: unknown): number => (typeof v === 'string' ? 1 : v && typeof v === 'object' ? Object.values(v).reduce<number>((n, x) => n + dizeSayisi(x), 0) : 0)
const kendiMetinSayisi = dizeSayisi([{ ...girdi.sozler, bicim: null }, girdi.ulkeAdi, girdi.kidemliHekim, girdi.rolAdlari, girdi.araclar.kapali, girdi.araclar.degisen, girdi.araclar.birimAdlari, girdi.acilis.telefonOrnegi, girdi.acilis.aylikTutarKalibi])

const kontrolListesi = readFileSync(join(KOK, 'docs', 'COUNTRY-PACK-CHECKLIST.md'), 'utf8').split('\n')
const ilk = kontrolListesi.findIndex((s) => s.startsWith('## Rules that stop one country leaking'))
const son = kontrolListesi.findIndex((s) => s.startsWith('## Order of work'))

/** What this record says under a gate of the checklist. Every gate stays unticked: a person ticks it, with a name and a date. */
function kapiNotu(kapi: string): string {
  const N: Readonly<Record<string, string>> = {
    '1': 'The pack holds nothing of Türkiye; the walls and the leak scan run for it (`npm run test:ulke`).',
    '2': 'Nothing falls back: the pack check finds nothing missing, and a tool this country does not have is a slot, not another country\'s tool.',
    '3': `Every tool is classified (base, or these roles) and ${kendiYuvalari.length} tool(s) of the shared English set are kept off for this country (below).`,
    '4': 'As in the kit: country and language are stamped at sign-up. One language form, `' + d + '`.',
    '5': 'The assistant in text and voice is not part of a country build. No assistant is named.',
    '6': 'One pack per build: built with `NOTYA_COUNTRY=' + p.kod + ' npm run build:ulke`, proven on the output. NO DATABASE EXISTS for this country (section M).',
    '7': `The leak scan runs over every screen of this pack for the terms of every other country, the other English-speaking countries included (countries/${p.kod}/sizintiTerimleri.ts states this country's).`,
    '8': 'Türkiye\'s build is untouched by this pack; the Turkish suite is compared with `main` by test name.',
    '9': 'Sign-up is closed (invitation code only) and the site is hidden from search.',
    A1: `NOT ANSWERED — ${LAWYER}. See "Regulatory questions".`, A2: `NOT ANSWERED — ${LAWYER}. The voice profile is off.`, A3: `NOT ANSWERED — ${LAWYER}. ${U.kayitRizasiNotu}`,
    A4: `NOT ANSWERED — ${LAWYER}. See "Regulatory questions" (the medical-device question for the tools and for note drafting). Image evaluation is off.`,
    A5: 'NOT DONE. The speech thresholds are starting values; no clinic audio from this country has been heard.', A6: 'NOBODY NAMED. Waits on the owner.',
    A7: 'NOT RESEARCHED. The pack connects to no state or record system and claims none.', A8: 'NOT ANSWERED. Waits on the owner (company, tax, payment, price level). No price exists.', A9: 'NOT RESEARCHED.',
    C1: 'UNVERIFIED. The 40 role names are from general knowledge and were not checked against the country\'s official list of specialties (table below).',
    C6: 'ABSENT. No medicine is named anywhere; every tool that needs the country\'s register is a slot.', C7: 'ABSENT (slot `diagnosis-coding`).',
    C8: 'UNVERIFIED. The unit each laboratory value is reported in is a starting value (settings below). No reference range is in the pack.',
    C9: 'ABSENT. No growth chart, vaccination schedule or screening programme is in the pack: each is a slot.', C12: 'MACHINE-BUILT. 40 templates, read by no clinician of this country.',
    C13: `MACHINE-WRITTEN. ${hf.cekirdek.bolumler.flatMap((b) => b.sorular).length} core questions and ${Object.values(hf.roller).flatMap((r) => r.sorular).length} role questions, read by no clinician of this country.`,
    C14: 'NOBODY. No role is signed off.', D1: 'NO NAME PROPOSED. The pack builds without one; every role shows the neutral assistant line. WAITING ON KAAN.',
    D5: 'Not part of this job: the assistant\'s voice.', E1: 'All screen text comes from the English language set and this folder; none is written in code.',
    E2: `One form, \`${d}\`: the spelling is made from the set's base by the spelling table (countries/_dil/en/sozluk.ts). No native editor has read it.`,
    E3: 'Settings below; every one unverified.', E5: 'One engine, English; the one second pass (on low confidence) repeats the same recording in English. No second language.',
    E11: 'NOT DONE. No native reader has read any patient-facing or marketing text.', F1: 'See "Tools" below: switched on, kept as a slot for this country, or a slot everywhere.',
    F2: 'The 14 tools tied to Türkiye\'s state and payer systems are blocked for every other country (rule D7).', F4: 'Unit check done by test for every switched-on tool (countries/' + p.kod + '/' + p.kod + '.test.ts); a clinician has not read them.',
    F7: 'NOT DONE. No specialty has a sign-off.', G5: `UNVERIFIED. ${U.kimlikNotu}`, H1: 'No other country\'s state system exists in this build.', H3: 'No integration is claimed anywhere (tested).',
    I1: `NOT DONE — ${LAWYER}. Both consent sentences are drafts.`, I2: `NOT DONE — ${LAWYER}. ${U.veliNotu}`, I6: `NOT DECIDED — ${LAWYER} and the owner. No database, no provider account exists for this country.`,
    J2: 'All 40 roles are offered; none is reviewed.', J3: 'See C1.', J4: 'Starting values (settings below).', J6: 'NO PRICE. Every plan is "by quote". WAITING ON KAAN.', J7: 'None. No trial, no discount.',
    K1: 'One landing page, in English, machine-written.', K2: 'Hidden: noindex on every response, robots.txt disallows everything.', K3: 'No public demo, no integration claim (tested).', K4: 'ABSENT. No legal pages exist. ' + LAWYER + '.',
    M1: 'NO DATABASE EXISTS. Waits on the owner.', M2: 'Not run.', M3: 'Not run.', M4: 'Not set.', M5: 'Not set.', M6: 'True: no script of this country was run on any database.',
  }
  return N[kapi] ?? 'Not answered.'
}
const kapilar: string[] = []
let atla = false
for (const satir of kontrolListesi.slice(ilk, son)) {
  if (satir.startsWith('How each rule is enforced today')) atla = true
  else if (satir.startsWith('## ')) atla = false
  if (atla || satir.startsWith('> ')) continue
  const m = /^- \[[ xX]\] ((?:[A-M]\d+|\d+)\.?) ?(.*)$/.exec(satir)
  if (m) kapilar.push(`- [ ] ${m[1]} ${m[2]}\n  - ${kapiNotu(m[1].replace('.', ''))}`)
  else kapilar.push(satir)
}

const satir = (ad: string, deger: string, bekler: string) => `| ${ad} | ${deger} | ${bekler} |`
const md = `# Country pack: ${U.ad} (\`${p.kod}\`)

Answers to \`docs/COUNTRY-PACK-CHECKLIST.md\` for the country \`${p.kod}\`. Code: \`countries/${p.kod}/\`, on top of the English language set \`countries/_dil/en/\`. How a country is built: \`docs/COUNTRY-PACK-HOWTO.md\` ("Adding a country that shares a language").

**Written by \`NOTYA_COUNTRY=${p.kod} npx --yes tsx scripts/ulke-en-kayit.mts\` on 2026-10-09 (NOTYA-ULKE-EN-01). The tables below are read from the pack; do not edit them by hand — change the pack and run the command again.**

## Status

- **Nothing is live.** No deployment exists and **no database exists for this country.** One database per country: the owner creates a new, empty one, and the baseline (\`lib/db/ulke/000_yeni_ulke_veritabani.sql\`) is run on it once. No script of this country is ever run on the Turkish database or on another country's (section M).
- **The pack is complete and builds**: the pack check finds nothing, \`NOTYA_COUNTRY=${p.kod} npm run build:ulke\` builds it, and the pack-neutral walk-through passes on stand-ins.
- **Sign-up is closed** (invitation code only) and **the site is hidden from search**. Both are opened by the owner only.
- Language form: \`${d}\`. Served at: \`${p.yolOnEki ?? '/'}\`.
- **EVERY TEXT IS MACHINE-WRITTEN AND UNREAD.** No clinician, no lawyer and no native editor of ${U.ad === 'United Kingdom' || U.ad === 'United States' ? 'the ' : ''}${U.ad} has read a line of it. **EVERY SETTING BELOW IS UNVERIFIED.**
- **No claim is made** anywhere in this pack that the product complies with any law or standard, is approved, cleared or certified by any authority, or is connected to any record system or state system.

## What building the pack does NOT prove

A pack that builds has every text and setting filled in. It says nothing about whether they are right. Each gate below is passed by a person and recorded here with a name and a date.

## What is in this pack, and where it comes from

- **From the shared English set** (\`countries/_dil/en/\`, written once for five countries): ${metinSayisi} texts as this pack shows them or hands the model (the country's own, counted in the next line, among them) — the screens, the role names, 40 note templates, the instructions to the model, the intake questions, ${acik.length} tools, the landing copy — written in \`${d}\` spelling by the set's spelling table.
- **This country's own** (\`countries/${p.kod}/\`, six small files): ${kendiMetinSayisi} texts it writes itself (its consent sentence, identifier label, time sentence, date example, name, word for a senior doctor, role names where they differ, what its closed tools are missing and who decides, unit names and tool words it writes differently, the example phone number and the pattern of an amount) and the settings in the table below.

## Settings — every one unverified

| Setting | Value in the pack | Waits on |
|---|---|---|
${[
  satir('Country code and path', `\`${p.kod}\`, served at \`${p.yolOnEki}\``, 'the owner (a routing rule on the live site is his decision)'),
  satir('Language form and spelling', `\`${d}\``, 'a native editor'),
  satir('Default time zone; zones an account may choose', `${p.saatDilimi}; ${u.saatDilimleri.join(', ')}`, `product, with a local lead. ${U.saatNotu}`),
  satir('Date pattern; clock; first day of the week', `${p.bicim.tarihDeseni}; ${u.saatBicimi}-hour; ${p.bicim.haftaBasi === 1 ? 'Monday' : 'Sunday'}`, 'a local lead'),
  satir('Units', `weight ${u.birimler.agirlik}, height ${u.birimler.boy}, temperature °${u.birimler.sicaklik}`, 'a local clinical lead — a clinical-safety setting'),
  satir('Laboratory units', Object.entries(a.araclar.labBirimleri).map(([q, b]) => `${LAB_ADLARI[q] ?? q}: ${(typeof b === 'string' ? [b] : [...(b ?? [])]).map(birimAdi).join(' or ')}`).join('; '), 'a local clinical lead — a clinical-safety setting; the kit converts from the unit stated here'),
  satir('Currency', `${p.paraBirimi.kod}`, 'the owner'),
  satir('Prices', 'EMPTY, SWITCHED OFF: every plan "by quote"', '**WAITING ON KAAN**'),
  satir('Emergency (ambulance) number on the patient\'s page', `\`${u.portal?.acilNumara ?? 'none'}\` — UNVERIFIED`, 'a local source, before any patient sees the portal'),
  satir('Days a patient\'s link stays valid', String(u.portal?.baglantiGecerlilikGun), `the owner; how long access may stand: ${LAWYER}`),
  satir('Patient identifier', `optional free text, encrypted, never validated; label "${p.ulusalKimlik?.ad ?? '—'}"`, `a local lead and a lawyer. ${U.kimlikNotu}`),
  satir('Guardian age', String(u.veliYasi), `**${LAWYER}**. ${U.veliNotu}`),
  satir('Recording-consent sentence', `"${a.metinler[d]!.muayene.riza}" — stamp \`${k.riza.surum}\`, NOT READ BY A LAWYER`, `**${LAWYER}**. ${U.kayitRizasiNotu}`),
  satir('Intake-form consent sentence', `the shared draft — stamp \`${hf.riza.surum}\`, NOT READ BY A LAWYER`, `**${LAWYER}**`),
  satir('Word for a senior doctor (in the instructions to the model)', `"${(k.notTalimati(d, a.notSablonlari.genelSablon) ?? '').match(/You are an experienced ([^.]+)\./)?.[1] ?? ''}"`, 'a local clinical lead'),
  satir('Phone: prefix, example, rule', `${p.telefon.ulkeOnEki}; ${p.telefon.ornek}; a format rule only`, `a local lead. ${U.telefonNotu}`),
  satir('Appointment norms', `${u.randevu?.varsayilan.baslangic}–${u.randevu?.varsayilan.bitis}, ${u.randevu?.varsayilan.sureDk} min; no public holiday`, 'a local clinical lead'),
  satir('Speech: model, thresholds', `${k.konusma.model}; ${k.konusma.dilOlasiligiEsigi}, ${k.konusma.ortalamaLogOlasilikEsigi}, ${k.konusma.asgariKarakter} characters`, 'engineering, on real clinic audio of this country'),
  satir('Assistant names', 'NONE. Every role shows the neutral line', '**WAITING ON KAAN**'),
  satir('Sign-up; search', 'invitation only; hidden', 'the owner'),
].join('\n')}

${U.ekNotlar.map((n) => `- ${n}`).join('\n')}

## Regulatory questions — none answered here; each is ${LAWYER}

${U.hukuk.map((h, i) => `${i + 1}. ${h} **(${LAWYER})**`).join('\n')}

## Roles — 40, names unverified

The keys are the shared English key set (\`docs/COUNTRY-PACK-ROLE-KEYS.md\`). The names are how each role is shown in this country; none was checked against the country's official list of specialties, and no role's template, questions or tools have been read by a clinician. **Waits on: a local clinical lead and a reviewer per role.**

| Key | Name shown | Kind |
|---|---|---|
${a.roller.map((r) => `| \`${r.anahtar}\` | ${r.ad[d]} | ${r.taraf === 'doktor' ? 'doctor specialty' : r.taraf === 'klinik-hekim' ? 'clinic doctor' : 'clinic allied profession'} |`).join('\n')}

## Tools

### Switched on (${acik.length}) — with the unit each measured input takes

Units are a clinical-safety matter. A length or a weight is typed in this pack's unit and converted by the kit with the exact defined factors (1 in = 2.54 cm, 1 lb = 0.45359237 kg); a laboratory value is typed in the unit shown. \`countries/${p.kod}/${p.kod}.test.ts\` runs every tool below with this country's units against the kit's reference result. **Every tool's text is machine-written; each waits on a local clinical lead.**

| Tool | Name | Who sees it | Measured inputs and their units |
|---|---|---|---|
${aracSatirlari.join('\n')}

### Kept as slots FOR THIS COUNTRY (${kendiYuvalari.length}) — for a local clinical lead

The shared English set has the words of these tools and the kit has their mechanism; this country keeps them switched off for the reason given.

| Tool | Who would see it | Why it is off here | Waits on |
|---|---|---|---|
${kendiYuvalari.map(yuvaSatiri).join('\n') || '| — | — | — | — |'}

### Slots in every English-speaking country (${ortakYuvalar.length}) — empty, switched off

No national reference content is written by a machine, and no item of a published questionnaire is reproduced. The sentences of a slot are written for documents and reviewers and are never shown on a screen; in every pack they stay in the set's base spelling (British), whatever the pack's own form.

| Slot | Who would see it | What is missing | Waits on |
|---|---|---|---|
${ortakYuvalar.map(yuvaSatiri).join('\n')}

## Intake form — what it does not ask (${formYuvalari.length} slots)

| Slot | What is missing | What the form asks today | Waits on |
|---|---|---|---|
${formYuvalari.map((y) => `| \`${y.anahtar}\` | ${y.eksik} | ${y.bugun} | ${y.kimden} |`).join('\n')}

## The checklist

Every gate is unticked: a gate is ticked by a person, with a name and a date. The line under a gate says where this pack stands today.

${kapilar.join('\n').trim()}

## Decisions and open questions

- 2026-10-09 (the coordinator, for the owner): spelling is converted when the pack loads; one English role-key set for the five countries; no assistant names; birth weight asked as free text; patient wording kept country-neutral.
- 2026-10-09 (the coordinator, for the owner): unit and scale decisions accepted as stated — each **for a local clinical lead**: the KDIGO tools are switched on only where laboratories report mg/g; the ESI triage record only in the United States; the BI-RADS report outline only in the United States and Canada; weight-based dose arithmetic is a slot where weight is measured in pounds; the DAS28 C-reactive protein field is labelled mg/L; prostate-specific antigen is shown in µg/L where that is the unit in use.
- 2026-10-09 (the coordinator, for the owner): an allied profession's instruction does not open with the senior-doctor line — its first sentence states the profession and that the colleague is not a doctor; the example phone number is from a range reserved for fiction where this job is certain of one, otherwise a shape that is no number; the sentences of the slots stay in British spelling in every pack (accepted).
- Open, with who each waits on: \`docs/OPEN-COMMITMENTS.md\`, NOTYA-ULKE-EN-01.
`

const yol = join(KOK, 'docs', U.dosya)
if (process.argv.includes('--denetle')) {
  if (!existsSync(yol) || readFileSync(yol, 'utf8') !== md) { console.error(`[ulke-en-kayit] docs/${U.dosya} is not what the pack says. Run: NOTYA_COUNTRY=${p.kod} npx --yes tsx scripts/ulke-en-kayit.mts`); process.exit(1) }
  console.log(`[ulke-en-kayit] docs/${U.dosya} is current`)
} else {
  writeFileSync(yol, md)
  console.log(`[ulke-en-kayit] wrote docs/${U.dosya}: ${acik.length} tools switched on, ${kendiYuvalari.length} kept as slots for this country, ${ortakYuvalar.length} shared slots, ${formYuvalari.length} intake slots, ${metinSayisi} texts shown, ${kendiMetinSayisi} of this country's own`)
}
