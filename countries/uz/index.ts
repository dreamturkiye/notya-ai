/**
 * NOTYA-ULKE-01 — Uzbekistan's country pack. Decisions and open questions: docs/COUNTRY-PACK-UZBEKISTAN.md.
 *
 * Everything is OFF unless listed here. Nothing in this folder may come from countries/tr (scripts/ulke-duvarlari.mjs),
 * and nothing here falls back to Türkiye's content — a missing item hides the feature.
 *
 * Keep this file light: data and pure functions only (the middleware and the browser bundle load it).
 * Values marked "to verify" are from secondary sources and wait for the local clinical lead / lawyer.
 */
import { paketMetinleri, type UlkePaketi } from '@/lib/ulke/tipler'
import {
  UZ_LATN_BEKLETME, UZ_LATN_DAVETLI_KAYIT, UZ_LATN_GIRIS, UZ_LATN_HESAP, UZ_LATN_SISTEM,
  UZ_RU_BEKLETME, UZ_RU_DAVETLI_KAYIT, UZ_RU_GIRIS, UZ_RU_HESAP, UZ_RU_SISTEM,
} from './metinler'
import { uzAramaKatla } from './arama'
import { UZ_ROLLER } from './klinik/rolAdlari'
import { UZ_VELI_YASI } from './ayarlar'

const metin = paketMetinleri({
  acikDiller: ['uz-Latn', 'ru'],
  yuzeyler: ['hesap', 'giris', 'davetliKayit', 'bekletme', 'sistem'],
  metinler: {
    'uz-Latn': { hesap: UZ_LATN_HESAP, giris: UZ_LATN_GIRIS, davetliKayit: UZ_LATN_DAVETLI_KAYIT, bekletme: UZ_LATN_BEKLETME, sistem: UZ_LATN_SISTEM },
    ru: { hesap: UZ_RU_HESAP, giris: UZ_RU_GIRIS, davetliKayit: UZ_RU_DAVETLI_KAYIT, bekletme: UZ_RU_BEKLETME, sistem: UZ_RU_SISTEM },
  },
})

/** Mobile number: +998 and nine digits, in any common spelling. Operator prefixes are not checked (to verify). */
function uzCepGecerliMi(ham: string | null | undefined): boolean {
  const t = String(ham ?? '').trim()
  if (!t || !/^[0-9+()\-.\s]+$/.test(t)) return false
  let rakam = t.replace(/\D/g, '')
  if (rakam.startsWith('00')) rakam = rakam.slice(2)
  if (rakam.length === 12 && rakam.startsWith('998')) rakam = rakam.slice(3)
  return /^[1-9]\d{8}$/.test(rakam)
}

export const UZ_PAKETI: UlkePaketi = {
  kod: 'uz',
  iz: 'notya-ulke-paketi:uz:3f7a05d6c1',
  diller: ['uz-Latn', 'uz-Cyrl', 'ru'],
  acikDiller: metin.acikDiller,
  varsayilanDil: 'uz-Latn',
  paraBirimi: { kod: 'UZS', simge: 'soʻm', ondalikHane: 0 },
  saatDilimi: 'Asia/Tashkent',
  bicim: { yerel: 'uz-Latn-UZ', tarihDeseni: 'DD.MM.YYYY', ondalikAyraci: ',', binlikAyraci: ' ', haftaBasi: 1 },
  telefon: { ulkeOnEki: '+998', ulusalHane: 9, ornek: '+998 90 123 45 67', cepGecerliMi: uzCepGecerliMi },
  // JSHSHIR (PINFL): 14 digits. Format only here. The structure and the control-digit rule were verified on 2026-10-09
  // against Cabinet of Ministers Resolution No. 177 of 12.04.2022 (https://lex.uz/docs/5955665) and are stated in
  // ./kimlik.ts (`uzJshshirYapisiGecerliMi`); they are NOT applied: see `uygulama.kimlikNumarasi` below.
  ulusalKimlik: { ad: 'JSHSHIR', hane: 14, gecerliMi: (ham) => /^\d{14}$/.test(String(ham ?? '').trim()) },
  // Fail closed: only what has been built FOR Uzbekistan is on. Landing page, login, sign-up by invitation code, and
  // the single holding page an account sees after login (NOTYA-ULKE-01, 2026-10-08). Everything else is off —
  // including the voice profile and image evaluation, until the law is confirmed (checklist A2, A4, I7).
  ozellikler: {
    acilisSayfasi: true,
    cekirdekGiris: true,
    davetliKayit: true,
    bekletmeSayfasi: true,
    // NOTYA-UZ-MUAYENE-01 (2026-10-08): the first product slice — first-login language question, settings, home,
    // patients, visit recording to an approved note. Where it is on, a signed-in account lands on /today instead of
    // the holding page. Sign-up is still by invitation code only, so nobody reaches it uninvited.
    cekirdekMuayene: true,
    // NOTYA-UZ-RANDEVU-01 (2026-10-08): appointments — working pattern, calendar, booking, status, the link from an
    // appointment to its visit, a reminder text the doctor copies. Nothing is sent to anybody automatically.
    randevu: true,
    // NOTYA-ULKE-PORTAL-01 (2026-10-09): the patient portal — a link and a PIN the doctor gives a patient; the patient
    // sees their own name, their doctor, upcoming appointments and what the doctor chose to share, and may ask for an
    // appointment. Nothing is shared automatically and nothing is sent to anybody from here.
    hastaPortali: true,
    // NOTYA-ULKE-INTAKE-01 (2026-10-09): the intake form — the doctor asks a patient to fill in a form before a visit;
    // the patient fills it in on their own page; the doctor reads the answers, marked as the patient's own unverified
    // words. Nothing is sent to anybody, and the answers are not given to the model. The questions are machine-written
    // and await a local clinician (./klinik/hastaFormu/).
    hastaFormu: true,
    // NOTYA-ULKE-ARACLAR-01 (2026-10-09): the tools area — a grid of tools, base tools for every role and role tools
    // gated by role (./uygulama/araclar/). Nothing is stored and nothing is sent. The texts are machine-written and no
    // clinician has read them; tools that need national reference content are empty slots, switched off.
    araclar: true,
    // NOTYA-ULKE-MESAJ-01 (2026-10-09): messages between a doctor and a patient, INSIDE the patient portal. The doctor
    // writes from the patient's file; the patient reads and answers on their own page. Nothing leaves the product: no
    // SMS, no e-mail, no messenger (see `uygulama.mesaj` below). The texts are machine-written and no native reader
    // has read them; whether a doctor may write to a patient this way under local law has not been read by a lawyer.
    hastaMesajlari: true,
    // NOTYA-ULKE-MESAJ-01 (2026-10-09): "my templates" — a doctor's own reusable text blocks, inserted into a section of
    // a note or into a message by the doctor's own click. The pack brings NO ready-made template. The screen's words
    // are machine-written and no native reader has read them.
    hekimSablonlari: true,
    // NOTYA-ULKE-MESAJ-01 (2026-10-09): consultation between doctors of this country's own database — a written
    // question about one patient, a read-only copy of one approved note or of its summary, the answer, closing. A
    // colleague is found by their consultation code only; there is no directory. Nothing is sent to anybody. The texts
    // are machine-written, and THE CONSENT SENTENCE HAS NOT BEEN READ BY A LAWYER (./klinik/index.ts).
    konsultasyon: true,
    // NOTYA-ULKE-KLINIK-01 (2026-10-09): clinic accounts — a clinic with an owner, members who join by a one-use
    // invitation code and hold one position, and permissions by which a doctor lets a member help with that doctor's
    // patients (the front desk; a share with a clinic specialist; cover by another doctor, read-only). A patient still
    // belongs to one doctor, a position alone opens no patient, and every use of a permission is recorded for the
    // doctor. The texts are machine-written; the legal answers below are unverified (./uygulama/klinikMetinleri.ts).
    klinikHesaplari: true,
  },
  // Routes of the PRE-SPLIT application's tool registry valid here: none, and it stays so. The country build has its own
  // tools area (/tools, feature `araclar`; ./uygulama/araclar/), which shares no route and no screen with that registry.
  araclar: [],
  // The ONLY paths that exist in an Uzbekistan deployment. Every other path of the application answers 404 in the
  // middleware. A path is added here in the same pull request that brings its Uzbek and Russian text and its leak test.
  rotalar: {
    sayfalar: ['/', '/login', '/signup', '/welcome', '/start', '/today', '/settings', '/patients', '/patients/new', '/patient', '/visit', '/calendar', '/portal', '/tools', '/clinic', '/desk'],
    apiOnEkleri: ['/api/ulke/'],
  },
  // NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08): served at notya.io/uzbek. The paths above are relative to this prefix.
  yolOnEki: '/uzbek',
  aramaMotorlarinaGizli: true,
  kabuk: {
    baslik: 'Notya',
    aciklama: 'Shifokorlar va klinikalar uchun klinik yordamchi.',
    zemin: '#f4eee3',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { 'uz-Latn': 'Oʻzbekcha', 'uz-Cyrl': 'Ўзбекча', ru: 'Русский' },
  uygulama: {
    // Inside the signed-in application an account may also choose Uzbek in Cyrillic script: those screens are written
    // in all three forms (countries/uz/uygulama/metinler.ts). The public pages above stay in the two `acikDiller`.
    diller: ['uz-Latn', 'uz-Cyrl', 'ru'],
    // The patient's own language, recorded per patient (script is the doctor's choice, not the patient's).
    hastaDilleri: ['uz', 'ru'],
    aramaKatla: uzAramaKatla,
    // NOTYA-UZ-BRANSLAR-01 · NOTYA-ULKE-UYGULA-UZ (2026-10-10): the roles an account chooses from at first login.
    // UZBEKISTAN'S OWN LIST since the audit of the specialties against the Ministry of Health's nomenclature (order
    // No. 6 of 12.05.2021, registration No. 3303) was applied: 42 roles — 37 doctor specialties, 3 clinic doctors,
    // 2 clinic allied professions. What was renamed, split, added, moved and removed, and why: ./klinik/rolListesi.ts
    // (and, as data, countries/rol-eslemesi.json → ulkeyeOzel.uz). Keys only; the names are in ./klinik/rolAdlari.ts.
    roller: UZ_ROLLER,
    // NOTYA-UZ-RANDEVU-01 — appointment norms. STARTING VALUES, to verify with the local clinical lead (checklist J4):
    // the usual working week and hours of a private clinic in Uzbekistan were not checked against a local source.
    // An account changes all of it for itself on the calendar's settings view. The time zone is `saatDilimi` above
    // and the week starts on `bicim.haftaBasi`. PUBLIC HOLIDAYS are deliberately absent: they are local content
    // (docs/COUNTRY-PACK-UZBEKISTAN.md, "needs local content"), and a hard-coded list would silently go stale.
    randevu: {
      varsayilan: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '18:00', sureDk: 30, molalar: [{ baslangic: '13:00', bitis: '14:00' }] },
      sureSecenekleri: [10, 15, 20, 30, 45, 60, 90],
    },
    // NOTYA-ULKE-PORTAL-01 — a portal link works for 30 days, then the doctor gives a new one. A STARTING VALUE, not a
    // local rule: to confirm with the owner and, for how long a patient's access may stand, with a lawyer (checklist I1).
    // The ambulance number the patient's page names is LOCAL CONTENT. null here = the page names no number.
    // 103 — CHECKED AGAINST AN OFFICIAL SOURCE on 2026-10-09 (country audit, docs/COUNTRY-AUDIT-UZBEKISTAN.md, A10): the
    // state services portal's page of the emergency medical service says to call the short number "103", free of charge
    // (https://gov.uz/oz/advice/63/document/1090). The single dispatch number 112 also exists (Cabinet of Ministers
    // Resolution No. 304 of 29.05.2024, https://gov.uz/en/advice/502/document/3256); whether the patient's page should
    // name 112 beside or instead of 103 is for a local clinician and the owner. Not yet confirmed by a person in the country.
    portal: { baglantiGecerlilikGun: 30, acilNumara: '103' },
    // NOTYA-ULKE-MESAJ-01 — TELLING A PATIENT THAT THEIR DOCTOR WROTE: A SLOT, SWITCHED OFF. No provider is contracted
    // and the kit sends nothing to anybody; the doctor tells the patient. Waits on Kaan (which channel patients here
    // really use, which provider, at what cost) and, before any patient is written to, on a lawyer.
    mesaj: {
      disBildirim: {
        acik: false, saglayici: null,
        eksik: 'An outbound channel that tells a patient a message is waiting on their page (SMS, a messenger or e-mail): no provider is contracted and none is built. The notice would carry no content of the message.',
        kimden: 'Kaan (provider and cost; which channel patients in the country really use, checklist H4), then a lawyer of the country for the consent to be contacted',
      },
    },
    // NOTYA-ULKE-MESAJ-01 — HOW LONG A COLLEAGUE MAY READ A CONSULTATION. STARTING VALUES, NOT A LOCAL RULE: nobody has
    // checked them against the country's law. A consultation stays open for at most 30 days; after the asking doctor
    // closed it, the colleague can read it for 14 more days and then no longer. To confirm with the owner and, for how
    // long a colleague may hold a copy of a patient's data, with a lawyer (docs/OPEN-COMMITMENTS.md, NOTYA-ULKE-MESAJ-01).
    konsultasyon: { acikGun: 30, kapanisSonrasiGun: 14 },
    // NOTYA-ULKE-KLINIK-01 — clinic accounts. EVERY VALUE HERE IS A STARTING VALUE WRITTEN BY A MACHINE, AND NONE HAS
    // BEEN READ BY A LAWYER OF UZBEKISTAN (`inceleme.hukukcu: null`). Who may lawfully read a medical record, what a
    // clinic specialist's profession may do, and how long a record of access must be kept are questions of Uzbek law
    // (docs/COUNTRY-PACK-UZBEKISTAN.md, "Clinic accounts"; docs/OPEN-COMMITMENTS.md, NOTYA-ULKE-KLINIK-01). Until
    // they are answered the pack takes the narrow side wherever there is one:
    //   yetkiTurleri              all five, each given by the doctor whose patients they are, one at a time.
    //   sahipHekimAdinaVerebilir  NO: a clinic's owner cannot give a permission for a doctor's patients. (Kaan / lawyer.)
    //   paylasimRolleri           the clinic specialist roles of this pack (the allied professions) may be given ONE
    //                             patient's approved notes by that patient's doctor. UNVERIFIED: the scope of each
    //                             profession is for a lawyer. TWO since 2026-10-10 (NOTYA-ULKE-UYGULA-UZ): occupational
    //                             therapy is not in the nomenclature and left the role list; dietology and surdology
    //                             are doctors' specialties there, and a doctor is given cover or a consultation, not
    //                             this share. Nobody gained access by that change; three roles lost this way in.
    //   davetGecerlilikGun        an invitation works for 7 days.   vekaletAzamiGun   cover lasts at most 14 days.
    //   kayitSaklama              a slot, off: no record row is ever deleted and no purge exists.
    klinikHesaplari: {
      yetkiTurleri: ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet'],
      sahipHekimAdinaVerebilir: false,
      paylasimRolleri: ['fizyoterapi', 'klinik-psikolog'],
      davetGecerlilikGun: 7,
      vekaletAzamiGun: 14,
      kayitSaklama: null,
      inceleme: { makineYazimi: true, hukukcu: null },
    },
    // ── NOTYA-ULKE-SABLON-01: what the shared screens used to assume for Uzbekistan, said out loud. Each value is
    // what the Uzbek build did before the screens became shared; none is a new decision.
    // Uzbek in two scripts, Russian in one: the first-login question asks the language and, for Uzbek, the script.
    dilGruplari: [
      { temel: 'uz', bicimler: [{ yazi: 'Latn', dil: 'uz-Latn' }, { yazi: 'Cyrl', dil: 'uz-Cyrl' }] },
      { temel: 'ru', bicimler: [{ yazi: null, dil: 'ru' }] },
    ],
    // One time zone in the country: no account is asked.
    saatDilimleri: ['Asia/Tashkent'],
    saatBicimi: 24,
    birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' },
    // The patronymic (otasining ismi / отчество) is its own field on the patient form.
    adAlanlari: { ikinciAd: true },
    // JSHSHIR is optional free text, stored encrypted and NOT validated. The official structure is now known (./kimlik.ts,
    // verified 2026-10-09); refusing a number that fails it is the owner's decision, and whether a private product may
    // ask for the number is a question for a lawyer (checklist G5; docs/COUNTRY-AUDIT-UZBEKISTAN.md, "Open items").
    kimlikNumarasi: { dogrula: false },
    // Guardian wording for a patient under 18 on the day of the visit. An assumption to confirm with a lawyer (checklist B12).
    veliYasi: UZ_VELI_YASI,
    // Invitation only.
    kayitAcik: false,
  },
}
