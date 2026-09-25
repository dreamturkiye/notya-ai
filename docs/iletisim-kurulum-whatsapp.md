# WhatsApp: automatic messages from the doctor's own number (NOTYA-ILETISIM-03)

Setup guide for Kaan, written 2026-09-25. Nothing works until the environment variables in step 6 exist. Until then the card shows **"WhatsApp ile otomatik gönderim yakında."** and every `/api/iletisim/whatsapp/*` route answers 503.

## How it works

1. In Ayarlar › İletişim the doctor taps **WhatsApp'ı bağla** once. Meta's Embedded Signup window opens with the "connect your existing WhatsApp Business app" option (Meta calls this *coexistence*). He confirms his number with a code shown in the WhatsApp Business app on his phone.
2. The browser gets a one-time code, which is valid for 30 seconds. Notya's server exchanges it for a business token using the app id and secret. The server then:
   - checks that the number really belongs to the WhatsApp Business Account (WABA) that token can see,
   - subscribes Notya to that WABA,
   - starts Meta's required contact and history sync,
   - creates two Turkish utility templates.
   The token is stored only encrypted, with `encryptPII`, the same AES-256-GCM helper used for the patients' `*_encrypted` columns.
3. Appointment reminders are sent through the Cloud API as template messages from the doctor's own `phone_number_id`. He keeps using the WhatsApp Business app on his phone. Replies from patients arrive in his app as usual.
4. The webhook records only delivery status (sent, delivered, read, failed), template approval and disconnects. Incoming message bodies and synced history are discarded without being stored.

Code: `lib/iletisim/otomatik/whatsapp/`, `app/api/iletisim/whatsapp/{complete-signup,status,disconnect,webhook}`, `components/doktor/iletisim/WhatsAppBaglan.tsx`, migration `lib/db/migrations/097_whatsapp_baglantisi.sql` (not applied).

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
4. Copy the **Configuration ID** into `META_ES_CONFIG_ID`.

Coexistence is not a separate configuration. The button passes `extras.featureType = 'whatsapp_business_app_onboarding'`, and v4 still supports it.

Sources:
- https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation
- https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/version-4
- https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/versions (v2 is deprecated on 15 Oct 2026)
- https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users
- https://developers.facebook.com/docs/facebook-login/facebook-login-for-business

## 4. Webhook

Go to **App Dashboard › WhatsApp › Configuration › Webhook**:

- Callback URL: `https://www.notya.io/api/iletisim/whatsapp/webhook`
- Verify token: the same random string as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Generate one with `openssl rand -hex 24`.
- Subscribe these fields:
  - `messages` (delivery statuses arrive here)
  - `message_template_status_update`
  - `account_update`
  - `history`, `smb_app_state_sync`, `smb_message_echoes`: Meta requires these for coexistence. Notya returns 200 and discards the content.

Every POST is checked against `X-Hub-Signature-256`, an HMAC-SHA256 of the raw body keyed with `META_APP_SECRET`. Unsigned or wrongly signed requests get 401.

Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview

## 5. Templates (created automatically per doctor)

On connect, Notya creates these in the doctor's own WABA. Category is **UTILITY**, language is `tr`, and there are no clinical details (KVKK):

| Name | Text | Variables |
|------|------|-----------|
| `randevu_hatirlatma` | Merhaba {{1}}, {{2}} saat {{3}} için {{4}} ile randevunuzu hatırlatırız. Gelemeyecekseniz lütfen bu mesaja yanıt verin. | hasta adı, tarih, saat, doktor adı |
| `saglikim_yeni_mesaj` | Merhaba {{1}}, {{2}} size Sağlığım üzerinden yeni bir not bıraktı. Okumak için aşağıdaki düğmeye dokunun. + button **Notu aç** → `https://www.notya.io/portal/hasta/{{1}}` | hasta adı, doktor adı, full Sağlığım link |

- Meta usually reviews these within minutes, sometimes up to 24 hours.
- The card shows **Onay bekliyor** until both are approved, then **Hazır**. If Meta rejects or pauses one, it shows **Onaylanmadı**.
- Status comes from the `message_template_status_update` webhook. `/status` also re-reads it from Meta while anything is still pending.
- If Meta re-categorises a template as MARKETING, the price changes. Keep the wording purely transactional.
- Automatic sending (NOTYA-ILETISIM-04): only these two message types ever go out on WhatsApp by themselves, and only
  as these templates. For a patient under 18, {{1}} is *Sayın Veli* (the reminder speaks to the parent). Everything
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
| `META_APP_ID` | App ID (public; sent to the browser for the Facebook SDK) |
| `META_APP_SECRET` | App secret, server only |
| `META_ES_CONFIG_ID` | Embedded Signup configuration ID (public) |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Random string, also typed into the webhook form |
| `ENCRYPTION_MASTER_KEY` | Already exists; required, because the feature stays off without it |

The migration `097_whatsapp_baglantisi.sql` must be applied before the variables are set.

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
