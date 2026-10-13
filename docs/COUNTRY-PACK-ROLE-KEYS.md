# Role keys across countries

Written 2026-10-09 (NOTYA-ULKE-EN-01). A role is a doctor specialty, a clinic doctor or a clinic allied profession: the thing an account chooses at first login, which decides its note template, its intake questions and its tools.

**Why this page exists.** The Turkish product and the Uzbek pack use the product's original role keys (`kardiyoloji`). The five English-speaking packs share one set of English keys (`cardiology`), defined once in the English language set, so that nothing Turkish sits in an English pack even as an internal key. A key is never shown on a screen. When a core fix is made for one specialty, this table says which key carries the same role in every other country.

**Where it lives.**

| What | Where |
|---|---|
| The table, as data | `countries/rol-eslemesi.json` (tests and scripts only: no application code, no pack and no build reads it) |
| The English keys, defined once | `countries/_dil/en/klinik/roller.ts` |
| The Turkish product's keys | `lib/asistan/specialistsCatalog.ts` (30 specialties), `lib/ai/personas/klinik_uzmanlar.ts` and `lib/specialties/klinikDikey.ts` (10 clinic roles) |
| The Uzbek pack's keys | `countries/uz/klinik/asistanAdlari.ts` |
| The test that holds the table to all three sides | `lib/ulke/rolEslemesi.test.ts` (in `npm run test:ulke`) |

**The rule.** Forty rows, none missing, none extra, on every side. A role added to the product, to the Uzbek pack or to the English set fails the test until the table has its row; an English-speaking pack that uses any key outside the shared set fails it too.

**What is the same across countries, by key:** the kind of role, the note-template fields of the role, the topics of its intake questions, and which tools of the kit it sees. **What is the country's own:** the name the role goes by there (general practice or family medicine, anaesthetics or anesthesiology), which lives in each pack.

## The table

| English packs (`gb`, `us`, `ca`, `au`, `nz`) | Türkiye | Uzbekistan | Kind |
|---|---|---|---|
| `emergency-medicine` | `acil-tip` | `acil-tip` | doctor specialty |
| `family-medicine` | `aile-hekimligi` | `aile-hekimligi` | doctor specialty |
| `anaesthesia` | `anestezi` | `anestezi` | doctor specialty |
| `neurosurgery` | `beyin-cerrahisi` | `beyin-cerrahisi` | doctor specialty |
| `paediatric-surgery` | `cocuk-cerrahisi` | `cocuk-cerrahisi` | doctor specialty |
| `internal-medicine` | `dahiliye` | `dahiliye` | doctor specialty |
| `dermatology` | `dermatoloji` | `dermatoloji` | doctor specialty |
| `endocrinology` | `endokrinoloji` | `endokrinoloji` | doctor specialty |
| `infectious-diseases` | `enfeksiyon-hastaliklari` | `enfeksiyon-hastaliklari` | doctor specialty |
| `gastroenterology` | `gastroenteroloji` | `gastroenteroloji` | doctor specialty |
| `general-surgery` | `genel-cerrahi` | `genel-cerrahi` | doctor specialty |
| `thoracic-surgery` | `gogus-cerrahisi` | `gogus-cerrahisi` | doctor specialty |
| `respiratory-medicine` | `gogus-hastaliklari` | `gogus-hastaliklari` | doctor specialty |
| `ophthalmology` | `goz-hastaliklari` | `goz-hastaliklari` | doctor specialty |
| `obstetrics-gynaecology` | `kadin-hastaliklari-dogum` | `kadin-hastaliklari-dogum` | doctor specialty |
| `cardiovascular-surgery` | `kalp-damar-cerrahisi` | `kalp-damar-cerrahisi` | doctor specialty |
| `cardiology` | `kardiyoloji` | `kardiyoloji` | doctor specialty |
| `otolaryngology` | `kulak-burun-bogaz` | `kulak-burun-bogaz` | doctor specialty |
| `nephrology` | `nefroloji` | `nefroloji` | doctor specialty |
| `neurology` | `noroloji` | `noroloji` | doctor specialty |
| `oncology` | `onkoloji` | `onkoloji` | doctor specialty |
| `orthopaedics` | `ortopedi` | `ortopedi` | doctor specialty |
| `paediatrics` | `pediatri` | `pediatri` | doctor specialty |
| `plastic-surgery` | `plastik-cerrahi` | `plastik-cerrahi` | doctor specialty |
| `psychiatry` | `psikiyatri` | `psikiyatri` | doctor specialty |
| `radiology` | `radyoloji` | `radyoloji` | doctor specialty |
| `rheumatology` | `romatoloji` | `romatoloji` | doctor specialty |
| `urology` | `uroloji` | `uroloji` | doctor specialty |
| `sports-medicine` | `spor-hekimligi` | `spor-hekimligi` | doctor specialty |
| `rehabilitation-medicine` | `fizik-tedavi` | `fizik-tedavi` | doctor specialty |
| `hair-transplant` | `sac-ekimi` | `sac-ekimi` | clinic doctor |
| `aesthetic-surgery` | `estetik-cerrahi` | `estetik-cerrahi` | clinic doctor |
| `aesthetic-medicine` | `medikal-estetik` | `medikal-estetik` | clinic doctor |
| `clinic-dermatology` | `klinik-dermatoloji` | `klinik-dermatoloji` | clinic doctor |
| `longevity` | `longevity` | `longevity` | clinic doctor |
| `physiotherapy` | `fizyoterapi` | `fizyoterapi` | clinic allied profession |
| `clinical-psychology` | `klinik-psikolog` | `klinik-psikolog` | clinic allied profession |
| `dietetics` | `diyetisyen` | `diyetisyen` | clinic allied profession |
| `occupational-therapy` | `ergoterapi` | `ergoterapi` | clinic allied profession |
| `audiology` | `odyoloji` | `odyoloji` | clinic allied profession |

Notes:

- The Turkish clinic list names its dermatology role `dermatoloji`; the product key of that clinic role is `klinik-dermatoloji` (`lib/specialties/klinikDikey.ts`). The table holds the product key, and the test reads the clinic list with that one translation.
- The English keys are written in the base spelling of the language set (`anaesthesia`, `paediatrics`, `orthopaedics`, `obstetrics-gynaecology`). They are identifiers, the same in all five English-speaking countries, and are not respelt for any of them: only what a screen shows follows a country's spelling.
- Note-template FIELD keys (`blood_pressure_pulse`, `prior_anesthesia`) are the same in every country build and need no table.
