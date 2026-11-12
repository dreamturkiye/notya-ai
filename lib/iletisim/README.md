# lib/iletisim — one-tap patient messages from the doctor's OWN accounts

NOTYA-ILETISIM-01 (Kaan, 2026-09-25). Doctors and their secretaries message patients by WhatsApp and email **from
their own WhatsApp and their own mailbox**, with no middleman. Notya prepares the recipient and the text; the device
in the sender's hand opens its own WhatsApp / mail; a human taps send.

NOTYA-ILETISIM-04: once the doctor has connected his own Gmail/Outlook (job B) or WhatsApp Business number (job C),
non-clinical queue items leave **by themselves** from that account (see "Automatic sending" below). Doctors who
connected nothing keep exactly the one-tap flow.

## Map

| File | What |
|------|------|
| `tipler.ts` | `MesajTuru`, `IletisimKanali`, `EpostaAcilis`, labels |
| `sablonlar.ts` | Turkish templates (`mesajHazirla`). **No clinical information, ever.** Guardian wording follows the patient's age (`veliDili` ← `veliDiliMi`). |
| `baglantilar.ts` | `whatsappLinki(telefon, metin)` → `https://wa.me/<digits>?text=…`; `epostaLinki(adres, konu, govde, 'uygulama' \| 'gmail' \| 'outlook')` → `mailto:` / Gmail web / Outlook web compose. Uses `normalizeTrPhoneE164` (lib/doktor/twilioNotify.ts). Every link ≤ `LINK_UST_SINIRI` (1800); link lines survive shortening. |
| `izin.ts`, `izinMetni.ts` | Consent gating (`kanalDurumu`, `onerilenKanal`) and the consent wording / intake field ids |
| `kuyruk.ts` | Hazır mesajlar: de-duplication keys, tomorrow's appointment candidates, staff rules (`PERSONEL_TURLERI`, `turIzinliMi`) |
| `sunucu.ts`, `hazirlik.ts` | Server: doctor-scoped reads, fail-soft helpers, `kuyrugaEkle`, `iletisimHazirla` |
| `istemci.ts` | Browser: API calls, per-device choices, `baglantiyiAc` (iOS-Safari-safe) |
| `otomatik.ts` | Sender registry: WhatsApp + e-posta adapters over jobs B/C, `OTOMATIK_TURLER`, `whatsappSablonu` (type → approved template + variables) |
| `otomatikGonderim.ts` | The dispatcher (`otomatikGonder`), the human claim (`elleSahiplen`), how an item looks to people (`insanGorunumu`), `bugunOtomatikSayisi` |
| `otomatik/eposta/`, `otomatik/whatsapp/` | Job B (Gmail/Outlook, 096) and job C (WhatsApp Business coexistence, 097). Setup guides: `docs/iletisim-kurulum-eposta.md`, `docs/iletisim-kurulum-whatsapp.md` |

UI: `components/doktor/iletisim/` — `GonderDugmesi` (the one send button), `HazirMesajlar` (Ana Sayfa card +
full-screen flow), `IletisimAyarKarti` (Ayarlar › İletişim), `OtomatikSlotlari` (`WhatsAppBaglan` + `EpostaBaglan`),
`RandevuMesaji`, `HastaIletisim`.
API: `app/api/doktor/iletisim/{hazirla,kayit,izin,kuyruk,ayarlar}`, `app/api/iletisim/{eposta,whatsapp}`; crons
`app/api/cron/randevu-hatirlatma` and `app/api/cron/iletisim-otomatik`. DB: `lib/db/migrations/095_iletisim.sql`,
`096_eposta_baglantisi.sql`, `097_whatsapp_baglantisi.sql`, `098_iletisim_otomatik.sql`.

## Rules

1. **No clinical content in any message.** A message says there is an appointment / a new Sağlığım message / a form
   to fill; details stay behind the PIN-protected Sağlığım link. No attachments — documents go as a Sağlığım link.
2. **Consent per channel.** Only `patients.iletisim_izni_<kanal> === true` opens a channel. `null` = unknown (every
   patient registered before 095) and is treated as "no" until someone marks it; the mark records who and when
   (`iletisim_izin_kayitlari`). Checked on the server (`POST /kayit` answers 409), not only in the UI.
3. **Staff (sekreter) = appointment messages only**: `PERSONEL_TURLERI` (randevu hatırlatma / değişikliği / iptali,
   tetkik getirin, hasta bilgi formu). Enforced in every route (403 / 404) and by the 095 RLS policies. Sağlığım
   notices, vaccine and recall items stay with the doctor. The log keeps the staff member as sender.
4. **Patient isolation.** Every id from outside is resolved with the doctor's column in the same query
   (`.cursor/skills/hasta-izolasyon/SKILL.md`); new routes are in `lib/security/hasta-izolasyon.test.ts`.
5. **Fail soft** until 095 is applied: empty queue, unknown consent, no log — never a crash.
6. **No cron touches `asilar`** (lib/asi/hatirlatma.test.ts). Due vaccines are enqueued when the doctor opens the
   queue (`asiKuyrukAdaylari`), not by a cron.
7. **Serbest randevu** (booking without a patient record): not enqueued and cannot be messaged from Notya — there is
   no patient record to hold the consent. Register the patient first.

## Contract for jobs B and C — `OtomatikGonderici`

Job B (NOTYA-ILETISIM-02: Gmail / Outlook, send-only) and job C (NOTYA-ILETISIM-03: WhatsApp Business coexistence)
add **unattended** sending from the doctor's own accounts. They plug in here and replace only
`components/doktor/iletisim/OtomatikSlotlari.tsx` in the UI.

```ts
interface OtomatikGonderici {
  kanal: 'whatsapp' | 'eposta'
  saglayici: string                       // 'gmail' | 'outlook' | 'whatsapp_business'
  hazirMi(doktorId: string): Promise<boolean>
  gonder(istek: OtomatikGonderimIstegi): Promise<{ ok: true; saglayiciMesajId?: string } | { ok: false; hata: string }>
}
```

- Register in `otomatikGondericiler()`; callers use `hazirOtomatikGonderici(doktorId, kanal)` (null → the manual
  one-tap path, exactly as today).
- `hazirMi` and `gonder` **never throw**; on any doubt `hazirMi` answers false and `gonder` returns `{ ok: false }`.
- The caller has already done ownership (`hastaSahibiMi`), consent (`gonderilebilirMi`) and staff checks, and passes
  the text from `mesajHazirla` — a sender must not build or change message text.
- Messages always leave from the **doctor's** account (`doktorId` = the practice owner), also when a secretary
  triggered them.
- On `ok: true`, log to `iletisim_kayitlari` with `durum = 'gonderildi'` and close the queue item — the same writes
  `PATCH /api/doktor/iletisim/kayit` does for the manual path.
- Credentials (OAuth refresh tokens, Meta tokens) live server-side only, encrypted, never in the browser, never in
  this module's return values. UI copy never says OAuth, token, API or deep link.
- WhatsApp Business: template messages only where Meta requires them (utility templates for randevu reminders).
  NOTYA-ILETISIM-04 goes further: the automatic WhatsApp path from the queue sends approved templates ONLY, never free text.
  WHATSAPP-API-01 adds exactly two free-text cases, both inside Meta's 24h customer-service window: the fixed confirmation
  sentence after a patient's own EVET / İPTAL / DUR (`lib/iletisim/whatsapp/serbest.ts` `SABIT`) and the doctor's one-tap
  "Yanıtla". Outside the window only the generic `genel_bildirim` template may go.

## Automatic sending (NOTYA-ILETISIM-04)

- **What**: only `OTOMATIK_TURLER`: randevu hatırlatma / değişikliği / iptali, hasta bilgi formu, Sağlığım'da yeni
  mesaj. Aşı, kontrol, tetkik, Sağlığım bağlantısı and free text are always one-tap.
- **When**: the randevu cron runs the dispatcher right after it fills tomorrow's reminders (07:00, 17:00 TRT);
  `/api/cron/iletisim-otomatik` sweeps every 10 minutes, 07:00–21:00 TRT, for everything enqueued in between. Enqueue
  triggers (e.g. `notifyPatientNewPracticeMessage`) never wait on a provider. Nothing leaves at night. Only items of
  today and yesterday; older ones stay with people.
- **Channel**: WhatsApp first (approved template only, `whatsappSablonu`; minors are greeted as "Sayın Veli"), else
  e-posta (the `mesajHazirla` text). A channel is used only with the patient's consent for it and a ready sender.
  WhatsApp answers "no" → e-posta. A sender that throws or hangs → no second channel (the first may have left).
- **At most once**: the dispatcher claims an item (`otomatik_durum` null → `gonderiliyor`) with a conditional update
  before any network call. A person opening the item in the send flow claims it too (`elle`), and an item the machine
  already sent answers 410 in `/hazirla`. A claim older than 10 minutes is shown to people again with a
  "gitmiş olabilir" note. Failures stay `bekliyor` with a short Turkish `otomatik_hata` and are not retried.
- **Log**: `iletisim_kayitlari` with `durum = gonderildi`, `otomatik = true`, `saglayici`, `saglayici_mesaj_id` (Gmail id /
  WhatsApp wamid); the queue item → `gonderildi`; a reminded appointment → `hatirlatma_gonderildi`.
- **Off until** migration 098 is applied (no claim column → nothing is sent) and the doctor has connected an account
  whose env vars exist.

## Klinik Kalkanı (NOTYA-KALKAN-01)

Gelen hasta mesajı ve hekimin uygulamadan yazdığı yankı `wa_konusma` / `wa_satir` defterine düşer. Gövde şifrelidir.
Otomatik cevap yalnız sabit cümledir (ilaç adı yok). Hekimin kendi cümlesi taslak olur; `hasta_ilaclar` Fısıltı’da
**Onayla** olmadan değişmez. Bilinmeyen numara hasta açmaz. Aynı telefon iki kayıtta ise klinik işlem yok.
Starter planda ve migration 103 uygulanmamışsa bu katman susar; one-tap ve şablon yolu aynı kalır.
`notya_kalkan_yonlendirme` UTILITY şablonu bu depoda oluşturulmaz — Meta’ya elle sunulur.
Ayarlar’daki muayenehane numarası tek başına “bağlı” değildir; Meta’da görünen numarayla aynı olmalıdır.

## Seans paketi (NOTYA-PAKET-01)

Onaylı SOAP ve Kalkan Onayla aynı paketi doldurur. Kapı 3 uyarır, kapı 2 kopyalar. İkisi de ilaç kartını kesmez.
Migration `104_seans_paketi.sql` uygulanmadan kapılar susar.

## WHATSAPP-API-01 (2026-10-16) — inbound replies, inbox, quota, audit

Code: `lib/iletisim/whatsapp/` (niyet, eslestir, randevuEylem, yanit, eylem, serbest, yedek, bakim, webhookIsle, kvkk, yardim) and
`lib/iletisim/otomatik/whatsapp/{kota,gunluk,saglik}.ts`. Migration `169_whatsapp_cloud_api.sql` (written, NOT applied).
Setup and Meta console steps: `docs/iletisim-kurulum-whatsapp.md`.

- **Env names**: `WHATSAPP_APP_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_ES_CONFIG_ID`, `WHATSAPP_VERIFY_TOKEN` (the earlier `META_*` /
  `WHATSAPP_WEBHOOK_VERIFY_TOKEN` names remain a fallback). Webhook URL: `/api/whatsapp/webhook` (the old URL runs the same handler).
- **İPTAL rule**: with an upcoming appointment İPTAL cancels that appointment; only STOP / DUR opt out. With nothing to cancel
  İPTAL opts out, as on SMS (`vazgecKelimesiMi`). Turkish case folding is done by `katla()` (`IPTAL`, `İPTAL`, `ıptal`, `iptal!`).
- **Safety boundary**: only a rule match (not the model) may confirm / cancel / opt out, and only with exactly one matching patient
  in THAT doctor's roster. The model's label only decorates the doctor's card.
- **Tables** (169): `whatsapp_mesaj_gunlugu` (append-only audit; body encrypted; counterpart keyed hash), `whatsapp_yanitlar`
  (inbox cards), `whatsapp_kota_saatlik` (hourly quota buckets) + RPCs `whatsapp_kota_al`, `whatsapp_kota_iade`, `whatsapp_gunluk_imha`.
- **Cron**: `/api/cron/whatsapp-bakim` hourly at :17.
- **Isolation (hasta-izolasyon)**: the receiving `phone_number_id` decides the doctor; every read/write carries `doctor_id`; card
  actions re-resolve the appointment with the doctor id AND the card's own patient id. Tests: `lib/iletisim/whatsapp/whatsapp-api.test.ts`.

## WHATSAPP-ONBURO-01 (2026-11-12) — "Ayşe ön büro": a new appointment by chat, answers from the practice sheet

Code: `lib/iletisim/onburo/`. Classification: CORE (shared patient-communication workflow — all 40 branches through the
one pipeline). Per-doctor switches, **default OFF**; inert until migration `195_whatsapp_on_buro.sql` is applied (a
missing settings table reads as OFF). Entry point: `yanit.ts` calls `onBuroIsle` after the doctor was derived from the
receiving `phone_number_id`, the sender was matched inside that doctor's roster and the audit row was written. It either
handles the message completely (own card, own replies) or returns `ele: false` and the existing pipeline runs unchanged.

| File | What |
|------|------|
| `ayar.ts` | Settings (`randevuModu`: kapali / onay / otomatik; `yanitAcik`) and the "Muayenehane bilgileri" sheet. Pure. |
| `dil/tipler.ts`, `dil/tr.ts`, `dil/aktif.ts` | The language pack contract and the Turkish pack: booking-intent rules, day / part-of-day words, medical + emergency guard lists, emergency number, every fixed sentence, date labels. A country build swaps `dil/aktif.ts`. |
| `slot.ts` | Chooses up to three of the slot engine's free times (one per day; a named day is spread over that day). Pure. |
| `bilgi.ts` | Answers: emergency guard → medical guard → deterministic rules → the model (select / compose from the sheet only; cited keys validated). |
| `sunucu.ts` | Settings read / save, working-hours default, reply caps and the daily model budget (counted from the audit log). |
| `isle.ts` | The inbound handler (decision by rules, card claimed first, crash-safe booking). |
| `eylem.ts` | Desk actions: approve / decline a request, undo an automatic booking; `talepSonucuBildir` for the calendar's request list. |
| `fisilti.ts` | Ön büro fısıltısı items (read-only): new-patient request, booked by Ayşe, emergency-worded message. |
| `onizleme.ts` | The settings card's test box — same rules, nothing sent or stored. |

**Booking.** A matched patient with no upcoming appointment who asks for one (rule-recognised only — typos, Turkish case
folding, negation / question / past-tense guards; cancel and reschedule wording stays with `iptalNiyeti.ts`) gets up to
three free times (`musaitSlotlar`: working plan, holidays, external busy, visit types and durations, notice and
max-days limits of the appointment settings). "1/2/3" picks; "başka gün / daha geç / sabah / salı / 15 kasım" re-proposes
(at most `ONERI_SINIRI` proposals, then the desk takes over). `onay` → `talepOlustur(kanal 'whatsapp', onay 'zorunlu')`:
an appointment row in state `talep` that appears in the calendar's existing request list (doctor + secretary); `otomatik`
→ the same function with `onay 'yok'`: confirmed at once, event log + confirmation and reminder jobs queued, Google push.
Both write `randevular.kaynak = 'whatsapp'`. A patient who already has an upcoming appointment is left to the doctor.

**Unknown number.** Never a patient row from the chat. Privacy notice first, then the full name, then the same proposal;
the pick becomes an `ob_yeni_hasta_talebi` card (name encrypted). The desk's approval creates the patient through
`lib/doktor/hastaOlustur.ts` (the write `POST /api/doktor/hastalar` uses) — or links the one patient the number now
belongs to — and books. **Two patients on one number** → "for whom?" with first names only, from this doctor's matches.

**Answers.** Only from the sheet. Rules answer the obvious questions; otherwise `aiCagir` (task `kisa-yanit`, no model
name here) receives the pseudonymised question and the sheet — never a patient record, note, appointment or name — and
must return `{alanlar, yanit}`. Every cited key must exist and be non-empty; a number or link not present in the cited
fields, or medical wording, discards the model's sentence in favour of the doctor's own text. No answer / failure /
timeout → the holding sentence and a card. Medical wording → fixed sentence + flagged card; emergency wording → the fixed
sentence with the country's emergency number + urgent card. Both guards run before the model and are rule lists.

**Limits.** STOP / DUR is checked first and always belongs to the opt-out flow. `NUMARA_SAATLIK` automatic replies per
number per hour (also the loop guard) and `DOKTOR_SAATLIK` per doctor; `MODEL_GUNLUK` model calls per doctor per day. At a
cap the card says so and nothing is sent. All replies are session messages (`oturumMetniGonder`, 24-hour window); a desk
notice outside the window falls back to the approved `genel_bildirim` template.

**Cards** (`whatsapp_yanitlar.otomatik_eylem`, `ob_*`; state in `on_buro` jsonb, answers and names encrypted):
`ob_slot_onerildi`, `ob_talep`, `ob_otomatik_randevu`, `ob_yeni_hasta_talebi`, `ob_kisi_soruldu`, `ob_ad_soruldu`,
`ob_yanit`, `ob_cevapsiz`, `ob_tibbi`, `ob_acil`, `ob_sinir` (+ the closed forms). One card per inbound wamid.

**Routes.** `GET/PUT /api/doktor/iletisim/on-buro` (GET: doctor + secretary; PUT: doctor), `POST …/on-buro/onizleme`
(doctor), `POST /api/doktor/on-buro-fisilti/on-buro` (desk actions, pratikOturum), the inbox card route (`ob_*` actions),
and a hook in `/api/doktor/randevu-portal/talepler` that answers a chat-made request on WhatsApp.

**Not built** (docs/OPEN-COMMITMENTS.md WHATSAPP-ONBURO-01): intake in the chat; the six country builds (no inbound
WhatsApp pipeline there yet); live Meta verification; clinician / legal review of the guard lists and the privacy notice.
