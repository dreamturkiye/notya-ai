# Randevu V2: as-built architecture

NOTYA-RANDEVU-V2 (brief from Kaan, 2026-10-04). Three stacked PRs: **PR1** engine, portal booking, approval and reminders · **PR2** Google Takvim two-way sync (dormant until credentials exist) · **PR3** waitlist and Ayşe. This file describes what is built. Status and test results are in `docs/RANDEVU-V2-REPORT.md`.

## The one rule: additive, OFF by default

- Each doctor has a switch, **Hasta Portalı Randevu** (`randevu_portal_ayarlari.acik`). It defaults to `false`.
- While it is OFF, no V2 code path writes anything:
  - the portal Randevu API answers `{ acik: false }`, so Sağlığım shows no Randevu tab;
  - the e-mail link API answers "kapalı";
  - the cron finds no jobs;
  - the practice request list is empty and renders nothing.
- Before migration 111 is applied, every V2 read fails soft and the feature reads as OFF.
- Existing behaviour is untouched. That covers the randevu routes (`/api/doktor/randevular[/id]`), the overlap check (`lib/randevu/cakisma.ts`), the reminder cron (`/api/cron/randevu-hatirlatma`), the Hazır mesajlar queue and dispatcher, and every existing column.

## Data (migration `lib/db/migrations/111_randevu_v2.sql`)

| Object | What |
|---|---|
| `randevu_portal_ayarlari` | Per-doctor switch and policy. Fields: types with durations, buffer, minimum notice, max days ahead, cancel/reschedule cutoff, approval mode (`hepsi_onay` default, or `mevcut_hasta_otomatik`), escalation hours. |
| `randevu_istisnalari` | The doctor's izin/tatil ranges. Official holidays come from `lib/randevu/resmiTatiller.ts`; an arife closes from 13:00. |
| `randevular.kaynak` | `'portal'` on rows the new flow wrote or moved; NULL on every existing row. |
| `randevular.talep_at`, `oneri_at`, `hasta_teyit_at`, `eskalasyon_at` | When the request was made, when the practice proposed another time, when the patient tapped Geliyorum, and when the request escalated. |
| `randevular.durum` | The CHECK constraint gains one value, `'talep'`. It is a superset of the old list, added `NOT VALID`, so existing rows are never re-checked. |
| `randevular_v2_cakisma_yok` | `EXCLUDE USING gist (doktor_id =, tstzrange(baslangic, bitis) &&) WHERE kaynak IS NOT NULL AND durum <> 'iptal'`. See the double-booking section. |
| `trg_randevu_v2_cakisma` | A new-flow row must not overlap **any** non-cancelled row. Serialised per doctor with `pg_advisory_xact_lock`; raises `23P01`, which the API maps to 409. |
| `randevu_olaylari` | Append-only event log: who (`hasta`, `doktor`, `sekreter`, `sistem`), what, when. An UPDATE or a direct DELETE raises an error; only an account-deletion cascade may delete. There is no FK to `randevular`, so the log outlives a deleted row. |
| `randevu_isleri` | Notification jobs, unique on `(randevu_id, tur, zaman)`. |

### Status mapping (brief: talep, onaylandı, teyit edildi, geldi, gelmedi, iptal)

| V2 state | Stored as |
|---|---|
| talep | `durum = 'talep'` (new value) |
| onaylandı | `durum = 'onaylandi'` (existing) |
| teyit edildi | `durum = 'onaylandi'` + `hasta_teyit_at` set. It is a column, not a new durum, because the existing queue, dispatcher and reminder cron accept only `planlandi`/`onaylandi`. |
| geldi | `durum = 'tamamlandi'` (existing) |
| gelmedi | `durum = 'gelmedi'` (existing) |
| iptal | `durum = 'iptal'` (existing). A rejected request is `iptal` with `iptal_nedeni = 'Talep karşılanamadı'`. |

### Double booking: what the database guarantees

- **New flow vs new flow:** the exclusion constraint makes an overlap impossible, with no race. Two patients tapping the same slot at the same moment cannot both win.
- **New flow vs any existing row:** the trigger re-checks under a per-doctor advisory lock, inside the inserting transaction.
- **Why the constraint is scoped by `kaynak`:**
  - Existing rows were overlap-checked only in application code (`lib/randevu/cakisma.ts`, check-then-insert), so live data may already contain overlaps.
  - An unscoped constraint could fail to build on those rows.
  - Every existing row has `kaynak IS NULL`, so the scoped constraint and the trigger cannot fail on, or change the behaviour of, existing data.
- **Residual race:** a booking from the existing calendar form (legacy path, no lock) racing a portal request in the same few milliseconds. This gap is the same one that exists today between two calendar bookings.

## Pure core (`lib/randevu/v2/`, unit-tested)

| File | What |
|---|---|
| `zaman.ts` | Europe/Istanbul wall clock ↔ UTC. The offset is read from the tz database, not hardcoded. |
| `slot.ts` | `bosSlotlar`: working hours (existing `doktor_calisma_saatleri`, grid = existing `slot_dakika`) − holidays/izin − busy blocks (all non-cancelled appointments + external busy) ± buffer − minimum notice − max-days window. `slotUygunMu` re-validates one start on the server. The output carries times only. |
| `ayar.ts` | Settings shape, defaults (OFF), normalisation of a DB row or a request body. |
| `durum.ts` | V2 state mapping, the patient's permissions under the cutoff, escalation, the approval rule. |
| `jeton.ts` | Signed single-appointment links. HMAC-SHA256 with `PORTAL_TOKEN_SECRET`, same pattern as the Sağlığım unlock cookie. Each link covers one appointment and one action (`geliyorum`, `ertele`, `iptal`, `kabul`) and expires the day after the visit. With no secret, no links are generated (never a fallback secret). |
| `ics.ts` | RFC 5545 `METHOD:PUBLISH` event, folded lines. Content is logistics only. |
| `isPlani.ts` | Reminder instants (day before at 10:00, morning of at 08:00, Istanbul time) and the check that a due job still applies. A moved appointment's old jobs no longer match. |
| `eposta.ts` | Patient e-mail texts. Same rules as `lib/iletisim/sablonlar.ts`: no clinical content, guardian wording by age, signed by the doctor. |
| `kanal.ts` | **Channel adapter interface** `RandevuKanali`; see the next section. |

## Channels (`kanal.ts`)

| Adapter | Behaviour |
|---|---|
| `epostaKanali` | Automatic, through the **existing** e-mail path: `hazirOtomatikGonderici` → the doctor's own connected Gmail/Outlook (NOTYA-ILETISIM-02). Consent-gated (`iletisim_izni_eposta === true`). Logged to `iletisim_kayitlari` exactly like the NOTYA-ILETISIM-04 dispatcher. The confirmation carries `randevu.ics`: the e-mail path gained an optional `ekler` (multipart/mixed); without it the message is byte-identical to before. |
| `whatsappTekDokunusKanali` | **Not automatic.** The day-before reminder goes into the existing Hazır mesajlar queue (`iletisim_kuyrugu`) under the same de-dup key as the daily cron (`tekilAnahtar.randevu`), so it appears once in "Yarın N randevu" and is sent with one tap from the practice's own number. |
| Later | Automatic WhatsApp (Meta coexistence, approved template only) is one more `RandevuKanali` with `otomatik: true`, registered first in `randevuKanallari()`. No change is needed in jobs, routes or UI. |

## Server (`lib/randevu/v2/sunucu.ts`)

All server code uses the service-role client `servisSupabase()`, the shared no-store client.

| Operation | What it does |
|---|---|
| `talepOlustur` | Patient request. Re-validates the slot, then inserts `kaynak='portal'`, `durum='talep'` (or `onaylandi` when auto-confirm applies). Logs an event. |
| `pratikIslem` | Practice answer: `onayla` confirms; `oner` moves to another free time, stays `talep`, and `oneri_at` is set; `reddet` sets `iptal`. Conditional on `durum='talep'`, so a double tap cannot double-apply. |
| `hastaIslem` | Patient: `teyit` (Geliyorum), `kabul` (accept the proposal), `iptal`, `ertele` (move; becomes a request again unless auto-confirm applies). Cutoff enforced. |
| Jobs | `isEkle`, `bekleyenIsleriIptal`, `isleriCalistir`. Each job is claimed `bekliyor → isleniyor` before anything leaves, then re-validated against the current row. Quiet hours (21:00–07:00 TRT) hold e-mails, same as the existing dispatcher. A day-before e-mail sets `hatirlatma_gonderildi` (the dispatcher's own mark), so the existing 17:00 run does not e-mail a second time. |
| `eskalasyonTara` | An unanswered request older than `eskalasyon_saat` gets `eskalasyon_at` and an event, and is pinned red at the top of the practice list. Requests never expire: past-due ones stay listed as "Saati geçti — hastaya bilgi verin". |
| `hatirlatmalariTamamla` | Re-plans reminders for confirmed new-flow appointments moved from the existing calendar. The existing PATCH route is not touched; the upsert is idempotent. |

## Routes

| Route | Who | What |
|---|---|---|
| `GET/PUT/POST/DELETE /api/doktor/randevu-portal/ayar` | pratikOturum; write = doctor only | settings, izin ranges |
| `GET/POST /api/doktor/randevu-portal/talepler` | doktor + sekreter | open requests; free times for "Başka saat öner"; Onayla / Öner / Reddet |
| `GET/POST /api/portal/hasta/[token]/randevu` | patient (PIN-unlocked token) | types, own appointments, free times, request / cancel / move / accept / Geliyorum |
| `GET/POST /api/randevu/eylem` | signed link (no login) | GET changes nothing (mail scanners); POST performs the one action |
| `GET /api/cron/randevu-v2` | CRON_SECRET | escalation, reminder re-plan, due jobs. `vercel.json`: `*/10 3-19 * * *` UTC (06:00–22:59 TRT) |

## UI

| Surface | What |
|---|---|
| Entegrasyonlar › **Hasta Portalı Randevu** (`components/doktor/randevu/RandevuPortalKarti.tsx`) | One switch. When ON, one card: working hours (the existing `doktor_calisma_saatleri`, same API as Randevular), types with duration, rules, approval mode, izin days, one Kaydet. |
| Ana Sayfa + Randevular (`components/doktor/randevu/RandevuTalepleri.tsx`) | "N randevu talebi" with Onayla / Başka saat öner / Reddet. Renders nothing when empty. |
| Sağlığım › **Randevu** (`app/portal/hasta/[token]/randevu/page.tsx`) | The nav item appears only while ON. Type → day → time (the time tap sends; a single open type skips the first tap). Below it: own appointments with Geliyorum / Bu saati kabul et / Başka saat seç / İptal et under the doctor's cutoff. |
| `/randevu/<token>` (`app/randevu/[jeton]/page.tsx`) | E-mail action page, Sağlığım look, one confirm tap. |

## Isolation (brief rule 5)

- A patient sees only bare free times for **their own** doctor, never who holds a taken slot or why.
- Own appointments are read with `doktor_id + patient_id` from the PIN-unlocked token.
- A body-supplied appointment id is re-resolved with both before any write.
- The practice resolves request ids with `doktor_id` (pratikOturum); patient names are decrypted only for `patients.doctor_id = doktorId`.
- Signed links expose time, doctor name and state, never patient data.
- Cross-doctor tests are in `lib/security/hasta-izolasyon.test.ts`: practice list, slots for a foreign request, rejecting a foreign request, settings, portal list, foreign cancel and foreign slots, PIN required.

## PR2: Google Takvim two-way sync (dormant until credentials exist)

### Dormancy and scope

- The feature is hidden unless all three are set: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` (the same names the Gmail connect already reads) and `ENCRYPTION_MASTER_KEY`.
  - The Entegrasyonlar card renders nothing.
  - Routes answer 503 or empty.
  - The cron step is a no-op.
- **Scope: only `https://www.googleapis.com/auth/calendar.events`.** No openid/email and no calendar list. The address shown on the card is the primary calendar's `summary` from the first list call.
- Connecting a calendar is a doctor's own action and is independent of the portal switch. Busy blocks only matter to online booking.

### Pieces

| Piece | What |
|---|---|
| Migration `112_randevu_v2_google.sql` | `google_takvim_baglantilari`: one row per doctor, refresh token **encrypted with `encryptPII`**, sync token, page token, channel id/resource/expiry, **SHA-256 hash** of the channel token, `tam_ad` (default false). `randevu_dis_mesgul`: busy blocks, start/end only. `randevu_google_eslesme`: appointment → event mirror. `randevu_takvim_onerileri`: Google-side changes awaiting the doctor. New tables only. |
| `lib/randevu/v2/google/donustur.ts` (pure) | Event body; title = initials ("A. Y.") unless full name is chosen (KVKK); stable event id `n0<uuid hex>` (base32hex, so a retried insert cannot duplicate); incoming-event classification (busy / free / cancelled / ours); the conflict decision. |
| `lib/randevu/v2/google/istemci.ts` | OAuth (PKCE, `access_type=offline`, `prompt=consent`) and Calendar v3 over `fetch`: insert, patch, delete, list (singleEvents, showDeleted, syncToken/pageToken), watch, stop. |
| `lib/randevu/v2/google/senk.ts` | **Push:** confirmed (`onaylandi`) appointments from now − 1 day to + 90 days. The mirror is recorded **before** the call, so the push's own echo is not mistaken for a Google edit. Events whose appointment is no longer confirmed are deleted, mirror marked first. **Import:** incremental with `syncToken`; `410` → clear busy blocks and full resync; the first full sync can span cron ticks (`sayfa_jetonu`). **Conflicts:** an event carrying our private `notyaRandevuId` that moved or was deleted becomes a proposal. The id is honoured only when this doctor's own mirror has it, which defeats a copied marker. **Notya wins on its own appointments:** "Notya'daki kalsın" force-pushes Notya's version back. "Uygula" takes Google's change: a move is overlap-checked (+ the 111 trigger) and the patient's jobs are re-planned; a delete cancels and e-mails the patient. **Channel:** `events.watch` (7-day TTL), renewed a day before expiry; the old channel is stopped. **Disconnect:** best-effort delete of future Notya events, stop the channel, revoke at Google, delete token, mirrors and busy blocks. |
| `disMesgul.ts` | Now reads `randevu_dis_mesgul` for the slot engine. |

### Routes

| Route | What |
|---|---|
| `GET/PATCH/DELETE /api/doktor/google-takvim` | Status / full-name toggle / disconnect. doktorOturum; doctor only, since it is the doctor's own Google account. |
| `POST /api/doktor/google-takvim/baslat` | Returns the consent URL. The state is signed with the e-mail connect's signer, type `google_takvim`; the PKCE verifier and nonce go in an encrypted httpOnly cookie on `/api/google-takvim`. |
| `GET /api/google-takvim/donus` | OAuth callback. Register this exact URL in Google Cloud. |
| `POST /api/google-takvim/bildirim` | Push webhook. Channel id plus a timing-safe token-hash check, then imports that doctor only. Always 200. |
| `GET/POST /api/doktor/google-takvim/oneriler` | The doctor's proposals. |

### Triggers and UI

- **Triggers:**
  - after each V2 change (practice answer, portal action, e-mail link), a best-effort push of that one appointment;
  - the `randevu-v2` cron runs the catch-up for every connected doctor, oldest sync first, within the time budget.
- **UI:**
  - `components/doktor/randevu/GoogleTakvimKarti.tsx` (Entegrasyonlar);
  - `GoogleTakvimOnerileri.tsx` (inside the card and on Randevular; hidden when empty). Its buttons are "Yeni saati uygula" / "Randevuyu iptal et" and "Notya'daki kalsın".

## PR3: waitlist and Ayşe

### Waitlist

| Piece | What |
|---|---|
| Migration `113_randevu_v2_bekleme.sql` | `randevu_bekleme_listesi`: one open entry per appointment, with `en_gec` = that appointment's start; carries the 052-style restrictive patient-ownership policy. `randevu_bekleme_teklifleri`: offers, each with a deadline. New tables only. |
| `lib/randevu/v2/bekleme.ts` | Join/leave, the portal state, accepting an offer (`teklifKabul`), and the cron matcher `teklifTara`. |
| Portal | One checkbox per movable appointment: "Daha erken bir saat açılırsa haber ver". An open offer shows "Bu saati istiyorum". |
| E-mail link | Token action `teklif` (the id is the offer), handled by `/api/randevu/eylem` and `/randevu/[jeton]`. |

How `teklifTara` works:
- It runs every cron tick, outside quiet hours, only for doctors whose switch is ON.
- Waiting entries are walked **in list order**. Each gets the earliest free slot (same slot engine, same length) that starts at least 60 minutes before its appointment, is not already offered to anyone, and was not offered to that entry before.
- One open offer per entry and one open offer per slot. An offer lives 2 hours (`TEKLIF_SURESI_SAAT`); when it expires, the slot passes to the next patient in line.
- The offer goes by e-mail through the existing path (consent + the doctor's own mailbox) and always appears in the portal.
- **First to accept** wins: their appointment moves to the slot via `hastaIslem('ertele')`. The slot is re-validated and the DB guarantee applies. Under the default approval mode it becomes a **talep** the practice approves.
- Nobody learns whose appointment was cancelled.

### Ayşe

- **List:** the existing calendar reader (`takvimSorusu`, voice `randevu_takvim`), unchanged.
- **Create:** the existing `kontrol_randevusu_olustur` card, unchanged.
- **Move / cancel: new `randevu_degistir`** (`core/eylemler/randevuEylemleri.ts`):
  - It is a card the doctor confirms, same spine (`core/eylemler/onayla.ts`), T1, undoable within 24 h.
  - It is a base action (every branş) but **offered only while Hasta Portalı Randevu is ON** (`ozellik: 'randevu_v2'` → `AracSuzgeci.randevuV2`, read-only check `lib/randevu/v2/ozellik.ts`). It is ordered **after** every existing tool, so it never pushes one out of the 15-tool cap.
  - Writes use the calendar's overlap check plus the 111 guarantee. V2 reminder jobs are dropped or re-planned.
  - **No patient message is sent** (T3 `hastaya_mesaj_gonder` stays absent). The tool description tells Ayşe to remind the doctor to inform the patient.
- **Kontrol proposal at note approval** (`lib/randevu/v2/kontrolOnerisi.ts`, one hook in `app/api/notes/[id]/approve/route.ts`):
  - The approved plan says "2 hafta sonra kontrol" → a `kontrol_randevusu_olustur` taslak in the existing pending-cards tray.
  - The date is computed from the doctor's sentence (`kaynak: dosyadan`, quoted); the **hour is left empty**.
  - Only while ON, and only if the patient has no upcoming appointment and no open kontrol card.
- **Morning brief** (`lib/doktor/gunOzeti.ts`): appointments were already in it.
  - Pending requests are now excluded from "Bugün N randevu" (always 0 while OFF).
  - They are reported as "N randevu talebi yanıt bekliyor".
- **Guard:** the chat/voice import graph stays free of clinical writes (`core/eylemler/tests/sessizYol.test.ts`). Job helpers live in `lib/randevu/v2/isler.ts`, which writes `randevu_isleri` only.
