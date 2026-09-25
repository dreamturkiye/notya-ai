# E-posta from the doctor's own mailbox — setup (NOTYA-ILETISIM-02)

After a one-time **Gmail ile bağlan** or **Outlook ile bağlan**, Notya sends reminder emails
from the doctor's own address. They show up in the doctor's Sent folder, and replies go to the
doctor's inbox. Notya asks only for permission to **send**. It can never read, list or delete mail.

The feature is switched off until the environment variables below exist. Until then the card
says *Yakında*, every `/api/iletisim/eposta/*` route answers 503 with a Turkish message, and the
sender's `hazirMi()` returns false. You can set up one provider and leave the other empty; the
card then shows only that button.

Docs checked on 2026-09-25. Source links are at the end of each section.

---

## 0. Environment variables (Vercel → notya-ai → Settings → Environment Variables, Production)

| Variable | From |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Google Auth Platform → Clients → your Web client |
| `GOOGLE_OAUTH_CLIENT_SECRET` | same |
| `MS_OAUTH_CLIENT_ID` | Entra → App registrations → Notya → Overview → *Application (client) ID* |
| `MS_OAUTH_CLIENT_SECRET` | Entra → Certificates & secrets → the secret's **Value** (shown only once) |

Two variables are already set and are required as well:
- `ENCRYPTION_MASTER_KEY`: the stored mailbox credential is encrypted with the same AES-256-GCM
  helper as patient `*_encrypted` fields.
- `NEXT_PUBLIC_APP_URL`: this builds the return addresses. If it is unset, the code uses
  `https://www.notya.io`.

Before the first doctor connects, apply migration `lib/db/migrations/096_eposta_baglantisi.sql`.
It is written but has not been applied to any database.

Return addresses to register at both providers. They must match exactly: https, `www`, no
trailing slash.

```
https://www.notya.io/api/iletisim/eposta/google/donus
https://www.notya.io/api/iletisim/eposta/microsoft/donus
```

Optional, for local testing: also register `http://localhost:3000/api/iletisim/eposta/<provider>/donus`
and set `NEXT_PUBLIC_APP_URL=http://localhost:3000` locally.

---

## 1. Google (Gmail)

### 1.1 Project
1. Go to https://console.cloud.google.com → project picker → **New project**. Name: `Notya`.
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.

### 1.2 Google Auth Platform (the old "OAuth consent screen")
Open **Google Auth Platform** (https://console.cloud.google.com/auth/overview) → **Get started**.

- **Branding**
  - App name: `Notya`
  - User support email: your address
  - App logo: the Notya logo, 120×120. A logo triggers brand review, so leave it out if you want the fastest path.
  - App home page: `https://www.notya.io`
  - Privacy policy: `https://www.notya.io/kvkk`. This is the only privacy page in the app today (`app/kvkk/page.tsx`). It must be on the same domain as the home page and linked from the home page, and before verification it needs the Gmail paragraph described in 1.4.
  - Terms of service: optional; leave it empty. There is no terms page yet.
  - Authorized domains: `notya.io`
  - Developer contact: your address
- **Audience**
  - User type: **External**
  - Publishing status: starts as **Testing**
  - **Test users** → **Add users** → Dr. Gökhan's Gmail address first, then any other beta doctors. The limit is 100.
- **Data access** → **Add or remove scopes**. Add exactly these and nothing else:
  - `openid`
  - `.../auth/userinfo.email` (shown as "email")
  - `https://www.googleapis.com/auth/gmail.send`. Google classes this as **Sensitive**, not Restricted.
- **Clients** → **Create client**
  - Application type: **Web application**, name `Notya web`
  - Authorized redirect URIs: `https://www.notya.io/api/iletisim/eposta/google/donus`
  - Copy the Client ID and Client secret into the two `GOOGLE_OAUTH_*` variables.

### 1.3 Testing mode and its 7-day limit
While the app is in **Testing**, only the listed test users can connect. Each of them sees an
"unverified app" notice. **Their connection expires after 7 days**, because Google does that to
refresh tokens of Testing apps that ask for more than name, email and profile. When a connection
expires, the card shows **Yeniden bağlan** and emails stop until the doctor taps it. That is fine
for Dr. Gökhan's trial. For real use you need verification (1.4).

### 1.4 Verification for `gmail.send` (sensitive scope): what Google asks for
Click **Publish app** under **Audience**, then submit for verification under **Verification Center**. You need:
1. **Domain ownership**: verify `notya.io` in Google Search Console
   (https://search.google.com/search-console) with a DNS TXT record at Namecheap. It must be done
   by an Owner or Editor of the Cloud project.
2. **Home page** on `www.notya.io` that describes what Notya does. A bare login page is not accepted.
3. **Privacy policy** on the same domain, linked from the home page. It must say what Gmail
   data is used: sending appointment reminders on the doctor's behalf, no reading of mail. It
   must also include Google's Limited Use wording for user data.
4. **Scope justification**: one short paragraph. For example: *"Notya sends appointment reminder
   emails from the doctor's own Gmail account so patients recognise the sender and replies reach
   the doctor. We only send; we never read, list or modify mail."*
5. **Demo video**: an unlisted YouTube link. It should show the whole flow: signing in to Notya,
   Ayarlar → **Gmail ile bağlan**, the Google consent screen with the app name and scope visible
   (browser address bar showing the client id), back in Notya the connected address,
   **Kendime deneme gönder**, and the email arriving and appearing in Sent.

**How long:** Google says sensitive-scope review typically takes **3–5 business days** after
everything is complete. It takes longer if they ask for changes, which usually concern the privacy
policy wording or the video. **No CASA security assessment** is needed; that applies only to
*restricted* scopes, and `gmail.send` is not one.

Sources:
- Web server flow, `access_type=offline`, `prompt=consent`, partial consent, revoke: https://developers.google.com/identity/protocols/oauth2/web-server
- Refresh token expiry, including the 7-day Testing limit and 100 tokens per account: https://developers.google.com/identity/protocols/oauth2
- Gmail scopes (gmail.send = Sensitive): https://developers.google.com/workspace/gmail/api/auth/scopes
- Sensitive scope verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification and https://support.google.com/cloud/answer/13464321
- Google Auth Platform console (Branding / Audience / Data access / Clients, test users): https://support.google.com/cloud/answer/15549945
- `users.messages.send`: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send and https://developers.google.com/workspace/gmail/api/guides/sending
- Error handling (401, 403 domainPolicy, 429 sending limit): https://developers.google.com/workspace/gmail/api/guides/handle-errors
- id_token read directly from the token endpoint: https://developers.google.com/identity/openid-connect/openid-connect

---

## 2. Microsoft (Outlook, Microsoft 365, outlook.com / hotmail)

### 2.1 App registration
1. Go to https://entra.microsoft.com → **Identity → Applications → App registrations → New
   registration**. Sign in with a **work account** (for example `kaan@notya.io` on Microsoft 365), not
   a personal Microsoft account; publisher verification (2.3) requires this.
2. Name: `Notya`.
3. Supported account types: **Any Entra ID Tenant + Personal Microsoft accounts**. Older portals
   call it "Accounts in any organizational directory … and personal Microsoft accounts". This is
   what lets both clinic Microsoft 365 accounts and outlook.com/hotmail addresses connect.
4. Redirect URI: platform **Web**, `https://www.notya.io/api/iletisim/eposta/microsoft/donus` → **Register**.
5. Copy **Application (client) ID** into `MS_OAUTH_CLIENT_ID`.

### 2.2 Secret and permissions
1. **Certificates & secrets → Client secrets → New client secret**. Description `Notya prod`.
   Expiry: Microsoft allows at most 24 months and recommends under 12. **Put the expiry date in
   your calendar**, because every Outlook connection stops working when the secret expires.
   Copy the **Value** (not the Secret ID) into `MS_OAUTH_CLIENT_SECRET` right away. It is shown only once.
2. **API permissions → Add a permission → Microsoft Graph → Delegated permissions**:
   - `Mail.Send`
   - `offline_access`, `openid`, `email` (under "OpenId permissions")
   - Remove the default `User.Read` if you like. Notya doesn't use it.
   - `Mail.Send` delegated does **not** need admin consent. By default each user can consent for
     their own mailbox.

### 2.3 Publisher verification (strongly recommended before inviting clinics on Microsoft 365)
Some organisations only let users approve apps from a **verified publisher**. Microsoft's
risk-based consent also blocks unverified multi-tenant apps for users in other tenants. Without
verification, a doctor whose clinic runs Microsoft 365 may be told to ask an admin.
Personal outlook.com/hotmail users are not affected. To verify:
1. Enrol in the **Microsoft AI Cloud Partner Program** (https://partner.microsoft.com) and
   complete its business verification. You'll get a Partner **global account** ID; a location ID
   is not accepted.
2. In Entra: **Branding & properties → Publisher domain** → set and DNS-verify `notya.io`. It must
   match the email domain used for the Partner Program verification.
3. **Branding & properties → Publisher verification → Add Partner ID**. You need the Application
   Administrator or Cloud Application Administrator role and must sign in with MFA. It is free and
   usually finishes in minutes once 1–2 are done.

### 2.4 Disconnecting on the Microsoft side
Microsoft has no endpoint to withdraw one app's permission for one user. When the doctor taps
**Bağlantıyı kaldır**, Notya deletes its encrypted copy of the credential. Only Notya ever held it,
and it is useless without our client secret. If the doctor also wants Notya gone from the
Microsoft account list, they can remove it at https://myapps.microsoft.com (work/school) or
https://account.live.com/consent/Manage (personal). Google, by contrast, is revoked directly at
Google when the doctor disconnects.

### 2.5 The connected address
The address shown on the card comes from the `email` claim in the sign-in response. For
personal accounts it falls back to `preferred_username` when that is an email address. Microsoft
does not guarantee `email` for every work account; for example, a user without a mailbox
attribute won't have one. That doctor would see *Bağlanamadı*. Fixing it would mean adding the
`User.Read` permission and reading `/me` from Graph. It was left out to keep permissions minimal.
Sending itself does not depend on this address.

Sources:
- Auth code flow, `/common`, PKCE, `response_mode`, combining scopes: https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
- id_token claims (`email`, `preferred_username`): https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference and https://learn.microsoft.com/en-us/entra/identity-platform/optional-claims-reference
- Refresh tokens (rotate on every use, 90 days): https://learn.microsoft.com/en-us/entra/identity-platform/refresh-tokens
- Error codes (AADSTS70000, 700082, 50173, 65001): https://learn.microsoft.com/en-us/entra/identity-platform/reference-error-codes
- `POST /me/sendMail` (202, `saveToSentItems`, personal + work delegated `Mail.Send`): https://learn.microsoft.com/en-us/graph/api/user-sendmail
- Permission reference (`Mail.Send`, no admin consent required): https://learn.microsoft.com/en-us/graph/permissions-reference
- Register an app and supported account types: https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
- Client secrets (max 24 months): https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials
- User consent settings: https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent
- Publisher verification: https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview
- `revokeSignInSessions` (all apps; not for personal accounts; not used): https://learn.microsoft.com/en-us/graph/api/user-revokesigninsessions

---

## 3. First live check (Dr. Gökhan)
1. Set the 2 (or 4) variables, apply migration 096, redeploy.
2. Dr. Gökhan: Ayarlar → İletişim card → **Gmail ile bağlan** → Google → allow. He lands back on
   Ayarlar with *Bağlandı…* and a ✓ next to his address.
3. **Kendime deneme gönder** → *Notya deneme e-postası* arrives in his inbox and appears in his
   Sent folder.
4. Optional: remove Notya at https://myaccount.google.com/permissions → the next send marks the
   card **Yeniden bağlan**.

## 4. How it behaves (for support)
| What happened | What the doctor sees | What Notya does |
|---|---|---|
| Doctor pressed Cancel on the provider's screen | *Bağlantı yapılmadı…* | nothing is stored |
| Doctor unticked "send email" on Google's screen | *E-posta gönderme izni verilmedi…* | nothing is stored |
| Permission withdrawn, password changed, 7-day Testing expiry, 90 idle days (Microsoft) | **Yeniden bağlan** | status `yenilenmeli`, sending stops |
| Gmail daily sending limit, provider outage | the message is reported failed; the queue may retry | connection stays active |
| **Bağlantıyı kaldır** | card back to the two buttons | Google: revoked at Google; both: row deleted |

What is stored (`doktor_eposta_baglantilari`): provider, address, the long-lived credential
**encrypted**, status, the last technical error, and timestamps. The browser can read only its own
row, and never the credential column (see the migration's column grants). Messages carry
appointment information and a Sağlığım link only. No clinical details (KVKK).
