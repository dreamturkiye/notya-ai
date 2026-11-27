# Dernek webinar follow-up — started 26 Kas 2026

Times: America/New_York. First-person Gökhan, From `drhanmamur@notya.io`, BCC `kaan@notya.io`. Never more than 4 touches. Skip EKDD.

Sanitize before every send: `python3 scripts/sanitize-outreach-emails.py <emails>`. Site iletisim without MX is not a mailbox.

## SENT (18) — MX PASS/WARN, do not resend

| Org | To | MX | Follow |
|-----|-----|----|--------|
| PUADER | bilgi@puader.org | Hostinger PASS | D+3 / D+7 / D+14 |
| TMPD | info@millipediatri.org | Google PASS | same |
| TPK | info@turkpediatri.org.tr | Hostinger PASS | same |
| Neonatoloji | turkneonatolojidernegi@gmail.com | Gmail PASS | same |
| CAIAD | cocukalerjiastim@gmail.com | Gmail PASS | same |
| Çocuk Endokrin | info@cocukendokrindiyabet.org | Zoho PASS | same |
| Çocuk Nöroloji | cnd@cnd.org.tr | Pleksus WARN | same; fallback `pednoro2026@gtturizm.com` if DSN |
| Çocuk Gastro | sekretarya@turkcocukgastro.org | Google PASS | same |
| Doğu Pediatri (PCO) | dopek2026@centerevents.com.tr | Outlook PASS | same |
| TJOD merkez | info@tjod.org | mail.tjod.org PASS | same |
| TJOD İstanbul (Figur) | tjodistanbul@figur.net | Outlook PASS | same |
| TJOD İstanbul Anadolu | istanbulanadolutjod@gmail.com | Gmail PASS | same |
| TJOV | info@tjov.org.tr | MX-to-self WARN | same; do not resend unless DSN |
| Perinatoloji | info@perinatal.org.tr | Outlook PASS | same |
| TDD | sekreterya@turkdermatoloji.org.tr | Pleksus WARN | same; fallback `dermatoloji@honestglobal.com` if DSN |
| TURKDERM | turkderm@turkderm.org.tr | Google PASS | same |
| Türk KBB | kbb@kbb.org.tr | Yandex PASS | same |
| Rinoloji | info@rinoturk.org | Yandex PASS | same |

## BOUNCE — send the 3 retries in OUTREACH-TODAY §7, then mark SENT

| Org | Dead (do not retry) | Why | Live replacement (MX PASS) |
|-----|---------------------|-----|----------------------------|
| Marmara Pediatri | info@marmarapediatri.org | no MX | marmarapediatri@bosphorusmice.net (2027 iletisim, Outlook) |
| Çocuk Nefroloji | info@cocuknefroloji.org.tr (554) · info@cocuknefroloji.org (no MX) | Pleksus + no MX | ozge.altas@burkon.com (kongre sekreterya) |
| İstanbul KBB | info@istanbulkbb.org | no MX, no A | tkbbd@kbb.org.tr (Yandex; same HQ). Do not resend kbb@ |

## Dead mailboxes (never send)

`dernek@tjodistanbul.org` (550) · `tdd@turkdermatoloji.org.tr` (550) · `info@cocuknefroloji.org.tr` (554) · `info@cocuknefroloji.org` (no MX) · `info@dogupediatri.org` (MX timeout) · `info@marmarapediatri.org` (no MX) · `info@istanbulkbb.org` (no MX)

Calendar:

| When | Channel | Copy |
|------|---------|------|
| **29 Kas 2026** (D+3, Cumartesi) | Email | aşağıda — only the 18 SENT above |
| **3 Ara 2026** (D+7, Perşembe) | Phone sekreterya | “Üye semineri, ücretsiz, Google Meet, kayıt sizin duyurunuz” |
| **10 Ara 2026** (D+14, Perşembe) | Email | Collab Reel teklifi (live yavaşsa) |
| **17 Ara 2026** (D+21) | Close/nurture | `NURTURE` — quarterly |

D+3 body (only if the first mail actually delivered):

```
Sayın Yönetim Kurulu,

26 Kasım’da üyeleriniz için ücretsiz 45 dakikalık Google Meet seminer
önerisi içeren mailimin ulaştığından emin olmak için kısa bir not.

Üç akşam slottan biri uygun mu (Türkiye saati):
• Pazartesi 30 Kasım 2026, 20:00
• Salı 1 Aralık 2026, 20:00
• Perşembe 3 Aralık 2026, 20:00

Takvim: https://cal.com/han-mamur-sugmbo/demo-tr

Saygılarımla,
Uzm. Dr. Gökhan Mamur
drhanmamur@notya.io
```

After 30 Kas, drop the 30 Kas slot from D+7/D+14 copy.

The three Friday 27 Kas DSNs with subject **“Muayenehaneniz için Türkiye'ye özel klinik asistanı (Dr. Gökhan Mamur)”** are a different 1:1 clinic campaign, not this webinar pack. Need the DSN `Final-Recipient` lines to sanitize those.
