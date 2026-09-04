# OPEN COMMITMENTS — Notya AI

**Why this file exists.** Work agreed in a session and deferred to "next time" was getting lost and
resurfacing weeks later as "why was this never done?". Chat history is not a tracking system.
Anything deferred goes here with a date and who it waits on, or it does not count as agreed.

Last reviewed: 2026-09-01 (randevu sistemi #44 merged)

---

## Waiting on the founder

| Since | Item | Why it matters |
|---|---|---|
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
| 2026-09-04 | **Sağlığım portal visual redesign (agency-grade)** | Current UI is functional IA + calm shell, not a paid design system. Founder feedback: not $3k-caliber. Needs a deliberate redesign pass (references, typography/layout craft) before selling as premium patient experience. |
| 2026-09-04 | **Sağlığım portal access gate (PIN/OTP)** | Today: bearer link only (30-day token). Health data warrants a second factor — recommend SMS/e-posta OTP or doctor-set PIN at link creation. Awaiting product choice before build. |

## CANLI OTURUM TO-DO (Dr. Gökhan) — 2026-09-03 itibarıyla açık defter
Kural: canlı oturum sırasında gözlemlenen HER şey (hata, sürtünme, istek, fikir) anında buraya işlenir; oturum sonrası önceliklendirilir. Çözülen kalemin durumuna [x] konur.

| Zaman (TRT) | Gözlem | Tür | Durum |
|---|---|---|---|
| 2026-09-03 14:15–14:28 | Seansı Bitir 2x500+504 — maxDuration + toleranslı parse ile çözüldü (PR #89) | hata | [x] |
| 2026-09-03 ~15:00 | e-Reçete "Sunucu hatası" — Groq ölü anahtar; Anthropic geçişi (PR #90, #91) | hata | [x] |
| 2026-09-03 15:39–15:48 | Dr. Gökhan 3 referans linki gönderdi: notlar Türk anamnez geleneğinde yazılmalı (şikayet→hikaye→özgeçmiş→soygeçmiş→alışkanlıklar; FM→lab→tanı→tedavi akışı). Motor kuralları revize edildi (PR #95). 3. link bozuk/eksik — yeniden istenecek | istek | [x] |
| 2026-09-03 ~16:10 | 3. link içeriği Kaan üzerinden geldi: FM sistematiği (genel durum + İns/Palp/Perk/Osk, batında İns→Osk→Perk→Palp, sistem terminolojisi). Objektif kuralı sistematik düzene genişletildi (PR #96) | istek | [x] |
