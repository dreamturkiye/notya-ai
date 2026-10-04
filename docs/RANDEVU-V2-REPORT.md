# Randevu V2: build report

Brief: Kaan via Claude, 2026-10-04. The architecture is in `docs/RANDEVU-V2.md`. This report is updated in each PR.

**Nothing was merged, deployed or applied to any database, and no Vercel setting or env var was touched.**

| PR | Branch | Based on | Migration |
|---|---|---|---|
| PR1: engine, portal booking, approval, reminders | `claude/randevu-v2-engine-l4bec9` | `main` | `lib/db/migrations/116_randevu_v2.sql` |
| PR2: Google Takvim two-way sync | `claude/randevu-v2-google-l4bec9` | PR1 | `lib/db/migrations/117_randevu_v2_google.sql` |
| PR3: waitlist and Ayşe | `claude/randevu-v2-waitlist-l4bec9` | PR2 | `lib/db/migrations/118_randevu_v2_bekleme.sql` |

Merge order: PR1 → PR2 → PR3. Each PR targets `main` and contains the previous one's commits.

---

## PR1: engine, portal booking, approval, reminders

### Built

- **Per-doctor switch** "Hasta Portalı Randevu", default OFF (Entegrasyonlar). When ON, one card holds:
  - working hours per weekday (the existing `doktor_calisma_saatleri`, the same API Randevular uses);
  - the existing types (İlk muayene / Muayene / Kontrol) with durations;
  - buffer, minimum notice, max days ahead, cancel/reschedule cutoff;
  - approval mode (default: every request needs approval; option: auto-confirm patients with a completed visit);
  - unanswered-request warning period;
  - izin days.
- **Slot engine** `lib/randevu/v2/slot.ts`: a pure function, unit-tested. Working hours − official holidays (arife from 13:00) − izin − all non-cancelled appointments (pending and confirmed) − external busy blocks (PR2 hook) ± buffer − minimum notice − max-days window. Server-side re-validation with `slotUygunMu` on every write.
- **Double booking, database level**: an exclusion constraint on `tstzrange(baslangic, bitis)` per doctor, scoped to new-flow rows, plus a per-doctor advisory-locked trigger that checks a new-flow row against every active row. Why scoped: see `docs/RANDEVU-V2.md` § Double booking.
- **Portal** (only while ON):
  - **Randevu** tab in three taps: type → day → time. When only one type is open, it is two taps.
  - Own upcoming appointments, with Geliyorum / Bu saati kabul et / Başka saat seç / İptal et under the doctor's cutoff.
  - A request holds its slot. At most 3 open requests per patient per doctor, so one patient cannot hold the calendar.
- **Approval**: "N randevu talebi" on Ana Sayfa and Randevular for doktor and sekreter, with Onayla / Başka saat öner / Reddet.
  - "Başka saat öner" moves the request to a free time; the patient accepts or picks another in the portal or from the e-mail.
  - Outcomes reach the patient by e-mail (when possible, see Risks) and in the portal.
  - Escalation: unanswered after the configured hours → red and pinned on top. A request whose time has passed stays listed as "Saati geçti — hastaya bilgi verin". Nothing expires silently.
- **States**:
  - `talep` (new durum value), `onaylandi`, `teyit edildi` (= `onaylandi` + `hasta_teyit_at`), `geldi` (= existing `tamamlandi`), `gelmedi`, `iptal`.
  - **Append-only event log** `randevu_olaylari`: who (hasta/doktor/sekreter/sistem), what, when. UPDATE and direct DELETE are blocked by a trigger.
- **Reminders**:
  - On confirmation: a confirmation e-mail with `.ics` plus Geliyorum / Ertele / İptal links, then jobs for 10:00 the day before and 08:00 on the day (Istanbul).
  - E-mail goes automatically through the **existing** path (the doctor's own connected Gmail/Outlook), consent-gated.
  - WhatsApp is **not** automatic: the day-before item is fed into the existing Hazır mesajlar queue (same de-dup key as the daily cron), sent with one tap.
  - Jobs are idempotent (unique key + claim). Cancel and reschedule drop or replace them. The cron runs on the existing Vercel cron pattern.
- **Channel adapter interface** `RandevuKanali` (`lib/randevu/v2/kanal.ts`), so automatic WhatsApp can be added later without rework.
- **Signed single-appointment links** (`lib/randevu/v2/jeton.ts`): the same HMAC pattern and secret as the portal. GET never changes anything.

### Files

| Area | Files |
|---|---|
| Migration | `lib/db/migrations/116_randevu_v2.sql` |
| Core | `lib/randevu/v2/{zaman,slot,ayar,durum,jeton,ics,isPlani,eposta,kanal,disMesgul,sunucu}.ts` |
| Tests | `lib/randevu/v2/slot.test.ts`, `lib/randevu/v2/akis.test.ts`; cross-doctor cases in `lib/security/hasta-izolasyon.test.ts` |
| API | `app/api/doktor/randevu-portal/{ayar,talepler}/route.ts`, `app/api/portal/hasta/[token]/randevu/route.ts`, `app/api/randevu/eylem/route.ts`, `app/api/cron/randevu-v2/route.ts` |
| UI | `components/doktor/randevu/{RandevuPortalKarti,RandevuTalepleri}.tsx`, `app/portal/hasta/[token]/randevu/page.tsx`, `app/randevu/{layout.tsx,[jeton]/page.tsx}` |
| Touched (additive) | `app/portal/hasta/[token]/HastaShell.tsx` (Randevu nav only while ON), `app/dashboard/doktor/page.tsx` and `app/dashboard/doktor/randevular/page.tsx` (one line each: request list, hidden when empty), `app/dashboard/doktor/entegrasyonlar/page.tsx` (card) |
| Touched (additive) | `lib/iletisim/otomatik/eposta/{mime,saglayicilar,gonderim}.ts`, `lib/iletisim/otomatik.ts`: optional `ekler`; without it the output is byte-identical |
| Touched (additive) | `vercel.json` (one cron entry), `package.json` (two test files), `lib/security/hastaIzolasyonEnvanteri.ts` |

### Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm test` | 3690 tests: **3687 pass, 3 fail — all 3 pre-existing on `main` @ 9428fab**, reproduced there unchanged: `lib/asistan/fishMikrofon.test.ts` hangs (killed; reported as a failure) and `lib/asistan/tekBeyin.test.ts` cases 3–4 (`JSON.parse(...).system.map is not a function`). No V2 code is involved in either. |
| `npm run test:izolasyon` | 386 pass / 0 fail (incl. 7 new cross-doctor cases) |
| New unit tests | 38 pass / 0 fail |

### Manual test steps (on a preview with migration 116 applied to a **non-production** database)

1. **Switch OFF (default).** Open Entegrasyonlar: the "Hasta Portalı Randevu" card shows the switch off.
   - Sağlığım shows no Randevu tab.
   - Ana Sayfa and Randevular look exactly as before.
   - Create, move and cancel an appointment from Randevular: behaviour is unchanged.
2. **Turn it ON.** The settings card opens. Set hours, durations and rules; add one izin day; press Kaydet.
3. **Book as the patient.** Open a patient's Sağlığım link and enter the PIN. A **Randevu** tab appears. Tap type → day → time.
   - The page shows "Talebiniz alındı…" and the slot no longer appears for another patient.
   - The izin day and official holidays offer no times.
4. **Answer as the practice.** On Ana Sayfa, "1 randevu talebi" appears.
   - Press **Başka saat öner** and pick a time. The patient sees "Yeni saat önerildi" and accepts.
   - Repeat with a fresh request and **Onayla**: the patient's e-mail (only if the doctor connected Gmail/Outlook in Ayarlar › İletişim and the patient has e-mail consent) arrives with `randevu.ics` and three links.
   - Repeat with **Reddet**: the patient sees "Talep karşılanamadı".
5. **Links.** Open the e-mail links. The page changes nothing until the button is pressed.
   - Geliyorum → the practice sees "Geleceğini bildirdi" in the event log.
   - Ertele → pick a time; it becomes a request again (approval mode default).
   - İptal within the cutoff works; after the cutoff the page explains to call the practice.
6. **Escalation.** Set the warning period to 1 hour and leave a request unanswered: after the next cron tick it turns red and moves to the top.
7. **Reminders.** For an appointment tomorrow, after the 10:00 TRT tick:
   - the e-mail reminder arrives (if a mailbox is connected);
   - Hazır mesajlar shows the WhatsApp item once (it is not duplicated by the 17:00 run).
   - Call `/api/cron/randevu-v2?secret=…` by hand to run it outside the schedule.
8. **Double booking.** Two browsers, two patients, the same slot, tapped together: one succeeds, the other gets "Bu saat artık uygun değil".

### Risks and decisions (conservative choices, recorded per the brief)

- **`durum` CHECK widened** with `'talep'`. This is the only change to an existing object: a strict superset, `NOT VALID`, so it cannot fail on existing rows.
  - Existing screens show a `talep` row like any other non-cancelled appointment. In the existing calendar it is a filled dot and occupies its time; the calendar's own action menu does not offer Onayla for it (approval goes through the request list).
  - "Teyit edildi" was kept as a column, not a durum, because the existing queue, dispatcher and reminder cron accept only `planlandi`/`onaylandi`.
- **E-mail only leaves from the doctor's own connected Gmail/Outlook** (the existing path; Resend is retired for patient mail). Without a connected mailbox, or without the patient's e-mail consent (`iletisim_izni_eposta`, existing KVKK rule), the outcome is shown in the portal only and the job is logged `atlandi` with the reason.
  - The patient is never e-mailed without consent; the booking flow does not add a consent tap.
- **The existing dispatcher may also e-mail** its generic day-before reminder at 07:00 when the mailbox is connected. When it does, V2 skips its own 10:00 e-mail (`hatirlatma_gonderildi`). When V2 sends first, it sets the same mark so the 17:00 run does not send again.
  - Rare residual case: an appointment confirmed between 07:00 and 10:00 for tomorrow, then rescheduled the same day, could get both.
- **Existing calendar edits on a new-flow row:**
  - Moving it there keeps working; the cron re-plans its reminders within two days.
  - Cancelling it there does **not** send the patient a V2 e-mail. This is unchanged from today's behaviour for practice-side cancellations.
- **Legacy (secretary-booked) appointments** appear in the patient's Randevu list and can be cancelled or moved by the patient under the same cutoff. A move turns them into new-flow rows (`kaynak='portal'`).
- **Residual race**: a booking from the existing calendar form racing a portal request in the same milliseconds. The legacy path takes no lock, so this is the same gap that exists today between two calendar bookings.
- **Cron** `*/10 3-19 * * *` (UTC) was added to `vercel.json`. It is a repo file and deploys only on merge.
- **Sağlığım shell** makes one extra request (`GET …/randevu`) to decide whether to show the tab. With the switch OFF it answers `{ acik: false }` and nothing changes on screen.

### Not built / follow-ups (PR1)

- The "N randevu talebi" signal is on Ana Sayfa and Randevular. It is **not** yet a numeric badge on the DoktorNav Randevular item (the existing nav badge is wired only for Mesajlar). This is a small follow-up.

---

## PR2: Google Takvim two-way sync (dormant until credentials exist)

### Built

- **Entegrasyonlar card "Google Takvim":** connect, reconnect when revoked, disconnect. It is hidden unless `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET` (+ `ENCRYPTION_MASTER_KEY`) are set. Scope: `calendar.events` only.
- **Notya → Google:** confirmed appointments are pushed (whichever path confirmed them; the cron catches legacy-path changes). The title is the patient's initials by default; a full-name option exists, off by default, with a KVKK note. No note, type or phone goes to Google.
- **Google → Notya:** other events are imported as busy blocks (start/end only, no title stored) and feed the slot engine. Free and cancelled events release their block.
- **Sync mechanics:**
  - incremental sync with sync tokens (410 → full resync);
  - a push channel with renewal and a token-hash-verified webhook;
  - the periodic catch-up runs in the existing `randevu-v2` cron.
- **Conflicts:** Notya wins on its own appointments. A Notya event moved or deleted in Google appears to the doctor as a proposal (Entegrasyonlar card + Randevular) and is never applied silently.
- **Tokens:** the refresh token is encrypted at rest with the existing `encryptPII`; the channel token is stored only as a SHA-256 hash.

### Files

| Area | Files |
|---|---|
| Migration | `lib/db/migrations/117_randevu_v2_google.sql` |
| Core | `lib/randevu/v2/google/{donustur,istemci,senk,baglan}.ts`; `lib/randevu/v2/disMesgul.ts` now reads busy blocks |
| API | `app/api/doktor/google-takvim/{route,baslat/route,oneriler/route}.ts`, `app/api/google-takvim/{donus,bildirim}/route.ts`; push hooks in the three PR1 action routes; one step in `app/api/cron/randevu-v2/route.ts` |
| UI | `components/doktor/randevu/{GoogleTakvimKarti,GoogleTakvimOnerileri}.tsx`; one line each in Entegrasyonlar and Randevular |
| Tests | `lib/randevu/v2/google/google.test.ts`: pure conversion + sync engine against the fake DB with a stubbed Google API |

### Checks (PR2 branch tip)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm test` file list | 3697 tests: **3695 pass, 2 fail**. Both failures are the pre-existing `lib/asistan/tekBeyin.test.ts` cases 3–4, which also fail on `main` @ 9428fab. `lib/asistan/fishMikrofon.test.ts` was left out of the run because it hangs on `main` too. |
| New tests | `google.test.ts`: 11 pass |

### Manual test steps (needs Kaan's Google client; see NOTYA-RANDEVU-V2-B)

1. In Google Cloud:
   - create an OAuth client (Web);
   - add the redirect URI `https://<host>/api/google-takvim/donus`;
   - enable the Calendar API;
   - verify the domain for push notifications (`https://<host>/api/google-takvim/bildirim`).
   Then set the two env vars on a **preview** environment.
2. Entegrasyonlar → **Google Takvim’i bağla** → consent → back on Entegrasyonlar with "Google Takvim bağlandı."
3. Confirm a portal request. Within seconds the event appears in Google as "A. Y." Turn on the full-name toggle and the title updates.
4. Create a private event in Google tomorrow at 10:00. After the webhook, or within 10 minutes via the cron, the 10:00 slot disappears from the patient's portal.
5. Drag the Notya event in Google to another hour. A proposal appears on Randevular:
   - **Notya’daki kalsın** moves it back in Google;
   - **Yeni saati uygula** moves the appointment and e-mails the patient a new confirmation.
6. Delete the Notya event in Google → a proposal to cancel appears.
7. Disconnect → the future Notya events are removed from Google and the grant is revoked.

### Risks and decisions

- **Dormant by design:** with no credentials, nothing is visible or called. Tested: `dormant without credentials: nothing is called`.
- **Client reuse:** the env names are the ones the Gmail connect already uses. If Kaan creates one Google client for both, the consent screen and verification must list both `gmail.send` and `calendar.events` (sensitive scope → Google verification).
- **Initial full sync:** it cannot use `timeMin` (Google returns a sync token only without it), so the whole calendar is paged once. Only events overlapping [now − 1 day, now + 400 days] are stored.
- **Push webhook:** needs a domain verified in Google Search Console. Until then the cron catch-up (every 10 minutes, 06:00–23:00 TRT) is the sync path.
- **Fail-soft busy blocks:** a failed busy-block read counts as "no external busy" (fail soft). Notya's own appointments remain the hard check.
- **What is pushed:** only `onaylandi` appointments. Pending requests and legacy `planlandi` bookings stay out of Google.

---

## PR3: waitlist and Ayşe

### Built

- **Waitlist:**
  - The patient ticks "Daha erken bir saat açılırsa haber ver" on an upcoming appointment.
  - A freed (or any free) earlier slot is offered **in list order**, one patient at a time, by e-mail (existing path, consent-gated) and in the portal. An unanswered offer expires after 2 hours and moves to the next patient.
  - The **first to accept** gets a **talep**: their appointment moves to the slot through the normal reschedule path.
- **Ayşe:**
  - list and create use the existing tools;
  - new **`randevu_degistir`** (move/cancel) is always a card the doctor confirms, offered only while the switch is ON and never displacing an existing tool;
  - a **kontrol randevusu** card is prepared at note approval from "N gün/hafta/ay sonra kontrol" in the approved plan (date from the doctor's sentence, hour left empty);
  - the **morning brief** reports pending requests and no longer counts them as appointments.

### Files

| Area | Files |
|---|---|
| Migration | `lib/db/migrations/118_randevu_v2_bekleme.sql` |
| Core | `lib/randevu/v2/{bekleme,kontrolOnerisi,ozellik,isler}.ts`; `core/eylemler/randevuEylemleri.ts` |
| Touched | `core/eylemler/{types,araclar,kayit}.ts` (feature gate + order); `app/api/doktor/{konsult,not-konsult}/route.ts`, `app/api/asistan/ses-eylem/route.ts`, `lib/asistan/ayseCevapla.ts` (pass the flag); `app/api/notes/[id]/approve/route.ts` (one best-effort hook); `lib/doktor/gunOzeti.ts`; portal route and page; e-mail link route and page; cron |
| Tests | `lib/randevu/v2/bekleme.test.ts`: waitlist order / expiry / first-accept / foreign-patient refusal / OFF; kontrol date; tool gating keeps the OFF tool list identical |

### Checks (PR3 branch tip)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm test` file list | 3705 tests: **3703 pass, 2 fail**. Both failures are the same pre-existing `tekBeyin.test.ts` cases 3–4 (they also fail on `main`). `fishMikrofon.test.ts` was left out because it hangs on `main` too. |
| `npm run test:izolasyon` | 386 pass / 0 fail |
| Action layer (`core/eylemler/tests`, incl. the silent-write guard) + all V2 tests | 216 pass / 0 fail |

### Manual test steps

1. **Waitlist.** With the switch ON:
   - patient A books next week and ticks "Daha erken…";
   - cancel an appointment this week from another patient's portal;
   - within 10 minutes, A sees "Daha erken bir saat açıldı" (and gets the e-mail if possible);
   - tap **Bu saati istiyorum** → the practice sees a request at the earlier time; approve it.
   Leave an offer unanswered for 2 hours: the next waiting patient receives it.
2. **Ayşe, move.** With a patient open, say "Yarınki randevusunu perşembe 14:00'e al". A "Randevu değişikliği" card appears; confirm it; the calendar moves; **Geri al** restores it.
3. **Ayşe, cancel.** Say "Cuma randevusunu iptal et" → card → confirm.
4. **Switch OFF.** Ayşe offers no move/cancel card (the tool list is identical to today).
5. **Kontrol proposal.** Approve a note whose plan says "2 hafta sonra kontrol". The patient file's pending cards show a Kontrol randevusu card with the date filled and the hour empty.
6. **Morning brief.** With a pending request, Ayşe's opener mentions "1 randevu talebi yanıt bekliyor".

### Risks and decisions

- **Voice:** voice through the tek-beyin path (ayseCevapla) gets the new tool. The legacy ElevenLabs client-tool path (`/api/asistan/ses-eylem`) accepts it when the agent names it, but its agent prompt was **not** changed (that would change behaviour for everyone).
- **No patient message from Ayşe:** a move/cancel by Ayşe does not message the patient (T3 rule). Already-scheduled V2 reminders follow the new time.
- **What the waitlist offers:** any free earlier slot, not only one freed by a cancellation. That is a superset of the brief and simpler to keep correct.
- **Waitlist eligibility:** it works from an existing appointment only. A patient with no appointment books normally.
- **Approval hook timing:** the kontrol hook runs inside the approval request (a few small queries, wrapped in try/catch). A failure never affects the approval.
