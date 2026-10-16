# Pediatri Beta Audit, item 2: Mobile use and staff access

Branch `feature/mobil-personel-erisimi`. Written 2026-10-16. Everything below was verified with a headless Chromium
against the local dev server with mocked `/api/**` responses, with unit tests, and with the in-memory Supabase stand-in.
**Nothing was run on a real phone, against real Supabase RLS, or against a real migration.** Migration 172 is written, not applied.

Requirement (Turkish original): "(a) Is Notya usable from a mobile phone? (b) Can the secretary, assistant and patient
counsellor reach the system? (c) Can authorised staff sign in from different locations?"

## Verdicts

| Item | Before | After | Why |
|------|--------|-------|-----|
| (a) Phone use | Partial | Strong (doctor screens); country kit Partial | The layout already collapsed on phones (sidebar becomes bottom tabs, no horizontal scroll). The measured defect was tap targets under 44px and a primary action (Onayla) that scrolled away. Fixed; see below. |
| (b) Staff access | Partial | Strong | Only `sekreter` existed. Added `asistan` and `hasta_danismani` behind one permission map, enforced on the server. Country builds: Missing for the two new roles (they have a different clinic model; see Country parity). |
| (c) Sign-in from anywhere | Strong | Strong | No IP allow-list, no device binding, no geofence anywhere (grep of `middleware.ts`, `lib/security`, `app/giris/doktor`). Added a small Oturumlar card (last sign-in, this device, sign out everywhere). Per-device history is not possible with Supabase auth alone: MOBIL-PERSONEL-05. |

## (a) Mobile: measured, not guessed

Method: Playwright Chromium, `isMobile` + touch, 390x844 and 768x1024 (and 1280x800 as a desktop control), auth token in
localStorage, every `/api/**` call fulfilled with fixture JSON. For each screen: document `scrollWidth` vs viewport, elements whose right edge
passes the viewport and are not inside a scrolling ancestor, and every button, link, input and select smaller than 44px in either dimension.
Screens: `/dashboard/doktor` (home), `randevular`, `hastalar/[id]`, `notlar/[id]`, `hastalar`, `notlar/[id]/tetkikler`.
Screenshots: `docs/audits/screenshots-item2/{base,after}-{390,768}-{home,randevular,hasta,not}.png`.

| Screen | Horizontal scroll (390 / 768) | Targets < 44px before (390) | After (390 / 768) |
|--------|------------------------------|------------------------------|-------------------|
| home | none | 4 (Bugün, Bu Hafta, Takvimi aç, + Randevu ekle: 38-42px) | 0 / 0 |
| randevular | none | 37 (month nav 32px, view tabs 36px, row actions) | 0 / 0 |
| hastalar/[id] | none | 23 (tabs 38px, Muayeneyi Başlat 40px, back link 18px) | 4 checkboxes only (13x20, native) |
| notlar/[id] | none | 17 (Yazdır, Reçete, Tetkikler 36px, back link 18px) | 0 / 0 |
| hastalar | none | 1 (+ Hasta Ekle 41px) | 0 / 0 |
| tetkikler | none | 2 (Geri 38px, Katalogdan ekle 30px) | 0 / 0 |

Findings:

- **No screen overflowed horizontally.** The only element past the right edge is the decorative `img.notya-bitki` plant, which is clipped by its container. The premise that the doctor screens are broken on a phone was not borne out.
- The real defects were tap targets and the Onayla button scrolling out of reach on a long note.
- `notlar/[id]/recete` rendered the generic error page in the harness. The cause is a fixture gap (the mocked note has no prescription payload), not a measured product defect; it is not counted as evidence either way.
- At 1280px the counts before and after are identical, so desktop is unchanged by the fix.

Fix (commit "feat(mobil)"): `lib/doktor/telefonStil.ts` holds one CSS block, emitted by `DoktorChrome` inside its existing `max-width: 899px` block, so desktop cannot
be affected. It raises buttons, selects, inputs and standalone links to 44px, makes tables scroll inside their own box, caps dialogs to the viewport,
and pins the note's primary action (`.notya-ana-eylem`, the Onayla button) above the bottom tab bar. `lib/doktor/useTelefon.ts` is the matching hook for
components that must branch in JS. Opt out with `data-kucuk-ok` on a button.

Not done: stacked-card rendering for wide tables (none overflowed; the CSS makes them scroll). `app/session/new` was out of scope; its needs are in the last section.

## (b) Staff access

Before: `personel.rol` could only be `sekreter` (migration 126 CHECK). `pratikOturum(req)` returned `rol: 'doktor' | 'sekreter'`.

After:

- One map: `lib/doktor/personelYetki.ts` (`ROL_YETKILERI` role to capabilities, `ROTA_YETKILERI` route prefix and method to capability). Pure and client-safe, so the UI hides what the server would refuse.
- Enforcement is server-side in `lib/doktor/pratikOturum.ts`: it reads `personel.rol`, refuses unknown roles with 403, and calls `yolIzniVarMi(rol, pathname, method)` for **every** route that uses `pratikOturum`. The new roles are **default-deny** (a route not in the table is refused). `sekreter` bypasses the table except for routes that are new in this change (`sekreterKapali`), so she neither loses nor gains anything.
- Doctor-only management: `POST /api/doktor/personel` (invite with role), `PATCH` and `DELETE /api/doktor/personel/[id]` (change role, deactivate, remove). All use `sadeceDoktor`, scope by `id` AND `doktor_id`, and write the audit log.
- Audit: `personel_rol_gecmisi` (append-only, trigger raises on UPDATE and DELETE) written by the routes (`lib/doktor/personelGunluk.ts`) and by a DB trigger for direct changes. Migration: `lib/db/migrations/172_personel_roller.sql` (idempotent, NOT applied).
- Isolation: new route `hastalar/[id]/olcumler` uses `hastaSahibiMi`. Registered in `lib/security/hastaIzolasyonEnvanteri.ts` (olcumler as tested, `hesap/oturum` as exempt with reason), with VAKALAR cases in `lib/security/hasta-izolasyon.test.ts`.

Permission matrix (generated from the map, not hand-typed):

| Capability | doktor | sekreter | asistan | hasta_danismani |
|---|---|---|---|---|
| randevu.gor | yes | yes | yes | yes |
| randevu.yonet | yes | yes | - | yes |
| hasta.liste | yes | yes | yes | yes |
| hasta.kayit | yes | yes | - | yes |
| hasta.dosya.oku | yes | yes | yes | - |
| hasta.dosya.yaz | yes | yes | - | - |
| not.oku | yes | yes | yes | - |
| not.yaz | yes | yes | - | - |
| not.onayla | yes | - | - | - |
| olcum.ekle | yes | yes* | yes | - |
| ek.ekle | yes | - | yes | - |
| iletisim.gonder | yes | yes | - | yes |
| iletisim.toplu | yes | yes | - | - |
| mesaj | yes | yes | - | yes |
| intake.oku | yes | yes | yes | yes |
| intake.yonet | yes | yes | - | yes |
| portal.baglanti | yes | yes | - | yes |
| gelen_belge, onburo, fatura, ayar, ai.asistan | yes | yes | - | - |
| personel.yonet, recete | yes | - | - | - |
| hesap.kendi | yes | yes | yes | yes |

\* `olcum.ekle` is in the frozen legacy capability set (she can already edit the file through the patient PUT), but the new dedicated `olcumler` route is closed to her
(`sekreterKapali`) so that nothing is added to what she could reach.

Design choices a clinician should confirm: asistan reads the file and notes and may add measurements and attachments but cannot write notes, approve, or contact patients;
hasta_danismani handles appointments, contact, portal links and intake but sees no clinical content (the patient card is contact fields only, and the note route refuses her);
bulk campaigns stay sekreter-only; a payment-reminder queue item is hidden from hasta_danismani.

### Finding that was NOT changed (instruction: sekreter unchanged)

A `sekreter` can read note content and delete a draft note through `app/api/notes/[id]`. This predates this work and is kept because the brief says sekreter must neither lose nor gain a permission.
It is the most important thing for a doctor to decide: MOBIL-PERSONEL-04.

Another pre-existing behaviour: a removed or deactivated staff member falls through `pratikOturum` as "the doctor of her own, empty, practice". She sees no data, but it is not a clean 401 (MOBIL-PERSONEL-08).

### Tests

- `lib/doktor/personelYetki.test.ts` (225): every role x every capability, the route table, a scan of every route file that uses `pratikOturum`, and the guarantee that sekreter is frozen.
- `lib/security/personel-rol-rotalar.test.ts` (30), real handlers on the fake DB: a staff member of doctor A never reads doctor B's patient, list or note; hasta_danismani cannot read note content; asistan cannot approve; role changes are doctor-only and logged.
- `lib/doktor/cihazAdi.test.ts` (7).

## (c) Sign-in from different places

No device lock exists. Searched `middleware.ts`, `lib/security/*`, `app/giris/doktor/page.tsx` and the personel routes for IP, device, fingerprint and geo checks: none. A staff member can sign in from any browser or location.

Added `GET/DELETE /api/doktor/hesap/oturum` and `components/doktor/OturumKarti.tsx` (in Hesabım): last sign-in time, the current device (from the User-Agent, `lib/doktor/cihazAdi.ts`), and "sign out of all devices" (`auth.admin.signOut(jwt, 'global')`, revokes refresh tokens; an access token already issued lives up to about one hour).
Supabase exposes no per-device session list, so a real "Oturumlar / giriş geçmişi" needs a table of our own written at sign-in: MOBIL-PERSONEL-05. The existing "Çıkış Yap" button only signs out the local device.

## Country parity (US, GB, CA, AU, NZ, UZ)

The country builds do not serve the Turkish doctor screens. Their route gate (`countries/<cc>/index.ts` `rotalar`, `middleware.ulke.ts`) opens only `/today /settings /patients /patient /visit /calendar /portal /clinic /desk ...` and `/api/ulke/`; `/dashboard/doktor/*` and `/api/doktor/*` answer 404.
They use the country kit (`components/ulke/uygulama/*`, CSS `uygulama.css`) and their own clinic-account model (`lib/ulke/klinikHesabi`): positions `sahip, yonetici, hekim, muttefik, on-buro`, with per-doctor grants `on-buro-randevu, on-buro-hasta, on-buro-portal, paylasim, vekalet`, enforced in `./yetki.ts` and a DB trigger (migration 145).

- Mobile: the kit screens are mobile-first (bottom nav at 899px, 46px buttons, 16px inputs). Controls still under 44px (`.uza-dugme-kucuk`, `.yg-arac-cip`, calendar nav and day cells, region select) were raised in a phone-only block of `uygulama.css` on each `feature/mobil-personel-erisimi-<cc>` branch. **Not rendered** (no country harness was built); CSS review only.
- Roles: not ported. Porting the Turkish `personel` routes would be dead code behind the route gate and would add user-visible Turkish text to code outside `countries/tr` (the ceiling in `countries/turkce-tavan.json` may only go down; `release/us` is already at 1700 against 1698 before this work, and a trial port raised it to 1705). The country equivalent of Secretary/Receptionist is the existing `on-buro` position.
  Clinical Assistant and Patient Coordinator would be new positions with new grants, which the kit deliberately leaves to a lawyer of each country (`inceleme.hukukcu`). Labels to use when they are built: Receptionist (US/CA, "Secretary" for GB/AU/NZ), Clinical Assistant, Patient Coordinator; Uzbek labels need a native reviewer. Logged as MOBIL-PERSONEL-09 and 10.

## What `app/session/new` needs (not edited)

Not measured here because the page needs a microphone session. From the code and from the phone behaviour of the other screens, to check on a real phone:
1. Recording and stop controls at least 44px, with the stop control reachable with one thumb (sticky bottom bar above the safe-area inset).
2. No horizontal overflow of the patient-selection and transcript panes at 390px.
3. Any modal capped to `100dvh - 24px` and scrollable inside.
4. The shared `telefonStil` block does not apply there (it is scoped to `.notya-icerik` under `DoktorChrome`); the page needs the same rules or to adopt the chrome.
