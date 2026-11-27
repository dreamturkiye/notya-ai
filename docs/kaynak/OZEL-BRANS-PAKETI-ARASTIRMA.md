# Özel Branşlar (9 besides diyetisyen) — portal package sources and limits (BRANS-PAKETI, 2026-11-27)

**Reviewer model (Kaan's brief):** there is no external clinical reviewer. Every timeline / checklist in
`lib/portal/paket/estetik.ts` and `lib/portal/paket/terapi.ts` is a STARTING TEMPLATE; the treating professional reviews,
may edit (timeline, list, photo angles/months, note — never a dose; diary fields and red flags stay fixed for safety)
and accepts it in Özel Branşlar › Hasta alanı paketi. Acceptance is stored with a timestamp and history
(`brans_paket_sablon.kabul_at`, `kabul_gecmisi`). A module with no acceptance reaches no patient.

| Id | Source | Status |
|---|---|---|
| YONETMELIK-2014 | RG 22.05.2014/29007 Ek-2: fizyoterapist (exercise programmes; patients on physician referral), klinik psikolog (therapy for F00–F99 on specialist referral; crisis support), ergoterapist (functional performance at home/work/school, aids), odyolog (tests on physician referral, hearing-device fitting, hearing protection) | read |
| REPO-* | The professional tools already in the repo for each branş (specialties/<slug>/engines: sac-ekimi izlem DOKULME 14–56 gün, SONUC_IZLEM 6/12 ay; estetik-cerrahi postOpTakvim 1/7/14/42 gün, emboli bandı; medikal-estetik islemTakvimi 1/14/28 gün, vasküler bayrak; klinik-dermatoloji akne 2/6/12 hafta, foto rızası; fizyoterapi kırmızı bayrak; klinik-psikolog kriz bandı; odyoloji ani işitme kaybı 112, cihaz izlem) | repo |
| WHO-PA-2020 | WHO Guidelines on Physical Activity and Sedentary Behaviour (2020): adults 150–300 min moderate/week, muscle strengthening ≥ 2 days/week | well-known, not re-fetched |
| SAC-PRATIK | Hair-transplant post-op course (first-night head elevation, gentle daily washing, crusts off ~10–14 days, temporary shedding weeks 2–8, growth from month 3, result 12–18 months) | **No primary ISHRS / Turkish document confirmed** — clinic/consumer pages only; the physician's acceptance is the review |
| CERRAHI-PRATIK | Pre-op checklist and post-op red flags (breathlessness / chest pain, unilateral calf swelling, rapidly expanding unilateral swelling, fever + wound signs) | General surgical safety practice; **no single cited Turkish document** — the surgeon accepts / edits |
| ESTETIK-PRATIK | Injectable aftercare and vascular-occlusion warning signs (blanching, livedo, escalating pain, visual change → urgent) | Matches the repo's vascular flag; **no Turkish consensus text confirmed** |
| MHRA-ISOTRETINOIN | UK MHRA drug-safety updates on isotretinoin (pregnancy prevention, mood monitoring) | search result only; international support |
| TITCK-ISOTRETINOIN-DOGRULANAMADI | TİTCK isotretinoin pregnancy-prevention programme | **NOT CONFIRMED** in this session — module is doctor-switched only and lines are doctor-written |

Rules encoded for every branş: 112 on every acil flag (pinned by test); no diagnosis words; no doses (template edits and
per-patient lines refuse "5 mg / 2 tablet / …"); klinik psikoloji crisis copy says the page is not enough and to call 112;
ergoterapi child modules only under 18 with veli wording, adults never get it; photos private (bucket brans-paket-foto),
metadata/location stripped, deletable by the patient, separate consent text per photo module.
