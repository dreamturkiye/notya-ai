# WhatsApp: automatic messages from the doctor's own number (NOTYA-ILETISIM-03, extended by WHATSAPP-API-01)

Setup guide for Kaan, written 2026-09-25, updated 2026-10-16. Nothing works until the environment variables in step 6 exist AND migration `169_whatsapp_cloud_api.sql` is applied (written, never applied by Claude). Until the variables exist the card shows **"WhatsApp otomatik gönderimi için kurulum bekleniyor."** and every `/api/iletisim/whatsapp/*` route answers 503.

**Nothing in this integration has been run against real Meta.** Every test uses an injected `fetch`. The first real send, the first real webhook and the template approvals are open commitments (`docs/OPEN-COMMITMENTS.md`, WHATSAPP-API-01).

## WHATSAPP-API-01 — what the 2026-10-16 extension adds

| Area | Behaviour | Code |
|------|-----------|------|
| Guided setup | Before the popup the doctor sees what to have ready (a mobile number that can get an SMS or voice-call code, the free WhatsApp Business app, a Facebook account), numbered steps, the KVKK consent checkbox (the button stays disabled until ticked) and a small assistant (FAQ + free question) | `WhatsAppBaglan.tsx`, `WhatsAppRehber.tsx`, `lib/iletisim/whatsapp/{yardim,kvkk}.ts`, `/api/iletisim/whatsapp/yardim` |
| Status card | Number, name, per-template state, quality rating, daily limit, last-24h usage; Klinik/Hastane plans also see this month's count and an estimated Meta cost (TR utility about USD 0.0009 per message; an estimate, not an invoice) | `/api/iletisim/whatsapp/status`, `kota.ts` |
| Templates | `randevu_hatirlatma` (asks for EVET / İPTAL), `saglikim_yeni_mesaj`, `sonuc_hazir` (generic "your notice is ready", no test or condition name) and `genel_bildirim` (generic fallback, also used when a reply is attempted outside the 24h window) | `sablonlar.ts` |
| Tier limit | Meta's starting tier is 250 business-initiated conversations per 24h. `whatsapp_kota_al` reserves one atomically (advisory lock, rolling 24h of hourly buckets); the tier is re-read from Meta at most hourly. A refused send gives the reservation back; an uncertain one (network error) keeps it | `kota.ts`, `saglik.ts`, migration 169 |
| Idempotency | Every send carries a key (`kuyruk:<id>`); the audit table has a unique partial index on (doctor, key) for `giden`+`deneniyor`, so the second attempt never reaches Meta. An attempt stuck in `deneniyor` for 10 minutes is closed as `belirsiz` (the message may have left) and the admin is alerted; it is never resent automatically | `gunluk.ts`, `bakim.ts` |
| Inbound | `POST /api/whatsapp/webhook` (the old `/api/iletisim/whatsapp/webhook` URL still works and runs the same handler). Signature first, then delivery statuses, then replies. Replies are matched ONLY to the receiving doctor's own active patients | `webhookIsle.ts`, `yanit.ts`, `eslestir.ts` |
| Intent | Whole-message rules first (EVET, İPTAL, DUR, ertele …, Turkish case folding so `IPTAL` works, negation guard). Only for what the rules do not recognise the approved AI gateway (task `siniflandirma`) puts a label on the doctor's card. **A label from the model never changes an appointment.** | `niyet.ts` |
| Automatic actions | A rule-matched EVET confirms, İPTAL cancels (flagged on the card, even inside the doctor's cancellation cut-off), a reschedule request proposes up to 3 free times (the patient's "1/2/3" is queued for the doctor's one-tap approval), DUR opts the number out. Needs exactly one matching patient | `yanit.ts`, `randevuEylem.ts` |
| İPTAL vs opt-out | **Decision:** to a patient with an upcoming appointment İPTAL means "cancel that appointment", not "stop all messages". Only STOP / DUR (and clear "do not message me" phrases) opt out. If there is nothing to cancel, İPTAL keeps the meaning it has on the SMS channel and opts the patient out. | `niyet.ts` header, `yanit.ts` |
| Gelen Yanıtlar | Doctor-only inbox (a secretary account never reaches it) with one-tap Onayla / İptal Et / Yeniden Planla / Yanıtla. Free text inside the 24h window, otherwise the `genel_bildirim` template | `GelenYanitlar.tsx`, `/api/doktor/iletisim/whatsapp/yanitlar`, `eylem.ts` |
| Delivery failure | A `failed` delivery status triggers ONE e-mail to the patient from the doctor's own connected mailbox (never in quiet hours; the morning cron picks those up). The brief named Resend; the repo's rule is "no middleman", so the doctor's own mailbox is used | `yedek.ts` |
| Audit (KVKK) | `whatsapp_mesaj_gunlugu`: append-only, body encrypted, counterpart only as a keyed hash, no names or numbers in metadata, 2-year retention purged by `whatsapp_gunluk_imha` (the only way to delete) | migration 169, `gunluk.ts`, `/kvkk` |
| Maintenance cron | `/api/cron/whatsapp-bakim`, hourly at :17 (`vercel.json`): health refresh, missing-template submission, stuck-attempt close, failed-delivery fallback sweep, audit purge | `bakim.ts` |
| Alerts | Telegram to the admin on: bad webhook signature (throttled), invalid token (error 190), poor quality rating, stuck attempts. Throttled to once per 12h per doctor | `saglik.ts` |

Order of work in the webhook: signature (401 on failure) → delivery/template/disconnect events → failed-delivery fallback → reply pipeline → Kalkan ledger. Kalkan's fixed auto-reply is suppressed for a message the reply pipeline already answered (no double reply). The route answers 5xx only when a retry can help (Meta re-delivers), 200 otherwise.

## WHATSAPP-CANCEL-01 — the cancel flow (2026-10-16, branch `feature/whatsapp-cancel-flow`)

**Not tested against real Meta.** Everything below ran only against an injected `fetch` and the in-memory Supabase stand-in. Migration `170_whatsapp_iptal_ve_sonuc_bildirimi.sql` is written, not applied; the cancel flow itself needs no schema change, only the "result ready" switch does.

| Area | Behaviour | Code |
|------|-----------|------|
| Recognition | Turkish folding first (İ I ı i → i, ş ğ ü ö ç → ASCII, repeated letters collapsed, punctuation and emoji dropped); then whole-token matching, never JS `\b` or `/i`. Five outcomes: **strong** (iptal family incl. typos like `ıptal`, `iptl`; `gelemiyorum`, `gelemeyeceğim`, `randevuya gelmeyeceğim`, `katılamayacağım`; `vazgeçtim`; `randevuyu sil/kapat` only with the word randevu), **weak** (`müsait değilim`, `işim çıktı`, `hastalandım`, `şehir dışındayım`, or a strong phrase softened by `belki / sanırım / olursa / gelemeyebilirim`), **reschedule** (`erteleyebilir miyiz`, `başka güne alabilir miyiz`; wins over a cancel word in the same message), **negation / question / contradiction** (`iptal etmeyin`, `iptal istemiyorum`, `vazgeçmedim`, `iptal mi oldu`, `iptalden vazgeçtim`), **none**. Bare `sil` / `kapat` never count. STOP / DUR are matched first and keep their opt-out meaning | `iptalNiyeti.ts`, `niyet.ts` |
| Strong signal | Cancels the patient's NEXT UPCOMING appointment (the one of the last reminder if any, else the earliest within 180 days). Same shared cancel path as the portal button and the calendar (`randevuIptalEt`): status `iptal` (the slot is free for the booking engine and the waiting list), waiting reminder jobs dropped, the standard cancellation notice job queued, `randevu_olaylari` row with who and the previous state, Google Calendar sync. Not blocked by the doctor's cancellation cut-off, but flagged `randevu_iptal_gec` | `yanit.ts`, `randevuEylem.ts`, `lib/randevu/v2/sunucu.ts` |
| Patient confirmation | Free text inside the 24h window (the patient has just written, so it is open): date and time, how to rebook; no name, no clinical text. If the DOCTOR cancels from the inbox card and the window has closed, the approved `randevu_iptal_onay` template goes instead | `serbest.ts`, `eylem.ts`, `sablonlar.ts` |
| Weak signal | Never cancels. The inbox card is flagged `zayif_iptal`, the patient gets up to 3 free times (or "we have not cancelled, the doctor will contact you"), the desk sees "may not come, NOT cancelled" | `yanit.ts` |
| Doctor AND secretary | The **Ön büro fısıltısı** (`/api/doktor/on-buro-fisilti`, `pratikOturum`: the doctor and the doctor's own secretary) shows one item per cancellation card: "Ayşe Y. randevusunu WhatsApp’tan iptal etti — saat boşaldı", with day and time. Chosen because it is the one in-app surface both roles reach, it already is a "to clear" list with a count, and it links to the calendar (a secretary cannot open Gelen Yanıtlar). "Gördüm" (`POST /api/doktor/on-buro-fisilti/iptal`) clears it for both. One card per inbound message id, so a redelivered webhook cannot notify twice. Minimal data: first name + last initial, date/time, a fixed sentence — never the message, a phone number or a diagnosis | `onBuro.ts`, `lib/doktor/onBuroFisilti.ts`, `OnBuroFisildiyor.tsx` |
| Doctor inbox | Gelen Yanıtlar shows the automatic action in plain words and an **İptali geri al** button: it undoes only a cancel the patient's own WhatsApp reply made, only while the time is still in the future and free, and tells the patient the appointment is valid again | `GelenYanitlar.tsx`, `eylem.ts` (`geri_al`) |
| Rebooking | After an automatic cancel (within 7 days), "yeni randevu" gets up to 3 free times; the patient's "1/2/3" waits for the doctor's one-tap Onayla, which reopens the cancelled row at the new time | `yanit.ts`, `randevuEylem.ts` |
| Audit | `whatsapp_mesaj_gunlugu` (append-only) gets the inbound message, the outbound confirmation and a `randevu_iptal` event; `randevu_olaylari` records the cancel and the undo | `gunluk.ts` |
| Fallback e-mail | Unchanged: it still fires only for a `failed` delivery status of a message that left, once, from the doctor's own mailbox. The cancel confirmation does not trigger it differently from any other outbound message | `yedek.ts` |
| Isolation | Every query carries `doktor_id` (and `patient_id` for appointment reads and writes); the patient is matched only among the receiving doctor's own active patients; several patients on one number (parent with children) → no automatic cancel, a desk item "iptal istedi — işlem bekliyor" instead | `eslestir.ts`, `hastaIzolasyonEnvanteri.ts` |

Known limits: Turkish only (each country build needs its own phrase set); if a patient has several upcoming appointments and no recent reminder, the earliest is cancelled (visible on the desk and reversible with Geri al); the standard cancellation-notice e-mail job is queued like for any other cancel (the patient may get both a WhatsApp and an e-mail confirmation).

## How it works

1. In Ayarlar › İletişim the doctor taps **WhatsApp'ı bağla** once. Meta's Embedded Signup window opens with the "connect your existing WhatsApp Business app" option (Meta calls this *coexistence*). He confirms his number with a code shown in the WhatsApp Business app on his phone.
2. The browser gets a one-time code, which is valid for 30 seconds. Notya's server exchanges it for a business token using the app id and secret. The server then:
   - checks that the number really belongs to the WhatsApp Business Account (WABA) that token can see,
   - subscribes Notya to that WABA,
   - starts Meta's required contact and history sync,
   - creates the Turkish utility templates (see section 5).
   The token is stored only encrypted, with `encryptPII`, the same AES-256-GCM helper used for the patients' `*_encrypted` columns.
3. Appointment reminders are sent through the Cloud API as template messages from the doctor's own `phone_number_id`. He keeps using the WhatsApp Business app on his phone. Replies from patients arrive in his app as usual.
4. The webhook records delivery status (sent, delivered, read, failed), template approval and disconnects. Synced history is discarded without being stored. Since WHATSAPP-API-01, replies a patient sends to the connected number are processed (see the table above): the body is stored encrypted in the audit log and on the doctor's inbox card only.

Code: `lib/iletisim/otomatik/whatsapp/`, `lib/iletisim/whatsapp/`, `app/api/iletisim/whatsapp/{complete-signup,status,disconnect,webhook,yardim}`, `app/api/whatsapp/webhook`, `components/doktor/iletisim/WhatsAppBaglan.tsx`, migration `lib/db/migrations/097_whatsapp_baglantisi.sql` (not applied).

## 1. Choose the path: Tech Provider (recommended) or a partner

### A. Notya becomes a Meta **Tech Provider** (what this code implements)

- There is no middleman and no monthly fee. Meta bills each doctor's own WABA per message.
- Requirements:
  - business verification of **Dream Türkiye** in Meta Business Manager,
  - App Review with **advanced access** to `whatsapp_business_management` and `whatsapp_business_messaging`. Review needs two screencasts: sending a message and creating a template.
- You cannot onboard customers until advanced access is approved.
- Onboarding limits: 10 new customers per rolling 7 days by default. This rises to 200 per week after Business Verification, App Review and Access Verification.
- Sources:
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/get-started-for-tech-providers
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview/

### B. Use a Solution Partner, e.g. **360dialog**

- 360dialog supports coexistence: https://docs.360dialog.com/partner/onboarding/whatsapp-coexistence
- Pricing (https://360dialog.com/pricing):
  - ISV plans: Starter €250/month + €49 per number, Growth €500 + €25, Premium €1,000 + €15
  - Meta fees are passed through with no markup.
- Pros: faster start, no own App Review, partner support.
- Cons: monthly cost per doctor, a third party in the data path (another processor under KVKK), and a different API (360dialog's own onboarding and hosting). This code would need a new sender.
- Recommendation: start the Tech Provider path. Use 360dialog only if App Review stalls.

## 2. Meta developer app

1. Go to https://developers.facebook.com/apps and choose **Create app**. Pick the **Business** type and connect it to Dream Türkiye's business portfolio.
2. Add the **WhatsApp** product.
3. Under **App settings › Basic**, set:
   - App domains: `notya.io`, `www.notya.io`
   - Privacy policy URL: `https://www.notya.io/gizlilik`
   - Terms URL: `https://www.notya.io/kullanim-kosullari`
4. Complete **Business verification** for Dream Türkiye in Business Manager (Security Center).

## 3. Facebook Login for Business: Embedded Signup configuration

1. Add the **Facebook Login for Business** product.
2. Under **Settings**, set both of these to `https://www.notya.io/`. Only HTTPS domains work.
   - **Allowed domains for the JavaScript SDK**
   - **Valid OAuth redirect URIs**
3. Go to **Configurations › Create configuration**:
   - Login variation: **WhatsApp Embedded Signup**
   - Products: **WhatsApp Cloud API**. Selecting products puts the flow on Embedded Signup **v4**, which picks the required permissions and assets automatically.
   - The token is a Business Integration System User token and never expires by default. Do not choose 60-day expiry.
4. Copy the **Configuration ID** into `WHATSAPP_ES_CONFIG_ID`.

Coexistence is not a separate configuration. The button passes `extras.featureType = 'whatsapp_business_app_onboarding'`, and v4 still supports it.

Sources:
- https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation
- https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/version-4
- https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/versions (v2 is deprecated on 15 Oct 2026)
- https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users
- https://developers.facebook.com/docs/facebook-login/facebook-login-for-business

## 4. Webhook

Go to **App Dashboard › WhatsApp › Configuration › Webhook**:

- Callback URL: `https://www.notya.io/api/whatsapp/webhook` (the earlier `/api/iletisim/whatsapp/webhook` keeps working and runs the same handler)
- Verify token: the same random string as `WHATSAPP_VERIFY_TOKEN`. Generate one with `openssl rand -hex 24`.
- Subscribe these fields:
  - `messages` (delivery statuses AND patient replies arrive here)
  - `message_template_status_update`
  - `account_update`
  - `history`, `smb_app_state_sync`, `smb_message_echoes`: Meta requires these for coexistence. Notya returns 200 and discards the content (the `smb_message_echoes` text is read only by the Kalkan ledger).

Every POST is checked against `X-Hub-Signature-256`, an HMAC-SHA256 of the raw body keyed with `WHATSAPP_APP_SECRET`. Unsigned or wrongly signed requests get 401.

Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview

## 5. Templates (created automatically per doctor)

On connect, Notya creates these in the doctor's own WABA. Category is **UTILITY**, language is `tr`, and there are no clinical details (KVKK):

| Name | Text | Variables |
|------|------|-----------|
| `randevu_hatirlatma` | Merhaba {{1}}, randevunuz {{2}} tarihinde saat {{3}}’te, {{4}} ile. Onaylamak için EVET, iptal etmek için İPTAL yazın. | hasta adı, tarih, saat, doktor adı |
| `saglikim_yeni_mesaj` | Merhaba {{1}}, {{2}} size Sağlığım üzerinden yeni bir not bıraktı. Okumak için aşağıdaki düğmeye dokunun. + button **Notu aç** → `https://www.notya.io/portal/hasta/{{1}}` | hasta adı, doktor adı, full Sağlığım link |
| `sonuc_hazir` | Merhaba {{1}}, {{2}} tarafından hazırlanan bildiriminiz hazır. Ayrıntılar yalnızca Sağlığım’da görüntülenir; aşağıdaki düğmeye dokunun. + button **Görüntüle** | hasta adı, doktor adı, full Sağlığım link |
| `randevu_iptal_onay` | Merhaba {{1}}, {{2}} tarihinde saat {{3}}’teki randevunuz iptal edildi. Yeni randevu için {{4}} muayenehanesiyle iletişime geçebilirsiniz. | hasta adı, tarih, saat, doktor adı |
| `genel_bildirim` | Merhaba {{1}}, {{2}} muayenehanesinden bir bildiriminiz var. Ayrıntı için lütfen muayenehaneyi arayın veya Sağlığım’ı kontrol edin. | hasta adı, doktor adı |

`sonuc_hazir` and `genel_bildirim` are created and approved but **no automatic trigger sends `sonuc_hazir` yet** (open commitment). The doctor sees an off-by-default switch for it in Ayarlar › İletişim (column `sonuc_bildirimi_acik`, migration 170); its copy says plainly that nothing is sent automatically yet, so the switch only records the choice. `randevu_iptal_onay` is submitted like the others (on connect and by the hourly cron, which also adds it for already-connected doctors) and is used only when the doctor cancels from the inbox card after the patient's 24h window has closed. The card's "Hazır / Onay bekliyor / Onaylanmadı" summary follows the two core templates only (`randevu_hatirlatma`, `saglikim_yeni_mesaj`), so a delayed approval of the optional ones does not block reminders. `notya_kalkan_yonlendirme` is submitted by hand (NOTYA-KALKAN-01).

- Meta usually reviews these within minutes, sometimes up to 24 hours.
- The card shows **Onay bekliyor** until both are approved, then **Hazır**. If Meta rejects or pauses one, it shows **Onaylanmadı**.
- Status comes from the `message_template_status_update` webhook. `/status` also re-reads it from Meta while anything is still pending.
- If Meta re-categorises a template as MARKETING, the price changes. Keep the wording purely transactional.
- Automatic sending (NOTYA-ILETISIM-04): only appointment reminders and the Sağlığım notice ever go out on WhatsApp by themselves from the queue, and only
  as templates. The only free text is the fixed confirmation sentence after a patient's EVET / İPTAL / DUR and the doctor's own one-tap "Yanıtla", both inside Meta's 24h window. For a patient under 18, {{1}} is *Sayın Veli* (the reminder speaks to the parent). Everything
  else (randevu değişikliği / iptali, bilgi formu) goes by e-posta if connected, otherwise stays one-tap. The Sağlığım
  button only works when `NEXT_PUBLIC_APP_URL` is `https://www.notya.io` (the template's fixed URL prefix); with any
  other value the notice falls back to e-posta.

Sources:
- https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/utility-templates/utility-templates
- https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/components
- https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/message_template_status_update

## 6. Environment variables (Vercel, Production)

| Variable | Value |
|----------|-------|
| `WHATSAPP_APP_ID` | Meta App ID (public; sent to the browser for the Facebook SDK). Old name `META_APP_ID` is still read as a fallback |
| `WHATSAPP_APP_SECRET` | App secret, server only; also the webhook signature key. Old name `META_APP_SECRET` still read |
| `WHATSAPP_ES_CONFIG_ID` | Embedded Signup configuration ID (public). Old name `META_ES_CONFIG_ID` still read |
| `WHATSAPP_VERIFY_TOKEN` | Random string, also typed into the webhook form. Old name `WHATSAPP_WEBHOOK_VERIFY_TOKEN` still read |
| `ENCRYPTION_MASTER_KEY` | Already exists; required, because the feature stays off without it |
| `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Already exist; the maintenance cron and the admin alerts use them |

Apply migrations `097_whatsapp_baglantisi.sql` and `169_whatsapp_cloud_api.sql` before the variables are set. (Without 169 the new code degrades: no tier, no audit log, no inbox; sending is refused because the audit trail cannot be written, which is deliberate: no audit trail, no send.)

## 7. Payment method: each doctor

With the Tech Provider path, each doctor's WABA pays Meta directly. After connecting, the doctor, or you together with him, adds a card at https://business.facebook.com/wa/manage/home/. Without a card, template sends fail and the doctor sees "WhatsApp ödeme yöntemi eksik".

## 8. Pricing

- Since 1 July 2025 Meta charges **per delivered template message**. The current rate card has applied since 1 July 2026.
- **Utility templates sent inside an open 24-hour customer-service window are free**, as are all non-template replies inside the window.
- Turkey received lower utility and authentication rates on 1 Oct 2025.
- Messages the doctor sends himself from the WhatsApp Business app stay free. Only Cloud API sends are billed.
- Rate card: download the USD CSV at https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing and look up the Turkey utility rate. I could not verify the exact amount from Meta. A third-party source puts Turkey marketing at about $0.0109 per message; the utility rate is lower.

## 9. Coexistence limitations: tell the doctor

Once his number is connected (source: onboarding-business-app-users link above):

- WhatsApp Business app **2.24.17 or newer** is required.
- These **stop working or are not supported**:
  - broadcast lists
  - disappearing messages
  - view-once messages (in 1:1 chats)
  - live location
  - group chats (not synced)
  - voice and video calls on the API side
  - channels
  - some "business tools"
- Companion devices work, **except WhatsApp for Windows and WearOS**.
- **He must open the WhatsApp Business app at least every ~14 days.** Otherwise Meta disconnects the number (`PRIMARY_INACTIVITY`).
- API throughput is fixed at 20 messages per second. This is irrelevant for a clinic.
- No blue verified badge (OBA) on coexistence numbers, per 360dialog.
- To disconnect from the phone: WhatsApp Business › Ayarlar › Hesap › Business Platform › Bağlantıyı kes. Meta sends `account_update` / `PARTNER_REMOVED`, and Notya deletes the row and the encrypted token. **Bağlantıyı kaldır** in Notya only removes Notya's subscription. The number and chats stay in the app, because coexistence numbers cannot be deregistered through the API.
- **History sync:** Meta requires the partner to start contact and history sync within 24 hours, or the account is offboarded. Notya starts it and discards everything. In the signup window the doctor can choose **not** to share chat history. Recommend that, since Notya does not need it.

## 10. Open points, unverified with Meta

- **Turkey availability of coexistence:** Meta's current page has no country list. Third parties say it was rolled out globally by April 2026, and Turkey was on the early exclusion list. **Test with a real +90 number** (Dr. Gökhan) before announcing.
- **Minimum age of the WhatsApp Business app number:** not stated by Meta. 360dialog says eligibility depends on "account tenure and messaging quality", and third parties say at least about 7 days of active use.
- **`sessionInfoVersion: '3'`:** included per Meta's coexistence snippet. If the finish event does not arrive, test without it.
- **CSP:** Meta documents none. `middleware.ts` now allows `https://connect.facebook.net` (script) and `https://*.facebook.com` (frames and connections). Test the popup on production.
