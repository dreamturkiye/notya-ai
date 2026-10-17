# NetGSM SMS — research notes (NETGSM-01)

Date: 2026-10-16. Author: Claude (for Kaan). Purpose: add a second bulk-SMS adapter so doctors who use an iPhone
(which cannot run android-sms-gateway) can send bulk SMS through THEIR OWN NetGSM account. Notya pays nothing and
holds no SMS account.

**Honest status of this research.** `netgsm.com.tr` (the official docs at `/dokuman/`) and `api.netgsm.com.tr` were
NOT reachable from the build sandbox (proxy 403), so the official HTML documentation could not be read. Everything
about the API below comes from **NetGSM's own official Node client**, `@netgsm/sms` v1.1.11 (published by "Netgsm
İletişim ve Bilgi Teknolojileri A.Ş", MIT, repo `netgsm/netgsm-sms-js`): its source code, TypeScript types, error-code
enums and examples. That is primary-source for request shapes and error codes, but it is **not** the full
documentation. Where something is not in those sources it says **NOT DOCUMENTED IN WHAT I COULD READ** — no field
here was invented. **Nothing was run against the live NetGSM API.**

## Sources

| # | Source | Used for |
|---|--------|----------|
| 1 | https://registry.npmjs.org/@netgsm/sms/-/sms-1.1.11.tgz (package page: https://www.npmjs.com/package/@netgsm/sms) — `dist/esm/netgsm.js`, `dist/types.d.ts`, `dist/esm/enums.js`, README, CHANGELOG | endpoints, auth, fields, response shape, error codes, status codes |
| 2 | https://raw.githubusercontent.com/netgsm/netgsm-sms-js/main/examples/advanced/additional-examples.js (repo https://github.com/netgsm/netgsm-sms-js) | `encoding: 'TR'`, `iysfilter` values 0 / 11 / 12, number format `5XXXXXXXXX` |
| 3 | https://github.com/tarfin-labs/netgsm (third-party Laravel package README) | balance returned with comma decimal (`2,7`); IYS add/search endpoints exist |
| 4 | https://github.com/netgsm1/otp (NetGSM PHP OTP wrapper README) | usercode/password/header triple; only points back to https://www.netgsm.com.tr/dokuman/ |
| 5 | https://birfatura.com/netgsm-entegrasyonu/ | a header ("başlık") needs documents sent to the provider; list/timing NOT given |
| 6 | https://mihci.av.tr/ticari-elektronik-iletiler/ (law-firm summary of 6563 + the Yönetmelik) | ticari vs. bilgilendirme, consent, opt-out, İYS |
| 7 | https://www.kvkk.gov.tr/Icerik/7557/2022-107 and https://ismmmo.org.tr/dosya/2192/Mevzuat-Dosya/ILETIREHBERI.pdf | appeared in search results for İYS/ticari ileti; **not read** — listed so a reviewer can start there |
| 8 | Official NetGSM docs https://www.netgsm.com.tr/dokuman/ | **blocked, not read** |

## What NetGSM's client specifies

**Host:** `https://api.netgsm.com.tr` (hard-coded in the official client). Notya hard-codes the same host; there is
no doctor-supplied URL, so no SSRF surface.

**Auth:** HTTP Basic, `usercode:password`, `Content-Type: application/json`. The balance call is the exception: it
posts `{ usercode, password, stip }` in the JSON body. "API access" must be enabled on the account and an IP
restriction can reject us (error 30 text: *"Invalid username, password or no API access. If IP restriction exists,
request may have been made from an unauthorized IP"*). Notya's servers do not have a fixed outbound IP — if a doctor
turns on IP restriction at NetGSM, sending will fail with 30. NOT DOCUMENTED: whether usercode/password for the API
are the same as the web-panel login (the Notya UI therefore says "API şifresi" and tells the doctor to ask NetGSM).

**Send:** `POST /sms/rest/v2/send`
```json
{ "msgheader": "BAŞLIK", "encoding": "TR", "iysfilter": "0",
  "messages": [ { "msg": "text", "no": "5XXXXXXXXX" } ] }
```
Optional in the client: `appname`, `partnercode`, `startdate` / `stopdate` (format `ddMMyyyyHHmm`, scheduled sending).
Notya sends none of those. Number: `5XXXXXXXXX` (no leading 0, no country code). Success: `{ "code": "00",
"description": "...", "jobid": "..." }`. Errors come back as HTTP 200 or **406** with a non-`00` `code`
(client treats both as API-level responses; other statuses as HTTP errors). One request may carry many
`messages` ("different messages for each recipient"); Notya sends one message per call because the bulk engine's
idempotency is per recipient.

**Message header ("başlık", sender name):** required field `msgheader`. Error 40 = *"Message header (sender name) is
not defined in the system"*. Which headers exist for an account can be listed with `GET /sms/rest/v2/msgheader`
(→ `{ code, msgheader: string[] }` or `msgheaders`). **NOT DOCUMENTED in what I read:** the approval process,
documents, time it takes, character rules or length limits of a header. (BirFatura's page confirms documents are
needed; nothing more.) The UI therefore says approval "may take time" and does not state rules.

**Turkish characters:** `encoding` accepts `TR` and `ASCII` (README: `// TR, ASCII`); the official example uses
`'TR'` for `çğıöşüÇĞİÖŞÜ`. Notya always sends `TR`.

**Length / segments:** error 20 = *"Could not be sent due to a problem in the message text or exceeded the standard
maximum message character count"*. The only number in the client is the OTP limit ("Max 160 char"). **NOT DOCUMENTED
in what I read:** characters per segment for TR encoding, maximum total length, how long messages are billed.
Notya sends the text unchanged and shows the doctor the character count with a hedge ("over 160 characters may be
billed as more than one SMS"), and does not display a segment number it cannot back up.

**Send error codes (`/sms/rest/v2/send`)** — from the official enum:

| Code | Official meaning (client text) | Notya doctor-facing handling |
|------|-------------------------------|------------------------------|
| 00 | success | `gonderildi` (accepted by NetGSM — NOT proof of delivery) |
| 20 | message text problem / over the max length | shorten the message |
| 30 | invalid usercode/password or no API access (or IP restriction) | check settings / ask NetGSM to enable API |
| 40 | message header not defined in the system | get the header approved, type it exactly |
| 50 | IYS-controlled sending not allowed for the account | talk to NetGSM |
| 51 | no IYS brand information for the subscription | talk to NetGSM |
| 70 | invalid query: a parameter is wrong or missing | check settings / phone number |
| 80 | sending rate limit exceeded | wait, continue |
| 85 | duplicate rate limit (max 20 tasks per number per minute) | wait |
| 100 / 101 | system error | retry later |
| (other) | — | shows the code + generic advice; a text mentioning kredi/bakiye/credit maps to "no credit" |

NOT DOCUMENTED in what I read: a send-time "insufficient credit" code. The report endpoint has status `14`
(insufficient balance) per message, which means a credit shortage may be visible only in the delivery report, not at
send time. Notya does not poll reports in v1.

**Balance:** `POST /balance` with `{ usercode, password, stip }`; `stip` 1 = packages, 2 = credit, 3 = both. Response
`{ balance: "2,7" }` (string, Turkish comma decimal, per the tarfin README) or `{ balance: [{ amount, balance_name }] }`.
The client's error enum names the endpoint `/sms/rest/v2/balance` while the code calls `/balance` — a documentation
inconsistency in NetGSM's own client; Notya uses `/balance` (what the code actually calls) and treats an
unreadable answer as "credit unknown", never as an error that blocks sending.

**Delivery reporting:** `POST /sms/rest/v2/report { jobids: [...] }` (limit: 10 queries/minute) returns per number
`status`: 0 pending, 1 sent, 2 expired, 3 invalid/restricted number, 4 not sent to operator, 11 rejected, 12 delivery
error, 13 duplicate, 14 insufficient balance, 15 blacklisted, 16 IYS rejected, 17 IYS error. **Not used in v1** —
Notya records `gonderildi` when NetGSM accepts the job (`code 00`, `jobid` stored in `saglayici_mesaj_id`).
That is "accepted", not "delivered". Wiring a report poller is a follow-up (OPEN-COMMITMENTS NETGSM-01).

**Non-sending connection check:** `GET /sms/rest/v2/msgheader` proves the usercode/password/API access and lists the
approved headers; Notya compares the typed header against the list. Plus `/balance` for credit. **No SMS is sent by
"Bağlantıyı test et".** A real test SMS was deliberately not built.

**Inbound replies / STOP:** the client has `GET /sms/rest/v2/inbox` (optional `startdate`/`stopdate` `ddMMyyyy`) →
`{ messages: [{ message, sender, receiver, datetime }] }`; error 40 means "no messages", and *"if you are not using the
startdate and stopdate parameters, you can only list your messages once with the API"*. So inbound is **pull**, not
push — there is no webhook in the client. **NOT DOCUMENTED in what I read:** whether an alphanumeric sender name can
receive replies at all (alphanumeric sender IDs generally cannot — to be confirmed with NetGSM), or which NetGSM
product/number is needed to receive. Decision (see below): STOP replies are **not** captured for NetGSM.

## Decision: STOP / opt-out for the NetGSM channel

Messages leave under an alphanumeric sender name; no push mechanism exists to wire into the existing webhook-secret
pattern; a poller over `/inbox` would need a number that can receive replies, which is unconfirmed. Therefore:

* the footer for NetGSM is **"Bu mesajları almak istemiyorsanız muayenehanemizi arayarak bildirebilirsiniz."**
  (`smsVazgecSatiri('netgsm')`); the Android channel keeps its STOP line (its webhook does capture it);
* the doctor-facing screens say plainly that STOP replies are not captured automatically for NetGSM and that the
  doctor must switch the patient's SMS consent off by hand (`patients.iletisim_izni_sms = false`);
* if the provider changes between composing and sending, the send is refused (`beklenenSaglayici`), so a footer
  written for one channel can never go out through another;
* opted-out patients (`iletisim_izni_sms` not exactly `true`) are excluded exactly as before — in the recipient
  selection, not only the UI.

## Turkish rules for SMS to patients — what I found (NOT legal advice)

State of knowledge: from source 6 and general knowledge; **all of it needs confirmation by a mali müşavir / avukat
and by NetGSM** (tracked as NETGSM-03).

1. **Law 6563 (Elektronik Ticaretin Düzenlenmesi Hakkında Kanun) and the Ticari İletişim ve Ticari Elektronik İletiler
   Hakkında Yönetmelik** regulate *ticari elektronik ileti* — electronic messages (SMS, e-mail, calls) sent **for
   commercial purposes**. Messages not sent for commercial purposes are outside that regime (source 6).
2. A *ticari* message needs the recipient's **prior consent (onay)** (Law 6563 art. 6, per source 6), kept provable by
   the sender; recipients have a free, easy **opt-out (ret) right**, the opt-out channel must be in every commercial
   message, and the sender must stop within three business days (Yönetmelik art. 9, per source 6). Senders of
   commercial messages register with and record consent in **İYS** (İleti Yönetim Sistemi).
3. Source 6 lists messages that need no consent and may be used only for their purpose, not promotion: information
   about the goods/services the person asked for, subscriptions/payments/accounts, messages required by other
   legislation. An **appointment or vaccine reminder to the doctor's own patient** looks like this category
   (service information), **but I could not confirm that classification for health services** — and a message that
   adds promotion ("check-up kampanyası", price offers) would be *ticari*.
4. NetGSM's client exposes `iysfilter`: `'0'` = *bilgilendirme amaçlı gönderim (İYS kontrolsüz)*, `'11'` = ticari,
   bireysel alıcı (İYS controlled), `'12'` = ticari, tacir alıcı. Notya sends `'0'` because the bulk-send screen is for
   patient information messages. **This is a classification the doctor is responsible for**; the Ayarlar screen tells
   them to send information only and that advertising/campaign texts need İYS consent and must not go through this
   screen. Open: whether NetGSM accounts that are not İYS-enabled accept `'0'` (expected yes; to watch on the first
   real send).
5. **Physicians and advertising:** health professionals are separately restricted in advertising (Tıbbi Deontoloji
   Nizamnamesi / sağlık mevzuatı). Not researched here; another reason to keep SMS strictly informational. Needs
   confirmation.
6. **KVKK:** a patient's phone number is personal data and health-relationship data is special-category. Existing
   product rule is kept: bulk SMS carries **no clinical content** (`sablonlar.ts`). NetGSM becomes a processor/recipient
   of the patient phone number and message text on the doctor's behalf (the doctor's own account) — the doctor's
   aydınlatma metni / veri işleme envanteri may need a line. Needs confirmation.
7. **Sender name (başlık):** per source 5 documents are required; approval time and rules not found.

## What is NOT proven

* No request has been made to NetGSM by this code. Shapes are from the official client, not from live traffic.
* Segment/length behaviour, header approval rules, API-password vs panel-password, IP restriction behaviour for
  Vercel (no fixed egress IP), and the `iysfilter: '0'` acceptance are unverified.
* Credit shortage may only appear in delivery reports (status 14), which v1 does not poll.
