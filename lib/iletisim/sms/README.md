# lib/iletisim/sms — the doctor's own phone, no Twilio

NOTYA-HASTA-ILETISIMI-01 (Kaan, 2026-10-16). Bulk SMS (`lib/iletisim/toplu/`) needed a sending channel.
Kaan's standing decision, repeated across `docs/OPEN-COMMITMENTS.md` (GOZ-SMS-RECALL, DERM-SMS-RECALL —
`TWILIO_SMS_FROM` deliberately never configured): **no Twilio, no paid per-message SMS API.** SMS must
leave from the doctor's **own phone number**, the same "doctor's own account" shape as WhatsApp/e-posta
in `lib/iletisim/README.md`.

## What is actually shipped, stated plainly

There is no way to send a real SMS from a server without EITHER a paid carrier/aggregator API (Twilio,
Vonage, …, all explicitly ruled out) OR a phone that physically holds the SIM doing the sending. So the
one real, free, zero-marginal-cost path is: the doctor's own Android phone runs a small app that exposes
an HTTP endpoint; this backend calls that endpoint; the phone sends the SMS through its own SIM exactly as
if the doctor had typed it. That is what is implemented:

- **Adapter**: `androidGateway.ts` — a client for **android-sms-gateway**
  (github.com/capcom6/android-sms-gateway, MIT-licensed, free, open source — not a Notya product and not
  operated by Notya). The doctor installs this one APK on their own phone, with their own SIM, and gets
  either a **local** HTTP endpoint (phone and server reachable on the same network / via the app's own
  free cloud relay) or the project's **free-tier cloud API** (api.sms-gate.app) — either way the SMS leaves
  from that phone's number, under the doctor's control, at zero per-message cost. They enter the endpoint
  URL + the login/password the app showed them into Ayarlar › İletişim; those credentials are encrypted at
  rest (`encryptPII`) and never reach the browser.
- **Interface is pluggable** (`gonderici.ts`, same shape as `lib/iletisim/otomatik.ts`'s
  `OtomatikGonderici`) specifically so a second adapter (a different open-source bridge, or a future paid
  one Kaan explicitly approves) can be added without touching `lib/iletisim/toplu/`.
- **Honest limits, stated once here, not oversold elsewhere in this sprint's report:**
  - This requires the doctor (or a technical person helping them) to install and configure a third-party
    open-source app once. It is not something Notya ships inside its own app — Notya only calls the
    endpoint the doctor configures.
  - The HTTP contract this client speaks (`POST {taban_url}/message`, Basic Auth, JSON
    `{ message, phoneNumbers }` → `{ id, state }`) is the project's **documented** API shape at the time
    this was written. It has **not** been exercised against a live phone/app instance in this sandbox (no
    device was available) — this is real, working client code against a real published contract, not a
    stub, but the first live send should be watched once by a human before relying on it unattended.
  - Until a doctor configures a gateway, `hazirMi()` answers `false` and the bulk-send screen falls back
    to the **semi-automated path**: it still prepares the exact per-recipient message list (phone + final
    text) and offers it as a copyable/downloadable list for the doctor to send from their own phone's
    native SMS app. That fallback is explicitly NOT bulk automation — the UI must never imply it is.

## Files

| File | What |
|------|------|
| `tipler.ts` | `SmsGondericiSonuc`, `SmsGonderimIstegi` |
| `gonderici.ts` | `SmsGonderici` interface, registry (`smsGondericiler`), `hazirSmsGonderici(doktorId)` |
| `androidGateway.ts` | The one real adapter — HTTP client + response parsing |
| `ayar.ts` | Doctor's own gateway connection: read/write `iletisim_sms_ayarlari` (encrypted password) |

## STOP / DUR (opt-out)

`app/api/iletisim/sms/webhook/[doktorId]/route.ts` accepts an inbound-message webhook (android-sms-gateway
can POST received SMS to a configured, per-doctor URL, authenticated by a shared secret the doctor also
configures in the gateway app). A message whose trimmed, case-folded body is `stop`, `dur` or `iptal`
flips `patients.iletisim_izni_sms` to `false` for the matching patient (decrypt-and-compare over that
doctor's active patients, same pattern as `lib/iletisim/kalkan/isle.ts`) and logs it to
`iletisim_izin_kayitlari` with `kaynak = 'vazgecme'`. Every bulk filter (`lib/iletisim/toplu/filtre.ts`)
reads that same column, so an opted-out patient is excluded from the NEXT campaign automatically — this is
enforced where recipients are selected, not only in a UI control that a retried request could skip.

The webhook only RECOGNISES the keyword; the patient has to be told it exists, or the mechanism is real
but undiscoverable. `lib/iletisim/toplu/sablonlar.ts`'s `TOPLU_SMS_VAZGEC_SATIRI` ("Bu mesajları almak
istemiyorsanız STOP yazıp gönderin.") is appended to every bulk SMS send (`kampanya.ts`) for exactly this
reason. The e-mail equivalent is a per-patient, HMAC-signed unsubscribe link (`lib/iletisim/vazgecJetonu.ts`,
`app/api/iletisim/vazgec/[jeton]/route.ts`) appended as a footer to every bulk e-mail.
