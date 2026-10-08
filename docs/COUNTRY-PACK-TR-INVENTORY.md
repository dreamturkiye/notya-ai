# Türkiye inventory: where Türkiye-specific material lives today

Written 2026-10-08 for the country split (`docs/COUNTRY-PACK-CHECKLIST.md`, rule 1: "Türkiye is a country pack like any other; nothing Türkiye-specific stays in the core"). A **map**, not a dump: each row says what is Türkiye-specific, where to find it, and how big it is. Read it before any job in `docs/COUNTRY-PACK-SPLIT-PLAN.md`.

Counts are files, measured on `main` at `9891987` with `grep` over `app components lib core specialties` (tests excluded) unless stated. "Turkish text" is measured by `npm run ulke:turkce-tavan`: **1,687 of 2,067** shipped source files carry Turkish text a person could see (a letter-based proxy; comments not counted).

## 0. The picture in one table

| Surface | Files with Turkish text | Nature |
|---|---:|---|
| `specialties/` (40 folders: 30 specialties + 10 clinic types) | 600 | Clinical engines, prompts, chapter UI: Turkish text **and** Turkish clinical content |
| `app/api/doktor` | 175 | Error and status sentences; state-system routes |
| `app/doktor-tools` | 145 | Tool pages (see the tools audit) |
| `app/portal` + `lib/portal` | 99 | Patient-facing: everything a patient reads |
| `lib/doktor` | 89 | Note engine, file, reports, epikriz, templates |
| `components/doktor` | 70 | Doctor screens |
| `lib/asistan` | 65 | Ayşe: persona, rules, voice, references |
| `lib/specialties` | 44 | Specialty and clinic-type profiles |
| `app/dashboard/doktor` + `klinik` | 38 | Main application screens |
| `core/` | 28 | Action engine, documents, lab |
| `lib/iletisim` + `lib/randevu` | 37 | Messages, reminders, appointments |
| `lib/clinical` + `lib/asi` | 22 | Growth, vaccination, screening |
| Landing, auth, root shell | 35 | Marketing, sign-up, login, errors |
| State systems in `lib/` | 13 | e-Nabız, SGK, Medula, NVI, MBYS |
| Mali + Avukat verticals | 53 | Non-medical verticals, Türkiye only by nature |
| Everything else | 184 | |

## 1. Locale assumptions (language, time, numbers)

| What | Where | Size |
|---|---|---:|
| `<html lang="tr">`, Turkish site title and description | `app/layout.tsx`, `app/global-error.tsx`, `public/manifest.json` (`"lang": "tr"`) | 3 |
| Dates and numbers formatted as `tr-TR` directly at the call site | `toLocale*('tr-TR')` across the app (no shared formatter) | 309 files |
| Time zone written as a literal | `timeZone: 'Europe/Istanbul'` (88 occurrences), plus the idea "TRT" in names and comments; shared default in `lib/doktor/selam.ts` (`VARSAYILAN_SAAT_DILIMI`) and `lib/doktor/saatDilimi.ts`; build default in `countries/tr/derleme.mjs` (moved from `next.config.mjs`) | 86 files |
| Greetings by time of day | `lib/doktor/selam.ts`, `lib/greetings.ts`, `lib/colleagueAddress.ts` | 3 |
| Browser validation bubbles forced to Turkish | `components/core/TurkceDogrulama.tsx`, `lib/turkce/dogrulamaMesaji.ts` | 2 |
| Turkish spelling guard (flags English or ASCII-Turkish in the UI) | `lib/turkce/`, `scripts/turkce-tara.mts`, `npm run test:turkce` — a rule that **every** screen is Turkish; must become per-language | 4 |
| Turkish-aware search and sorting | `lib/utils/turkceArama.ts`, `lib/doktor/hastaAramaSozluk.ts`, `lib/doktor/hastaAramaIndeksi.ts`, migration 111 | 5 |
| Speech recognition language | `lib/transcription/deepgramClient.ts` (model `nova-2-medical`, Turkish), Fish / ElevenLabs paths in `lib/asistan/fishAsr.ts`, `sesLlm.ts` | 7 |
| Public holidays | `lib/randevu/resmiTatiller.ts` | 1 |
| Address format (il / ilçe) | `lib/address.ts` | 1 |
| Phone format | `lib/iletisim/cepTelefonu.ts` (used by the Türkiye pack as is) | 1 |
| Name handling (ad soyad, unvan) | `lib/doktor/hekimAdi.ts`, `personelAd.ts`, `lib/portal/hastaAdi.ts` | 3 |

## 2. Specialties and clinic types

| What | Where |
|---|---|
| The 30 specialty keys (the type itself) | `lib/asistan/turkishSpecialtyRefs.ts` → `SpecialtyKey` (a core type living in a Turkish-references file) |
| Names and aliases as Turkish doctors write them (TUS names) | `lib/doktor/specialties.ts` (`SPECIALTY_MAP`), `lib/doktor/bransAdlari.ts`, `lib/specialties/bransAnahtari.ts`, `lib/intake/bransSorulari.ts` (`BRANS_ETIKETLERI`) |
| Per-specialty profile (measurements, portal modules, wording) | `lib/specialties/<key>.ts` (30) + `registry.ts`, `profile.ts`, `kapsam.ts`, `hitap.ts` |
| Chapter content | `specialties/<slug>/` — `engines/`, `prompts/*.md` (read from disk at run time; listed in `next.config.mjs` `outputFileTracingIncludes`), `ui/`, `tests/` |
| The 10 clinic types | `lib/specialties/klinikDikey.ts`, `lib/klinik/`, `specialties/{sac-ekimi, estetik-cerrahi, medikal-estetik, klinik-dermatoloji, longevity, fizyoterapi, klinik-psikolog, diyetisyen, ergoterapi, odyoloji}` |
| Clinic law notes (who may do what in a Turkish clinic) | `lib/klinik/klinikMevzuat.ts` |
| "Veli" (guardian) rule: age 18, Turkish law | `lib/specialties/kapsam.ts` (`veliOnamGerekliMi`), `lib/intake/coreAlanlar.ts` |

Another country needs its **own specialty list mapped to these keys** (checklist C1); the keys themselves can stay as internal identifiers.

## 3. Ayşe: persona and clinical references

| What | Where |
|---|---|
| Persona: name, title, biography, manner of address ("Hocam") | `lib/asistan/personaEngine.ts`, `lib/asistan/specialistsCatalog.ts`, `lib/ai/personas/klinik_uzmanlar.ts`, `lib/dr-ayse/persona.ts`, `lib/colleagueAddress.ts`; 201 files mention the name, 68 the address form |
| Clinical references she answers from (5 Turkish sources per specialty) | `lib/asistan/turkishSpecialtyRefs.ts` (`TURKISH_REFS`, `SECONDARY_TEXTBOOKS`), `lib/klinik/klinikTurkishRefs.ts` (`KLINIK_TURKISH_REFS`), `lib/ai/textbookTemplates.ts`, `lib/ai/specialtyTemplates.ts` |
| Answer standard and audit corpus (written with a Turkish paediatrician) | `lib/asistan/dosyaSorgu/`, `lib/asistan/kalite/`, `lib/asistan/tests/`, `docs/AYSE-*.md` |
| Rules and guards worded in Turkish (scope lock, source lock, dose lock) | `lib/asistan/kapsamKilidi.ts`, `lib/doktor/kaynakKilidi.ts`, `lib/doktor/dozKilidi.ts`, `specialties/*/prompts/` |
| Safety signal list (Turkish words for pregnancy, warfarin, mg/kg …) | `lib/ai/modeller.ts` (`guvenlikSinyaliVar`) |
| Application guide she reads to explain the product | `lib/asistan/uygulamaRehberi.ts` |
| Colleague features: whisper cards, suggestions, learning | `lib/doktor/fisilti*.ts`, `oneri*.ts`, `lib/doktor/ogrenme/` |

## 4. Voice

| What | Where |
|---|---|
| Voice ids, agents per persona, provider switch | `lib/asistan/elevenVoices.ts`, `tekBeyinAjanlari.ts`, `sesSaglayici.ts`, `.env.example` (`DR_AYSE_VOICE_ID`, `ELEVENLABS_AGENT_*`) |
| Turkish pronunciation of medical terms, numbers, units | `lib/ses/tibbiSeslendirme.ts`, `tibbiSeslendirmeSozluk.ts`, `lib/asistan/elevenMetni.ts` |
| Wake words, yes / no, interruption phrases | `lib/asistan/uyandirSoz.ts`, `sesliOnay.ts`, `konusmaKapisi.ts`, `komutNiyeti.ts`, `yarimSoz.ts` |
| Spoken dates and appointment phrases | `lib/randevu/randevuSozu.ts`, `tarihCozumle.ts`, `lib/asistan/zamanBlogu.ts` |
| Voice profile (biometric) and its consent text | `lib/asistan/sesProfili/`, `components/sesProfili/`, migration 127 |

## 5. State systems

| System | Where | Files |
|---|---|---:|
| e-Nabız (paste-ready desk, lab import format) | `lib/enabiz/`, `core/lab/enabiz.ts`, `app/doktor-tools/enabiz`, `app/klinik-tools/enabiz`, `app/api/doktor/araclar/enabiz` | 72 mention it |
| MBYS helper (browser extension + queue) | `lib/enabiz/mbys/`, `lib/seansPaketi/mbys.ts`, `extensions/mbys-yardimci/`, migration 126 | 22 |
| SGK, Medula (provision, e-prescription, reports) | `lib/sgk/`, `lib/medula/`, `app/doktor-tools/sgk-*`, every `*-sgk` specialty tool | 201 mention SGK, 97 Medula |
| SUT (reimbursement rules) | `lib/seansPaketi/sutKurallari.ts`, specialty engines and tools named `*-sut*` | 160 |
| e-Reçete, coloured prescriptions | `app/doktor-tools/erecete`, `lib/doktor/receteRengi.ts`, `receteAktarim.ts`, migration 038 | |
| NVI / KPS identity lookup | `lib/nvi/kps.ts`, `lib/doktor/idCardParse.ts` | |
| HL7 / FHIR bridges to hospital systems | `lib/entegrasyon/`, `app/api/entegrasyon/` | |

## 6. Identity numbers

T.C. kimlik no (11 digits, checksum) is validated in **two** separate copies — `lib/enabiz/mbys/kontrol.ts` (`tcKimlikGecerli`, the one the Türkiye pack points at) and `lib/gelenBelgeler/eslesme.ts` (`tcGecerliMi`) — and stored hashed with a pepper (`TC_HASH_PEPPER`, `lib/security/encryption.ts`, `pseudonymize.ts`). 83 files mention it. Masking rule: `lib/doktor/aracNotu.ts` (`tcMaskele`). Patient record fields: `lib/doktor/hastaKayitAlanlari.ts`.

## 7. Vaccination, growth, screening

| What | Where |
|---|---|
| National vaccination calendar and catch-up | `lib/asi/ulusalAsiTakvimi.ts`, `lib/asi/` (card, PDF, reminders), `lib/asistan/asiTablosu.ts`, `specialties/pediatri/engines/` |
| Growth charts: Neyzi (Turkish children) next to WHO | `lib/clinical/buyumeEgrisi.ts`, `whoBuyumeLms.ts`, `specialties/pediatri/engines/buyume.ts`; 77 files mention Neyzi |
| Screening programmes (hearing, vision, M-CHAT, vitamin D, iron) | `lib/clinical/gelisimTaramasi.ts`, `mchatR.ts`, `genetikTarama.ts` |
| Pregnancy follow-up schedule (ministry guide) | `lib/clinical/gebelik.ts`, `specialties/kadin-dogum/engines/` |

## 8. Medicines

| What | Where |
|---|---|
| Reimbursed drug list (data file) | `data/sgk-ilaclar.json`, `scripts/import-sgk-ilac.mjs`, `scripts/import-titck-etken.mjs` |
| Brand names and search | `lib/asistan/turkishDrugs.ts`, `lib/ilac/ilacArama.ts`, `lib/asistan/ilac/` |
| Dose safety limits and wording | `lib/doktor/dozGuvenligi.ts`, `dozKilidi.ts`, `core/eylemler/ilacUyari.ts` |

## 9. Coding

ICD-10 with Turkish titles: `app/doktor-tools/icd10`, `app/api/doktor/araclar/` (98 files mention ICD-10). Lab test catalogue and units: `lib/doktor/tetkikKatalogu.ts`, `core/lab/kanonik.ts`. Imaging modalities: `lib/doktor/imagingModalities.ts`.

## 10. Consent and legal texts

| What | Where |
|---|---|
| KVKK notice page, consent at sign-up (text version stamped on the account) | `app/kvkk/page.tsx`, `app/kayit/page.tsx` |
| Messaging permission text | `lib/iletisim/izinMetni.ts`, `izin.ts` |
| Voice profile consent | `lib/asistan/sesProfili/rizaMetni.ts` |
| Patient-side consents (intake, portal) | `lib/intake/coreAlanlar.ts`, `app/intake/[token]`, `app/portal/` |
| Retention and deletion job | `app/api/cron/kvkk-imha/route.ts` |
| Clinic registration and consent checklist | `app/klinik-tools/kayit-kvkk`, `lib/klinik/klinikKayit.ts` |
| Outside providers, written into the security policy | `middleware.ts` (CSP: ElevenLabs, Groq, Deepgram, Supabase, Facebook, Open-Meteo), `lib/ai/saglayici.ts` (OpenRouter) |

103 files mention KVKK.

## 11. Patient-facing surfaces

Everything here is read by a patient and is Turkish throughout: the portal "Sağlığım" (`app/portal/`, 126 files; `lib/portal/`; `public/sagligim/`), intake forms (`app/intake/[token]`, `lib/intake/bransSorulari.ts`, `klinikSorulari.ts`, `coreAlanlar.ts`), appointment pages (`app/randevu/[jeton]`), consultant page (`app/konsultan/`), vaccination card PDF (`lib/asi/karnePdf.tsx`), e-mail and WhatsApp templates (`lib/iletisim/sablonlar.ts`, `bilgiFormuEposta.ts`, `lib/portal/messageCopy.ts`, `notifyPatientEmail.ts`), reports and epikriz (`lib/doktor/epikrizMetinleri.ts`, `raporDerle.ts`). Patient language is not stored: there is no per-patient language field.

## 12. Pricing, payment, landing

| What | Where |
|---|---|
| Prices in lira, plan names | `components/doktor-landing/content.ts` (`INDIVIDUAL_PLANS`, `CLINIC_PLANS`), `pricing.tsx`, `app/klinik/page.tsx` |
| Payment provider (iyzico, Turkish) | `app/api/billing/webhook/route.ts`, `.env.example` (`IYZICO_*`) |
| Landing pages | `app/doktor/`, `app/klinik/`, `app/home/`, `components/doktor-landing/`, `components/klinik-landing/`, `docs/LANDING-REFRESH-2026-10.md` |
| Company line ("Dream Türkiye, İstanbul") | `components/doktor-landing/site-footer.tsx` |
| "Teklif alın" on the clinic page | a label over a link to `/kayit?plan=klinik` — there is **no** contact-request mechanism behind it |

## 13. Onboarding, sign-up, login

`app/kayit/page.tsx`, `app/onboarding/page.tsx`, `app/giris/*` (5 pages), `app/davet/personel/[token]`, `app/api/users/*`, `app/api/personel/*`. Trial of 15 days: `app/api/users/trial/route.ts`.

**The Turkish Supabase project is written into the code.** Its URL and public key are literals in 8 files: the five pages under `app/giris/`, `app/kayit/page.tsx`, `app/davet/personel/[token]/page.tsx`, and `lib/doktor/clientAuth.ts` (as a fallback when the setting is missing). A build for another country that forgot its own setting would talk to the Turkish database. The Uzbek login does not use these files and refuses to run without its own setting; the literals must go before any of these screens is opened to another country (split plan, step 2).

## 14. Things that ship in every build regardless of country

Not behind any wall yet; the route allow-list keeps them unreachable in another country, but they are in the build:

- `public/` — 87 static pages (`public/*.html`: internal audit and sample pages), `sagligim/`, `manifest.json`, `sw.js`.
- `specialties/*/prompts/*.md` — Turkish prompts read from disk.
- `vercel.json` — one cron list and one region (`fra1`) for every deployment.
- `.env.example` — Turkish voices, iyzico, KVKK keys.
- `middleware.ts` — CORS allow-list of the Turkish domains.

## 15. The ten places most likely to show Turkish content to a non-Turkish doctor

Ordered by how easily it happens, not by size.

1. **Server error sentences.** Almost every API route answers errors in Turkish (`'Oturum bulunamadı. Lütfen tekrar giriş yapın.'`, `'Hasta bulunamadı.'`). The first route opened to another country will speak Turkish the first time anything fails. (`lib/doktor/serverAuth.ts` `OTURUM_YOK`; 175 files in `app/api/doktor`.)
2. **The root shell and error pages.** `app/layout.tsx` (title, description, `lang="tr"`, the floating Ayşe panel on every page), `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx` — shown on any wrong address or crash. Other countries have their own (`app/*.ulke.tsx`) and never load these; the risk returns the day a Turkish screen is re-exported as a `*.ulke.*` route without its shell being checked.
3. **Ayşe's sources.** `TURKISH_REFS` / `KLINIK_TURKISH_REFS` are injected into her prompts for every specialty; with no local list she would cite the Turkish Ministry of Health and SGK to an Uzbek doctor.
4. **The note itself.** SOAP templates, section headings and the patient summary are produced by Turkish prompts (`lib/doktor/soapTemplates.ts`, `soapUret.ts`, `lib/ai/noteGenerator.ts`, `specialties/*/prompts`). Changing the screen language does not change the note language.
5. **Dates, numbers and time.** 309 files format with `'tr-TR'` and 86 pin `Europe/Istanbul` at the call site; a translated screen would still print Turkish month names and Istanbul time (appointments, reminders, "today").
6. **Tools that are Türkiye by content, not by name.** Vaccination calendar, Neyzi growth curves, SCORE2 with Türkiye's risk region, pregnancy follow-up schedule — they look universal and are not (see the tools audit, "Adapt").
7. **Messages that leave the product.** E-mail, WhatsApp and reminder templates (`lib/iletisim/sablonlar.ts`, cron jobs) are Turkish and are sent without a screen in between — nobody sees them before the patient does.
8. **PDFs and print.** Vaccination card, reports, epikriz, prescriptions: Turkish headings, the T.C. kimlik field, and an embedded font chosen for Turkish glyphs (`lib/asi/karnePdf.tsx`, `outputFileTracingIncludes`).
9. **Voice.** Wake words, confirmations ("evet", "tamam"), number and unit reading and the persona's name are Turkish in the voice path, which bypasses most screen text.
10. **Defaults that mean Türkiye.** `|| 'tr'`, `'Europe/Istanbul'` fallbacks, the hard-coded Turkish Supabase project, `specialty` aliases, the 18-year guardian rule, lira and SGK columns in the database schema (`users.kvkk_consent_at`, `tc_kimlik_hash`). A missing setting silently becomes Türkiye — the opposite of "fail closed".
