# OPEN COMMITMENTS — Notya AI

**Why this file exists.** Work agreed in a session and deferred to "next time" was getting lost and
resurfacing weeks later as "why was this never done?". Chat history is not a tracking system.
Anything deferred goes here with a date and who it waits on, or it does not count as agreed.

Last reviewed: 2026-09-01 (randevu sistemi #44 merged)

---

## Standing rule — mobile check on every change (Kaan, 2026-09-13)

Every new feature, UI change, or fix Claude ships to Notya from now on must be verified to
display and work correctly on mobile devices (iPhone and Samsung/Android web) before being
considered done — not just typechecked. This applies going forward to all surfaces: doktor
dashboard, İnceleme, not sayfası, reçete, Sağlığım portal, intake forms, everything.

Practical check for each PR that touches UI, before calling it finished:
- Screenshot or render at a real mobile width (390px iPhone, 360px Galaxy) — claude-in-chrome
  navigate + screenshot at that viewport, or the visualizer mockup tool when no live page exists yet.
- Confirm: no horizontal overflow, buttons/inputs reachable and not cut off, text wraps instead of
  truncating silently, touch targets aren't so small they're unusable, modals/panels fit the screen.
- If a change is desktop-only by nature (e.g. a purely server-side calc with no new UI), no mobile
  check is needed — but any new button, form, panel, badge, or page does need one.
- Record what was checked (and any gap found) in the PR description / ledger, same as other work.

## Open — self-serve şifre sıfırlama (2026-09-14)

Login sayfasına "Şifremi unuttum" linki eklendi (PR pending) ama gerçek self-servis akış DEĞİL —
tıklayınca "Notya ekibiyle iletişime geçin" diyor. Gerçek e-postalı sıfırlama şu an mümkün değil,
iki bağımsız blokaj var:
1. RESEND_API_KEY tanımlı değil — e-posta gönderme altyapısı (lib/mail/resend.ts) zaten var ve
   hasta portalı bildirimlerinde kullanılıyor, yalnız anahtar eksik olduğu için no-op çalışıyor.
2. Supabase projesinin Redirect URL allow-list'i yalnız localhost'a izin veriyor — production
   domaini eklenmemiş; bu proje-seviyesi bir ayar (Supabase dashboard veya Management API personal
   access token gerekir, servis anahtarıyla değiştirilemez).

Kaan RESEND_API_KEY sağlarsa (Resend ücretsiz katmanı yeterli) ve/veya Supabase Redirect URL'lerine
https://notya-ai.vercel.app eklerse, gerçek self-servis "şifremi unuttum → e-posta → link → yeni
şifre" akışı bir oturumda kurulabilir.

## CLOSED — bayat Supabase fetch taraması (opened 2026-09-14, closed 2026-09-16)

**CLOSED 2026-09-16 (PR fix/no-store-sweep-2):** `scripts/codemod-no-store.mjs` (bracket-matching codemod, idempotent) wrapped the remaining 41 raw `createClient(...)` calls under app/api + lib with `cache: 'no-store'` (merged into existing `global`/`auth` option objects where present, 0 manual). Its `--check` mode runs in `npm test` as `lib/supabase/noStore.test.ts`, so any future raw client without no-store fails CI. Rule stands: prefer the shared no-store client; if a raw client is unavoidable the guard forces the option.


PR #170 (2026-09-10) 34 dosyada ham `createClient(...)` çağrılarına `cache: 'no-store'` sardı,
ama arama deseni yalnız `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)` şeklindeki
satırları yakalıyordu. Bugün hasta portalının Büyüme Eğrileri verisinin sessizce `null` döndüğü
bulundu — kök sebep `app/api/portal/hasta/[token]/route.ts`'nin URL/anahtarı yerel değişkenlerde
(`supabaseUrl`, `serviceRoleKey`) tutması, deseni kaçırması. O dosya düzeltildi (PR bu oturumda).

Aynı taramayla (`createClient(` var ama `no-store` yok ve `servisSupabase()` da kullanmıyor)
~40 başka dosya çıktı — hepsi doğrulanmadı, bazıları POST-only/webhook olduğu için muhtemelen
risksiz. Adaylar: portal/hasta alt-rotaları (mesajlar, unlock), klinik/me, klinik/members,
entegrasyon/* (yonetim, hl7/al, fhir/isle), avukat/* (dilekce, sozlesme-analiz, ictihat-ara),
mali/ebeyan, mali/portal-admin, sessions/start, sessions/[id]/end, notes/whatsapp,
users/profile, users/me, doktor/belgeler/ingest, doktor/ilaclar/doz-oner, doktor/goruntuleme
(ve alt rotaları), doktor/hatirlatma, doktor/araclar/* (icd10, erecete, epikriz, sgk-rapor,
ilac-interaksiyon, hasta-portali), asistan/learn, asistan/chat, asistan/avukat-*, asistan/mali-chat,
billing/webhook, help/chat, lib/portal/toolsUi.ts, lib/transcription/deepgramClient.ts,
lib/security/auditLogger.ts, lib/sandbox/supabase.ts, lib/doktor/integrations.ts,
lib/asistan/actionExecutor.ts.

Öncelik: GET rotaları (okuma sonucu bayat servis edebilenler) — users/me, users/profile,
doktor/goruntuleme, portal/hasta/[token]/mesajlar, klinik/me, klinik/members. POST/webhook
rotalarının riski daha düşük ama gözden geçirilmeli. Ayrı bir oturumda dosya dosya doğrulanıp
düzeltilmeli — bugünkü gibi kör bir toplu regex yerine.

## Program — specialty chapters on one spine (2026-09-14, Kaan)

Decision: the baseline (SOAP, İnceleme/onay, reçete/Medula, epikriz, randevu+hatırlatma, Sağlığım
portal, aşılar, intake, Ayşe sesli+yazılı, 1 saat+30 dk kayıt) is universal. Each specialty is a
"chapter" declared once in `lib/specialties/<key>.ts` via `SpecialtyProfile` and resolved through
`specialtyProfile(key)` (`lib/specialties/registry.ts`). Unbuilt specialties fall back to the
baseline automatically.

Build method (Kaan's direction, accepted): research-build each chapter to 80-90% BEFORE a
specialist sees it (specialists react to what's in front of them — immunization lesson), then a
real doctor revises. Guardrails that do not move: official Turkish sources only (SB, TUK
societies, SUT/TİTCK); deterministic code calculators only from validated PUBLIC instruments
(Neyzi/M-CHAT/GİDR pattern — Denver II lesson); Ayşe image review is decision support, never
"tanı"; every chapter ships with its `specialistReview` checklist.

Order: Wave 0 = registry (DONE: profile.ts, pediatri.ts, registry.ts — declarative, unwired) →
wire hasta dosyası tabs, ölçüm sırası, epikriz unvan to read the profile → Ayşe vision + shared
photo/media timeline (Claude Sonnet 4.6 is already multimodal; `hasta_goruntulemeler` exists as
storage-only). Wave 1 = Kadın Hastalıkları ve Doğum FIRST (Kaan 2026-09-14: Dr. Gökhan has delivered 3000+
babies and can guide — fastest path to a second specialist-validated chapter; SB Doğum Öncesi
Bakım Yönetim Rehberi + lohusa izlem protokolü, same public-source pattern as GİDR; fetal
biometry reuses the Neyzi percentile engine + chart; tetanoz reuses aşılar; expectant-mother
portal reuses Sağlığım). Then Dermatoloji (image-native, own breadth like pediatri), then Aile
Hekimliği. Wave 2 = Dahiliye, Göz Hastalıkları (NOT "optometri" — optisyen is a separate,
non-diagnosing profession in Turkey).
Wave 3 = Psikiyatri (TR-validated scales, deterministic), Kardiyoloji (EKG on vision). Acil Tıp
and surgical branches last (hospital-based / lower muayenehane volume).

Assumption: customer = Turkish private-practice physicians (muayenehane/poliklinik).

### Sağlığım — specialty-specific portal modules (DECIDED 2026-09-17, Kaan)

Core Sağlığım shell stays universal (PIN, mesajlar, ziyaretler, sonuçlar, ilaçlar, öykü, KVKK/112).
**Beyond core, portals are specialty-specific** — pediatri ≠ göz ≠ KD ≠ dahiliye ≠ derm. Same
core values; section UI/data via registry modules, not one identical Takip for every branş.
Skill: `.cursor/skills/specialty-hasta-portali/SKILL.md`. Audits must score a **Hasta portalı**
depth row (`specialty-audit-report`). Today’s gebelik/büyüme/dahiliye-anket bolt-ons are Partial;
new chapters (Göz first next) ship doctor chapter + portal module in the same program.

**SAGLIGIM-PORTAL-REGISTRY — SHIPPED 2026-09-17 (Part A of the Göz all-in-one brief).** `SpecialtyProfile.portal`
(`PortalModulu`: id, nav, bundleKeys, eligibility, copyHints, views, derinlik) declared on pediatri (büyüme/hedef boy,
Partial), KD (Gebeliğim + jine reminders, Partial), dahiliye (new registry entry `lib/specialties/dahiliye.ts`, ön anket,
Partial), dermatoloji (**Missing**, declared honestly, mounts nothing), göz (Gözlerim). `lib/portal/moduller.ts`
decides per token (doctor `users.specialty` × active pregnancy / KD chart / dahiliye cards / growth data × age). The
portal API loads core always and builds büyüme / gebelik / jine slices only for attached modules; `PortalShell` nav
extras come from `bundle.portal.nav`; Takip and home mount widgets only via `portalModulAktif`; the ön anket API uses
the same eligibility. **Leaks fixed:** büyüme curves were computed for every patient with a DOB (adults included);
Pap/HPV reminders for every woman in any practice; the ön anket shortcut fetched for every token. Rules: a doctor
whose chapter has its own module never gets another chapter's chart-data modules (göz/derm/KD/dahiliye → no büyüme,
Pap/HPV only for KD); Gebeliğim follows an active pregnancy for any practice (mixed care); baseline-branch doctors
(aile hekimi, endokrin…) get chart-data modules only when the data exists. Assumption (recorded): unknown
`users.specialty` = baseline branch, not pediatri. Tests: `lib/portal/moduller.test.ts` (10, in `npm test`).

### Göz Hastalıkları — chapter (SHIPPED 2026-09-17; was queued)

**Pre-sprint:** `public/goz-presprint-audit.html` → ~8% wow bar (chapter Missing).
**Post-sprint:** `public/goz-post-sprint-audit.html` → 11/18 Strong, ~77% wow bar (#292/#293).
**Remaining-gaps re-audit (independent, 2026-09-17):** `public/goz-remaining-gaps-audit.html`
→ https://notya-ai.vercel.app/goz-remaining-gaps-audit.html — Claude Strong ratings verified
(`test:goz` 61/61); 7 Partial domains + chart-tab chrome leak + MD beta still open.

**GOZ-CHAPTER — SHIPPED 2026-09-17 (#292, Claude).** `specialties/goz-hastaliklari/**` + `lib/specialties/goz-hastaliklari.ts`
(VA/GİB first-class olcumler, Gözlerim module Strong) + migration `048_goz_chapter.sql` (goz_* tables, oct/fundus/on_segment
modalities; applied) + `/api/doktor/goz` + hasta dosyası › **Göz** (only for göz doctors). Engines: VA (logMAR/letters, PS/EH/IH
non-numeric), glokom (hekim target/intervals, no titration), DR (TEMD 2026 screening + TEMD vs ICO 2017 dual column,
`catisma`), anti-VEGF (SUT 4.2.33 verified line by line: basamak, rapor type/duration, loading, implant spacing, switch rule,
8 mg, response class), SGK rapor drafts, acil red flags, katarakt checklist, ön segment cards (SUT 4.2.33.D), pediatric bridge,
strip + intake→Subjektif, dual-sign OCT/fundus reads. Prompts lock wired (SOAP/chat/ses/stil). Dahiliye bridge: closing an open
`sevkler(hedef=goz)` writes `dahiliye_dm.son_goz_dibi` and closes `dm_goz`. Sağlığım › Gözlerim + `/portal/demo-goz`.
Tests: `npm run test:goz` (61), npm test 584/584. Smoke: `scripts/goz-smoke.mts` 48 steps/checks 0 failures (QA doctor
`qa.goz@notya.ai`, password only in .env.local); `scripts/goz-prompts-smoke.mts` 7/0 (real SOAP + chat). Screenshots 360/390px,
no horizontal overflow (smoke-out/goz, gitignored).

**Assumptions recorded (low-risk, made without asking):** TEMD "minimal retinopati" = hafif NPDR and "ileri evre" = orta NPDR+
or any DMÖ (TEMD gives no ICDR table) — shown next to ICO, hekim locks the date; glaucoma and pediatric intervals are hekim
fields because TOD birim texts are members-only; ICD-10 suggestions on SGK drafts (H35.3/H36.0/H34.8/H44.2/H25.9) are marked
"hekim doğrular"; `rapor_metni` on OCT/fundus rows stays visible in Sağlığım › Sonuçlar because it is doctor-typed at upload
(same as every modality); a GİL draft is an info note because the SUT text has no GİL rapor rule.

**Open / intentional outs (Göz):**
- GOZ-AYSE-VISION — Ayşe OCT/fundus draft into `goz_goruntu_okumalari` (dual-sign record exists; auto-draft not wired). M.
- GOZ-EK3G — verify SUT EK-3/G lens items (monofokal/torik/multifokal) with the clinic's billing; list could not be fetched. S.
- GOZ-TOD-TEXTS — TOD Glokom / Retina / Pediatrik birim guidelines are members-only; read with a member login and replace hekim
  interval fields with verified defaults. M.
- GOZ-SB-GORME — SB görme taraması referral cut-offs (Lea/Snellen) unverified (hsgm PDFs refused connection); not embedded. S.
- GOZ-INTAKE-SMOKE — intake → Subjektif path has unit tests but no smoke with a filled göz ön formu. S.
- GOZ-COMPARE — side-by-side OCT compare for the same eye. M.
- Real ophthalmologist beta — synthetic QA ≠ muayenehane; needs a göz hekimi field day.

**SAGLIGIM PART C — portal honesty pass (2026-09-17):** pediatri büyüme Partial (gated, still Takip bolt-on), KD Gebeliğim + jine
Partial (gated), dahiliye ön anket Partial (gated in bundle and API), dermatoloji **Missing** (declared, mounts nothing), göz
Gözlerim Strong. Smoke proves a göz practice gets no büyüme/gebelik/jine/anket, including a 6-year-old with kilo/boy.
**Waits on Kaan (doctor side, not changed):** hasta dosyası shows "Deri & Lezyon" to every branch (#244 made it universal) and
pediatric tabs (M-CHAT, gelişim, büyüme, bebek kartı) follow patient age, not doctor branch — so göz/KD doctors see them for
children. Proposal: same registry rule as the portal (own-chapter doctors don't get other chapters' tabs). Needs a yes because
Dr. Gökhan's pediatri workflow may use the Deri tab.

## Kadın Hastalıkları ve Doğum — Wave 1, first slice shipped 2026-09-14 (night)

Shipped for Dr. Gökhan's morning review: lib/clinical/gebelik.ts (Naegele/USG dating, SB DÖB
4-izlem takvimi with per-visit items, guideline-threshold alerts, kilo alım hedefi — all
deterministic), migration 020 (gebelikler, gebelik_izlemleri — APPLIED), /api/doktor/gebelik,
HastaGebelik.tsx tab (visible for female patients ≥12y; tab #12, appended so no renumbering),
registry chapter lib/specialties/kadin-dogum.ts (olgunluk: arastirma), beta list v7 item 10.

Second slice, same night (Kaan: "build the rest with the 3 references"): fetal biyometri persentilleri
(INTERGROWTH-21st official tables embedded verbatim from intergrowth21.com + Hadlock EFW —
lib/clinical/fetalBiyometri.ts), lohusa izlemi (SB DSBYR, migration 021 lohusa_izlemleri),
kadın sağlığı (KETEM tarama motoru, kontrasepsiyon kataloğu, menopoz çerçevesi — kadin_sagligi
table, /api/doktor/kadin-sagligi), printed Gebe İzlem Kartı (…/gebelik/yazdir, letterhead, A4,
USG + doğum + lohusa sections), portal "Gebeliğim" (PortalBundle.gebelik, GebeligimView).
References used for KHD (the "3" + SB): SB DÖB Yönetim Rehberi 2018, SB Doğum Sonu Bakım
Yönetim Rehberi, SB Kanser Tarama Standartları (KETEM), TJOD kılavuzları; TMFTP for USG practice.

Third slice, same night (Kaan: "make sure genetic/non-genetic disease tests like Down
syndrome are included"): genetik/kromozomal tarama — İkili test (NT+PAPP-A+free β-hCG),
üçlü/dörtlü test (AFP/hCG/estriol/inhibin A), NIPT (T21/T18/T13), invaziv test (CVS/amniyosentez)
— lib/clinical/genetikTarama.ts, migration 022 genetik_taramalar (APPLIED), wired into
/api/doktor/gebelik + HastaGebelik.tsx panel + printed Gebe İzlem Kartı.

CRITICAL BOUNDARY HELD: this module records lab-reported results only — it does NOT calculate
a combined aneuploidy risk ratio (e.g. "1/250"). That requires FMF/Astraia-certified,
lab-calibrated MoM software; computing it ourselves would repeat the Denver II/WHO-percentile
mistake at higher stakes (drives invasive-testing/termination decisions). NT gets only a
conservative ABSOLUTE flag (≥3.5mm), not a CRL-specific percentile curve — verified terminology
against FMF's own Turkish teaching material and current Turkish practice literature before
building. İleri anne yaşı (≥35) computed as a simple deterministic threshold — uncontroversial.
Verified: threshold logic tested at boundary (3.5mm exactly flags, 16hf correctly out-of-window).

Fourth slice, same night (Kaan supplied a detailed 10-section KHD reference doc — Williams
Obstetrik/Berek&Novak/Temel KHD Bilgisi + SB DÖBYR 2026 — and asked to audit built vs. spec):

Built tonight in response: pediatri köprüsü (canlı doğumda "Doğum Gerçekleşti" now takes
APGAR/kilo/boy/baş çevresi/cinsiyet and **must** create the newborn's Bebek kartı —
029 dogum_olaylari + bebek_kartlari linked to anne, plus gebelikler.yenidogan_patient_id.
Taburcu paketi / NTP / izlem extras: migration 036 (reuses 029 maddeler/yenidogan_tarama jsonb). Optional skip is gone.
Migration 023: gebelikler gained olu_dogum/ektopik (D/E), önceki sezaryen
sayısı/kesi tipi, çoğul gebelik tipi, risk_sinifi, ilk_vizit_lab, indirekt_coombs, anti_d_uygulamalari;
gebelik_izlemleri gained servikal_uzunluk, ogtt, gbs_kultur, tehlike_isaretleri. genetikTarama.ts
gained nazalKemik field, kordosentez/fetal-eko invaziif options, SUT_KODLARI, TEHLIKE_ISARETLERI
list, ozelPratikAralik() (private-practice overlay schedule, informational only, SB minimum stays
primary).

Explicitly NOT built, and why (full list is now in kadin-dogum.ts specialistReview, organized by
the reference doc's own A-J section letters so review is fast):
- Most of the new migration-023 fields have DB columns but no form UI yet (ran out of time, not
  hidden — every one is named in specialistReview)
- Erken gebelik (4-8hf) viability tracking, late-pregnancy fetal well-being tests (NST/BPP/Doppler)
- F. Obstetric emergency/decision algorithms (partograf, Bishop score, VTE risk score, HELLP/
  eclampsia, IUGR Doppler staging) — KASITLI: needs verified clinical algorithms, same Denver-II
  discipline, not attempted without a source
- G. Full separate gynecology suite (PCOS/infertility-IVF referral, urogynecology/POP-Q,
  gynecologic oncology triage, surgical templates, adolescent gyn, gebe okulu) — essentially
  untouched beyond KETEM/kontrasepsiyon/menopoz; likely needs its own "Jinekoloji Vizit" flow
- D. Real USG image/DICOM storage, e-Nabız/PACS integration — only measurement JSON is stored
- H. e-Doğum/e-Nabız/legal-document government system integration — no API access, not faked
- E. Gebelik aşı şeması (Td dose-sequence, Tdap window, flu-season reminder) as a real reminder
  engine — pediatri's Aşılar module has no pregnancy equivalent yet

Still open (chapter specialistReview):
- Fetal biyometri persentilleri (needs a chosen open reference: Hadlock / INTERGROWTH-21st / TR)
- Gebe İzlem Kartı + Obstetrik USG raporu + Doğum raporu printed templates (letterhead pattern)
- Lohusa izlem (SB protokolü), jinekoloji (KETEM HPV/smear takvimi, kontrasepsiyon, menopoz)
- Sağlığım portal "Gebeliğim" week-by-week view
- Ayşe gestational-week-aware SOAP/persona overlay (profile.promptNotlari exists, not wired)
- Wave 0 wiring still pending: hasta dosyası tabs / ölçüm order / epikriz unvan should read the
  registry (today's tab is still hardcoded + gated by patient sex/age)

## Architecture decision (Kaan 2026-09-14 gece): core/ vs specialties/*/{manifest,schema,protocols,ui,prompts,tests}

Direction accepted. Mapping from what exists today, so migration is a checklist not a guess:
- manifest.ts  = lib/specialties/<key>.ts (SpecialtyProfile) — already basically this shape.
- schema.ts + protocols/ = lib/clinical/<engine>.ts per specialty (buyumeEgrisi/mchatR/
  gelisimTaramasi for pediatri; gebelik/fetalBiyometri/lohusaVeJinekoloji/genetikTarama for
  kadin-dogum) — currently flat under lib/clinical/, needs splitting by specialty.
- ui/ = components/doktor/Hasta*.tsx (HastaBuyumeEgrileri, HastaMchat, HastaGelisimTaramasi,
  HastaGebelik) — free to move, plain imports, no URL constraint.
- prompts/ = personaEngine.ts specialty overlays + the inline system prompts in route.ts files
  (gebelik's genetik-tarama AI call, epikriz's system prompts) — currently the most tangled,
  needs care, not a fast move.
- API routes stay physically under app/api/** (Next.js app-router ties URL to file location);
  route files become thin imports from specialties/*/ once the logic moves there — route.ts
  itself never becomes the home of the logic.
- tests/ was the real gap — no persisted tests existed before tonight; verification was all
  throwaway scripts deleted after each check. FIXED for tonight's code: lib/clinical/mchatR.test.ts,
  fetalBiyometri.test.ts, gebelik.test.ts, genetikTarama.test.ts added and wired into the existing
  `npm test` script (tsx --test, node:test/node:assert — matches lib/clinical/yasamsalBulgular.test.ts
  convention). 53/53 pass including the 19 new ones.

Sequencing decision: did NOT mass-move tonight's live, just-shipped pediatri/KHD code into the
new folder shape — no test-suite-backed refactor of working production code at this hour, hours
before Dr. Gökhan's review. Instead: (1) tests are the one piece that's genuinely done and safe
to do immediately — done above; (2) the NEXT specialty (Dermatoloji, Wave 1) starts directly in
the new shape from a blank slate — zero migration risk since nothing exists yet to break;
(3) migrating pediatri/kadin-dogum's existing files into specialties/* is a deliberate, tracked,
one-file-at-a-time task for a future session, each move verified by the test suite above, not a
bulk rename.

## Waiting on the founder

| Since | Item | Why it matters |
|---|---|---|
| 2026-09-15 | **NOTYA-BELGE-06 — Supabase project region: confirm EU in the dashboard** before doctors send belge analyses at scale | The spec says Supabase EU; the vault + belge_analizleri hold de-id hashes and reports. One dashboard look. |
| 2026-09-15 | **NOTYA-BELGE-07 — license letters: Stanford (EchoNet-Dynamic weights) and VisionFM authors** — Claude drafts, Kaan sends | Both are ❌/⚠️ for commercial use; replies take weeks and cost nothing. Until then echo = describe-only, fundus = zero-shot. |
| 2026-09-15 | **NOTYA-BLE-03 — Dr. Gökhan: Samsung Android phone (Kaan 2026-09-15 — native Web Bluetooth, no extension needed); which Bluetooth device(s) he owns still unknown — live test scheduled 2026-09-16 (see CANLI OTURUM TO-DO)** | First real pairing decides the first row of docs/CIHAZ-UYUMLULUK.md — the list grows only from field-paired devices (standing rule). |
| 2026-09-15 | **NOTYA-BLE-04 — KVKK transfer position per vendor cloud** (Withings, Eko Connect, Kardia Pro) before any T4 adapter is written | Vendor clouds hold patient data outside TR; conversation first, adapter second. |
| 2026-09-15 | **Reinstall the Notya PWA on an Android phone after the BLE deploy** | The Web Share Target (Eko app → Paylaş → Notya) registers at install time; an already-installed PWA needs a reinstall once. |
| 2026-09-09 | **Medula e-reçete — ask Dr. Gökhan four things (his SCREEN is no longer needed — see Operator row): (1) how he writes e-reçete today — an MBYS/entegratör program, or paper; (2) does he have a Medula Doktor username/password; (3) does he hold an e-imza (NES) card, and on which PC; (4) his SGK tesis kodu** | Unblocks the zero-cost line: P1 "Medula'ya hazır reçete" (barkod/SGK ürün adı, doz+periyot kodları, kutu adedi from mg/kg, SUT checks — antibiyotik kısıtları / rapor gerektiren ilaç / yaş-doz limits — at reçete onay time, "📋 Medula için kopyala" like the HBYS bridge; ~1 session, public SGK reference data, no licence) and P2 "Medula Doldurucu" Chrome extension (autofills Medula Doktor's reçete form inside the doctor's own logged-in session; he reviews and presses e-imza; no credentials stored, no SGK approval, no server; ~1–2 sessions but cannot be built blind — needs his screen). P3 (Medula web service + e-imza signing component + Bakanlık MBYS/entegratör registration) stays gated behind paying doctors per the USS-P4 decision. Wording rule: P1/P2 are "Medula'ya hazırlama / form doldurma", never "Medula entegrasyonu" until P3. Decided 2026-09-09: game-changer shortlist kept = (a) Ayşe on the patient's side via WhatsApp (parked — Kaan wants no Twilio/Meta per-message cost; revisit only with a zero-cost channel), (b) Medula P1/P2 (this item), (c) Ayşe as resepsiyon (parked with (a), same channel). |
| 2026-08-25 | **Configure custom SMTP in Supabase (Resend / Postmark / SendGrid)** — dashboard setting + DNS records | **LAUNCH BLOCKER for the doctor section.** Signup currently uses Supabase's built-in mail sender, which is development-grade and rate-limited; QA hit `email rate limit exceeded` after a handful of attempts. On launch day the first few doctors register, then every later signup silently fails to receive its confirmation link — no confirmation, no login, no trial. No custom SMTP is configured anywhere (`SMTP_*`, `RESEND_*`, `SENDGRID_*` all absent) and the app does not send its own mail. Needs account credentials and domain DNS, so it is a founder action |
| 2026-08-25 | **Complete the signup end-to-end test** once SMTP is live | The flow genuinely stops at the confirmation e-mail, so register → confirm → login → 15-day trial → dashboard cannot be verified until the mail path works |
| 2026-08-26 | **Decide the sender domain** (notya.ai vs alternative) | Undecided as of 2026-08-26. Does NOT need to block SMTP: Resend verifies any owned domain, and the Supabase sender is one config field — a subdomain of an already-owned domain unblocks the E2E today and the brand domain can be swapped in later |
| 2026-08-27 | **Submit the two Pabau partner applications** (Claude drafts, founder submits under the Notya brand) | (1) Referral Partner Program — up to 20% recurring revenue up to 3 years per referred clinic; (2) App Marketplace listing — distribution into Pabau's 3,000+ practices. Until approval, product and landing say only "Pabau ile çalışır" with a trademark note |
| 2026-08-27 | **Merge PR #19 (NOTYA-AUTH-01)** | Auth convention (session refresh, one 401); deploys to production on merge. /klinik landing (#25) merged and live 2026-08-30 |
| 2026-08-28 | **Pabau E2E with a real key** | The connect flow validates against live Pabau before storing (verified: bad key → 401 Invalid API Token) but end-to-end needs a real clinic API key — a Pabau trial account or a pilot clinic's key, pasted at /dashboard/klinik/pabau |
| 2026-09-01 | **Randevu sistemi end-to-end test** | Live (PR #44): /dashboard/doktor/randevular, /dashboard/doktor/personel, secretary invite via /davet/personel/[token]. Not yet verified with a real secretary account or a real WhatsApp reminder send — code path and cron wiring confirmed, live send not. Invite a real sekreter, book a real randevu, confirm the reminder fires ~2-3h before |
| 2026-08-28 | **Klinik uzman voice E2E** | /asistan/klinik rides the existing ElevenLabs base agents with prompt/voice overrides (the same mechanism /asistan uses in production). Needs one real mic session per gender to confirm overrides land |

## Operator work

| Since | Item | Note |
|---|---|---|
| 2026-09-16 | **NOTYA-DAH-01 — İç hastalıkları V1 SHIPPED** | Header chips from approved labs; HT card with Uzlaşı 2025 classes/targets/buckets, confirmed-HT rule, combo class suggestion (doctor picks), dirençli HT detection from hasta_ilaclar → sevk; DM card (TEMD 2026 cadence, annual tasks, göz sevk, eGFR drug warnings, no insulin titration); lipid (doctor LDL target, statin-ALT trend, CK/TG warnings); tiroid mini; check-up template + interval + DXA; ilaç list reuse + eGFR<30 text warnings + polifarmasi; red-flag gate; sevk with last lab panel. Migration 033; 5 test groups; docs/README_DAHILIYE.md. |
| 2026-09-16 | **NOTYA-DAH-AUDIT — pre-wow specialty audit SHIPPED** | Same KD-style audit: depth pills, wow bars, HYP/Uzlaşı/TEMD matrix, private-clinic pain, 15 game changers. HTML `public/dahiliye-presprint-audit.html` → https://notya-ai.vercel.app/dahiliye-presprint-audit.html; docs/README_DAHILIYE_AUDIT.md; Araçlar link. Verdict: V1 cards real; breadth ~1/30 of KD — wow sprint before/alongside DAH-02. |
| 2026-09-16 | **NOTYA-DAH-02 — reçete yazımı → hasta_ilaclar auto-update on the muayene; SCORE2 only if a reviewed formula lands; first real dahiliye patient (KB → lab → raporla → Onayla)** — waits on Claude / Kaan | Backlog expanded by audit: check-up ledger, home-BP, DM closed loops, CKD, anemi, obezite/GLP-1, portal, prompts/, SGK rapor şablonları (see audit Sprint A/B/C). |
| 2026-09-16 | **NOTYA-DERM-02 — Dermatoloji eksik paket SHIPPED** | Audit: skorlar/fototerapi/yama/GOP already existed; built the gaps — ABCDE + resmi tanı + melanom acil rule, biyopsi/küçük cerrahi işlem paketi with onam + wound-care tasks + patoloji bound to the same lezyon, izotretinoin gate (approved βhCG + onam, monthly task, cross-task to kadın-doğum), biyolojik gate from approved labs (new canonical keys IGRA/HBsAg/AntiHBc/AntiHCV/HIV/PPD), pediatrik templates → bebek kartı, kozmetik tab off by default. Migration 032; docs/README_DERMATOLOJI.md. |
| 2026-09-16 | **NOTYA-DERM-03 — first real derm patient through the spine (dermoskopi foto → ABCDE → biyopsi → patoloji)** — waits on Kaan (a derm beta doctor) | — |
| 2026-09-16 | **NOTYA-JINE-04 / KD-05 — WOW SPRINT SHIPPED** | CYBH CDC-TR tedavi + NAAT/TOC/partner printable; full MEC + EC (LNG/UPA/Cu) + postpartum start; menoraji LNG-IUS→TXA→cerrahi ladder; 1-tap USG rapor+SUT; Anti-D closed loop; e-Doğum wizard; private package ledger; CS defense pack; ürojine+IOTA sevk; infertilite+ sevk paketi; şiddet+KOK yıllık (JINE-03); portal Pap/HPV/RİA reminders. Engines + UI tabs + API adımlar + migration 035 + tests. |
| 2026-09-16 | **NOTYA-JINE-02 — Jinekoloji V2 SHIPPED** (Berek / Speroff / TJOD goldens) | AUB PALM-COEIN with örnekleme rule (PMP, ≥45, risk <45) and Hb/ferritin from approved labs; PMP pathway gate (TVUS ET + örnekleme; sitoloji kapatmaz); KOK WHO-MEC gate (4 = block with logged ≥15-char override, 3 = caution, alternatives); endometriozis card (no staging; sevk → görevler); tekrarlayan kayıp (APS/kavite/TSH rutin, trombofili önerilmez); erken gebelik kaybı with definitive TVUS criteria + β-hCG trend + Rh anti-D task, bound to active gebelik <20 hf; ref_code dipnotlar behind the clinician "Kaynak" toggle. Migration 031; 6 tests; docs/README_JINEKOLOJI_V2.md. |
| 2026-09-16 | **NOTYA-JINE-03 — şiddet tarama + endometriyal örnekleme→Belgeler + KOK yıllık TA/kilo — SHIPPED inside JINE-04** | Siddet checkbox + sevk görevleri; kok_yillik API; örnekleme bridge remains via aub_guncelle + Belgeler flow. |
| 2026-09-16 | **NOTYA-JINE-01 — Jinekoloji spine SHIPPED** (KD spec part H, beyond minimal) | Due engine (SB + ofis), HSGM serviks action tree with doctor-locked plan + kolposkopi görevi, CYBH ön tanı + partner rule + first-ulcer HIV/RPR list + HSV pregnancy hooks, PCOS Rotterdam/TJOD 2023 counter, RİA schedule gated on STI screening, HRT pre-check that refuses start on hard contraindication, lezyon notes, infertilite step 1, kırmızı bayraklar → görevler. Renders for every female patient (mounted in HastaGebelik). Migration 030; 7 tests. |
| 2026-09-16 | **NOTYA-KD-02 — Kadın-doğum obstetrics spine SHIPPED** (audit fix on Kaan's "eksik paket" spec) | Task engine with exact week windows + hard reminders + miss alternatives; 13 TJOD-style onam templates (printable, snapshot at signing, tüp ligasyonu box); travay partograf with WHO alert/action logic; fetal distres note; C/S decision timestamp + SB endikasyon list (doctor selects); C/S preop/intraop/postop/SSVD; preterm card (steroid/MgSO4/PPROM rules, no orders); PPH classifier → acil; anne/bebek complications; lohusa 3 visits; taburcu gate (NTP-1/HepB-1/VitK/işitme or documented exception); live birth → bebek kartı + bebek patient record with pediatri tasks (ROP/YDYBÜ/üroloji rules). Migration 029; 9 tests; docs/README_KADIN_DOGUM.md. |
| 2026-09-16 | **NOTYA-KD-03 — anestezi cross-view of C/S preop + anestezi tipi; genel cerrahi reuse of PPH shell; e-imza on onam** — waits on Claude (after KD field test) | Data is in place; visibility rules and e-imza are the next slice. |
| 2026-09-16 | **NOTYA-KD-04 — first real gebe through the spine with a KD doctor (görevler → onam → partograf → doğum → taburcu → bebek)** — waits on Kaan (a KD beta doctor) | The pediatric beta (Dr. Gökhan) only exercises the bebek side. |
| 2026-09-16 | **NOTYA-LAB-01 — Belgeler LAB + TREND SHIPPED** (overnight, Kaan's spec improved) | Two-pass extraction (structural + Claude vision) reconciled cell by cell; 80+ canonical keys with TR/EN aliases, LOINC, unit conversion in code; flags from printed refs only; Δ/trend arithmetic + templated Turkish trend sentence; criticals by rule → "Hekim şimdi baksın"; identity guard; per-doctor "bunu ALT say" aliases; persona writer with 30-branş emphasis + validator (≤3 tanılar, caps 70/85, dose stripped from reçete ipucu); Onayla → last note Objektif with locked [Lab] block; approved rows become priors. Migration 028 applied; 10 tests; docs/README_LAB.md. |
| 2026-09-16 | **NOTYA-LAB-02 — "Lab değerlendirme" muayene auto-create** | SHIPPED: when the patient has no note, Onayla creates a completed `kontrol` session + empty SOAP note ("Lab değerlendirme (belge).") and attaches the [Lab] block to it. Same path for image/sound belgeler ("Belge değerlendirme"). |
| 2026-09-16 | **NOTYA-LAB-03 — Belgeler list: Lab filter + summary card** | SHIPPED: `GET /api/doktor/belgeler/lab?patientId=` returns per-document summaries; vault list shows "N parametre · x yüksek · y düşük · z kritik" + up to 3 chips (e.g. ALT ↑) and a Tümü / Lab filter. |
| 2026-09-16 | **NOTYA-LAB-04 — specialty computed lines** | SHIPPED: `ozelHesaplar()` — Kre slope (mg/dL/ay, ≥2 priors; nefroloji/dahiliye/üroloji/onkoloji/aile), Δ HbA1c in points (endokrin/aile/dahiliye/göz), serial troponin with direction (kardiyoloji/acil), Δ Hb/Plt/Neu (hematoloji/onkoloji). Injected into the writer as "BRANŞ HESAPLARI (aynen işle)" and shown as `Hesap:` bulgular. Tested. |
| 2026-09-16 | **NOTYA-LAB-05 — first real lab PDF from Dr. Gökhan (pediatric hemogram/CRP) through the pipeline; record extraction accuracy in docs/MOTOR-UYUMLULUK.md** — waits on Kaan (a real report) | Smoke test passes on a synthetic digital PDF; scanned/photo reports are vision-only until tested. |
| 2026-09-15 | **NOTYA-BELGE-09 — own golden-set evaluation for txrv-densenet121** (CheXpert val or PadChest subset; per-code AUROC into motor_kayit.dogrulama_auroc) — waits on Claude; needs the dataset download (CheXpert requires registration by Kaan) | Registry currently cites the published AUROCs; the release-gate rule wants ours. |
| 2026-09-15 | **NOTYA-BELGE-01 — Notya Belgeler multi-engine medical AI, step 0+1 SHIPPED** (core/, all 30 branşlar) | Tier A live: "Asistana raporla" on every vault document → client de-id (EXIF strip/downscale; audio → spectrogram + quality metrics) + KVKK checkbox → Claude vision persona writer (Ayşe/Mehmet/Elif/genel) → ontology (~110 bulgu_kodu) → fusion + cap table enforced in code (95/85/70/60 pediatric/55 serbest/0 kalite düşük) + acil by rule → belge_analizleri; doctor edits özet, locks resmi tanı, Onayla → notes.content_objektif (+ not_duzenlemeleri + muayene_revizyonlar), Plan → Muayeneyi onayla (locked). Migration 025 applied; motor_kayit seeded (claude-vision active, 7 Tier B rows inactive). 17 fusion/router tests. Docs: docs/BELGELER-MOTOR-MIMARISI.md, docs/README_BELGELER.md. No GPU host (Kaan). |
| 2026-09-15 | **NOTYA-BELGE-02 — Tier B engine modules** | SHIPPED 2026-09-15: **txrv-densenet121** (TorchXRayVision CXR, Apache-2.0) exported to ONNX (parity 0.0 vs stock forward), hosted on Supabase Storage `motorlar/`, runs in the browser via self-hosted onnxruntime-web (WebGPU/WASM), 18 labels mapped to the ontology, registry active (own CheXpert-val eval still pending → NOTYA-BELGE-09). STILL OPEN (each needs a gated download or training, not a code change): hear-icbhi / hear-circor (HeAR is HAI-DEF gated on HF — Kaan accepts terms once; probes trained on ICBHI/CirCor), ptbxl-inception1d (weights from the benchmarking repo), grazpedwri-yolo + fracatlas-yolo (train own heads), rsna-boneage. |
| 2026-09-15 | **NOTYA-BELGE-03 — automatic de-id: OCR redaction of burned-in text (Tesseract.js) + face blur (MediaPipe) for dış göz / yüz derm** — waits on Claude | V1 = doctor checkbox "görüntüde kimlik yok"; automation removes the human step. |
| 2026-09-15 | **NOTYA-BELGE-04 — DICOM single-slice import** | SHIPPED 2026-09-15: `core/belgeler/dicom.ts` (dicom-parser in the browser; uncompressed CR/DX/CT/MR/US; window/level from tags or percentiles; MONOCHROME1 inverted; RGB first frame; tags never leave the device). Compressed transfer syntaxes refused with a clear message. |
| 2026-09-15 | **NOTYA-BELGE-05 + NOTYA-BLE-06 — Ayşe/SOAP awareness** | SHIPPED 2026-09-15: `lib/doktor/hastaDosyaDerleyici.ts` adds "## CİHAZ VE BELGE DEĞERLENDİRMELERİ" (approved cihaz_olcumleri + approved belge_analizleri) before Vizit Geçmişi, so every SOAP/konsült prompt sees device readings and approved reports. Beta checklist item still waits on Dr. Gökhan's first real report (NOTYA-BELGE-07/BLE-07). |
| 2026-09-15 | **NOTYA-BELGE-08 — docs/MOTOR-UYUMLULUK.md field rule** (standing): an engine is "sahada test edildi" only after a real doctor reviewed ≥20 drafts and belge_revizyonlar was read | Same discipline as CIHAZ-UYUMLULUK. |
| 2026-09-15 | **NOTYA-BLE-01/02 — Cihaz Köprüsü shipped** (universal Bluetooth device capability, core/, all branşlar) | Built: core/bluetooth (6 standard GATT medical profiles, IEEE 11073 decoders, 20 tests), migration 024 (cihaz_olcumleri, doktor_cihazlar, cihaz_uyumsuzluk_raporlari — applied live), /api/doktor/cihaz-olcum (+/dosya → vault 'cihaz-kaydi'), 📶 Cihazdan al + 🎧 Cihazdan gelen dosya in İnceleme vitaller and the note page, PWA share_target + sw.js v4 + /cihaz/paylas, audio in DocumentViewer. Architecture: docs/CIHAZ-KOPRUSU-MIMARI.md. Decisions locked by Kaan: iOSWebBLE + Bluefy for iPhone, confirm card always, PWA. |
| 2026-09-15 | **NOTYA-BLE-05 — docs/CIHAZ-UYUMLULUK.md is field-only** (standing rule) | Never mark a device compatible from a spec sheet; failed pairings log to cihaz_uyumsuzluk_raporlari and move to the list as *uyumsuz*. |
| 2026-09-15 | **NOTYA-BLE-06 — Ayşe awareness of device-sourced vitals/files** (open, waits on Claude after first field pairing) | Flag `(cihazdan: <cihaz>)` on vitals and "steteskop kaydı mevcut" in the SOAP/konsült context. No audio interpretation — by design. |
| 2026-09-15 | **NOTYA-BLE-07 — beta checklist v8 item 13 "📶 Cihazdan ateş al"** (waits on NOTYA-BLE-03) | Added once we know which device Dr. Gökhan will test with. |
| 2026-09-10 | **Day-2 fix sweep from Gökhan's/Kaan's live use (PRs #152–#184) — all branş-agnostic unless noted** | Shipped: randevu saat 15-dk select; dashboard Hocam/bugünkü muayene/son notlar adı/landing copy; mobile menu redesign; + Randevu ekle left on phone; hatırlatma via doctor's own WhatsApp (wa.me); randevu edit e-posta optional+saved; intake rules (e-posta zorunlu, all mandatory except conditional explanations, sigorta order, alerji vertical, baş çevresi optional, date ≤ today, branş default = doctor's, Şehir field, TR labels + dd.mm.yyyy + two-column review); intake → hasta kaydı aktarım; kronik_hastaliklar array crash fix; cinsiyet TR everywhere; markdown renderer for all model text; seans branş lock via refreshed token (30 branş, canonical keys); ALL 34 server Supabase clients no-store (stale İnceleme queue); İnceleme shows patient name; every note field editable in İnceleme (başvuru, vitaller, evde dikkat, veli özeti) + Ayşe edits land in them (key normalization, embedded-JSON parse); hekim adı in veli özeti; reçete: draft drugs for unapproved note, full_name fallback, editable letterhead (satirlar/diploma/logo, migration 017), A5 standard, footer removed; note detail page (Muayene Geçmişi → tam not → yeniden onay); print attestation removed, Diploma No under signature; ilaç sıklık list. Branş: only intake pediatri overrides and pediatri-specific SUT age rules are pediatri-only; Medula SGK branş kodu mapped for 5 kılavuz-verified branşlar, others null (doctor selects in Medula). Beta checklist v3 (docs/beta, ~/Downloads). Open, Claude: (a) remaining 25 SGK branş kodları from Tablo 9; (b) Diploma No + adres fields also in Ayarlar profile (today only via reçete letterhead editor); (c) rule for new API routes: use `servisSupabase()` or the no-store client pattern — never a bare `createClient`. |
| 2026-09-09 | **Reçete — both routes served now (Kaan: "handle paper AND MBYS doctors")** | `/dashboard/doktor/notlar/[id]/recete`: print-ready A5 Turkish reçete (hekim başlığı, hasta/yaş, tarih, tanı ICD-10, Rp. lines with S: talimat + kutu, kaşe/imza + Diploma No blank) for paper doctors; same page offers "MBYS / Medula için kopyala" and "⬇ e-Reçete XML" (erecete.s1.xsd) for MBYS doctors; Ayşe's SUT/age warnings shown on screen, not printed. Linked from the note print page. (a) DONE 2026-09-10 PRs #176–#181 (users.recete_baslik letterhead + Diploma No); (b) kutu adedi editable on screen (PR #149), true kutu içeriği still waits on the SGK ilaç listesi (barkod work) — open, Claude; (c) DONE 2026-09-16 (renkli reçete: `lib/doktor/receteRengi.ts` classifies by etken madde — kırmızı = uyuşturucu, yeşil = psikotrop incl. tramadol/pregabalin/modafinil; the reçete page prints controlled drugs on their own KIRMIZI/YEŞİL sheet with an RRS note and keeps them off the normal reçete; uncertain substances (kodein, tapentadol, ketamin, gabapentin, psödoefedrin) only raise a "reçete türünü doğrulayın" screen note — list grows from TİTCK duyuruları, never from brand names); (d) DONE 2026-09-09 PR #149 (recete-yolu hafıza fact); still open: ask each doctor at onboarding "reçeteyi nasıl yazıyorsunuz: kâğıt / MBYS / Medula" and store it as a `uygulama` hafiza fact so the preferred button is highlighted and Ayşe's opener can say "3 reçete yazdırılmayı bekliyor". |
| 2026-09-09 | **Medula P1 — SHIPPED; P2 VOID (researched); P3 is the real path** | Research in `docs/MEDULA-KILAVUZ.md`. Kaan asked why Gökhan's screen was needed — checked SGK's own portal: Medula Doktor Uygulaması is for taking the hekim password, viewing past reçete/rapor and adding to returned ones; it is NOT a reçete-writing form, so a form-filling extension has nothing to fill. The login page links a "Yeni Medula Hekim uygulaması" (medeczane.sgk.gov.tr/hekim/) that returns a server error today — watch it. Live: "📋 Medula için kopyala" + Ayşe SUT/age/duration warnings; `GET /api/doktor/medula/recete`. Proven on SGK's public test env: `ereceteSorgula` returns a business-rule answer (auth + envelope + WSSE + field order OK). Open, Claude: (a) `ereceteGiris` 9999 "XML yapısı bozuk" — diff against SGK `ornek_erecete.xml`, retry with a real barkod; (b) barkod mapping via `aktifIlacListesiSorgula` (needs a tesis kimliği, 17:00–08:00); (c) P3-b local signer agent (open-source XAdES-BES, zero licence) — design in the doc; (d) Tablo 9 code tables unverified. **Waits on Kaan/Gökhan:** how he writes e-reçete today (MBYS or paper), Medula Doktor credentials, NES card + which PC, tesis kodu. Rule: no "Medula entegrasyonu" claim until P3 live. |
| 2026-09-09 | **Mobile pass for GÜN-01/02 — DONE at 390px** | Verified in a real 390px Chrome window: dashboard header line, vertical program list (badges wrap, no overflow), yazılı sohbet opener bubble. Found + fixed on the way (PR #143): Next 14 patched `fetch` served a stale PostgREST response to `/api/doktor/gun-programi` (first empty call got cached); `servisSupabase()` now forces `cache: 'no-store'` on every Supabase request — global, protects all pratik routes. Open, Claude: (a) pre-existing clip on `/asistan` at 390px — the "Pediatri Uzmanı" subtitle under the avatar is covered by the fixed mic panel; (b) 360px (Galaxy) not screen-captured — layout has no fixed widths >360, but a real Samsung pass on Gökhan's phone is the only proof. |
| 2026-09-09 | **Günün Programı (NOTYA-GUN-02) — SHIPPED** | Dashboard "Bugün" = kim/kaçta/neden list with Ayşe briefing per randevu. Open follow-ups, Claude: (a) ICD descriptions in `notes.icd10_codes` are English ("Acute suppurative otitis media") — the briefing shows them as-is; add a TR description lookup from the ICD catalog at note generation so the briefing (and PDF) read Turkish; (b) same list inside `/dashboard/doktor/randevular` day view (today only dashboard); (c) tap-to-expand row showing full son vizit plan without leaving the dashboard. |
| 2026-09-09 | **Günün Başı / Günün Sonu (NOTYA-GUN-01) — SHIPPED** | Ayşe opens and closes the day on dashboard, yazılı sohbet and sesli seans. Open follow-ups, Claude: (a) named follow-ups in the opener ("Ali'nin idrar kültürü geldi") once lab results have a structured landing place — today only counts (yeni belge) are safe to state; (b) optional evening WhatsApp "günün sonu" via the existing cron once Gökhan says he wants it (opt-in, not default — companion, not spam); (c) sekreter-facing variant ("bugün doktorun 14 randevusu var") when personel accounts are in daily use. **Waits on Kaan:** whether the dashboard opener should also render for the klinik vertical once klinik = doktor mirroring is decided. |
| 2026-09-09 | **Meslektaş hafızası (NOTYA-OGRENME-03) — SHIPPED** | Unified memory layer (`lib/doktor/hafiza.ts`, migration 016 applied live). Open follow-ups, Claude: (a) a small "Ayşe hakkımda ne biliyor" panel on the doktor settings page (`GET/POST /api/doktor/hafiza` already exist — transparency + KVKK-friendly forget); (b) feed `asistan_actions.was_corrected` (chat-side drug corrections) into `hafizaKaydet(kategori klinik, kaynak duzeltme)` so chat corrections count toward the 2-evidence rule like note edits do; (c) wire `hafizaBloguSohbet` into the mali/avukat chat routes once those verticals have real users (same module, one import). **Waits on Kaan:** seans = working day (current) vs each muayene — one-line change in `seansIsle` if he wants the latter. |
| 2026-09-01 | **Restore a working typecheck** — DONE (PR #42) | Dropped `baseUrl` + `ignoreDeprecations` from tsconfig; `moduleResolution: bundler` with `paths` doesn't need `baseUrl` on TS 6, and dropping it removes the TS5101 abort. Re-run is clean, 0 errors — the 66 predicted here were fixed incidentally by PRs #38–#41 in the interim. `next.config.mjs` already has `ignoreBuildErrors: false` |
| 2026-08-25 | **Workflow verification (QA item 5)** | Not started: doctor workflows end-to-end — hasta ekle, belge yükleme, reçete, rapor, SGK |
| 2026-08-25 | **True 390px visual verification** | Chrome's resize_window moves the window but not the viewport, so mobile layout was proved from the code rather than seen. NOTYA-MOBILE-01 fixed the grids; a real device pass is still worth doing |
| 2026-08-25 | **Tailwind conversion for /doktor** | The page is built from ~102 inline style objects, which is why it could not hold a media query. The CSS-block fix is correct but the section is worth converting properly when the launch is not imminent |
| 2026-08-25 | **Only 8 media queries in the whole app** | /doktor is fixed. Other surfaces (mali, avukat, dashboard sub-pages) have not been audited for mobile |
| 2026-08-25 | **Auth guard convention fix** | The NOTYA-ILAC-04 session-key bug came from a route ignoring a pattern the app already had. One convention, applied to every doktor route, folded into whichever PR next touches them |
| 2026-08-26 | **`ruhsatAskida` not surfaced in the UI** — DONE (PR #42) | Flagged per-pack in the search dropdown, sunum select, and a warning banner in HastaIlaclar + shared IlacSecici. Brand badge only fires when every pack of the brand is suspended (6 brands are partial: CLIACIL, ILARIS, KARVEA DUO, MINOSET, RIVOTRIL, +1) |
| 2026-08-26 | **214 SGK barcodes with no TİTCK match** | 2.5% of records have no etken madde (no barcode match, no unambiguous eşdeğer grubu). Mostly allergen extracts and serums. Searchable by name; left blank rather than guessed. Re-check after the next TİTCK weekly list |
| 2026-08-26 | **TİTCK / SGK refresh cadence** | Both lists change weekly. `scripts/import-sgk-ilac.mjs` then `scripts/import-titck-etken.mjs` — no schedule exists yet. A stale list means a withdrawn drug still shows as reimbursed |
| 2026-09-01 | **tsconfig `baseUrl` deprecation (TS5101)** — DONE (PR #42) | `baseUrl` dropped, `paths` alone is enough under `moduleResolution: bundler` |
| 2026-09-01 | **Çalışma saatleri (working hours) settings UI** | Backend is live (`doktor_calisma_saatleri` table + GET/PATCH `/api/doktor/calisma-saatleri`, defaults to 09:00–18:00 weekdays) but there is no settings page to edit it, and randevu booking does not yet block times outside working hours or auto-suggest free slots from it. Worth building once the day-view calendar has real usage to learn from |
| 2026-09-01 | **Randevu haftalık/aylık görünüm** — DONE (PR #44–#60) | Month grid + day view live; agenda/list views and drag-to-reschedule added 2026-09-02 |
| 2026-09-02 | **Karşılama e-postası + hasta formu — Onayla anında** | The moment the doctor clicks Onayla: friendly welcome email + intake form link go out automatically. Intake link generation and the `kanal` (whatsapp/eposta) parameter already exist; only the mail transport is missing. **Waits on Kaan: domain decision.** Once the domain is picked: DNS (SPF/DKIM) → SMTP → email branch wired into the Onayla hook — Claude builds it same day |
| 2026-09-02 | **Klinik meslektas v2 kalemleri** | (a) Sesli asistan (ElevenLabs Ayse) icin dosya erisimi — konsult su an metin sohbet (Ayse'ye Danis sekmesi); ses entegrasyonu ayri is. (b) Konsult icinde rontgen/EKG gorselini inline acma (v1 kayit listesi + Goruntuleme sekmesine yonlendirme). (c) Eski hastalara e-posta backfill (yeni kayitlarda zorunlu; eskilerde bos). (d) Cron hatirlatmalarin TRT denetimi. (e) Randevu API'sinde e-posta sunucu tarafi zorunlulugu (su an istemci zorunlu kiliyor; sekreter/asistan cagrilari icin sunucu dogrulamasi eklenmeli). Claude yapar |
| 2026-09-02 | **Sadelik O6 — Araclar emekliligi (v2)** | Asistanin karsiladigi araclar kullanim verisiyle tek tek kaldirilacak: ilac-interaksiyon (Ayse dosyadan proaktif uyariyor), hatirlatma (cron+randevu akisi), hasta-portali (intake linkleri). Kullanim birikince Claude yapar |
| 2026-09-02 | **SOAP ogrenme v2 + not PDF** | (a) not_duzenlemeleri farklarini periyodik damitip doktor stil profiline cevir ve prompta ekle (v1 few-shot bugun aktif). (b) Onayli notun PDF/yazdir cikti. (c) Inceleme Reddet butonuna gercek yeniden-uretim akisi. Claude yapar |
| 2026-09-02 | **SOAP-03 kapanan kalemler** | Ses dosyasi yukle->SOAP (ElevenLabs Scribe, ham ses silinir), plan surekliligi (onceki vizit plani degerlendirilir), Yazdir/PDF sayfasi (attestasyon + duzenleme sayisi + imza alani). Kalan: ekranda satir-satir versiyon gecmisi UI (log tabloda birikiyor); ambient diarized kayit v2. Claude yapar |
| 2026-09-03 | **Sesli-Ayse (ElevenLabs) dosya bilinci + kademe zorlamasi** | (a) ElevenLabs ajanina webhook tool eklenip dosya sorgulari sunucudan cevaplanacak (endpoint + kisa omurlu token mimarisi hazir degil; ajan konfigurasyon oturumu gerekli - Kaan ile birlikte). (b) Abonelik lansmaninda kademe zorlamasi: temel=yazili sohbet, orta/pro=sesli 1:1 + seans limitleri (ai_kullanim tablosu altyapi olarak hazir). Claude yapar |
| 2026-09-03 | **Klinik = Doktor aynalama karari** | Klinik vertikali bugun hasta/seans/not altyapisindan yoksun (Pabau + 10 sesli persona). Onerilen mimari: klinik hekimlerine doktor-vertikal hesabi acip klinige baglamak (personel modeli genisletmesi) - boylece SOAP motoru, Inceleme, dosya, ogrenme AYNEN gecerli olur; ayri kod tabani kopyalanmaz. Kaan karari bekliyor; karar sonrasi 1-2 odakli oturum. |
| 2026-09-04 | **Resend + sender domain for Sağlığım patient mail** | Code is live (`lib/mail/resend.ts`, notify on practice reply). Needs `RESEND_API_KEY` + verified `RESEND_FROM_EMAIL` on Vercel **after domain is fixed**. Without it, patient e-mail notifies silently skip. |
| 2026-09-04 | **Sağlığım SMS/e-posta OTP (stronger access gate)** | 6-digit doctor PIN shipped. OTP each session (Epic-like) waits on domain + Resend/SMS. Build after domain is fixed. |

## CANLI OTURUM TO-DO (Dr. Gökhan) — 2026-09-03 itibarıyla açık defter
Kural: canlı oturum sırasında gözlemlenen HER şey (hata, sürtünme, istek, fikir) anında buraya işlenir; oturum sonrası önceliklendirilir. Çözülen kalemin durumuna [x] konur.

| Zaman (TRT) | Gözlem | Tür | Durum |
|---|---|---|---|
| 2026-09-03 14:15–14:28 | Seansı Bitir 2x500+504 — maxDuration + toleranslı parse ile çözüldü (PR #89) | hata | [x] |
| 2026-09-03 ~15:00 | e-Reçete "Sunucu hatası" — Groq ölü anahtar; Anthropic geçişi (PR #90, #91) | hata | [x] |
| 2026-09-03 15:39–15:48 | Dr. Gökhan 3 referans linki gönderdi: notlar Türk anamnez geleneğinde yazılmalı (şikayet→hikaye→özgeçmiş→soygeçmiş→alışkanlıklar; FM→lab→tanı→tedavi akışı). Motor kuralları revize edildi (PR #95). 3. link bozuk/eksik — yeniden istenecek | istek | [x] |
| 2026-09-03 ~16:10 | 3. link içeriği Kaan üzerinden geldi: FM sistematiği (genel durum + İns/Palp/Perk/Osk, batında İns→Osk→Perk→Palp, sistem terminolojisi). Objektif kuralı sistematik düzene genişletildi (PR #96) | istek | [x] |
| 2026-09-05 | **FHIR Gateway P2-P4 (hastane eklentisi devami)** | P2: PDF DocumentReference + kurum yonetim ekrani + Vercel cron kaydi. P3: ilk gercek hastane onboarding (MRN esleme, OAuth, onlarin test ortami). P4: muayenehane katmani icin dogrudan Saglik.Net/USS gonderimi (ayri ray, sertifikasyon isi). P1 TAMAM: mapper + kuyruk + HAPI kaniti (PR #107). Claude yapar |
| 2026-09-05 | HBYS satici hedef sirasi (Kaan zorluk tablosu) | P3 kanal sirasi: 1) Sisoft + Probel (olgun API/HL7), 2) Fonet (ortaklik API), 3) Enlil (interface engine), 4) Talya/Kardelen/Meddata (musteriye ozel). SB HBYS.API spesifikasyonu ilk onboardingde cekilecek. Ilk mektuplar odeyen doktorlarla | K+C |
| 2026-09-06 | QA BOT PASS #1 (test hesabi qa.test@notya.ai, sentetik hasta) | SONUC: cekirdek dongu UCTAN UCA YESIL - giris, hasta olustur, yazili seans, not uretimi (guven %95, anamnez duzeni tam, vitaller dogru, mg/kg hesap dogru, ayirici tani + kritik bulgular paneli), Incele+Onayla. BULGULAR: (1) /login 404 - kucuk, /giris gercek yol; (2) DUZELTILDI PR #114: manuel hasta ekleme bloklu idi (formda olmayan eposta alani + TC zorunlulugu adim-1de ateslenmis); (3) eposta dogrulamasi adim-1de adim-3 alanina bakiyordu - kok neden sira hatasi. ACIK KARAR (Kaan): veli e-postasi zorunlu mu opsiyonel mi kalsin (su an opsiyonel) | C yapti |
| 2026-09-06 | QA BOT PASS #2 (derin ozellikler) | DUZELTILDI: #1 /login->/giris 308 (PR 116); #4 Muayene Gecmisi HER hastada bostu - sessions sorgusu notes(...) gomme yerine kolon saniyordu, catch sessizce yutuyordu (PR 117); #5 FHIR worker notes.status kolonu yok, approved_at olmali (PR 117). DOGRULANDI YESIL: dosya zaman cizelgesi notu gosteriyor + Yazdir/PDF; yazdir sayfasi HBYS koprusu iki dugme (kopyala->Kopyalandi, HTML indir) calisiyor; Ayse chart-aware konsult MUKEMMEL - yazdigimiz notu okuyup tani+ICD+antibiyotik+doz+takip dogru getirdi. ACIK: sesli Ayse dosya bilinci (bilinen sinir), kota/tier davranisi test edilmedi (yeni hesap limitsiz)
| 2026-09-06 | QA BOT PASS #3 (yuksek-riskli yuzeyler) | UCU DE YESIL, sifir bug. (1) RECETE/ETKILESIM: varfarin kronik ilac kayitli hastada 2. vizitte antibiyotik onerisi - motor TMP-SMX+varfarin ciddi etkilesimini (CYP2C9, K vit, kanama YUKSEK) gercek farmakoloji ile yakaladi, amoksisilin-klavulanati daha guvenli secenek onerdi, ibuprofen+varfarin GI kanama icin parasetamol onerdi, INR takibi sart dedi - jenerik kutu degil, gercek ikili-ilac muhakemesi. (2) PLAN SUREKLILIGI: 2. vizit notu onceki vizit planina + kronik ilaca (Coumadin) atif yapti. (3) BELGE YUKLEME: type-to-search hasta secimi, dosya ekle, X Kaldir kontrolu, Kasaya yukle->Kasa(0->1), arsivde Lab Sonucu etiketiyle + inline onizleme + Indir/Kapat. Uctan uca calisiyor | C |
| 2026-09-16 (planlı oturum) | **📶 CİHAZ KÖPRÜSÜ CANLI TEST — Dr. Gökhan, Samsung Android telefon** (Kaan 2026-09-15: cihazı Samsung Android; yarınki oturumda test edilecek). Adımlar: (1) Chrome veya Samsung Internet ile notya-ai.vercel.app'i "Ana ekrana ekle" ile PWA olarak (yeniden) kur — Paylaş hedefi kurulumda kayıt olur. (2) İnceleme → Yaşamsal Bulgular → 📶 Cihazdan al: hangi Bluetooth cihazı var (termometre marka/model? steteskop?) — seçicide görünüyorsa eşleştir, ölçümü cihazda yap, onay kartında değeri gör, Nota ekle, notu onayla; görünmüyorsa "uyumsuz (özel protokol)" olarak docs/CIHAZ-UYUMLULUK.md'ye ilk satır. (3) 🎧 Cihazdan gelen dosya: telefondan bir ses/PDF dosyası yükle, Belgeler sekmesinde çal/aç. (4) Varsa Eko/başka cihaz uygulaması → Paylaş → Notya → /cihaz/paylas akışı. (5) Her başarısız eşleşme cihaz_uyumsuzluk_raporlari tablosuna düşer — oturum sonrası oku. | test | [ ] |
| 2026-09-16 (planlı oturum) | Cihaz testi sonucu → NOTYA-BLE-03 kapanır (ilk saha cihazı), NOTYA-BLE-07 beta checklist v8 madde 13 "📶 Cihazdan ateş al" yazılır, NOTYA-BLE-06 (Ayşe cihaz farkındalığı) başlar. | takip | [ ] |

## Renkli Reçete Sistemi (RRS) — 2026-09-16

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-16 | **NOTYA-RRS-01 — RRS iş akışı, entegrasyonsuz P1** (Kaan: "fully build as part of e-reçete aracı"): migration 037 `rrs_receteler` (note+renk başına 1 kayıt; bekliyor → duzenlendi); `lib/doktor/rrs.ts` (RRS alan sırasında kopyalanabilir metin, TC bilerek yok, adımlar, adres); `/api/doktor/rrs` GET/POST/PATCH (pratikOturum, hasta doktora ait mi kontrolü, satırlarda TC reddi); reçete sayfasında renkli sayfaya `RrsPaneli` (kopyala → RRS'yi aç → numara → kaydet; kâğıtta yalnız "RRS Reçete No"); e-reçete aracına `RrsBekleyenler` kartı (bekleyen RRS kayıtları + elle girilen ilaçta kontrole tabi uyarısı). Onaysız notta kayıt açılmaz. | SHIPPED |
| 2026-09-16 | **NOTYA-RRS-02 — takip kalemleri** (waits on Claude, after Dr. Gökhan's first yeşil reçete): (a) hafıza sorusu "RRS'yi siz mi, sekreteriniz mi düzenliyor" (`rrs-yolu` uygulama fact) ve sekreter rolüne yönlendirme; (b) RRS kayıtlarının hasta dosyası ilaç satırında ve Ayşe dosya bağlamında görünmesi ("RRS'de düzenlendi, no …"); (c) kırmızı reçete miktar/süre sınırları ekranda (RRS zaten uyguluyor — yalnız ön uyarı); (d) RRS web servisi entegrasyonu = P4 rayı (SBSGM MBYS kaydı), ödeyen doktor sonrası. | OPEN |

## e-Reçete — kimlik bir kez, gönderim Notya'dan (2026-09-16)

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-16 | **NOTYA-ERECETE-01 — Ayarlar › e-Reçete + SGK kimlik doğrulama** (Kaan: "must have for all specialties; test with Dr. Gökhan or the other beta tester"): migration 038 `users.erecete_ayar` JSONB (TC + hekim şifresi encryptPII, tesis kodu, SGK branş kodu, ortam, e-imza yöntemi, son test); `lib/medula/ayar.ts` (+tests); `/api/doktor/erecete-ayar` GET (maskeli) / PUT / POST test = gerçek ortamda salt-okunur `ereceteSorgula('0')` ile kimlik doğrulama (kayıt açmaz, imza istemez); page `/dashboard/doktor/ayarlar/erecete` (nereden alınır rehberi dahil); reçete sayfasında `EReceteDurum` şeridi ("Medula'ya gönder" imza aracı gelene kadar pasif); BRANS_SGK `lib/medula/brans.ts`'e taşındı, Medula taslağı ayardaki branş kodunu önceler. Research findings: SGK web servisi = TC + Kurumsal Hekim Şifresi (Basic/WS-Security, her istekte), tesis kodu, 2016'dan beri imzasız kayıt yok, PIN işlem bazlı; **RRS renklirecete.saglik.gov.tr → SB Reçetem (recetem.enabiz.gov.tr)** — renkli + beyaz, hekim girişi yalnız e-imza, Doktor Bilgi Bankası kontrolü; entegre MBYS'ler için token ile imzasız yönlendirme var ama vendor kimliği KTS/SBSGM kaydı ister (P4). Reçetem linkleri/metinleri güncellendi. | SHIPPED |
| 2026-09-16 | **NOTYA-ERECETE-02 — Notya İmzacı (e-imza aracı) + canlı gönderim** — waits on Kaan/beta doctor: (1) e-imza var mı (kart/USB token hangi PC, ya da mobil imza), (2) tesis kodu, (3) hekim şifresi → Ayarlar'a girilir, "Bağlantıyı test et" ✅ olunca: XAdES-BES yerel imza aracı (açık kaynak kütüphane, lisans yok; PIN her reçetede), `imzaliEreceteGiris` ile canlı kayıt, e-reçete no nota + yazdırmaya. Mobil imza yolu operatör sözleşmesi ister (maliyet) — token öncelikli. | OPEN |
| 2026-09-16 | **NOTYA-ERECETE-03 — Reçetem tek tık** — KTS-kayıtlı MBYS vendor kimliği (SBSGM) alınınca Reçetem token yönlendirmesi (`Auth/…Login?accessToken`) ve HbysRaporEkle; P4 rayı, ödeyen doktor sonrası. Ayrıca MBYS/USS bildirim zorunluluğu aynı kayıtla çözülür. | OPEN (P4) |

## Dahiliye wow sprint — v2 brief (2026-09-16)

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-16 | **NOTYA-DAH-WOW-v2 — revised sprint brief** `docs/DAH-WOW-BRIEF-v2.md` (Kaan: audit v1 brief, improve order/depth, add game changers from TR dahiliye practice + care quality): dependency-ordered Waves 0–4 with a QA gate each (tsc + tests + prod Ready, Claude audits at wave boundaries), objective "Strong" rubric (engine+tests+table+UI+Kaynak+smoke), SCORE2 source spec (ESC 2021 high-risk region calibration for Türkiye + SCORE2-OP + SCORE2-Diabetes, worked-example tests), check-up merge moved LAST, home-BP + portal logs merged into one table. Six NEW game changers: İlaç izlem takvimi (W1.6), Erişkin aşı takvimi (W2.6), Muayene öncesi hasta anketi (W2.7), Antikoagülan kartı (W3.2), Ramazan DM/HT rehberi (W3.7), Kronik kohort paneli + recall (W4.1); care nudges folded into DM/lipid/HT cards (SGLT2/GLP-1 indication flags, hipoglisemi riski, statin intensity gap, frailty/PHQ-2, KB ölçüm tekniği). Build = Cursor, wave by wave. | BRIEF WRITTEN — build waits on Cursor start |
| 2026-09-16 | **NOTYA-DAH-WOW-NEXT** — seven cards: yaşlı polifarmasi deprescribing (STOPP/START); hasta hedef kartı + Turkish eğitim yaprakları; sigara bırakma paketi; Vit D / B12 eksikliği + SGK rapor; e-Nabız geçmiş PDF → Belgeler import; gut/ürik asit card; osteoporoz DXA T-skoru card (TEMD_OSTEO). **SHIPPED 2026-09-17 (Kaan authorized).** Each card follows the wow pattern: pure engine + tests (in `npm test`), migrations `046_dahiliye_wow_next.sql` + `047_dahiliye_sgk_vitamin.sql` (both applied), API steps in `app/api/doktor/dahiliye/_wow5.ts` (hooked from route.ts GET/POST), and UI `ui/DahiliyeWow5.tsx` — Dahiliye › **Bakım+** row (Polifarmasi · Hedef kartı · Sigara · Vit D/B12 · Gut · Osteoporoz) and Belge › **e-Nabız**, 2 taps. Kaynak ref_code on every suggestion; hekim lock before the note (`kart_nota` writes only a locked plan). New verified refs: STOPP_START_V3 (Eur Geriatr Med 2023;14:625), ACR_GUT2020, EULAR_GUT2016 (checked via Crossref). **C1** `engines/polifarmasi.ts`: ≥65, 24 own-words class-level rules from hasta_ilaclar + approved eGFR/K/Na + card flags (ASKVH, AF, KY, DM, KOAH, osteoporoz, albuminuria, positive fall screen). A blocking stop needs a ≥15-char override reason, enforced in the engine, the API and a DB check. `dahiliye_polifarmasi_kararlari` log; hasta_ilaclar is never touched. **C2** `engines/hedefKart.ts`: only locked goals (HT hedef lock, DM hedef HbA1c, LDL/KVR locks); unlocked → "Hekiminiz belirleyecek"; 4 printable one-pagers (yaşam, HT, DM ayak/göz, statin) in our own words, no doses; print HTML only after hekim approval (`dahiliye_hedef_kartlari` + lock hedef/kart). **C3** `engines/sigara.ts`: pack-years, HSI, stage of change, 5A, ALO 171, NRT/vareniklin/bupropion class only with contraindication flags, 1 wk / 1 mo / 3 mo / 6 mo görevler, sigara_birakma sevk. No SGK template: stated honestly, current rules verified by the hekim. **C4** `engines/vitamin.ts`: approved VitD/B12/folat → status, next test, replacement class (hekim writes dose); SGK templates `vitd` (E55.9) and `b12` (D51.9 / E53.8) in `sgkRapor.ts`. **C5** inbound only: `core/lab/enabiz.ts` + belgeler/lab `cikar kaynak=enabiz` (vision pass with a per-row printed-date instruction; dates validated as not future and not before DOB; duplicates removed; panel_type `enabiz_gecmis`; dated row editing on the lab page). Identity guard and tablo onayla → raporla → Onayla gate unchanged; undated rows never reach approved series. No live e-Nabız pull. **C6** `engines/gut.ts`: flare classes (NSAİİ removed for eGFR<30 / KY / OAC; kolşisin eGFR and interaction checks), ULT indication strong/conditional/none, target <6 (<5 with tophi), ladder + prophylaxis, diet, septic-arthritis red flag in the strip, romatoloji/üroloji sevk. **C7** `engines/osteoporoz.ts`: T-score from an approved DXA belge (`tSkoruCikar`, saved only by hekim "Belgeden al") or hekim entry; WHO classes, clinical osteoporosis from fragility fracture, risk flags, class-level plan (bisphosphonate eGFR<35 guard), secondary work-up, DXA interval + görev; FRAX not computed (licensed). Unit tests 460 → 507 + enabiz 3. Smoke: new synthetic 78-year-old patient, local run **150 requests / 58 checks / 0 failures**. It caught one real bug: an SGK sablon check constraint, fixed in 047. Screenshots in `public/dahiliye-smoke/next-*.jpg`; post-sprint + gaps audit HTML updated. Real MD field beta still out of scope (not faked). | SHIPPED |

## DAH-WOW build log (Claude builds, 2026-09-16)

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-16 | **DAH-WOW Wave 0 SHIPPED** — W0.1 prompts/ lock (`specialties/dahiliye/prompts/system.md`, `soap-dahiliye.md`, `asistan-ogrenme.md`, `tools.ts`); W0.2 Rx→hasta_ilaclar: already live since PR #150 (muayene onayı writes hasta_ilaclar; dahiliye reads it live, no fork) — İzlem sekmesi reads the same rows; W0.3 kart contract (`engines/kart.ts`, `dahiliye_kart_kilitleri`, adım `kilit` with allowed-field validation); W0.4 vizit şeridi (`engines/serit.ts`, sticky bar + 1-tap plan taslağı + kopyala). | SHIPPED |
| 2026-09-16 | **DAH-WOW Wave 1 — core SHIPPED**: W1.1 şerit live; W1.2 KVR (`engines/score2.ts`: kural kovası ASKVH/DM+TOD/KBH → LDL hedef → statin yoğunluk açığı; SCORE2 katsayıları EHJ 2021 suppl. p9 değerleriyle kodda, **SCORE2_ONAYLI=false kilidi**: sayısal risk doğrulamaya kadar dönmez; SCORE2-OP/Diabetes ledgered); W1.3 CKD KDIGO (`engines/ckd.ts`, ısı haritası, kronisite, hızlı düşüş, plan, nefro sevk paketi → sevkler); W1.5 ev kayıtları (`dahiliye_ev_kayitlari`, `engines/evKayit.ts` beyaz önlük/maskeli, glukoz hipo); W1.6 ilaç izlem takvimi (`engines/ilacIzlem.ts`, 13 kural, görevler dahiliye_gorevleri'ne). Migration 039. UI `DahiliyeWow.tsx` (KVR · KBH · İzlem · Ev kayıt sekmeleri). KANONIK: UACR, Retic eklendi. | SHIPPED |
| 2026-09-16 | **DAH-SCORE2-VERIFY** — waits on Claude (1 fetch): compare `engines/score2.ts` KATSAYI/OLCEK with EHJ 2021 ehab309 Updated Supplementary p9 (SCORE2 coefficients, S0 0.9605/0.9776, region scales), add 3 published worked examples to tests, flip `SCORE2_ONAYLI=true`. Until then the KVR card shows kural kovası + "doğrulama bekliyor". DONE 2026-09-17. **Source:** SCORE2 working group & ESC Cardiovascular risk collaboration, *SCORE2 risk prediction algorithms*, Eur Heart J 2021;42(25):2439–2454, doi:10.1093/eurheartj/ehab309 — file "SCORE2 Updated Supplementary Material.docx" (dated 2021-09-16) inside `ehab309_supplementary_data.zip`, downloaded from PMC8248998 (pmc.ncbi.nlm.nih.gov/articles/instance/8248998/bin/ehab309_supplementary_data.zip). academic.oup.com was behind a Cloudflare challenge, and PMC serves the supplement as DOCX, not PDF. **Compared line by line:** Suppl. methods Table 2 (log SHR ×9 per sex, S0 0.9605/0.9776, centring), Table 3 (scale1/scale2 for low/moderate/high/very high × sex), Table 4 calibration formula. **Discrepancies: none.** The diabetes term (0.6457/0.8096) is left out on purpose, per the table footnote. Tests: Table 4 worked example (50-year-old smoker, SBP 140, TChol 6.3, HDL 1.4; uncalibrated 0.0541/0.0332; calibrated M 0.0631/0.0811/0.0881/0.1506, F 0.0434/0.0523/0.0713/0.1414) in 5 tests, asserted against the published numbers; a changed scale or coefficient makes them fail (checked). The brief's suggested TC 5.5 / HDL 1.3 example does not appear in the supplement, so it was not used. `SCORE2_ONAYLI=true`; new Kaynak ref `ESC_SCORE2`; hekim lock unchanged (score → kova taslak → `kilit kvr.kategori`; no auto-note). Smoke: second synthetic patient (non-DM) → 8.8% through approved labs + lock; 90 requests / 21 checks / 0 failures; screenshot `public/dahiliye-smoke/kvr-score2.jpg`; audit row SCORE2/KVR → Strong (20/22). | SHIPPED |
| 2026-09-16 | **DAH-SCORE2-OP** — SCORE2-OP (≥70) as a separate engine with its own ONAYLI gate + published worked examples. **SHIPPED 2026-09-17 (gate opened):** `engines/score2op.ts` holds ehab312 "Supplementary material_20210604_v2.docx" (PMC8248997) coefficients (match main-paper Table 2) + **Suppl. Methods Table 1** region scales (Türkiye = high: men 0.08/1.15, women 0.38/1.09). Tests reproduce Table 3 steps 1–2 (LP 0.5029/0.3298; uncalibrated 0.2442/0.2966) and Table 1 calibration of the same patient (low 15.2%/18.6%; high 30.6%/27.8%). **Resolution of the old contradiction:** Suppl. Methods Table 2 step 3 explicitly requires Table 1 scales; Table 3's "low-region" −0.85/0.82 and −0.61/0.89 do not exist in Table 1 and are a documentation error (kept as a negative test that the formula still matches those wrong numbers). Main-paper 16%→37% / 14%→44% is an approximate Figure S9 non-HDL chart read, not a continuous TC/HDL worked example. `SCORE2_OP_ONAYLI=true`. KVR ≥70 → SCORE2-OP % + kova taslak (≥70 thresholds 7.5/15); hekim locks; Kaynak `ESC_SCORE2_OP`. Smoke: synthetic 75 y male smoker Table-3 lipids → 27.8%, kova çok yüksek, hekim lock. | SHIPPED |
| 2026-09-16 | **DAH-SCORE2-DIABETES** — SCORE2-Diabetes (ESC 2023, ehad260) for DM 40–69 as a separate engine with the same ONAYLI gate + published worked examples. **SHIPPED 2026-09-17:** `engines/score2diabetes.ts` holds the coefficients from Supplementary Methods Table 1 (PMC10361012 `supplementary_material.pdf`). They match line by line the formulas in the official calculator (`appendix_2.xlsx`, "values" sheet); s0 and region scales are the same as SCORE2. `tests/score2diabetes.test.ts` reproduces the published numbers: (1) main-paper Results, moderate region, 60 y: men 11.0% / 17.2%, women 12.7%; (2) low region 12.9% / 9.8%, very high 31.2% / 34.0%; (3) the official calculator's stored example, LP + uncalibrated risk + 4 regions × 2 sexes (high region men 15.39% / women 16.01%). Caveat on the ledger: the main text's women "7.9%" computes to 7.6% with these coefficients; the other 7 values match within ±0.05, so 7.9% is left out of the tests. `SCORE2_DIABETES_ONAYLI=true`. KVR card: ASKVH / DM+TOD / severe CKD → very high with no score (unchanged). Otherwise DM 40–69 → SCORE2-Diabetes: high-risk region (Türkiye), HbA1c % → mmol/mol by the IFCC–NGSP master equation, eGFR and HbA1c only from onayli rows, age at diagnosis from the DM card tanı tarihi or the new KVR input (`045_dahiliye_score2_dm.sql`, applied). ESC 2023 thresholds (<5 / 5–<10 / 10–<20 / ≥20) → kova taslak (never below a rule bucket such as orta KBH). Kaynak `ESC_SCORE2_DIABETES`; hekim locks. Any missing input → no number, the missing items are named, and the TEMD "en az yüksek" fallback stays. Smoke: synthetic DM 60 y patient on unapproved labs → no score; after Onayla → 12.5% high region, kova yüksek, hekim lock. | SHIPPED |
| 2026-09-16 | **DAH-WOW W1.4 SGK rapor şablonları SHIPPED** — `specialties/dahiliye/engines/sgkRapor.ts` + `tests/sgkRapor.test.ts` (HT/DM/statin/DOAK ilaç kullanım raporu; etken madde yalnız hasta_ilaclar, lab yalnız onaylı, T.C./ad saklanmaz, CHA₂DS₂-VASc hekim işaretli, mekanik kapak DOAK kilidi engeli); migration `040_dahiliye_sgk_rapor.sql`; `app/api/doktor/dahiliye/route.ts` adım sgkrapor/sgkkilit (e-Nabız zarfı `enabizSgkRapor`, hekim kimliği Medula ayarından); UI `DahiliyeWow.tsx` "SGK rapor" sekmesi (yazdır/PDF, zarf kopyala, hekim onayı). Wave 1 complete. | SHIPPED |
| 2026-09-16 | **DAH-WOW W1.5 portal entry** — closed by W2.7: Sağlığım › Takip › Muayene öncesi anket writes `dahiliye_ev_kayitlari` (kaynak=portal). | SHIPPED |
| 2026-09-16 | **DAH-WOW Wave 2 SHIPPED — care loops**: W2.1 DM döngü (`engines/dmLoop.ts`: FIB-4, SGLT2/GLP-1 kardiyo-renal bayrak, hipoglisemi riski, ayak foto/FIB-4 görevleri); W2.2 anemi (`engines/anemi.ts`); W2.3 obezite/GLP-1 (`engines/obezite.ts`, bariatrik = sevk); W2.4 KETEM (`engines/tarama.ts`, jine tarihleri ortak); W2.5 HT panel + 14 gün lab takibi (`engines/htPanel.ts`); W2.6 erişkin aşı (`engines/asi.ts`, HYP); W2.7 ön anket (`engines/anket.ts`, portal `app/api/portal/hasta/[token]/dahiliye-anket/route.ts` + `app/portal/hasta/[token]/on-anket/page.tsx`, Takip kısayolu). Tests: `tests/{dmLoop,anemi,obezite,tarama,asi,anket}.test.ts`. Migration `041_dahiliye_wow_w2.sql`. Server `app/api/doktor/dahiliye/_ortak.ts` + `_wow2.ts`; UI `specialties/dahiliye/ui/DahiliyeWow2.tsx`, grouped tabs in `DahiliyeHome.tsx`; `lib/doktor/gununNotunaEkle.ts` alan param. | SHIPPED |
| 2026-09-16 | **DAH-WOW Wave 3 SHIPPED — breadth cards**: W3.1 KY/GDMT (`engines/hf.ts`); W3.2 antikoagülan (`engines/antikoagulan.ts`: TTR, DOAK uygunluk, HAS-BLED checklist); W3.3 KOAH/astım (`engines/pulm.ts`); W3.4 ofis GI + H. pylori (`engines/gi.ts`); W3.5 EKG 1-tap rapor + kırmızı kapı (`engines/ekg.ts`); W3.6 tiroid nodül TI-RADS tarzı (`engines/tiroidNodul.ts`); W3.7 Ramazan DM/HT (`engines/ramazan.ts`); W3.8 check-up paket defteri + birleşik rapor (`engines/checkupPaket.ts`). Tests `tests/{hf,antikoagulan,pulmGi,ekgNodul,ramazanCheckup}.test.ts`. Migration `042_dahiliye_wow_w3.sql`. Server `app/api/doktor/dahiliye/_wow3.ts`; UI `specialties/dahiliye/ui/DahiliyeWow3.tsx`; kart kilit alanları genişletildi (`engines/kart.ts`). | SHIPPED |
| 2026-09-16 | **DAH-WOW Wave 4 SHIPPED — close**: W4.1 kronik kohort paneli (`engines/kohort.ts`, `app/api/doktor/dahiliye/_kohort.ts`, `app/api/doktor/dahiliye/kohort/route.ts`, `app/doktor-tools/dahiliye-kohort/page.tsx`; 1-tap recall via Sağlığım mesajları, klinik değer yok); W4.2 bakım kalitesi dürtmeleri (`engines/nudge.ts`: KB ölçüm tekniği kapısı şeritte, FRAIL, düşme, PHQ-2; `_wow4.ts`; NudgeBar; sonuç nota yalnız "Nota ekle" ile); rubric fixes (izlem/kırmızı/ilaç güvenliği ref_code, tiroid tanı kilidi); W4.3 `public/dahiliye-post-sprint-audit.html` (Araçlar'dan link). Migration `043_dahiliye_wow_w4.sql`. Tests `tests/kohortNudge.test.ts`. Audit result (strict §2): 0/22 Strong · 19/22 at 5/6 (smoke screenshot pending) · 3 Partial (SCORE2/KVR, Lab/Belgeler shared, prompts). | SHIPPED |
| 2026-09-16 | **DAH-WOW-SMOKE** — rubric criterion 5 for all domains. DONE 2026-09-17: dedicated QA doctor `qa.dahiliye@notya.ai` (specialty dahiliye; qa.test pediatri untouched; password only in .env.local), synthetic patient + approved lab panels via the real Onayla route, `scripts/dahiliye-smoke.mts` (83 API calls, 15 checks, 0 failures, re-runnable), 24 real headless-browser screenshots in `public/dahiliye-smoke/`, audit re-scored to 19/22 Strong (SCORE2/KVR, Lab/Belgeler, prompts/ stay Partial with reasons). Fixed along the way: onayla `notes.specialty` 500 on the no-muayene path; apiksaban "kriter yok" with no creatinine → "değerlendirilemez". | SHIPPED |
| 2026-09-17 | **DAH-WOW-SMOKE-FU** — seen in smoke screenshots: check-up kalem "Kırılganlık + düşme taraması" not auto-ticked from dahiliye_taramalar; Bakım kalitesi bar keeps "Nota ekle" after the result was added. DONE 2026-09-17: (1) `engines/checkupPaket.ts` kalem `tarama: ['frail','dusme']` — `paketDurumu` takes tarama dates (new `taramaTarihleri` in `_wow3.ts`, used by both GET and birleşik rapor) and ticks the item (kaynak `tarama`, checkbox locked like lab/belge) when BOTH a FRAIL and a düşme screening exist on/after paket tarihi or ≤12 months before it (annual nudge window); (2) migration `044_dahiliye_tarama_nota.sql` (applied) adds `dahiliye_taramalar.nota_eklendi_at`, set by `notaekle` only after `gununNotunaEkle` succeeds; NudgeBar shows "✓ notta" instead of "Nota ekle" for that result (a new screening row gets the CTA again). Tests: new check-up tarama test; smoke +2 checks — prod (old code) 2 failures, local with fix 84 istek / 17 kontrol / 0 hata. | SHIPPED |
| 2026-09-17 | **DAH-LAB-BELGELER** — close the Lab/Belgeler Partial row in the post-sprint audit. DONE 2026-09-17. **Engine re-audit:** new `core/lab/cikarim.test.ts` (in npm test) runs a synthetic digital PDF (`core/lab/fixtures/sentetikLabPdf.ts`, ASCII, no real document) through pdfjs → rows → canonical_key/units/flags. It also covers CSV header, BOM + semicolon and headerless fallback, printed-name aliases, `trTarihIso`, the vision pass via a stub client, and yapı/görsel reconciliation. **Bugs found and fixed:** (1) CSV `"8,2"` was parsed as 82 by SheetJS number parsing, a 10× HbA1c error; UTF-8 names ("Açlık Kan Şekeri") were garbled and dropped. CSV is now decoded as UTF-8 text with `raw: true`. (2) Inside Next the pdfjs fake worker could not load `pdf.worker.mjs`, so the structural pass failed silently and only Claude vision ran. The worker is now loaded in-process (`globalThis.pdfjsWorker`). (3) CSP had no `frame-src`, so the vault PDF preview (blob: iframe) was blocked on every document. `frame-src 'self' blob:` was added in `middleware.ts`; verified only by the console error going away, because headless Chromium has no PDF viewer. **Rubric C4:** `specialties/dahiliye/engines/labKaynak.ts` + tests. For dahiliye doctors, the raporla output gives each tanı a golden ref_code by ICD-10 chapter and the öneri one per abnormal lab group, shown behind the Kaynak toggle on the lab page. **Hekim lock (UI):** "Onayla ve son muayeneye ekle" now looks disabled until a tanı is locked (it already was disabled, and the route returns 400). **Display:** strip LDL/eGFR are rounded for display only (119.877 → 120). **Smoke:** `scripts/dahiliye-smoke.mts` adds a third synthetic patient and runs the real path: multipart vault upload → `cikar` (yapı + görsel) → `onayli=false` and the strip stays empty → raporla without tablo onayı 409 → tablo onayla → raporla → Kaynak check → Onayla without a tanı 400 → PATCH hekim tanısı → Onayla → `onayli=true` → strip HbA1c 7.9 %. Result: 103 requests, 33 checks, 0 failures. 6 real UI screenshots `public/dahiliye-smoke/lab-*.jpg`. Audit row Lab/Belgeler → Strong (21/22). | SHIPPED |
| 2026-09-17 | **DAH-PROMPTS-LOCK** — close the prompts/ Partial row honestly. DONE 2026-09-17. **Rubric:** brief §2 now has a separate **prompts rubric**: (a) exists + complete, (b) reviewed against goldens with no book text, (c) wired at runtime, (d) hekim lock language. Criteria 1–2 are N/A by design; no engine or table was invented. **Real gap found:** nothing loaded `specialties/dahiliye/prompts/*` at runtime (the KD/derm prompts/ folders aren't loaded either; not in scope here). **Wiring:** `specialties/dahiliye/prompts/index.ts` (fs loader; throws if a file is missing) is used by `lib/doktor/soapUret.ts` `soapSistemPromptu` → `sessions/[id]/end` + `sessions/ses-yukle` (new `doktorBransi` = users.specialty, so the lock applies even without a session context), by `asistan/chat/route.ts` (system.md + tools map), by `doktor/hafiza/route.ts` (compact lock in the voice sesBlogu) and by `stilProfiliDamit` via `notes/[id]/approve` (asistan-ogrenme.md). tools.ts is a read-only step map in the prompt, not Anthropic tool calls (chat has no tool loop; dotted names would be invalid anyway; card writes stay hekim actions). For dahiliye, SOAP `receteOnerisi` doz/kullanım/mg are stripped in code (`dahiliyeReceteDozsuz`). `next.config` `outputFileTracingIncludes` traces the .md files; confirmed in the `.nft.json` of all 5 routes. **Review fix:** system.md rule 5 excluded ACEi/ARB/statin from the pregnancy warning. It now says ACEi/ARB and statin are contraindicated, and everything else gets "gebelikte gözden geçir". ESC_SCORE2 was added to the Kaynak list. **Tests:** `specialties/dahiliye/tests/promptsLock.test.ts` (11). **Runtime:** `scripts/dahiliye-prompts-smoke.mts` on `next start`: 4/4 (hafıza lock loaded; real SOAP 200, reçete without doses; chat flags ACEi contraindication with no mg). Audit prompts/ row → Strong on the prompts rubric → 22/22. | SHIPPED |
| 2026-09-17 | **DAH-PROMPTS-FU** — seen in the prompts smoke SOAP output for an adult dahiliye patient: aiDegerlendirme ended with "Büyüme/VKİ değerlendirmesi için büyüme persentili bölümüne bakınız". The shared `soapKurallari()` carries pediatri growth-percentile wording for every branch. Scope it to pediatri/çocuk branches. The KD/derm `prompts/` folders are also not loaded at runtime (same gap dahiliye had). DONE 2026-09-17 in two PRs, one per specialty. **Shared bleed:** fixed once in `soapKurallari(pediatrik)` / `pediatrikKapsam()` (KD-PROMPTS-LOCK #278). It was confirmed on real generated notes before the fix: dahiliye (the original sighting), **kadın doğum** (27-week prenatal note, aiDegerlendirme "Büyüme persentiline bakınız"), and **dermatoloji** (24-year-old nodülokistik akne note with kilo/boy dictated, 2/2 runs "Büyüme persentiline bakınız"; without kilo/boy, 0/2). Every adult branch was affected. After the fix: 0 hits in KD (4 notes: 2 direct, the `next start` smoke and the production smoke) and derm (5 notes including the `next start` smoke). Pediatric prompt text is byte-identical. **KD:** prompts/ wired, plus a second bug: profile `kadin-dogum` was not recognised by `session/new`, so KD notes ran as "genel" (see KD-PROMPTS-LOCK). **Derm:** prompts/ wired, no extra routing bug: `session/new` already sends `dermatoloji`, and no KD/dahiliye lock text reaches a derm prompt (tested) (see DERM-PROMPTS-LOCK). **Folder completeness vs dahiliye:** KD and derm both have system.md + tools.ts + soap-*.md + asistan-ogrenme.md (+ vision-asistan.md), so nothing is missing and nothing was authored. | SHIPPED |
| 2026-09-17 | **KD-PROMPTS-LOCK** (DAH-PROMPTS-FU, kadın doğum half; PR #278). DONE 2026-09-17. **Trace:** nothing loaded `specialties/kadin-dogum/prompts/*` at runtime; only `tools.ts` was re-exported from `index.ts`, and no route used it. There was also a second gap. Real KD profiles store `users.specialty = 'kadin-dogum'`, which `app/session/new` did not recognise. SOAP therefore ran with `context.specialty = 'genel'` and the "genel" persona ("…pediatride kilogram başına dozlamayı esas alırsın"). **Bleed verified on a real note:** a synthetic 27-week prenatal SOAP (transcript only, via `soapNotuUret`) ended aiDegerlendirme with "Büyüme persentiline bakınız (uygulama büyüme modülünde)". **Fix (shared):** `soapKurallari(pediatrik)` + `pediatrikKapsam()`. Growth-percentile/Neyzi, baş çevresi, prenatal öykü, mg/kg and veli wording now apply only to pediatri/çocuk branches and to mixed-age genel/aile, which keep the guard. Locked adult branches get "VKİ sınıfı veya persentil hesaplayıp sayı uydurma" instead. Pediatric output is byte-identical to before (checked). This also fixes the adult dahiliye note from DAH-PROMPTS-FU. `soapPersonaAnahtari` falls back to users.specialty for the persona, and `session/new` maps `kadin-dogum` → `kadin-hastaliklari-dogum`. **Wiring:** `specialties/kadin-dogum/prompts/index.ts` (fs loader, throws on a missing file) feeds `soapSistemPromptu` (system.md + all 4 soap-*.md with a pick-by-visit-type line + tools map; SB/ACOG as two aiDegerlendirme lines), asistan chat (system.md + vision-asistan.md + tools map), hafıza sesBlogu (system.md without the citation bullets) and `stilProfiliDamit` (asistan-ogrenme.md). `next.config` traces the .md files; confirmed in the `.nft.json` of all 5 routes. **Review fix:** the vision disclaimer in system.md / vision-asistan.md was ASCII ("destegi, tani degildir"). It now uses the `VISION_DISCLAIMER` UI text. **Tests:** `specialties/kadin-dogum/tests/promptsLock.test.ts` (13, including tools.ts = manifest whitelist, cited roles = manifest books, no-bleed on shared rules). **Runtime:** `scripts/kd-prompts-smoke.mts` on `next start` with QA doctor `qa.kd@notya.ai` (users.specialty `kadin-dogum`, synthetic patient deleted after): 4/4. The hafıza lock loaded. A real SOAP call without context.specialty returned 200 with no persentil/Neyzi/büyüme/veli text and SB/ACOG columns in aiDegerlendirme. Chat on a high-risk ikili tarama answered "tanı değil" → NIPT / CVS / amniyosentez. The KD `prompts/` folder is complete vs dahiliye (system, tools, soap-*, asistan-ogrenme, plus vision); nothing new was authored. | SHIPPED |
| 2026-09-17 | **DERM-PROMPTS-LOCK** (DAH-PROMPTS-FU, dermatoloji half). DONE 2026-09-17. **Trace:** nothing loaded `specialties/dermatoloji/prompts/*` at runtime; `tools.ts` was only re-exported from `index.ts`. Unlike KD, routing was fine: `users.specialty = 'dermatoloji'` is a SPECIALTIES key, so `session/new` sends it and the SOAP persona was already the Dermatoloji one. **Bleed:** present before #278 (see DAH-PROMPTS-FU). On main after #278 it was gone before any derm wiring (2 notes), and it stays gone with the lock (2 local notes + smoke). **Wiring:** `specialties/dermatoloji/prompts/index.ts` (fs loader, throws on a missing file) feeds `soapSistemPromptu` (system.md + soap-derm / soap-phototherapy / soap-procedure with a pick-by-visit-type line + tools map), asistan chat (system.md + vision-asistan.md + tools map), hafıza sesBlogu (system.md without the citation bullets) and `stilProfiliDamit` (asistan-ogrenme.md). `dermatolojiMi` matches /derma/ (router) and "Deri ve Zührevi". `soapPersonaAnahtari` maps that unvan to `dermatoloji`. `next.config` traces the .md files; confirmed in the `.nft.json` of all 5 routes. **Review fix:** the vision disclaimer was ASCII ("destegi, tani degildir"). It now uses the `VISION_DISCLAIMER` UI text. **Tests:** `specialties/dermatoloji/tests/promptsLock.test.ts` (12, including tools.ts = manifest whitelist, every manifest book role cited, no KD/dahiliye lock in derm prompts, adult rules). **Runtime:** `scripts/derm-prompts-smoke.mts` on `next start` with QA doctor `qa.derm@notya.ai` (users.specialty `dermatoloji`, synthetic patient deleted after): 5/5. The hafıza lock loaded. A real fototerapi SOAP call without context.specialty, with kilo/boy dictated, returned 200 with no persentil/Neyzi/veli/ACOG text; the phototherapy template flagged the missing J/cm² and cumulative dose plus the TBSE reminder. Chat on "is this mole melanoma" answered "karar desteğidir, tanı değildir" → dermoskopi, uzman onayı. **Lock effect seen in notes:** before the lock, fototerapi notes had no J/cm² / TBSE structure; now they do. | SHIPPED |
| 2026-09-17 | **DERM-PROMPTS-FU** — seen in DERM-PROMPTS-LOCK notes. (1) Same dose issue as KD-PROMPTS-DOZ-FU: the derm lock has no dose rule, and receteOnerisi / aiDegerlendirme carry izotretinoin "0,5 mg/kg/gün ≈30 mg/gün" and cumulative "120–150 mg/kg" from memory. The same hekim decision applies to both specialties. (2) One akne note called the izotretinoin onam "BZBH Form 014 benzeri". BZBH Form 014 is in system.md's `state` citation list but is not an izotretinoin consent form, so a hekim should review that list line and the GÖP isotretinoin onam wording. (3) Model text leaks the internal id name `coreImageId` into aiDegerlendirme ("fotoğraf kaydı (coreImageId) … alınmamış"). Consider a lock line to say "fotoğraf" in doctor-facing text. Not authored here (clinical/prompt content). | SHIPPED → KD-DERM-SAFETY-FINDINGS F1 (doses) + F4 (form name, coreImageId) |
| 2026-09-17 | **KD-PROMPTS-DOZ-FU** — seen in KD-PROMPTS-LOCK notes: the KD lock has no dose rule (dahiliye's system.md has "Doz yazma"), so the model still writes doses from memory. Examples: receteOnerisi anti-D "300 mcg (1500 IU) IM", aspirin "81 mg/gün" in aiDegerlendirme, and once "anti-D (300 mcg)" in the plan body when the hekim never said a dose. It also cited "ACOG Practice Bulletin No. 222" from memory instead of `protocols/acog-map.ts`. Needs a hekim decision on the KD dose policy (strip like `dahiliyeReceteDozsuz` or allow) and then a system.md rule. Not authored here. | SHIPPED → KD-DERM-SAFETY-FINDINGS F1 |
| 2026-09-17 | **ASISTAN-PERSONA-BRANS-FU** — seen in the KD chat smoke: with no personaId, `/api/asistan/chat` falls back to `getPersonaForSpecialty('genel')` → pediatri "Prof. Dr. Ayşe Kaya" for a KD doctor. The KD lock is appended and governs the content, but the persona identity (and `proactiveDoseExample`) is still pediatric. Pick the default persona from users.specialty. The long KD chat answer also hit `max_tokens` mid-JSON, so the route fell back to raw text and `speech` carried the ```json fence and the truncated tail. Make the parser salvage truncated JSON (as `jsonKurtar` does for SOAP) or raise the limit. | SHIPPED → KD-DERM-SAFETY-FINDINGS F2 (persona) + F3 (truncated JSON) |
| 2026-09-17 | **NOTYA-DAH-GAPS-AUDIT — remaining gaps after 22/22 Strong** | Fresh audit (not a re-grade): `public/dahiliye-gaps-audit.html` → https://notya-ai.vercel.app/dahiliye-gaps-audit.html; Araçlar link. Open now: DAH-SCORE2-OP, DAH-SCORE2-DIABETES, DAH-PROMPTS-FU, ledger hygiene; NEXT pack (7 cards) waits on Kaan; real MD beta still QA-only. Intentional outs unchanged. **Refreshed 2026-09-17:** SCORE2-Diabetes, the NEXT pack (7/7), SCORE2-OP (`SCORE2_OP_ONAYLI=true` — Table 2 mandates Table 1 scales; Table 3 step-3 typo documented) and ledger hygiene are marked shipped; the real MD beta is still open. | SHIPPED |
| 2026-09-16 | **DAH-02** (Rx → hasta_ilaclar + dahiliye cards) — covered by DAH-WOW W0.2 (live since PR #150) and SGK rapor etken madde reading hasta_ilaclar (W1.4). | SHIPPED |

## KD-DERM-SAFETY-FINDINGS (2026-09-17)

Real findings from the KD-PROMPTS-LOCK (#278) and DERM-PROMPTS-LOCK (#279) test notes, fixed in priority order, one PR each.

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **F1 — no "invented doses" lock for kadın doğum / dermatoloji** (closes KD-PROMPTS-DOZ-FU, DERM-PROMPTS-FU (1)). **Trace:** dahiliye had a prompt rule (system.md #2 "Doz yazma … hekim dozu yazar") and a code check, `dahiliyeReceteDozsuz`. That check only stripped `receteOnerisi`, so the plan body, `aiDegerlendirme` and `ilaclar` were never covered. **Fix:** (a) `## Doz kilidi (kırılmaz)` in `specialties/kadin-dogum/prompts/system.md` (anti-D, tokolitik, oksitosin/misoprostol, MgSO4, antenatal steroid, aspirin, LMWH, demir/folik asit/D vit/iyot, kontraseptif, acil kontrasepsiyon, HRT) and `specialties/dermatoloji/prompts/system.md` (izotretinoin günlük+kümülatif, biyolojik/sistemik, topikal steroid potens sınıfı only, antibiyotik/antifungal kürleri, fototerapi J/cm²). Plain lines, so the rule reaches SOAP, chat and voice; ÖNCELİK + SOAP receteOnerisi line as in dahiliye. (b) New `lib/doktor/dozKilidi.ts` code check for dahiliye/KD/derm (`dozKilitliBrans`): receteOnerisi doz/kullanım always stripped (the old dahiliye function, now shared). Any dose token (mg, mcg, IU, ünite, mL, mU/dk, mg/kg/gün, ranges, ≈) whose number is in neither the transcript nor the kimliksiz patient context is replaced with "[doz hekim tarafından belirlenir]" in every note field and `ilaclar`, and listed in a "⚠ Doz kontrolü (hekim onayı)" line in aiDegerlendirme. Doses the hekim dictated are kept exactly. Lab units (mg/dL, g/dL, mL/dk/1.73, mIU/mL) and 50/75/100 g OGTT are excluded. The same check runs on `/api/asistan/chat` speech (source = doctor's messages + patient file + verified drug context). **Verified:** `lib/doktor/dozKilidi.test.ts` (9, in npm test) uses the literal failing strings (anti-D (300 mcg) in plan, aspirin 81 mg/gün, izotretinoin 0,5 mg/kg/gün ≈30 mg/gün, 120–150 mg/kg); KD/derm promptsLock tests assert the rule reaches all 3 surfaces. **Real regression** `scripts/doz-kilidi-smoke.mts` on `next start` with qa.kd / qa.derm and synthetic patients, no dose dictated: KD anti-D SOAP, KD aspirin SOAP, KD anti-D chat, derm izotretinoin SOAP, derm izotretinoin chat → **18/18, run twice**. The code check never had to fire (the model itself wrote "Doz hekim tarafından belirlenir" / "Doz kilidi: sayısal doz yazılmamıştır"); chat pointed to KÜB / TDD Akne instead of a number. tsc clean, npm test 431/431. | SHIPPED |
| 2026-09-17 | **F2 — chat persona defaulted to pediatri for KD / derm doctors** (ASISTAN-PERSONA-BRANS-FU persona half). **Trace:** `/api/asistan/chat` picked `requestedPersona \|\| prefs.preferred_persona \|\| getPersonaForSpecialty(body.specialty = 'genel')`, and 'genel' resolves to pediatri Ayşe. Also found: nothing ever writes `doctor_preferences.preferred_persona`, and the column default is `'elifsahin'` (`lib/db/asistan_schema.sql`). All 3 prod rows held that value, so from their 2nd chat every doctor (any branch) got the **nöroloji** colleague. The /asistan page always opened on Ayşe. `getSpecialistForSpecialty` had no alias for users.specialty `kadin-dogum` or "Deri ve Zührevi Hastalıklar", and "İç Hastalıkları" lost its match to the combining dot left by `toLowerCase`. **Fix:** `varsayilanPersonaId(request specialty, users.specialty)` in `lib/asistan/personaEngine.ts`: a branch doctor gets their branch colleague; genel / aile / pediatri / unknown keep Ayşe (b9406a9). It uses the strict `findSpecialistForSpecialty` (added aliases + U+0307 strip). The chat route uses it for new sessions and stops reading `preferred_persona`. The /asistan page applies it when the doctor has no saved tab. The written-chat labels use the active persona's name, not a hardcoded "Ayşe". **Verified:** `lib/asistan/personaEngine.test.ts` (4, in npm test). Real `/api/asistan/chat` on `next start` with no personaId (both QA doctors carry preferred_persona = elifsahin): qa.kd → Prof. Dr. Fatma Çelik (Kadın Hastalıkları ve Doğum), qa.derm → Prof. Dr. Selin Aksoy (Dermatoloji); before: pediatri (1st chat) / nöroloji (later). **Mobile:** /asistan as qa.kd at 390px and 360px (gstack browse): header "Fatma Çelik Hocam", scrollWidth = viewport (no overflow), written-chat panel fits. Gap found and handed to F3: the written-chat panel shows "Yanıt alınamadı." for every answer (route returns `speech`, UI reads `response`). tsc clean, npm test 435/435. | SHIPPED |
| 2026-09-17 | **F3 — long KD chat answer cut off and shown as raw JSON** (ASISTAN-PERSONA-BRANS-FU second half). **Trace:** `/api/asistan/chat` ran `max_tokens: 800` and `JSON.parse(whole text)`, falling back to `speech = rawResponse`. On long questions the real model returns a short JSON wrapper (`"speech": "… aşağıda derledim"`), writes the actual content as markdown **after** the object, and hits max_tokens. Reproduced 3/3 with the real KD chat prompt. So the parse failed and the doctor got the ```json fence, the object and the cut tail. Also found (F2 mobile check): the written-chat panel read `response/message/cevap`, but the route returns `speech`, so **every** answer displayed as "Yanıt alınamadı.". Long markdown table lines also widened the panel to 515px on a 390px screen. **Fix:** new `lib/asistan/yanitCoz.ts` `asistanYanitiCoz(raw, stop_reason)`: a complete object keeps its fields, and trailing markdown after it is appended to speech. On a cut (max_tokens or unclosed object), speech is salvaged up to the cut and the escape tail is dropped. The action is dropped (a half-written action never runs), and a Turkish note is appended: "Yanıt uzunluk sınırında kesildi. Devamı için "devam et" yazın ya da soruyu daraltarak tekrar sorun." A JSON-shaped reply with no readable speech shows "Yanıt tamamlanamadı." plus the note, never the object. The route uses the parser and logs cuts, and max_tokens goes 800 → 1600. The prompt says the whole answer goes inside speech and long topics come in parts. The panel reads `data.speech` through the same parser as a guard, and bubbles use `overflowWrap: anywhere`. **Verified:** `lib/asistan/yanitCoz.test.ts` (8, in npm test), including the real wrapper+markdown shape and escape cuts. `scripts/asistan-kesik-yanit-smoke.mts` 3/3: the real model cut mid-JSON (old parse fails, raw text) → clean Turkish + note; the real route long KD answer → 200, 3.2k chars, no raw JSON, cut note. **Mobile / UI** (qa.kd, `next start`, gstack browse) at 390px and 360px: the long answer renders as markdown with the cut note, no ```json / {"speech", scrollWidth = viewport, 0 overflowing elements. "devam et" continues the answer in the same session. Before the fix: "Yanıt alınamadı." and a 515px panel. Not fixed (pre-existing): `HafifMarkdown` renders markdown tables as pipe text. tsc clean, npm test 443/443. | SHIPPED |
| 2026-09-17 | **F4 — derm note text: invented consent form name, leaked internal field name** (DERM-PROMPTS-FU (2)(3)). **Reproduced on main** (real `soapNotuUret`, derm lock, synthetic izotretinoin visit with "onam bir sonraki vizitte", "fotoğraf çekemedik"), 4 runs: `coreImageId` in doctor text 2/4 ("standardize lezyon fotoğrafı (coreImageId)"), invented consent form 2/4 ("tedavi onam formu (BZBH Form 014)", "BZBH Form 014 (gebelik önleme programı formu)"). **Trace:** derm system.md listed "BZBH Form 014" under `state` with no meaning; it is the notifiable communicable / zührevi disease report, not a consent form. The derm SOAP lock literally said "Fotoğraf/dermoskopi kimliği (coreImageId) …", and soap-*.md / tools.ts use storage field names. **Fix:** (a) derm system.md: the state line says Form 014 is the bildirim form, "onam formu değildir"; new `## Onam ve form adları (kırılmaz)`: no invented form names or numbers, izotretinoin onam only as "izotretinoin onam formu", form text stays with the hekim. It reaches SOAP, chat and voice. (b) derm SOAP lock line reworded without the id. KD and derm SOAP/chat locks: new rule, no internal field or tool names in doctor-facing text, use the clinical word. (c) Code, all branches: `lib/doktor/klinikMetin.ts` `notMetinleriniTemizle` on every string of the generated note (`soapNotuUret`) and `doktorMetniTemizle` on chat speech. Internal ids (coreImageId, dicomId, pathologyId, photoId, lesionId, VisionRead, islem_oncesi, uzman_onayli, generic `…Id`) are replaced with the clinical word, and a parenthetical id is dropped. A "Form NNN" reference in a consent sentence becomes "onam formu (hekimin kullandığı form)"; real bildirim sentences (sifiliz, TSİM, bulaşıcı) keep Form 014. **Verified:** `lib/doktor/klinikMetin.test.ts` (5, in npm test) on the literal leaked strings, with no false positives on clinical text; derm promptsLock (d) test. `scripts/derm-not-metni-smoke.mts` on the same synthetic visit after the fix: **8/8** (4 runs), and the raw model output before the code cleaner was already clean in 4/4 (prompt fix alone). The notes now say "İzotretinoin onam formu bir sonraki vizitte imzalatılacak" and "lezyon fotoğrafı ve dermoskopi görüntüsü alınamamıştır". Server-side text only, no UI change, so no mobile check needed. tsc clean, npm test 449/449. | SHIPPED |

## NONURGENT-CLEANUP (2026-09-17)

Three known non-urgent items from the KD-PROMPTS-LOCK (#278) and F3/F4 (#282/#283) follow-ups. Standing rule applied (Kaan, 2026-09-17): Turkish references and practice first (TİHUD, TEMD, SB/HYP, Uzlaşı, SGK, the Turkish specialty society, e.g. TJOD). An international source is used only when no Turkish one exists or the Turkish guideline defers to it.

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **KD-KAYNAK-KILIDI — KD notes / chat cited guideline document numbers from memory.** **Reproduced** on the real routes (`next dev`, qa.kd, `scripts/kd-kaynak-kilidi-smoke.mts`, `SMOKE_ETIKET=once`). 4 of 5 KD chat answers had an unverifiable number: PPH "ACOG Practice Bulletin #183" (not in the repo's verified list), GBS "ACOG Practice Bulletin 797" (797 is a Committee Opinion, so the document type was invented), PPROM "ACOG PB 188" (acog-map has PB 217), and "Clinical Consensus 1" (postpartum pain) cited for PPH. The 3 SOAP cases had none. The prompt only said "ACOG Practice Bulletin / Committee Opinion" and "TR hekim pratik gold standard: ACOG", so the model recalled numbers itself and cited ACOG first. **Fix:** (a) `specialties/kadin-dogum/prompts/system.md`: Turkish source first (SB rehberleri DÖBYR / Riskli Gebelikler / Doğum Sonu Bakım, SUT/SGK, TJOD). ACOG stays as the separate "klinik öneri" column, or is used where no Turkish equivalent exists. New `## Kaynak kilidi (kırılmaz)`: no document number or year from memory, for international **or** Turkish sources. The rule reaches SOAP, chat and voice. (b) `protocols/dogrulanmis-kaynaklar.ts` is the only citable list, copied from sources already verified in the repo (acog-map rows + related documents named in their notes, DÖBYR 2026 / Yayın No. 1402, TJOD PKOS 2023, TJOD Endometriozis 2014). Each topic names its Turkish equivalent first: DÖBYR for izlem / OGTT / anti-D / aneuploidy / NST, Riskli Gebelikler for PE / preterm, Doğum Sonu Bakım for postpartum. GBS and CS/VBAC have no Turkish guideline in the repo, so they get no invented one. The list is rendered into the SOAP and chat lock from code. (c) Backstop `lib/doktor/kaynakKilidi.ts`: a numbered ACOG PB/CO/CC/OCC/CS, SMFM Consult Series, RCOG Green-top or NICE NG/CG citation, a TJOD/TMFTP/DÖBYR year, or a Yayın No. is kept only if it is in the list **and** its topic is discussed in the same answer / field. Otherwise it becomes the organisation name ("ACOG önerileri", "TJOD …") plus a "⚠ Kaynak kontrolü (hekim onayı)" line (SOAP aiDegerlendirme / chat bubble) and a server log. Wired into `soapNotuUret` (KD) and `/api/asistan/chat` (KD). Internal source-role ids (`pratik_altin_standart_tr_hekim`) no longer leak into doctor text (klinikMetin). **Verified:** `lib/doktor/kaynakKilidi.test.ts` (8, the literal failing strings, in npm test). promptsLock KD test for the Kaynak kilidi. Real-route smoke after the fix, two consecutive runs 24/24: no unverified number reaches the doctor, and the model obeyed the lock (backstop did not fire) in all 5 chat + 3 SOAP cases. Answers now cite "SB Doğum Sonu Bakım Yönetim Rehberi", "DÖBYR 2026" and "ACOG CO 797". Topic check tuned on real output: whole-answer topic, not a ±200-char window, because answers cite in a closing Kaynak table. **Not done / noted:** year-only ACOG claims ("reaffirmed 2023") are prompt-covered only. The model still attributes content to named SB rehberleri, which cannot be checked against book text. `citeProtocol()` now TR-first (SB → Temel KD → ACOG → Williams; product directive 2026-09-17 overrides prior ACOG-first display ranking). PPH blood-loss "≥500 mL" dose-lock false positive fixed in `dozKilidi` (volume thresholds excluded). tsc clean, npm test 521/521. | SHIPPED |
| 2026-09-17 | **MD-TABLO — markdown tables rendered as raw pipe text in chat** (noted in F3 #282 / F4 #283). **Trace:** every doctor-facing AI bubble (Asistan yazılı sohbet, hasta konsult, not-konsult, epikriz, SGK rapor) uses the dependency-free `components/asistan/HafifMarkdown.tsx`. It supported bold / bullets / label rows only, so `\| SB \| ACOG \|`, `\|---\|`, `## heading` and `---` showed literally. No markdown library in package.json. **Fix:** extended HafifMarkdown (no new dependency). A pure parser `lib/asistan/markdownTablo.ts` (GFM pipe tables: header + separator, alignment colons, rows with/without outer pipes, short/long rows, escaped pipes, a trailing-space separator as the model writes it) renders a real `<table>` with bold cells. `#`/`##`/`###` render as headings and `---` as a rule. The table sits in a horizontal scroll wrapper with `width: 0; minWidth: 100%`. The first attempt (`maxWidth: 100%`) still let the table's max-content width grow the chat panel to 421px on a 390px screen, left edge cut. **Verified:** `lib/asistan/markdownTablo.test.ts` (4, real answer shapes, in npm test). Real app (`next dev`, qa.kd, gstack browse): asked Fatma Çelik for a GDM 75 g vs 50+100 g SB/ACOG comparison. The real answer rendered 1 table (3 columns, 8 rows) with 0 raw `\|` / `#` / `---` lines and 0 console errors. Desktop 1280: the table scrolls inside the fixed 530px panel. **390px and 360px:** document scrollWidth = viewport, panel 16→374 / 16→344, the table scrolls inside the bubble (655px table in a 268/241px wrapper). Screenshots `smoke-out/md-tablo-{desktop,390,360}.png`. Seen in the answer: the model wrote "Conflict: true" (echo of system.md's `conflict: true` wording). Cosmetic, left as is. tsc clean, npm test 521/521. | SHIPPED |
| 2026-09-17 | **DAHILIYE-BETA-REHBERI — real dahiliye MD field-beta path, documented** (documentation only, no simulated doctor). `docs/DAHILIYE-BETA-REHBERI.md` (Turkish, for the beta internist): 0 invariable rules (asistan drafts / hekim locks, flag ≠ tanı, no dose, approved lab rows only, nothing auto-stopped/sent). 1 account + branş (onboarding Dahiliye; the tab shows for dahiliye/aile/genel doctors on adult patients; default colleague Zeynep Arslan, checked against `varsayilanPersonaId`; e-Reçete optional). 2 the `scripts/dahiliye-smoke.mts` path as doctor steps: KB + şerit + ölçüm tekniği, Belgeler lab → Asistana raporla → Onayla (unapproved rows stay out), e-Nabız PDF, the HT/DM/Lipid/KVR-SCORE2/KBH/Tiroid table, Ev kayıt / İzlem / Ön anket, Check-up birleşik rapor, 1-tap plan, Kohort panel. Every row has a "hekim kilidi" column. 3 the 7 WOW-NEXT cards with their gates (override ≥15 chars, Belgeden al, FRAX not computed, …). 5 end-of-session checklist (incl. no invented dose or guideline number). 6 what to do if something looks wrong. Every button label was checked against the UI source. Images are only the existing synthetic QA screenshots in `public/dahiliye-smoke/`, labelled "Örnek ekran — QA verisi". No invented screenshots; Vit D/B12, e-Nabız and gut have no screenshot and are described in text. Linked from `docs/README_DAHILIYE.md` and from the new `docs/beta/README.md` index, next to Dr. Gökhan's beta test lists (those were not linked anywhere before). **Found:** there is **no in-app feedback / support channel**. The guide says so and gives the current beta practice from Dr. Gökhan's lists: notes to Kaan by WhatsApp / e-posta, no patient identity. | SHIPPED |
| 2026-09-17 | **BETA-GERI-BILDIRIM-KANALI** — **DECIDED (2026-09-17):** beta döneminde in-app "Sorun bildir" **yapılmayacak**. Beta hekimler geri bildirimi **WhatsApp / e-posta** ile, **hasta kimliği olmadan** Kaan'a iletir. In-app kanal (kimliksiz ekran bağlamı + free text) **deferred until post-beta** — Kaan'dan bekleyen karar yok. Guide wording: `docs/DAHILIYE-BETA-REHBERI.md` §6, `docs/beta/README.md`. | DECIDED / deferred-until-post-beta |

| 2026-09-17 | **F1 dose-lock false positive — PPH ≥500 mL** — `uydurmaDozTemizle` no longer treats blood-loss volume thresholds (mL with ≥/≤/PPH/kan kaybı context) as invented drug doses; real mg/mcg/IU doses still locked. Regression in `lib/doktor/dozKilidi.test.ts`. | SHIPPED |
| 2026-09-17 | **citeProtocol TR-first** — citation display order SB/national TR → Temel KD → ACOG → Williams (overrides prior ACOG-first ranking for Notya display). Test updated in `sources-acog.test.ts`. | SHIPPED |

## MOBILE-REVIEW — two-day build, phone widths (2026-09-17)

Scope: everything shipped in the dahiliye wow sprint, the e-reçete / renkli reçete work, and the KD/derm prompt-lock work. Layout/rendering only; clinical logic, locks, Kaynak content and the dose guard were not touched. **Method:** real app (`next dev`, `qa.dahiliye@notya.ai`, synthetic smoke patients from `scripts/dahiliye-smoke.mts`), gstack browse (headless Chromium) at **360 / 390 / 412 / 428px** (+1280 regression). Per surface: body/document scrollWidth vs viewport; elements past their card or the viewport, including ones the global `overflow-x: hidden` silently cuts; controls under 24px; sticky behaviour when scrolled; a visual read of every screenshot. Evidence: `smoke-out/mobile-review/*-{once,sonra}.png` (gitignored, same as MD-TABLO). Temporary fixtures: synthetic `hasta_ilaclar` rows (Pantoprazol/Alprazolam/Morfin QA, no dose) on the smoke note for the split sheets, and a known PIN on the smoke portal token. Removed afterwards; the next smoke run reseeds the token.

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **Checked, already fine.** All 31 dahiliye sections (Özet, HT, DM, DM döngü, Lipid, KVR, KBH, Tiroid, Anemi, Obezite, Tarama/Aşı, İzlem, Ev kayıt, Ön anket, KY, Antikoagülan, Solunum, GI, EKG, Ramazan, the 7 WOW-NEXT cards: Polifarmasi, Hedef kartı, Sigara, Vit D/B12, e-Nabız, Gut, Osteoporoz; plus Check-up, İlaçlar, SGK rapor, Sevk): no page-level side-scroll at any width. Also fine: the expanded 1-tap plan, the check-up ledger and birleşik rapor, the nefro sevk text, the Hedef kartı table (fits at 282px), the e-Nabız upload card, the EReceteDurum strip, the RrsPaneli on the kırmızı/yeşil sheets (each color on its own sheet), and chat tables at 360–428 on /asistan, hasta konsult and not-konsult. No KD/derm UI file changed in the window (only prompts/safety), so none was re-rendered. | CHECKED |
| 2026-09-17 | **#288 (1/3):** SGK rapor select, fixed at 380px, ran past the card at all widths → `maxWidth 100%`. Görev ✓ 27×19 → 36×28; "Nota ekle" 63×19 and two lines → 28px, one line. Kohort rows didn't wrap (3-line badge ovals, 4-line button) → wrap. **Belge/lab page** 2-column grid never stacked (report in a 188px column, body 393–629px) → new `.notya-grid-yigin` (≤768px `minmax(0,1fr)`; a plain `1fr` let the lab table push the column to 629px). Lab table scrolls in its own wrapper, and "Resmi tanıya al" drops under the text. **Portal takip + ön anket:** white hero CTA on a white panel ("Gönder", "Anketi doldur" read as text), panels flush to the screen edge → `sg-pin-btn` + `.sg-fade` inset. | SHIPPED |
| 2026-09-17 | **#289 (2/3):** Ayarlar › e-Reçete 2-column inputs cut placeholders at 360 → stack. Reçete page kutu −/+ 20×20 → 28×28 (still hidden in print); "← Geri" nowrap. **Reçetem bekleyenler showed the patient name as raw JSON** `{"ad":"…"}` for every patient (`name_encrypted` is `{ad,soyad}` JSON) → `/api/doktor/rrs` GET decodes it; plain-text HL7 names pass through. | SHIPPED |
| 2026-09-17 | **3/3 — chat markdown (verifies #286 across the full answer):** the table fix held, but a long `**Label:** value` row (label track `max-content` + `nowrap`) pushed the chat panel to 445px on a 360px screen and cut the left edge, table included. Fix: `fit-content(45%) minmax(0,1fr)` with a wrapping label, plus `overflowWrap: anywhere` on the HafifMarkdown root (HastaKonsult's bubble let an unbroken token spill). Verified with a stubbed answer (wide 4-column table, long label, 90-character unbroken token, long URL, headings, rule) in the real /asistan chat, hasta konsult and inceleme not-konsult at 360/390/412/428: body = viewport, no content past the bubble, table scrolls inside; 1280 unchanged. Epikriz / SGK rapor use the same component, but their answers need a live LLM run, so they weren't rendered. Guard test in `lib/asistan/markdownTablo.test.ts`. | SHIPPED |
| 2026-09-17 | **MOBILE-STICKY-GLOBAL — no `position: sticky` in the app actually sticks** (desktop too): the vizit şeridi, DoktorNav, KD/derm strips, note header, klinik/mali/avukat navs. Cause: `app/globals.css` `html, body { overflow-x: hidden }` makes `body` a scroll container while the window scrolls. Verified: with `overflow-x: clip` sticky works (`smoke-out/mobile-review/sticky-serit-360x640-clip-deneme.png`), but then (a) the nav becomes sticky on every page, taking 65px of a 640px phone screen, and (b) the dahiliye şerit (136px tall at 360) and the KD/derm strips park at `top: 0` **under** the nav (z 100). Today the şerit simply scrolls away and covers nothing. **Not changed:** app-wide chrome behaviour beyond this review. If wanted: `overflow-x: clip` on html/body (keep `hidden` as the fallback line), strips `top: <nav height>`, and a one-line collapsed şerit under 480px. | OPEN (Kaan decision) |
| 2026-09-17 | **HEDEF-KARTI-KB-UNDEFINED** (found in the review, not layout): Hedef kartı shows "Tansiyon **undefined mmHg altı**" and the KB lock input shows "undefi". `specialties/dahiliye/engines/hedefKart.ts` reads `kbHedef.sbpUst/dbpUst`, but the HT target is stored as `{sbp, dbp}` (check-up report prints `HT: hedef: {"dbp":80,"sbp":130}`), so the status is also computed against `undefined` (always hedef dışı). Clinical logic, left for a separate ticket. | OPEN |
| 2026-09-17 | Minor, not changed: placeholders cut in narrow fixed-width dahiliye inputs ("hedef INR aralığı", "T total kalça", "uyanınca ilk sigara (dk)"); the value is still typed and shown normally. Headless caveat: native `<select>` / date pickers and the iOS 16px-focus zoom can't be judged in headless Chromium, so they need a real iPhone/Galaxy pass. | NOTED |

## KASA-BELGE-01 — "Kasadaki belge açılmıyor" (Dr. Gökhan, canlı, 2026-09-17)

Dr. Gökhan uygulamayı kullanırken bildirdi: bir hastanın Kasa'sına lab sonucu PDF'i yükledi, listede
**"Hasta I_ki laboratuvar sonuc_ları.pdf"** olarak göründü (Türkçe harfler bozuk), tıklayınca altta
dosya adı + "İndir" / "Kapat" olan bir panel açıldı ama **belge içeriği görünmedi**. Ayrıca bu
yüklemenin bir **AI değerlendirmesine** gidip sonucun **muayene formuna** eklenebilmesi gerektiğini
hatırlattı; öyle olmadığını gördüğünü söyledi.

**Yeniden üretildi** gerçek rotalarla: `next dev` + sentetik QA doktoru (`qa.dahiliye@notya.ai`) +
sentetik hasta ("TEST — Kasa Belge Smoke") + sentetik lab PDF'i (`core/lab/fixtures/sentetikLabPdf.ts`),
`scripts/kasa-belge-smoke.mts`. Dr. Gökhan'ın hesabına, hastalarına ve belgelerine dokunulmadı.
Tarayıcı doğrulaması gerçek Google Chrome ile (headless shell'de PDF eklentisi yok).

**Üç ayrı kök neden bulundu; ilk ikisi tek kaynaktan: Türkçe harfler.**

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **Belge açılmıyor = indirme rotası 404. Asıl hata CSP veya görüntüleyici değil, HTTP başlığıydı.** `app/api/doktor/documents/[id]/download/route.ts` ham dosya adını `Content-Disposition: inline; filename="…"` içine yazıyordu. HTTP başlıkları yalnız Latin-1 taşır; **ğ ş ı İ Latin-1'de yok**, Node başlığı reddedip atıyor, istek rotanın genel `catch`'ine düşüp **404 "Dosya indirilemedi"** dönüyordu. Sonuç: Türkçe adlı her belgede hem önizleme hem **İndir** ölüydü (DocumentViewer `objectUrl` alamadığı için İndir bağlantısı da tıklanmıyordu). **ç ö ü Latin-1'de olduğu için o adlar tesadüfen çalışıyordu** — hata bu yüzden "bazen oluyor" gibi görünüyordu. Ölçüldü: `ascii.pdf` 200, `sonuç.pdf` 200, `sonucları.pdf` **404**, `ığş.pdf` **404**, `çöğüş-Öçü.pdf` **404**. **Fix:** `contentDispositionAd()` (lib/vault/validation.ts) — RFC 5987: ASCII yedek `filename=` + gerçek adı taşıyan `filename*=UTF-8''…`. Sessiz 404'ün aylarca hatayı gizlemesini önlemek için rotaya `console.error` eklendi. **Verified:** indirme 200, baytlar yüklenenle birebir aynı (1191/1191), Chrome'da İndir dosyayı **"Hasta İki laboratuvar sonuçları.pdf"** adıyla kaydediyor, PDF blob iframe'de tam sayfa render oluyor (`smoke-out/kasa-iframe.png`). | SHIPPED |
| 2026-09-17 | **Dosya adı bozulması (I_ki / sonuc_ları).** `sanitizeFileName` izin listesi önceden-birleşik ("precomposed") Türkçe harfleri sayıyordu (`ğüşıöçĞÜŞİÖÇ`), ama **macOS dosya adlarını NFD (ayrışmış) verir**: "İ" = "I" + U+0307, "ç" = "c" + U+0327. Taban harf `\w` ile geçiyor, birleşen işaret listede olmadığı için `_` oluyordu — ekrandaki "I_ki" / "sonuc_ları" tam olarak bu. **Fix:** önce `normalize('NFC')`, sonra Unicode duyarlı süzgeç (`\p{L}\p{N}`), böylece Türkçe/Kürtçe/Arapça adlar aynen kalır; yol ayıracı, denetim karakteri ve baştaki nokta hâlâ temizlenir. Ayrı bir "görünen ad" alanına gerek olmadı — depolama anahtarı zaten `db:{uuid}`, dosya adı hiçbir zaman anahtar değil. **Verified:** yükleme → kayıt → liste → indirme zincirinin tamamında ad `"Hasta İki laboratuvar sonuçları.pdf"`. | SHIPPED |
| 2026-09-17 | **Aynı hata sınıfı ikinci yerde: aylık rapor PDF indirme.** `app/api/doktor/raporlar/pdf/route.tsx` ay adını başlığa ham yazıyordu; **şubat / mayıs / ağustos / kasım / aralık** (12 ayın 5'i) Latin-1 dışı harf taşıdığı için o aylarda rapor indirme 500 veriyordu. Aynı `contentDispositionAd()` ile düzeltildi. İnceleme sırasında bulundu, Dr. Gökhan bildirmedi. | SHIPPED |
| 2026-09-17 | **AI değerlendirme + muayene formu: boru hattı VAR, eksik olan bağlantıydı (keşfedilebilirlik, kod değil).** NOTYA-BELGE-01 (`Asistana raporla` → taslak rapor → resmi tanı kilidi → Onayla → SOAP Objektif) ve NOTYA-LAB-01 (`Lab` → tablo çıkar → onayla → raporla) zaten çalışıyor ve **hasta dosyası › Belgeler sekmesinde** (`PatientDocumentVault`) düğmeleri var. Ama Dr. Gökhan'ın yükleme yaptığı **`/dashboard/doktor/belgeler` ("Belge Kasası")** sayfasının liste satırlarında yalnız ad + tür + boyut + Sil vardı; sayfa çıkışsız bir arşiv gibi duruyordu. **Fix (yeni AI mantığı yazılmadı):** Kasa satırlarına aynı iki bağlantı eklendi — "Asistana raporla" → `/dashboard/doktor/hastalar/{hastaId}/belgeler/{belgeId}`, "Lab" → aynı yolun `/lab`'ı — ve listenin başına ne yaptıklarını anlatan bir satır. **Verified (uçtan uca, gerçek rotalar + gerçek Claude):** Kasa'ya yüklenen PDF → `cikar` 6 satır → `tablo_onayla` → `raporla` (taslak özet üretildi) → hekim tanısı kilitlenmeden `onayla` **400** (hekim kapısı duruyor) → tanı kilitlendi → `onayla` 200 → muayene notunun `content_objektif` alanında `[Lab] … E11.9` bloğu. Tarayıcıda: Kasa'daki "Asistana raporla" bağlantısı gerçek analiz sayfasını açıyor (taslak özet, olası tanılar + ICD-10, "Onayla → Muayene Objektif", `smoke-out/kasa-asistana-raporla.png`). | SHIPPED |
| 2026-09-17 | **Temizlik:** `DocumentViewer` içinde ölü PDF.js CDN yükleyicisi (`ensurePdfJs` / `renderPdf` / canvas + sayfa okları) duruyordu — `pdfPages` hiç set edilmediği için o kod hiç çalışmıyordu, ama "belge açılmıyor" hatasını araştıran herkesi yanlış yere bakmaya itiyordu. Kaldırıldı; PDF önizleme tek yoldan, blob iframe ile. | SHIPPED |
| 2026-09-17 | **Değişmedi, bilerek:** CSP'de `object-src` yok (→ `default-src 'self'`). Gerçek Chrome'da blob iframe PDF'i sorunsuz render ediyor (`frame-src 'self' blob:` yeterli), bu yüzden politika genişletilmedi. Ayrıca `next.config.mjs` ile `middleware.ts` iki ayrı CSP tanımlıyor; pratikte middleware'inki kazanıyor (tek başlık ölçüldü) ama **ikisi ayrışmış durumda** — `next.config.mjs`'deki kopyada `frame-src` yok. Bugün zararsız; ileride Next davranışı değişirse ya da biri yalnız birini güncellerse sessizce belge önizlemesini kırar. Tek kaynağa indirmek ayrı, küçük bir iş. | OPEN (Kaan kararı) |

**Mobil kontrol (standing rule):** 360 / 390 / 428 / 1280px, gerçek Chrome. İki bağlantı eklenince
satır 360px'te **kendi kutusunu 29px aşıyordu** (satır genişliği 290, scrollWidth 319) — sayfa
yan kaymıyordu ama içerik kesiliyordu. Düzeltme: satıra `flexWrap: 'wrap'`, dosya adına
`flex: '1 1 140px'` + `minWidth: 0`. Sonrası: her genişlikte `scrollWidth ≤ width`, 360'ta ad üstte,
üç eylem altta; 1280 tek satır, değişmedi. Ekran görüntüleri `smoke-out/kasa-mobil-*.png` (gitignored).

## RANDEVU-IPTAL-REAKTIVASYON — canlı hata, Dr. Gökhan (2026-09-17)

**Nasıl geldi.** Dr. Gökhan uygulamayı kullanırken bildirdi: bir randevuyu iptal etti, takvimde
üstü çizili göründü, sonra üstüne tıklayıp saatini değiştirdi ve Güncelle'ye bastı — randevu HÂLÂ
iptal görünüyordu. Sorusu: *"Bu randevu nasıl yeniden aktif oluyor?"* Ayrıca aynı modaldeki
doğrudan iptal düğmesinin "hiç tepki vermediğini" söyledi.

**Kök sebep 1 — iptal tek yönlü bir kapıydı (asıl hata).** Takvimin üstü çizili göstermesi BAYAT
ARAYÜZ DEĞİLDİ; veri gerçekten `durum='iptal'` kalıyordu. Saat düzenlemesinin `durum`'a dokunmaması
doğru davranış (kaydetmek bir randevuyu sessizce aktifleştirmemeli) — asıl eksik, geri dönüş
yolunun HİÇ OLMAMASIYDI. `app/dashboard/doktor/randevular/page.tsx` içinde durum değiştiren her
düğme iki kapının arkasındaydı: gün kartında `rv.durum !== 'iptal'`, modalda
`duzenlenenRandevu.durum !== 'iptal'`. Yani randevu iptal olur olmaz Onayla/Tamamlandı/Gelmedi/
Yeniden Planla/Sil dahil TÜM aksiyonlar gizleniyordu; modal "Mevcut durum: İptal" rozetinden
ibaret kalıyordu. Kodda iptal edilmiş bir randevuya başka bir durum gönderebilen tek bir tıklama
yolu yoktu — iptal kalıcıydı. Dr. Gökhan'ın sorusunun cevabı gerçekten "olmuyor"du.

**Kök sebep 2 — modaldeki İptal Et düğmesi bayat bayrak yüzünden kayboluyordu.** `duzenlemeyeAc()`
`modalIptalAcik`/`modalIptalNedeni`'yi sıfırlamıyordu ve modalı ARKA PLANA dokunarak kapatmak
(`formuSifirla()` çağırmadan sadece `setFormAcik(false)`) bayrağı açık bırakıyordu. Sonraki açılışta
aksiyon satırının tamamı (İptal Et dahil) gizli geliyor, üstelik önceki iptal nedeni metni de
duruyordu — kullanıcı gözünden "düğme tepki vermiyor".

**Kök sebep 3 — hatalar yutuluyordu.** `durumDegistir()` oturum yoksa sessizce `return` ediyor,
PATCH 4xx/5xx dönerse yanıtı hiç kontrol etmeden `yenile()` çağırıyordu; `silIslemi()` de aynı.
Her iki durumda doktor için sonuç: düğmeye bas, hiçbir şey olmasın, hiçbir açıklama çıkmasın.

**Kök sebep 4 — reaktivasyonda çift kayıt açığı (düzeltirken bulundu).** `durum` değişimi
çakışma kontrolünü hiç tetiklemiyordu. İptalden sonra o saat başka bir hastaya verilmiş olabilir;
kontrolsüz bir reaktivasyon iki randevuyu aynı saate koyardı — çift kayıt engelleme bu üründe
opsiyonel değil.

**Ne yapıldı.**
- Yeni `lib/randevu/randevuDurum.ts`: `randevuGuncellemePlani()` (bir PATCH gövdesinin hangi
  sütunlara dokunduğunu hesaplayan saf fonksiyon) + `randevuAksiyonlari()` (duruma göre hangi
  düğmelerin görüneceği). API rotası ile arayüz artık aynı cümleyi kuruyor; aksiyon listesinin iki
  ayrı yerde, iptal dalı eksik biçimde tekrarlanması hatanın ta kendisiydi.
- **"↺ Aktif Hale Getir"** aksiyonu: hem düzenleme modalında (iptal nedeni + neden Güncelle'nin
  yetmediğini anlatan açıklama ile birlikte) hem gün görünümü kartında. `durum='planlandi'` yazar,
  `iptal_nedeni`'ni temizler, `hatirlatma_gonderildi`'yi sıfırlar (hasta yeniden hatırlatma alsın).
  Modal KAPANMAZ, rozet anında "Planlandı"ya döner — Dr. Gökhan'ın yapmak istediği "aktif et +
  saatini değiştir" tek akışta bitsin diye.
- Reaktivasyon artık çakışma kontrolünden geçiyor; slot dolmuşsa 409 + "Önce saati değiştirin,
  sonra aktif hale getirin". Buna karşılık İPTAL durumundaki bir randevunun saatini değiştirmek
  artık çakışma kontrolü İSTEMİYOR (iptal satırı kimsenin önünü kesmiyor, kesilmemeli de).
- İptal edilmiş randevu gün görünümünde artık Yeniden Planla ve Sil'e de erişebiliyor (eskiden
  tek bir düğmesi yoktu).
- `duzenlemeyeAc()` ve arka plana dokunarak kapatma artık modal durumunu sıfırlıyor; `durumDegistir()`
  ve `silIslemi()` başarı/başarısızlık döndürüyor ve hatayı ekranda gösteriyor (modal açık kalıyor).
- Dokunma hedefi: `aksiyonBtn` / `modalAksiyonBtn` 28px → 36px (`minHeight` + inline-flex).

**Doğrulama.** `scripts/qa-randevu-iptal-reaktivasyon.mts` GERÇEK PATCH route handler'ını sahte
oturum + bellek içi tablo ile çalıştırıp Dr. Gökhan'ın adımlarını birebir tekrarlıyor (SENTETİK
QA doktoru/hastası — gerçek hesaba, gerçek hastaya, production veritabanına dokunmuyor, PHI yok):
oluştur → iptal (üstü çizili) → saati değiştir + Güncelle (hâlâ iptal, doğru) → Aktif Hale Getir
(Planlandı, iptal nedeni temiz) → slot dolmuşken reaktivasyon (409) → boş saate taşıyıp aktif et
(Planlandı). Regresyon testi `lib/randevu/randevuDurum.test.ts` (12 test) `npm test`'e eklendi;
596/596 yeşil, `npx tsc --noEmit` temiz. Mobil (standing rule): modalın yeni iptal bloğu 360px ve
390px'te gerçek CSS ile render edildi — yatay taşma yok, metin sarıyor, düğmeler 123×36.

---

## CLOSED — onaydan muayene formuna dönüş yolu yoktu (NOTYA-MUAYENEYE-DON-01, 2026-09-17)

**Şikayet (Dr. Gökhan, canlı).** Hasta dosyasında M-CHAT-R/F'i uyguladı, puanladı,
"Bugünkü Muayene Formuna Ekle"ye bastı. Her şey doğru çalıştı: yeşil onay paneli sonucu
("Otizm özelliği yok", puan, risk) ve "Bugünkü muayene formuna eklendi." mesajını gösterdi.
Tek eksik: oradan sonucu yazdığı muayene formuna dönecek bir bağlantı yoktu — formu menüden
elle bulmak zorunda kalıyordu.

**Paylaşılan mı, kopyalanmış mı (tarama sonucu).** İkisi birden — ve ayrım tam da düzeltmenin
şeklini belirledi:
- **Sunucu tarafı PAYLAŞILMIŞ.** `lib/doktor/gununNotunaEkle.ts` tek bir yardımcı ve ~10 rota
  onu çağırıyor (mchat, gelişim-taraması, gebelik, jinekoloji, dahiliye, göz, dermatoloji).
  Önemlisi: zaten hangi nota yazdığını (`notId`) döndürüyordu — veri hep oradaydı, kimse
  arayüze taşımıyordu.
- **Arayüz tarafı KOPYALANMIŞ (forked).** Ortak bir "eklendi" onay bileşeni YOKTU. Her tüketici
  onayı kendi yerel string state'inde tutuyordu (`setNotEklendi` / `setMesaj`) ve kendi
  `<div>`'inde çiziyordu; `calistir(body, ok)` yardımcısı 5 branş kabuğunda birbirinin kopyası.
  Yani "tek yerde düzelt, herkes kazansın" diye bir yer mevcut değildi — önce yaratmak gerekti.

**Ne yapıldı.**
- Yeni **`lib/doktor/muayeneFormuYolu.ts`** (saf, test edilebilir): `muayeneFormuYolu(notId)`
  (hekimin düzenleyip yeniden onaylayabildiği `/dashboard/doktor/notlar/[id]` sayfası),
  `MUAYENE_FORMUNA_DON` etiketi tek kaynakta, ve `eklenenNotId(yanit)` — iki farklı API yanıt
  şeklini (`{notEkleme:{eklendi,notId}}` ve düz `{ok,notId}`) tek kurala indiriyor.
- Yeni **`components/doktor/MuayeneFormunaDon.tsx`** — eksik olan ortak bileşen. Kasıtlı olarak
  ikincil: düz bağlantı, dolgu yok, 12px, uygulamadaki mevcut "Notu aç →" deseniyle aynı teal
  (#2DD4BF) — birincil yeşil onayla yarışmıyor. `notId` yoksa hiç çizilmiyor, yani not
  gerçekten eklenemediyse hekim ölü bir bağlantıya tıklayamıyor.
- Bağlanan tüketiciler (her biri kendi kopyalanmış onay kutusunda): `HastaMchat` (şikayetin
  kendisi), `HastaGelisimTaramasi`, `HastaGebelik` (izlem / lohusa / genetik tarama),
  `BugunkuJineMuayene`, `DahiliyeHome` ve `GozHome` kabukları.
- `notId`'yi zaten atan rotalara geri koyduk: göz (`olcum_nota`, `intake_nota`), dahiliye
  (`notaekle`, `kart_nota`, `polifarmasi_nota`, `anketsoap`, `htpanel`, `ekgonay`, `sgkkilit`).
- Bayat bağlantı koruması: mesaj başına bir bağlantı. `GozHome`/`HastaGebelik`'te `setMesaj`
  sarmalandı, yeni her mesaj bağlantıyı düşürüyor; yalnız gerçekten nota yazan akışlar geri
  koyuyor. Böylece alakasız bir onayın altında bir önceki notun bağlantısı asılı kalmıyor.

**Etiket.** "Muayene Formuna Dön →" — Dr. Gökhan'ın istediği sözcükler. Uygulamadaki mevcut
yakın kural "Notu aç →" (belge/lab analizi onayları); görsel dil ondan alındı ama metin
korunmadı: oradaki eylem "başka bir yerden notu aç", buradaki "az önce çalıştığın forma dön".

**Doğrulama.** `scripts/qa-muayene-formuna-don.mts` GERÇEK `POST /api/doktor/mchat` handler'ını
ve GERÇEK `wow4Post` (dahiliye "Nota ekle") fonksiyonunu sahte oturum + bellek içi tablolarla
çalıştırıyor (SENTETİK QA doktoru/hastası — gerçek hesaba, gerçek hastaya, production
veritabanına dokunmuyor, PHI yok). Dr. Gökhan'ın senaryosu birebir: 20 soru normal yanıtlandı →
0/20 "Otizm özelliği yok" → forma eklendi → bağlantı çıkıyor ve **tam olarak** satırın yazıldığı
nota gidiyor (genel not listesine değil), önceki not içeriği korunuyor. İkinci tüketici (dahiliye
taraması, ayrı/kopyalanmış onay arayüzü) aynı şekilde doğrulandı. Negatif durum: bugün muayene
yoksa onay da bağlantı da çıkmıyor. Regresyon testi `lib/doktor/muayeneFormuYolu.test.ts`
(8 test) `npm test`'e eklendi; **607/607 yeşil, `tsc --noEmit` temiz**.

**Mobil (standing rule).** Yeni onay satırı gerçek inline stilleriyle 360px ve 390px'te render
edildi: yatay taşma yok (ölçüldü, taşan öğe listesi boş), bağlantı mesajın altına sarıyor,
dokunma hedefi 149×36 (12px metin korunarak `minHeight: 36` ile büyütüldü — repo'nun 36px
dokunma hedefi kuralı).

**Açık kalan (kapsam dışı bırakıldı, kasıtlı).** Göz rotasının `olcum_nota`/`intake_nota`
adımları not eklenemediğinde HTTP 200 + `{ok:false}` dönüyor; kabuktaki `calistir` yalnız HTTP
durumuna baktığı için bu halde yine de başarı mesajı yazıyor. Bu ÖNCEDEN VAR OLAN bir etiketleme
hatası, bu iş onu yaratmadı ve büyütmedi (bağlantı o durumda doğru şekilde çıkmıyor). Ayrı bir
düzeltme hak ediyor.

**Branş kapsamı (cross-specialty-parity).** Bu dal açıldığında
`.cursor/skills/cross-specialty-parity/SKILL.md` henüz yoktu; #296 ile main'e indi ve merge
sırasında alındı, sözleşme geriye dönük uygulandı. Kapsam bloğu PR gövdesinde.
## CROSS-SPECIALTY-PARITY — standing rule + retroactive sweep of 2026-09-17 (Kaan)

**Standing rule, now a skill.** `.cursor/skills/cross-specialty-parity/SKILL.md` (new; sits beside
`specialty-audit-report` and `specialty-hasta-portali`, neither touched). It says: a fix is reported
from one branş's screen but is not finished until you can name which of Notya's 30 registry branches
(`lib/doktor/specialties.ts`) it reaches and why. Before closing any change to the shared spine
(SOAP, İnceleme/onay, reçete/Medula, Belge Kasası, randevu/takvim, epikriz, Asistan sohbet, Sağlığım
kabuğu, intake, lab çıkarım, doz/kaynak kilidi), name the shared files you touched; for the ~26
baseline-only branches a properly-scoped shared fix covers them **by construction** with no
per-branş verification — the single exception being behavior gated by specialty (`users.specialty`,
`SpecialtyKey`, `specialtyProfile`, persona id, eligibility rule), which must be walked; and for each
chapter that owns a `specialties/<slug>/` folder, check individually whether it forked the thing you
fixed (its own `prompts/system.md` wording, its own copy of a UI component or guard) and would
therefore miss it. The chapter list is **read live** (`ls specialties/` + the `CHAPTERS` map in
`lib/specialties/registry.ts`), never hardcoded, because it grows every sprint. Every shared-spine PR
must carry a **"Branş kapsamı"** block naming what was checked; "fixed X" alone is not enough, and
"no fork found, nothing to do" is an expected, valid result — inventing chapter changes to have
something to show is listed as an anti-pattern.

**Retroactive sweep — today's shared-spine fixes, what was checked.** Commits reviewed by diff (not
title): F1 doz kilidi (#280), F2 varsayılan persona (#281), F3 ham JSON yanıt (#282), F4 iç alan /
uydurma form adı (#283), KD-KAYNAK-KILIDI + MD-TABLO (#286), PPH doz-kilidi FP (07ef910),
MOBILE-REVIEW 1–3 (#288/#289/#290), DAH-LAB-BELGELER ortak lab motoru (#276),
RANDEVU-IPTAL-REAKTIVASYON (#294), KASA-BELGE-01 (#295). Chapters checked individually: dahiliye,
dermatoloji, kadın-doğum (göz-hastaliklari excluded — another agent was mid-build on it).

*Correctly shared, no fork anywhere, nothing to do:* F3 `lib/asistan/yanitCoz.ts` and F4
`lib/doktor/klinikMetin.ts` run ungated on both the chat and SOAP paths. F2 `varsayilanPersonaId`
resolves through `findSpecialistForSpecialty` over the whole 30-specialist catalog. The MD-TABLO
renderer (`lib/asistan/markdownTablo.ts` + `components/asistan/HafifMarkdown.tsx`) has no forked copy
— every consumer (İnceleme, epikriz, SGK rapor, konsült, sohbet) imports the shared one. Kasa
(`lib/vault/validation.ts`, `components/doktor/DocumentViewer.tsx`), randevu (`lib/randevu/randevuDurum.ts`,
`app/api/doktor/randevular/`) and the lab engine (`core/lab/cikarim.ts`) likewise have no chapter
copy. The MOBILE-REVIEW work split cleanly: `.notya-grid-yigin` and the portal pages are shared, the
rest were dahiliye-only components with no derm/KD counterpart to mirror.

*Found and fixed — the dose-invention guard reached 4 branches out of 30.* F1 built the guard in
shared files (`lib/doktor/dozKilidi.ts`, `lib/doktor/soapUret.ts`, `app/api/asistan/chat/route.ts`)
but gated it behind `dozKilitliBrans` — dahiliye, kadın doğum, dermatoloji, göz. The other ~26
branches ran the same SOAP and chat code with **no backstop at all**: a kardiyoloji note carrying
"metoprolol 50 mg" the hekim never said, or a pediatri note with an invented mg/kg, shipped as
written. Split into two strengths rather than widening the gate, because the guard does two different
jobs: `soapDozKilidi` (unchanged, chapters only) is the full lock and also strips `doz`/`kullanim`
from `receteOnerisi` — that is a **product policy** their prompts promise, and forcing it on pediatri
would delete the kg/doz reçete önerisi that NOTYA-SOAP-02 §3 designs for. New `soapDozUydurmaKilidi`
applies the **safety backstop only** (invented dose → `[doz hekim tarafından belirlenir]` + a
"⚠ Doz kontrolü (hekim onayı)" line in aiDegerlendirme) and now runs for every other branch; a dose
the hekim actually dictated is still passed through untouched, and receteOnerisi doses survive. The
chat cleaner was hoisted out of the `dozKilitliBrans` block so it runs for all branches, with the
chapters additionally told in-bubble why a number disappeared (matching how KD's kaynak kilidi
already behaves there).

*Found and fixed — dahiliye's own prompt had drifted behind KD/derm.* F1 wrote a full
`## Doz kilidi (kırılmaz)` block into `specialties/{kadin-dogum,dermatoloji}/prompts/system.md` but
gave dahiliye only the code refactor, leaving its terser rule #2 without the three clauses that stop
the model writing a number in the first place: don't invent from memory/guideline, pass a dictated
dose through unchanged instead of "correcting" it, and give no number when asked for a dose in chat.
Added those to dahiliye's `Kırılmaz kurallar` #2 (so they reach the compact voice lock too) plus a
full `## Doz kilidi (kırılmaz)` section with dahiliye's own drug scope (antihipertansif, statin, OAD,
SGLT2i/GLP-1, insülin titrasyonu, antikoagülan, levotiroksin, allopürinol/kolşisin, D vit/B12,
bifosfonat, demir, PPİ, antibiyotik), matching the KD/derm pattern. Asserted in
`specialties/dahiliye/tests/promptsLock.test.ts`.

*Checked, correctly NOT generalized.* The citation lock (`lib/doktor/kaynakKilidi.ts`) stays KD-only
by construction: it needs a per-chapter verified-source list to compare against
(`specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar.ts`), and running it without one would
strip every citation as unverified. Extending it is a **chapter build** (each chapter authors its own
verified list), not a missing parity fix — noted here so the next chapter sprint picks it up rather
than assuming the guard already covers them.

Ship bar: `npx tsc --noEmit` clean, `npm test` 605/605 (was 600 — 5 new parity tests).

## HASTA-FORMU-SIGORTA-OPSIYONEL — Dr. Gökhan, canlı, 2026-09-17

**Nasıl geldi.** Dr. Gökhan ekran görüntüsüyle bildirdi: Hasta Bilgi Formu'nun 4. bölümünde
(**Sağlık Güvencesi**) üç alan kırmızı yıldızla zorunlu işaretliydi — **Özel Sigorta Şirketi**,
**Poliçe / Üyelik Numarası**, **Kurum / İşveren Adı** — oysa üçünün de ipucu metni zaten
`Yoksa "Yok" yazın` diyordu. Hastaların çoğunun özel sigortası yok; alan zorunlu kaldığı için
hasta formu gönderebilmek adına kutuya **"Yok" yazmak zorunda** kalıyordu. Talep: alanlar kalsın,
ipucu kalsın, **zorunluluk kalksın**.

**Kök sebep — şema ile ipucu metni ayrışmıştı.** `lib/intake/coreAlanlar.ts` alan başına tek bir
`zorunlu` bayrağı tutuyor; hem formun kırmızı yıldızı, hem istemci doğrulaması, hem sunucu
doğrulaması bu bayraktan okuyor. Üç alanda bayrak `true` bırakılmış ama placeholder "yoksa boş
geçebilirsin" diyordu. Tek satırlık bir çelişki, ama hastaya "Yok" yazdırdığı için veriyi de
kirletiyordu: "Yok" dizesi ile boş alan aynı bilgiyi taşır, ikincisi dürüst olanı.

**Ne yapıldı.**

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-17 | **Üç sigorta alanından `zorunlu: true` kaldırıldı** (`lib/intake/coreAlanlar.ts`). Alanlar da ipucu metinleri de aynen duruyor — yalnız kırmızı yıldız ve doğrulama gitti. `sigortaTuru` (Sağlık Güvenceniz: SGK / özel / ücretli) **zorunlu kaldı**: onda "Yok" ipucu yok ve hangi güvenceyle geldiği klinik/mali olarak gerçekten gerekli. | SHIPPED |
| 2026-09-17 | **Aynı desen dört yerde daha vardı, hepsi düzeltildi.** Dr. Gökhan üçünü bildirdi ama `yoksa "Yok" yazın` ipucu taşıyan başka zorunlu alanlar da vardı: çekirdekte **Geçirdiğiniz Ameliyatlar** ve **İlaç Adı ve Dozu**, pediatri uyarlamasında **Özgeçmiş — Hastalık / Ameliyat** ve **Kullanılan İlaç / Takviyeler**. Kural: ipucu metni "yoksa boş bırakabilirsin" diyorsa alan zorunlu olamaz — nerede geçerse geçsin. Toplam **7 alan** isteğe bağlı oldu. | SHIPPED |
| 2026-09-17 | **Zorunluluk/desen kuralı tek gövdeye indirildi** (`lib/intake/dogrula.ts`). Kural aynı anda iki yerde yaşıyordu: `app/intake/[token]/page.tsx` içindeki gönder döngüsü ve `app/api/intake/[token]/route.ts` içindeki sunucu döngüsü. İkisi de artık `intakeIlkHata()` çağırıyor, yalnız hastaya gösterilen metni kendileri biçimlendiriyor (sunucu mesajları birebir korundu). İstemcideki elle yazılmış TC kontrolü de kalktı — şemadaki `desen`/`desenHata` zaten aynı kuralı, aynı Türkçe mesajla taşıyor. Ayrıca boş + isteğe bağlı bir alan artık desen kontrolüne takılmıyor. **Birleştirirken çıkan yan bulgu:** istemcinin boşluk testi `!yanitlar[id]` idi ve `[]` (hiç seçim yapılmamış checkbox-grup) JavaScript'te truthy olduğu için istemci bunu DOLU sayıyordu; sunucu ise boş sayıp 400 dönüyordu. Yani zorunlu bir checkbox grubunu hiç işaretlemeyen hasta, istemciden geçip sunucudan geri çeviriliyordu. Ortak gövdede `[]` artık iki tarafta da boş. | SHIPPED |
| 2026-09-17 | **Downstream: bağımlılık yok, tek pürüz düzeltildi.** `sigortaSirketi` hiçbir yerde okunmuyor; `policeNo`/`kurumAdi` yalnızca `lib/doktor/hastaDosyaDerleyici.ts`'in **gizli** listesinde (AI'ya hiç gönderilmiyorlar) ve derleyici zaten `v == null \|\| v === ''` olanı atlıyor. `hastaKaydinaAktar.ts` boş değer yazmıyor (`yaz()` boşu eler, `kronikHastaliklar` "yok"u süzer), `kullanilanIlaclar` boşken `kullaniyorMu='Hayır'` yedeği devrede. SGK rapor şablonlarındaki `kurumAdi` **başka bir alan** (doktorun Medula tesis bilgisi), intake formuyla ilgisi yok. Tek gerçek pürüz: doktorun inceleme görünümünde (`components/doktor/HastaIntake.tsx`) boş dize satırı bomboş bırakıyordu — `degerGoster()` yalnız `null/undefined` için `—` basıyordu. Boş dize ve boş dizi de artık `—` basıyor. | SHIPPED |

**Doğrulama.** `scripts/qa-intake-sigorta-opsiyonel.mts` **gerçek** `POST /api/intake/[token]`
route handler'ını, PostgREST'i fetch seviyesinde taklit ederek çalıştırıyor — **sentetik** hasta,
sentetik token, sentetik şifreleme anahtarı; production veritabanına, Dr. Gökhan'ın hesabına veya
gerçek bir hastaya dokunmuyor, PHI yok. Üç sigorta alanı (ve "Yok" ipuçlu diğerleri) **boş**
gönderildi: **HTTP 200**, `durum='dolduruldu'`, kayıtta değerler `["","",""]`, hasta kaydına
aktarım boşlarla sorunsuz çalıştı. Karşı kontrol: `ad` boşken hâlâ **400** — zorunlu alan koruması
duruyor. Regresyon testi `lib/intake/coreAlanlar.test.ts` (4 test) `npm test`'e eklendi; içinde
şemayı tarayıp `yoksa "Yok" yazın` ipuçlu **hiçbir** alanın zorunlu olmadığını doğrulayan bir test
var, yani ipucu ile bayrak bir daha ayrışamaz. Testin gerilemeyi gerçekten yakaladığı, bayrak
geçici olarak geri konularak ölçüldü (3 test kırmızıya döndü). main ile birleştirildikten sonra **616/616 yeşil,
`npx tsc --noEmit` temiz.**

**Mobil kontrol (standing rule) — YAPILMADI, gerekçesi:** bu hotfix worktree'sinde Supabase
kimlik bilgisi yok, dolayısıyla geçerli bir intake token'ı üretilemiyor ve form sayfası canlı
render edilemiyor (token'sız sayfa yalnız hata dalını gösterir). Görsel delta yalnızca **karakter
çıkarıyor**: etiketten satır içi ` *` kalkıyor, doktor görünümünde boş hücre `—` oluyor. Yeni
düğme/panel/rozet/sayfa yok, hiçbir kutu genişlemiyor. Yine de gerçek cihazda göz gezdirilmesi
gerekirse Kaan'ın bir sonraki oturumunda 15 saniyelik bir kontrol yeter.
