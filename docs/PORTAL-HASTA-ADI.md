# PORTAL-HASTA-ADI — patient name on Sağlığım

Date: 2026-10-07. Problem: the portal showed the doctor's card but never whose page it is.

## What changed

**Data**
- `PortalBundle.hasta: { adSoyad: string | null }` (`lib/portal/types.ts`). Core spine, every branş. Name only.
- `lib/portal/hastaAdi.ts` — `hastaAdSoyad(decrypted)`: parses the decrypted `patients.name_encrypted` JSON
  (`{ ad, soyad }`) into a trimmed full name, or `null`. The aşı karnesi server (`lib/asi/karneSunucu.ts`) now uses
  the same helper instead of its inline copy, so portal and karne cannot drift.
- `app/api/portal/hasta/[token]/route.ts` — `name_encrypted` added to the existing `patients` read
  (`.eq('id', patientId).eq('doctor_id', doctorId)`, HASTA-IZOLASYON unchanged); decrypted with the route's existing
  `decrypt` wrapper. This runs after `requirePortalUnlock`, so a locked request (401 `pin_required`) carries no name.
- `emptyPortalBundle()` → `hasta: { adSoyad: null }`. Demo fixtures → `'Demo Hasta'` (synthetic, matches the demo
  aşı karnesi); göz/KBB demos inherit it via spread.
- `PortalLiveProvider`: when a refresh hits `pin_required`, the in-memory bundle is reset to empty, so a lapsed
  unlock does not keep the name in client state.

**UI**
- `HomeHero.tsx`: inside the Notya / Sağlığım brand block, under the brand rule: small label `Hasta`, full name in
  the serif display font. No greeting. Not rendered when `adSoyad` is null.
- `PortalShell.tsx`: new optional `hastaAdi` prop. When set, the name (small, ellipsised) replaces the
  `Hasta alanı` tag at the right of the header, so it is visible on every portal page; when null the original tag
  stays. `HastaShell` passes `data.hasta.adSoyad` (only once loaded); demo layouts pass the fixture name.
- The PIN screen is unchanged: `PortalLiveProvider` renders `PinGate` without the shell, and the bundle is never
  fetched before unlock.
- CSS: four new classes appended at the end of `app/portal/sagligim.css` (`.sg-hero-hasta*`, `.sg-header-hasta`).
  No existing rule or background touched.

Not exposed: T.C., doğum tarihi, contact details. Only `adSoyad` is on `bundle.hasta`.

## Tests
- `lib/asi/asiRotalari.test.ts` (real route, fake Supabase): locked request → 401 and no name in the body; unlocked →
  `hasta = { adSoyad: 'QA Çocuk A Işıkoğlu' }`, other doctor's patient name absent; patient with no name →
  `{ adSoyad: null }`. Passes.
- `lib/portal/hastaAdi.test.ts` (added to `npm test`): helper parsing/null cases, empty bundle, ordering of the
  assignment after the PIN check, UI renders nothing on null and has no `Merhaba`. Passes.
- `npx tsc --noEmit`: clean.

## Unverified / known
- Not visually checked in a browser: `/portal/demo*` is behind Notya sign-in and real tokens need a DB. The header
  name at very narrow widths (<380px, where `Hasta alanı` was hidden) relies on ellipsis — worth a phone look.
- Pre-existing failures on `main`, unchanged by this branch (same 5 before and after): in `asiRotalari.test.ts` the
  "kayıt yoksa modül yok" assertion (aşı karnesi module attaches for a record-less pediatri patient), the
  HASTA-İZOLASYON inventory test, and the `fish-tur` / Ayşe isolation cases. `npm run test:liste` flags
  `lib/doktor/hastaKlinikOzet.test.ts` as unlisted, also pre-existing.
- `app/portal/sagligim.css` is also being edited by the leaves-background session; my additions are an appended block
  at the end of the file, so a merge should be trivial but may need a manual resolution if both append at EOF.
