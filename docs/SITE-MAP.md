# Notya — Site Map & Wiring (read this first, then do not re-derive it)

Generated 2026-09-01 for live-session speed. Production: https://notya-ai.vercel.app (Vercel team `getvelacom`, project `notya-ai`, prod branch `main`). Repo `~/notya-ai`. Supabase project ref `anjayzospuurymjmmtim`.

## Change loop
- Edit → `npm run -s typecheck` (ignore TS5101 baseUrl warning) → commit on a branch → `git push -u origin <branch>` → `gh pr create` → `gh pr merge N --merge --admin --delete-branch` → Vercel builds ~50s → live. A local pre-push hook blocks direct pushes to `main`; the PR + admin-merge path is the fast loop (~2 min end to end).
- Local preview: `npx next dev -p 3199` (keep osascript calls < 30s; run it with nohup).
- Landing CSS is PRE-COMPILED: `/doktor` and `/klinik` import `app/doktor/utilities.css`, built by `npx tailwindcss -c tailwind.doktor.config.js -i app/doktor/tw-source.css -o app/doktor/utilities.css --minify`. Any Tailwind class change on those two pages requires rerunning that; any new page importing that CSS must be added to the config's `content`.
- `"use client"` pages: `export const dynamic` is ignored; `useSearchParams` needs `<Suspense>`.
- Migrations: `lib/db/migrations/*.sql`, applied with `node scripts/run-sql-migration.mjs <file>` (uses SUPABASE_DB_URL from .env.local).

## Auth (one convention — NOTYA-AUTH-01)
- Client: `lib/doktor/clientAuth.ts` → `ensureDoctorAccessToken()` (refreshes), `getDoctorAccessToken()` (sync), `DOKTOR_GIRIS='/giris/doktor'`. Session lives in localStorage `auth-token` or `sb-<ref>-auth-token`.
- Server: `lib/doktor/serverAuth.ts` → `doktorOturum(req)` returns `{user, supabase(service-role)}` or `{hata}` (401 "Oturum bulunamadı. Lütfen tekrar giriş yapın."). Applied to hastalar, pabau, klinik-signed-url; ~20 older routes still inline the same check.
- Login pages: `/giris` (chooser) → `/giris/doktor`, `/giris/avukat`, `/giris/mali`. Signup `/kayit` → `/onboarding` (profession picks vertical).

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
| Patient portal `/portal/hasta/[token]` | `/api/portal/hasta/[token]` | hasta_portal_tokens (HMAC, PORTAL_TOKEN_SECRET) |

## Voice/asistan wiring
- `/asistan` → `/api/asistan/signed-url?specialty&persona` → ElevenLabs base agent per gender (`ELEVENLABS_AGENT_*`, fallbacks hardcoded) → client overrides prompt + `tts.voiceId` + firstMessage. Text chat `/api/asistan/chat` (Anthropic, pseudonymised via `lib/security/pseudonymize.ts`). Sessions: asistan_sessions, asistan_actions, sessions/notes via `/api/sessions/start|[id]/end`.
- Klinik: `/api/asistan/klinik-signed-url?persona=<slug>`; 10 slugs = sac-ekimi, estetik-cerrahi, medikal-estetik, dermatoloji, longevity, fizyoterapi, klinik-psikolog, diyetisyen, ergoterapi, odyoloji.
- Voice pool: `lib/asistan/elevenVoices.ts` (TR_VOICES).

## Klinik (team) wiring
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
