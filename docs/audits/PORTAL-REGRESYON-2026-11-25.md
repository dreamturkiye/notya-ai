# PORTAL-REGRESYON-2026-11-25 — Sağlığım: is everything the patient had before still there?

Kaan (2026-11-25): "Make sure that the hasta portalım has all the previous functionality intact."

Baseline: `f82f84ac^` (before HASTA-PORTALI-GUNLUK). Audited on `origin/main` at `dfd76656` (after f82f84ac Bugün phase 1,
1b8da3cc EV-VERISI-V2, 2e1c7ffa BUGUN-V2, dfd76656 HASTA-MODULLERI). Classification: **core** (all 30 branşlar + 10 Özel
Branşlar). Country carry-over: queued as `PORTAL-REGRESYON-2026-11-25` in `docs/ULKE-TASIMA-KUYRUGU.md`.

## Method

- `git diff --stat f82f84ac^ origin/main -- app/portal app/api/portal components/doktor/portal lib/portal lib/saglikEvi`:
  **no portal route was removed**; only additions plus 8 modified files. The one behavioural change to existing
  functionality: the home page (`app/portal/hasta/[token]/page.tsx`, `/portal/demo`) stopped rendering `HomeHero` (the Özet
  home) and renders `BugunSayfasi` instead. Every HomeHero element was traced to its new place (table below).
- Local run: `next dev` on the worktree, headless Chrome (Playwright) at 390×844 (phone), `en-US` browser locale (to catch
  locale bugs). Demo patient `/portal/demo` (+ `?durum=`), the doctor's preview `/portal/onizleme` with the branş taken from a
  stubbed `/api/users/me` (dahiliye, pediatri, kadın-doğum, göz, KBB, dermatoloji, saç ekimi), `/portal/demo-goz`,
  `/portal/demo-kbb`, `/portal/demo-hekim`. A link crawl opened every `/portal…` link on the home: demo 13/13 render
  (0 page errors); preview 14/14 respond, with the pages the preview closes by design (mesajlar, takip, aşı pages) identical
  to the baseline closed set.
- The live token route (`/portal/hasta/[token]`) needs a database; it shares every page/container with the preview and demo,
  and its API is covered by the real-route tests in `lib/asi/asiRotalari.test.ts` (fake Supabase, PIN gate).
- Screenshots: `/mnt/user-data/outputs/notya-portal/regresyon/` (phone size).

## Feature checklist

Status: **var** = present and reachable, unchanged · **düzeltildi** = regression found and fixed in this change ·
**yok-bilerek** = intentionally not carried, with reason.

### Earlier Özet home (HomeHero) → Bugün

| Feature | Baseline location | Current entry point | Status | Proof |
|---|---|---|---|---|
| Whose page it is (patient name) | HomeHero brand block "Hasta · name"; header name (PortalShell) | Header name on every page (unchanged); Bugün greeting uses the first name for an adult | var | `01-bugun-dahiliye-yetiskin-tam.png`; `lib/portal/hastaAdi.test.ts` |
| Minor's page (veli reads it) | HomeHero had no greeting (PORTAL-HASTA-ADI "no greeting") | Bugün greeted the CHILD by first name ("İyi günler, Elif") → now no name for under-18, "Hasta · name" line instead (bundle `hasta.onSekizAlti`, computed from the DOB server-side; DOB never sent) | düzeltildi | `02-bugun-pediatri-cocuk-ust.png`; `bugunGorunum.test.ts` "a minor's page…"; `asiRotalari.test.ts` (2024 DOB → true, 1990 → false) |
| Doctor's card (photo/initials, name, branş · klinik, address, tel link) | HomeHero hero card (PORTAL-HEKIM-01) | **Missing on Bugün** → restored at the top of "Doktorumla" | düzeltildi | `03-bugun-doktorumla-hekim-karti.png`; `hekimKarti.test.ts`; `bugunGorunum.test.ts` (all 40 branşlar) |
| ≤48 h visit alert "Muayeneniz yaklaşıyor … Gelemeyecekseniz lütfen haber verin" + Detay | HomeHero alert strip | Only a grey line in the bridge → restored as an alert card above the day rings, Detay → Ziyaretler | düzeltildi | `bugunGorunum.test.ts` "the ≤48 h visit alert…" (demo data has no visit inside 48 h, so no screenshot) |
| Chip: active medicines | HomeHero chip → İlaçlar | Bugün dose list + Bölümlerim › İlaçlarım "N aktif ilaç" | düzeltildi (count back) | `04-bolumlerim-dahiliye.png` |
| Chip: messages / unread highlight | HomeHero chip → Mesajlar | Doktorumla › Mesajlar row with unread badge | var (BUGUN-V2) | `03-…` |
| Chip: test results count | HomeHero chip → Sonuçlar | Doktorumla › Tahlil ve belgeler | var | `03-…` |
| Chip: upcoming check-up | HomeHero chip → Ziyaretler | Doktorumla › Sıradaki randevu | var | `03-…` |
| "Mesajlara git" CTA | HomeHero hero | Doktorumla › Mesajlar row | var | `03-…` |
| Aşı Karnesi tile | HomeHero tile (when module on) | Nav + Bölümlerim tile | düzeltildi (home entry back) | `04`–`10-bolumlerim-*.png` |
| Shortcuts: Mesajlar, Ziyaretler, Sonuçlar, İlaçlarım, Öykü, Takip + every chapter module with hint | HomeHero "Kısayollar" | **Lost on Bugün.** On a phone the nav is a hidden-scrollbar strip and chapter modules sat at position 12+ (off-screen) → restored as **Bölümlerim**: modules first (registry `bundle.portal.nav`, never per-branş code), then İlaçlarım / Öykü / Takip; Mesajlar / Ziyaretler / Sonuçlar are in Doktorumla | düzeltildi | `04`–`10-bolumlerim-*.png`; `bugunGorunum.test.ts` "Bölümlerim…" |
| Recent activity (messages / visits / results shared) | HomeHero "Son aktivite" (`summary.sonAktivite`, still computed by the API) | Lost → restored as "Son paylaşılanlar" in Doktorumla | düzeltildi | `03-…` |
| Hedef boy card (pediatri, büyüme module) | HomeHero ek bölüm + Takip | Takip page (unchanged); Bölümlerim › Takip hint reads "Yaşamsal bulgular · büyüme · hedef boy" when the module + data exist | yok-bilerek on the home (the full card lives on Takip, one tap from Bölümlerim; Bugün's first screen is the day plan by design) | TrackingView.tsx (unchanged) |
| Lede "Kayıtlar, sonuçlar ve mesajlar tek yerde." | HomeHero | — | yok-bilerek (replaced by the Bugün greeting + plan; BUGUN-V2 design) | — |
| Home when the daily-state API fails | n/a (HomeHero read only the bundle) | Bugün showed only an error line (no doctor, messages, sections) → now the error line + alert + doctor card + bridge + Bölümlerim + 112 note (`BugunKopruYedek`) | düzeltildi | `bugunGorunum.test.ts` "daily state failed to load…" |

### Core shell and record pages

| Feature | Baseline | Current | Status | Proof |
|---|---|---|---|---|
| PIN gate + token expiry, client reset on `pin_required` | PinGate / PortalLiveProvider | unchanged files | var | `lib/portal/pinKilit.test.ts`, `asiRotalari.test.ts` (401 before PIN) |
| Brand, header name, KVKK / 112 footer | PortalShell | unchanged (nav label Özet → Bugün) | var | every screenshot; `components/doktor/portal/__golden__/kabuk.html` |
| Mesajlar | `/mesajlar` | nav + Doktorumla | var | link crawl 200 |
| Ziyaretler + detail | `/ziyaretler`, `/ziyaretler/[id]` | nav + Doktorumla (last visit opens the detail) | var | link crawl (`/ziyaretler/v1`, `/ziyaretler/ov1`) |
| Sonuçlar + detail | `/sonuclar`, `/sonuclar/[id]` | nav + Doktorumla | var | link crawl |
| İlaçlar | `/ilaclar` | nav + Bölümlerim | var | link crawl |
| Öykü | `/gecmis` | nav + Bölümlerim | var | link crawl |
| Takip (vitals, büyüme / hedef boy for children) | `/takip` | nav + Bölümlerim | var | link crawl |
| Randevu booking (when the doctor turns it on) | HastaShell adds nav `Randevu` | unchanged | var | HastaShell.tsx diff (only GunlukProvider wrap added) |
| Module back links | "← Özet" | "← Bugün" (72 files incl. the preview; same target) | düzeltildi (label) | grep |

### Chapter modules (registry, per branş)

All 52 baseline pages under `app/portal/hasta/[token]/` (core + chapter modules) still exist (`git ls-tree f82f84ac^` vs disk), mount through the same
registry nav, and now also appear in Bölümlerim. Checked per branş in the preview: pediatri → Aşı Bilgilendirme, Aşı
Karnesi; göz → Gözlerim; KBB → Kulaklarım; dermatoloji → Derim; saç ekimi (Özel Branş) → Saçım; kadın-doğum → Aşı Karnesi
(Gebeliğim / Jinekoloji attach only with an active pregnancy / KD chart data — unchanged registry rule). No branş showed
another branş's module (`06`–`10-bolumlerim-*.png`). Status: **var**.

### Daily health home (new since yesterday) — styling regressions

| Item | Finding | Status | Proof |
|---|---|---|---|
| Tercihler › Sessiz saatler | Native `type="time"` follows the phone's locale: "11:00 PM / 07:00 AM", second box past the card edge | düzeltildi — `SaatSecici` 24-hour select (HH:MM, 15-min steps, saved off-grid value kept), row wraps under the text | `tercihler-saat-duzeltme-telefon.png`; `bugunGorunum.test.ts` "24-hour time pickers" |
| Doz Takvimi › İlaçlarım › Saatleri değiştir / Kendi ilacımı ekle | Same native time inputs (12-hour on English phones) | düzeltildi — `SaatSecici` | `11-doz-takvimi-ilaclarim.png` |
| Doz Takvimi › İlaçlarım row with "Doktorunuz önemli dedi" | "Saatleri değiştir" pushed past the card | düzeltildi | `11-doz-takvimi-ilaclarim.png` |
| Shared dose list › "Gerektiğinde" group (Bugün + Doz Takvimi) | The word ran over the medicine name (62 px time column), text squeezed by the button | düzeltildi — full-width label, button wraps | `12-doz-gerektiginde-pediatri.png` |
| Günlük Kayıt, Karne, Uyarı kartı, entry sheet | Render; no overflow at 390 px; no console errors | var | `13-gunluk-telefon.png`, link crawl |

### Demos

| Demo | Status | Proof |
|---|---|---|
| `/portal/demo` (Bugün; `?durum=ilk/az/ilacsiz/onaysiz/tamam/ht`) | var | `01-…` |
| `/portal/demo-goz`, `/portal/demo-kbb` (still the Özet hero) | var | `14-demo-goz-ozet-hero.png`, text check (Doktorunuz, Kulaklarım) |
| `/portal/demo-hekim` (+ `?durum=ht`: no glucose) | var | text check |
| `/portal/onizleme` (doctor's preview, 40 branşlar) | var | `lib/portal/onizleme.test.ts` |

### Branş leaks / veli wording

`bugunGorunum.test.ts` renders Bugün for all 40 branşlar: tiles only from the branş row, no "veli" for an adult, no AI
wording, and the restored pieces on every branş. `onizleme.test.ts` (no "veli" text in any adult branş preview payload — the
bundle flag is therefore named `onSekizAlti`).

## The four "pre-existing" failures

| Test | First failing commit | Cause | Portal-work regression? | Done |
|---|---|---|---|---|
| `lib/portal/hekimKarti.test.ts` | `3c18a116` (2026-10-17, PERF-SAGLAMLIK-2026-10) — route rewrote `bundle.hekim = await portalHekimKarti` into a parallel load; then `9fa006b3` (2026-10-24) moved the hero markup into `PortalOzetGorunumu` | stale source assertions | No (verified: passes at `3c18a116^`, fails at `3c18a116`) | Assertions follow the current code; the doctor card that Bugün had actually lost is restored and asserted on the live home |
| `lib/portal/hastaAdi.test.ts` | `9fa006b3` (2026-10-24) — identity markup moved to `PortalOzetGorunumu` / `PortalKabukGorunumu` | stale source assertions | No (passes at `9fa006b3^`) — but the "no greeting" intent was broken by Bugün for minors, fixed here | Test checks the shared views + Bugün (no child's name for a minor) |
| `hasta-izolasyon.test.ts` › fish-tur positive control | `85d9f607` (2026-10-25, "Assistant reads identity answers aloud") — the spoken turn now says the value; the test still expects "ekranınıza yazdım" | intended behaviour change, test not updated | No | Not changed (voice path; outside this task) |
| `hasta-izolasyon.test.ts` › SOAP session-end positive control | No commit: the module mock for `lib/doktor/soapUret` is not applied and the real `soapNotuUret` runs. The same commits (e.g. `6833cc2e`) passed 4× and then failed with no code change; it now fails on every commit tried back to `origin/main~300`, including the baseline | harness / environment, not code | No | Not changed; logged here |
| (extra) `lib/asi/asiKarnesi.test.ts` › "PortalShell sınıfları…" | `9fa006b3` (classes moved to `PortalKabukGorunumu`) | stale source assertion | No | Points at the shared frame |

## Not verified

- The live token page against production data (needs a real patient link + PIN). The production portal demo returned
  200 on deployment `dpl_J4mfSPEwuTB1QkZBnEM4g1GytLeM` (dfd76656, READY); its content sits behind Notya sign-in.
