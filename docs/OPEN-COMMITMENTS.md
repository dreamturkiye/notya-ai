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
| 2026-09-16 | **NOTYA-DAH-WOW-NEXT — recorded for the following sprint** (waits on Kaan's go after DAH-WOW ships): yaşlı polifarmasi deprescribing (STOPP/START); hasta hedef kartı + Turkish eğitim yaprakları; sigara bırakma paketi (ALO 171 + SGK rapor); Vit D / B12 eksikliği + SGK rapor kuralları; e-Nabız geçmiş PDF → Belgeler import; gut/ürik asit card; osteoporoz DXA T-skoru card (TEMD_OSTEO). | OPEN |

## DAH-WOW build log (Claude builds, 2026-09-16)

| Tarih | Kalem | Durum |
|---|---|---|
| 2026-09-16 | **DAH-WOW Wave 0 SHIPPED** — W0.1 prompts/ lock (`specialties/dahiliye/prompts/system.md`, `soap-dahiliye.md`, `asistan-ogrenme.md`, `tools.ts`); W0.2 Rx→hasta_ilaclar: already live since PR #150 (muayene onayı writes hasta_ilaclar; dahiliye reads it live, no fork) — İzlem sekmesi reads the same rows; W0.3 kart contract (`engines/kart.ts`, `dahiliye_kart_kilitleri`, adım `kilit` with allowed-field validation); W0.4 vizit şeridi (`engines/serit.ts`, sticky bar + 1-tap plan taslağı + kopyala). | SHIPPED |
| 2026-09-16 | **DAH-WOW Wave 1 — core SHIPPED**: W1.1 şerit live; W1.2 KVR (`engines/score2.ts`: kural kovası ASKVH/DM+TOD/KBH → LDL hedef → statin yoğunluk açığı; SCORE2 katsayıları EHJ 2021 suppl. p9 değerleriyle kodda, **SCORE2_ONAYLI=false kilidi**: sayısal risk doğrulamaya kadar dönmez; SCORE2-OP/Diabetes ledgered); W1.3 CKD KDIGO (`engines/ckd.ts`, ısı haritası, kronisite, hızlı düşüş, plan, nefro sevk paketi → sevkler); W1.5 ev kayıtları (`dahiliye_ev_kayitlari`, `engines/evKayit.ts` beyaz önlük/maskeli, glukoz hipo); W1.6 ilaç izlem takvimi (`engines/ilacIzlem.ts`, 13 kural, görevler dahiliye_gorevleri'ne). Migration 039. UI `DahiliyeWow.tsx` (KVR · KBH · İzlem · Ev kayıt sekmeleri). KANONIK: UACR, Retic eklendi. | SHIPPED |
| 2026-09-16 | **DAH-SCORE2-VERIFY** — waits on Claude (1 fetch): compare `engines/score2.ts` KATSAYI/OLCEK with EHJ 2021 ehab309 Updated Supplementary p9 (SCORE2 coefficients, S0 0.9605/0.9776, region scales), add 3 published worked examples to tests, flip `SCORE2_ONAYLI=true`. Until then the KVR card shows kural kovası + "doğrulama bekliyor". | OPEN (Claude) |
| 2026-09-16 | **DAH-SCORE2-OP / DAH-SCORE2-DIABETES** — waits on Claude: OP coefficients (ehab312 Table 2 — partially fetched) and SCORE2-Diabetes (ehad260) as separate engines with the same ONAYLI gate. | OPEN (Claude) |
| 2026-09-16 | **DAH-WOW W1.4 SGK rapor şablonları SHIPPED** — `specialties/dahiliye/engines/sgkRapor.ts` + `tests/sgkRapor.test.ts` (HT/DM/statin/DOAK ilaç kullanım raporu; etken madde yalnız hasta_ilaclar, lab yalnız onaylı, T.C./ad saklanmaz, CHA₂DS₂-VASc hekim işaretli, mekanik kapak DOAK kilidi engeli); migration `040_dahiliye_sgk_rapor.sql`; `app/api/doktor/dahiliye/route.ts` adım sgkrapor/sgkkilit (e-Nabız zarfı `enabizSgkRapor`, hekim kimliği Medula ayarından); UI `DahiliyeWow.tsx` "SGK rapor" sekmesi (yazdır/PDF, zarf kopyala, hekim onayı). Wave 1 complete. | SHIPPED |
| 2026-09-16 | **DAH-WOW W1.5 portal entry** — ev kayıtları today are hekim-entered; portal (hasta) entry lands with W2.7 ön anket. | OPEN (Claude) |

