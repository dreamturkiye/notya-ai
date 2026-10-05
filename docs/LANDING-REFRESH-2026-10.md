# Landing refresh — 2026-10-05 (NOTYA-LANDING-2026-10)

Brief: Kaan, 2026-10-05. Branch `claude/landing-page-refresh-2026-urhwhg`, based on `origin/main` at `ea5a873`. Not merged, no auto-merge.

## /doktor — what changed
Section order now: Hero → Konuşma (Ayşe) → Muayene sonu → Hasta portalı → Konsültasyon → Randevu ve iletişim → Branşınıza özel → Takip → Öğrenme → Güvenlik ağı (+ trust strip) → Fiyat → CTA.
- Hero: brief's eyebrow, H1 and lede. The 4-item strip under the hero is `30 branş · Sesli, gerçek zamanlı · Hasta portalı dahil · Her adım hekim onaylı`. The photo caption now reads "Muayenehane · görsel referans" and no longer names a location.
- Konuşma: lede tightened ("İki saniyede yanıt" removed). The bullets are now the brief's first two (see dropped lines).
- New sections are in `components/doktor-landing/practice.tsx`, using a shared pattern in `feature.tsx`: eyebrow, display heading with an italic pine second line, lede, bullets, and a typographic card. No screenshots.
- Branşlar: the names come from the `SPECIALTIES` registry in `lib/doktor/specialties.ts` (30), plus the three example cards. `app/doktor/page.tsx` is now a server component, so only the labels reach the page. The registry's other fields (agent env-var names, references) stay out of the client bundle.
- Öğrenme: the lede now describes the outcome ("Tercihlerinizi hatırlar…"), not how learning works.
- Güvenlik: textbook name replaced with "Kılavuza göre"; "SGK kısıtlaması" is now "SUT kuralı". Trust strip: KVKK, AES-256, SUT and "Notya karar desteğidir; tanı ve tedavi kararı hekime aittir."
- Removed: the textbook ticker (`ticker.tsx`) and the three persona cards with textbook lines (`specialists.tsx`).
- Meta: title "Notya — Hekimler için yapay zekâ klinik asistanı" and a new description.
- Footer tagline is "Hekimler için yapay zekâ klinik asistanı"; the bottom line reads "KVKK · AES-256 · Türkçe".
- Pricing and CTA: layout and prices unchanged. The Pabau items were removed from the plans (rule 1 overrides "unchanged"). Fiyat eyebrow renumbered to 10.

## /klinik — what changed
Order now: Hero → Hasta portalı → Dallar → trust line → Fiyat → CTA.
- Removed sections: the old hero facts strip, the Branşlar index (descriptions full of method names: FUE/DHI/ICD-10/DSM-5/ICF, and the 29.03.2025 tag), İşleyiş, Güvenlik (model and pseudonymisation mechanism), and Entegrasyonlar (Pabau + trademark note).
- Dallar: names only, in the brief's order.
- Trust line: "Notya kayıt ve takip aracıdır; tanı ve tedavi kararı hekime aittir."
- Meta: title "Notya Klinik — Kliniğiniz ve hastanız aynı sayfada" and a new description.
- **Hero H1 and lede are not the brief's.** Both claimed automatic follow-up, care due dates, team permissions and messaging, which main cannot back up (see rule 5). I replaced them with confirmed claims only:
  - H1: "Kliniğiniz ve hastanız / aynı sayfada."
  - Lede: "Notya kliniğinizin dalına göre kurulur ve her hastanıza, uygulama indirmeden açılan şifreli bir sayfa verir."
  - Swap in the brief's copy once the klinik features ship.

## Every claim removed
- Integrations: Pabau (klinik section, trademark note, klinik meta, PROOF line "Klinik yazılımına SOAP ve ICD-10 aktarımı", plan items in Pro, Uzman, Klinik 5 and Klinik 10), "Medula kısıtlamaları". No e-Reçete, e-Nabız, Google Calendar or WhatsApp claims existed on either landing.
- Textbooks and guidelines: Nelson, Braunwald, Harrison, Harriet Lane, Adams & Victor, DSM-5-TR, ESC 2024. They were in the hero lede, hero facts, ticker, persona cards, a conversation bullet, two sample dialogues and the safety quote.
- Softening: "Türkiye'nin ilk yapay zekâ tıp uzmanı", "· İstanbul" (eyebrow), "tanı alın", "Cebinizdeki uzman". The location-specific photo caption "Nişantaşı, İstanbul / Oda 01" was also removed.
- Sample dialogue: "Akut otitis media." is now "Akut otitis media ile uyumlu." (decision support, not a diagnosis).
- Mechanism and infra: "AB Frankfurt" (footer line and KVKK proof), "Tam denetim kaydı", "GCM", the klinik "kimlik bilgileri modele gitmeden takma adla değiştirilir" block, "İki saniyede yanıt".
- Klinik: "Her koltuğa bir uzman", "10 klinik dalı", "KVKK · 29.03.2025 yönetmeliği", the yönetmelik note, and the per-branch method descriptions.
- No demo links existed on either landing, nav or footer. Nothing to remove there.

## Demo routes — how they are gated
- `components/demo/DemoOturumKapisi.tsx` is a client gate using the dashboard's pattern: `ensureDoctorAccessToken()` from `lib/doktor/clientAuth.ts`, then `GET /api/users/me` with the bearer token. With no session, or a non-OK response, it calls `router.replace('/giris')`. Nothing renders until the check passes.
- Wrapped in the layouts of `/portal/demo`, `/portal/demo-goz` and `/portal/demo-kbb`, and in a new `app/konsultan/demo/layout.tsx`. All four export `robots: { index: false, follow: false }`.
- Signed-in in-app links keep working: any valid Notya session passes, whatever the profession. No in-app links to these routes were found on main.
- There is no sitemap or robots file in the repo (`app/robots*`, `app/sitemap*` and `public/robots*` are all absent), so there was no allow list to edit.
- Verified on a local production build with headless Chromium: all four routes send an anonymous visitor to `/giris` and serve `<meta name="robots" content="noindex, nofollow"/>`.
- **Limitation:** the session lives in localStorage, so the gate is client-side, the same as the dashboard. The synthetic fixtures (no PHI) still ship in the JS bundle and RSC payload, so a determined visitor could read them. A server-side gate needs cookie-based auth, which the app does not have.
- `/sandbox/dr-ayse/*` was found and left alone. It is a test harness whose APIs already require a sandbox token (`requireSandboxAuth`), not a public demo. Gate it too if you consider it a demo.

## Capability lines dropped or narrowed under rule 5
Verified against `ea5a873`.

Doktor:
- "Gerekçesini gösteren klinik öneri" (Konuşma bullet): **dropped.** Reasoning is shown only for dose suggestions; the main assessment prompt says "gerekçe yazma".
- Muayene sonu body "Not, reçete taslağı, rapor, kontrol randevusu ve hastaya gidecek özet aynı ekranda, sırayla.": **narrowed** to "Muayene sonu adımları sırayla önünüzde." `MuayeneSonuPaketi` is a checklist of links to separate tools, not one screen showing the note and drafts. The bullets (templates, kontrol randevusu, portal summary) are confirmed.
- "Hatırlatmalar kendiliğinden gider" (Randevu bullet): **dropped.** Reminders auto-send only through a connected channel; otherwise they wait in a queue for a one-tap send.
- Takip "sonucu bekleyen": **dropped** from the body and the card. Pending results are not in the worklist. Overdue controls, missed follow-ups and the one-tap reminder are confirmed.
- KVKK "Kişisel veriler Türkiye'de ve AB Frankfurt'ta. Tam denetim kaydı.": **replaced** with "KVKK'ya göre kurgulandı. Saklama süresi dolan veri imha edilir." No region setting in code; `auditLogger` is used in 2 routes; the imha cron exists.
- AES-256 "Seanslar … şifrelenir": **corrected** to "Hasta kimlik bilgileri şifrelenir." Transcripts and SOAP fields are stored unencrypted; identifiers use AES-256-GCM.

Klinik (all four sections dropped):
- Ekip ve yetki: klinik roles are only member/admin, and nothing limits what a member sees. The sekreter role exists only in the doktor vertical.
- Seans ve randevu: no session series, and control dates are not on the calendar.
- İşlem sonrası bakım: due dates are computed by tools but not saved; the overdue list reads a field nothing writes; there is no reminder button.
- Kayıt ve onam: no per-patient checklist. Consent ticks and the "RIZA EKSİK" flag are device-local only.
- Hasta portalı: "kontrol tarihleri" removed from the body. Patient-specific control dates are not passed to the portal; care instructions are generic per branch. Link + PIN and messaging are confirmed.

## Checks
- `npx tsc --noEmit`: pass.
- `npm run build`, first run: compiled, then failed collecting page data for `/api/asistan/avukat-chat` ("supabaseUrl is required"). This container has no Supabase env; the route is unrelated to this change.
- `npm run build` re-run with placeholder `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: pass.
- Landing CSS was recompiled with `tailwind.doktor.config.js` (per `docs/SITE-MAP.md`). Recompiling unchanged main reproduced the committed file byte for byte first.
- Guard tests `brans-alan-sizmasi`, `brans-alan-sizmasi-rotalar`, `klinikErisim` and `klinikDikey`: 55/55 pass.
- 390 px and 1366 px renders of both pages: no horizontal overflow.

## Could not verify
- The signed-in path through the demo gate. No real Supabase session is available here; the logic is the dashboard's own.
- Whether data actually resides in Frankfurt (infra, not code). Removed from copy rather than asserted.
- Kept untouched because pricing and CTA are "unchanged":
  - "ICD-10 kodlama" in the Pro plan, a classification name.
  - "Özel yapay zekâ ayarı" in the Uzman plan.
  - "Ekibinizi dakikalar içinde ekleyin" in the klinik CTA. Invites work, but by a code shared by hand.
  - "Muayenehanenize bir meslektaş daha" in the doktor CTA.

  Flag any of these for the legal review (OPEN-COMMITMENTS NOTYA-LANDING-2026-10a).
- "Elli hasta, yorgun bir gün" (safety heading) is kept as rhetoric, not a statistic.
