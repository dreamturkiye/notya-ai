# Notya — Site Map & Wiring (read this first, then do not re-derive it)

Generated 2026-09-01 for live-session speed. Production: https://notya-ai.vercel.app (Vercel team `getvelacom`, project `notya-ai`, prod branch `main`). Repo `~/notya-ai`. Supabase project ref `anjayzospuurymjmmtim`.

## Change loop
- Edit → `npm run -s typecheck` (ignore TS5101 baseUrl warning) → commit on a branch → `git push -u origin <branch>` → `gh pr create` → `gh pr merge N --merge --admin --delete-branch` → Vercel builds ~50s → live. A local pre-push hook blocks direct pushes to `main`; the PR + admin-merge path is the fast loop (~2 min end to end).
- Local preview: `npx next dev -p 3199` (keep osascript calls < 30s; run it with nohup).
- Landing CSS is PRE-COMPILED: `/doktor` and `/klinik` import `app/doktor/utilities.css`, built by `npx tailwindcss -c tailwind.doktor.config.js -i app/doktor/tw-source.css -o app/doktor/utilities.css --minify`. Any Tailwind class change on those two pages requires rerunning that; any new page importing that CSS must be added to the config's `content`.
- `"use client"` pages: `export const dynamic` is ignored; `useSearchParams` needs `<Suspense>`.
- Migrations: `lib/db/migrations/*.sql`, applied with `node scripts/run-sql-migration.mjs <file>` (uses SUPABASE_DB_URL from .env.local).

## Auth (two conventions)
- **NOTYA-AUTH-01, solo-doctor routes**: `lib/doktor/serverAuth.ts` → `doktorOturum(req)` returns `{user, supabase(service-role)}` or `{hata}` (401 "Oturum bulunamadı. Lütfen tekrar giriş yapın."). Assumes doctor_id === auth.uid() — use this for anything a sekreter must NEVER reach (clinical notes, e-reçete, SGK, billing).
- **NOTYA-RANDEVU-01, shared doctor+staff routes**: `lib/doktor/pratikOturum.ts` → `pratikOturum(req)` returns `{user, supabase, doktorId, rol: 'doktor'|'sekreter', personelId?}`. Resolves doktorId via the `personel` table if the caller is a sekreter, else doktorId = caller's own id. ALWAYS scope by `doktorId`, never `user.id`, in routes using this convention. `sadeceDoktor(oturum)` guard rejects sekreter with 403.
- Client: `lib/doktor/clientAuth.ts` → `ensureDoctorAccessToken()` (refreshes), `getDoctorAccessToken()` (sync), `DOKTOR_GIRIS='/giris/doktor'`. Session lives in localStorage `auth-token` or `sb-<ref>-auth-token`. Same login page/session works for both doktor and sekreter — role is resolved server-side via `/api/personel/me`, not by which page they logged in through.
- Login pages: `/giris` (chooser) → `/giris/doktor`, `/giris/avukat`, `/giris/mali`. Signup `/kayit` → `/onboarding` (profession picks vertical). Sekreter accounts do NOT go through `/kayit` — they're created via `/api/personel/kabul` (admin.createUser, email_confirm:true) after accepting an invite at `/davet/personel/[token]`, bypassing the SMTP blocker entirely.

## Verticals → surfaces → files
| Vertical | Landing | Dashboard | Voice/chat asistan | Nav component |
|---|---|---|---|---|
| Doktor | `/doktor` (`components/doktor-landing/*`, `content.ts` holds copy + PLANS + CLINIC_PLANS) | `/dashboard/doktor/*` | `/asistan` (`lib/asistan/personaEngine.ts`, `specialistsCatalog.ts`, `elevenVoices.ts`) | `components/doktor/DoktorNav.tsx` |
| Klinik | `/klinik` (`components/klinik-landing/{content,nav,sections}.tsx`) | `/dashboard/klinik/{,kullanicilar,ayarlar,pabau}` | `/asistan/klinik` (personas `lib/ai/personas/klinik_uzmanlar.ts`) | `components/klinik/KlinikNav.tsx` |
| Avukat | `/avukat` | `/dashboard/avukat` | `/asistan/avukat` | `components/avukat/*` |
| Mali | `/mali` | `/dashboard/mali/*` | `/asistan/mali` | `components/mali/*` |
| Home | `/home` (4 flip cards, inline styles, 2×2 grid) | — | — | — |

## Doktor dashboard pages → API → tables
| Page | API routes | Tables |
|---|---|---|
| `/dashboard/doktor` (overview) | `/api/users/me`, `/api/users/trial`, `/api/doktor/hastalar` | users, patients, sessions, subscriptions |
| `/hasta-ekle` | `/api/doktor/hastalar` POST, `/api/doktor/id-card/parse`, `/api/doktor/mernis-lookup` | patients |
| `/hastalar`, `/hastalar/[id]` | `/api/doktor/hastalar[/id]`, `/[id]/sessions` | patients, sessions, notes |
| `/ilaclar` (`components/doktor/HastaIlaclar.tsx`) | `/api/doktor/ilac-ara` (search over `data/sgk-ilaclar.json`, 8,649 SGK drugs + TİTCK etken madde/ATC), `/api/doktor/ilaclar[/id]` | hasta_ilaclar |
| `/belgeler` | `/api/doktor/belgeler/ingest` | hasta_belgeler |
| `/goruntuleme` | `/api/doktor/goruntuleme`, `/goruntuleme/yukle` | hasta_goruntulemeler |
| `/raporlar` | `/api/doktor/raporlar`, `/api/notes/pdf` | notes, sessions |
| `/inceleme` | `/api/notes`, `/api/notes/[id]/approve` | notes |
| `/entegrasyonlar` | `/api/doktor/integrations[/provider]` | doctor_integrations |
| `/doktor-tools/*` (icd10, erecete, epikriz, ilac-interaksiyon, sgk-rapor, hasta-portali, tetkik, enabiz, sgk-medula, hatirlatma) | `/api/doktor/araclar/*`, `/api/doktor/sgk`, `/api/doktor/hatirlatma` | notes, hasta_hatirlatma, hasta_portal_tokens |
| `/randevular` (NOTYA-RANDEVU-01, day view, shared with sekreter) | `/api/doktor/randevular[/id]`, `/api/doktor/calisma-saatleri` | randevular, doktor_calisma_saatleri, patients |
| `/mesajlar` (Sağlığım practice inbox — doktor + sekreter) | `/api/doktor/mesajlar`, `/api/doktor/mesajlar/[konuId]`, `/api/doktor/mesajlar/unread-count` | hasta_mesaj_konulari, hasta_mesajlar |
| `/personel` (doktor-only, sadeceDoktor guard) | `/api/doktor/personel[/id]`, `/api/personel/davet/[token]`, `/api/personel/kabul`, `/api/personel/me` | personel |
| Patient portal **Sağlığım** `/portal/hasta/[token]` (+ `/mesajlar`, `/ziyaretler[/id]`, `/sonuclar[/id]`, `/ilaclar`, `/gecmis`, `/takip`) | `/api/portal/hasta/[token]`, `/api/portal/hasta/[token]/mesajlar` → `PortalBundle` + send/reply | sessions/notes, hasta_ilaclar, labs/imaging, **hasta_mesaj_*** |
| Patient portal **DEMO** `/portal/demo` (+ same section paths) | static `lib/portal/demoData.ts` (no PHI) | Reference UI — compose is demo-only |

### Sağlığım messaging + notifications
- Shared practice inbox (Option D): doktor + sekreter see the same queue via `pratikOturum` (**in-app only** for practice).
- Patient send → auto-ack klinik message + `okundu_pratik=false` → optional WhatsApp ping to doctor if `whatsapp_enabled` (no PHI, 30 min throttle).
- Practice reply / new thread → **patient e-mail** via Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) — link to portal Mesajlar, **no message body**; skips if patient has no `email_encrypted` or Resend unset.
- In-app badge: DoktorNav → Mesajlar `(n)` from `/api/doktor/mesajlar/unread-count`.
- Patient copy: non-urgent disclaimer; acil → 112.

### Env gotcha — Hasta Portalı “Portal yapılandırılmamış.”
- `PORTAL_TOKEN_SECRET` must exist on the **same Vercel environment** as the deploy you are testing.
- Historically it was **Production-only**. Preview URLs like `notya-ai-git-design-*-getvelacom.vercel.app` return `Portal yapılandırılmamış.` until Preview also has the secret.
- Production test URL: https://notya-ai.vercel.app/doktor-tools/hasta-portali (has the secret).
- Patient-facing DEMO (no login): https://notya-ai.vercel.app/portal/demo
- Do **not** invent a code fallback for a missing secret (CSO). Fix the env, then redeploy the Preview if needed.

## Voice/asistan wiring
- `/asistan` → `/api/asistan/signed-url?specialty&persona` → ElevenLabs base agent per gender (`ELEVENLABS_AGENT_*`, fallbacks hardcoded) → client overrides prompt + `tts.voiceId` + firstMessage. Text chat `/api/asistan/chat` (Anthropic, pseudonymised via `lib/security/pseudonymize.ts`). Sessions: asistan_sessions, asistan_actions, sessions/notes via `/api/sessions/start|[id]/end`.
- Klinik: `/api/asistan/klinik-signed-url?persona=<slug>`; 10 slugs = sac-ekimi, estetik-cerrahi, medikal-estetik, dermatoloji, longevity, fizyoterapi, klinik-psikolog, diyetisyen, ergoterapi, odyoloji.
- Voice pool: `lib/asistan/elevenVoices.ts` (TR_VOICES).

## Randevu + Personel (NOTYA-RANDEVU-01)
- Public accept page: `/davet/personel/[token]` (no auth). Doctor generates the link from `/dashboard/doktor/personel`, shares it manually (WhatsApp/SMS) — no email is sent, sidesteps the SMTP blocker.
- Reminder cron: `/api/cron/randevu-hatirlatma`, hourly (`vercel.json`), WhatsApp via existing `lib/doktor/twilioNotify.ts`, fires 2–3h before `randevular.baslangic`.
- Overlap prevention is server-side in both POST (create) and PATCH (reschedule) on `/api/doktor/randevular`.
- `DoktorNav.tsx` is role-aware: items tagged `sadeceDoktor: true` are hidden when `/api/personel/me` reports `rol: 'sekreter'`.

## Klinik (team) wiring
- Separate multi-user model from the above — klinik uses `clinics`/`clinic_members`/`clinic_invitations` (Pabau-oriented, seat-based). Randevu/personel is unrelated infrastructure for the plain doktor vertical (solo muayenehane + one secretary), not the klinik team model.
- Tables: clinics, clinic_members, clinic_invitations (seats/roles), pabau_connections (encrypted API key; `lib/pabau/{client,crypto}.ts`).
- API: `/api/klinik/me|members|settings|invite/accept`, `/api/pabau/connect-key (GET/POST/DELETE) | patients | appointments` → `https://api.oauth.pabau.com/{api_key}/{clients|appointments}`.

## Security / KVKK
- `lib/security/pseudonymize.ts` (+ `tr-sozluk.json`, 48.6k words: dictionary-word name tokens are substituted only inside the full name). `/kvkk` page. Nightly `/api/cron/kvkk-imha` (CRON_SECRET). audit_logs.

## Cross-cutting
- Users/plans: users, subscriptions; `/api/users/{me,profile,trial}`; `/api/billing/webhook`.
- WhatsApp (Twilio): `/api/notes/whatsapp`, `/api/mali/whatsapp`, `lib/notifications.ts`.
- Monitoring: `/api/monitor/health`, `/api/monitor/alert`. Help widget: `components/HelpWidget.tsx` → `/api/help/chat`.
- Data files: `data/sgk-ilaclar.json` (refresh: `scripts/import-sgk-ilac.mjs` then `scripts/import-titck-etken.mjs <xlsx>`).
- Deferred work: `docs/OPEN-COMMITMENTS.md`.
