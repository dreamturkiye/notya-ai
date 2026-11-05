# TR free-lead playbook — demos + free trials (no stand)

**Classification:** growth / GTM ops (not product spine). Turkey outreach only.  
**Product demo surface:** shared `/demo` + `NEXT_PUBLIC_DEMO_BOOKING_URL` → Cal.com `han-mamur-sugmbo/demo-tr`.

## Roles

| Role | Who | Does |
|------|-----|------|
| **Invites / outreach** | **Kaan (Notya)** | WhatsApp Business + e-posta from call-ready CSV |
| **Public e-posta** | **`merhaba@notya.io`** | Forwards to `kaan@notya.io` (live) |
| **Demo host** | **Dr. Gökhan Mamur** | 30' remote video via Cal.com (US, visitor TZ · Google Meet) |
| **Trial** | Notya / Kaan | Open account if they skip or after demo |

Gökhan has lived outside Türkiye for ~**7 years** and does **not** have a warm peer list right now. Do **not** plan on him forwarding invites from his own WhatsApp. He demos; Kaan books the pipeline.

## Why this shape

- Goal is volume of **demos and/or free trials** — both feed word-of-mouth. Stand budget = 0.
- Agent free work: harvest public listings → call-ready CSV → templates → Kaan’s daily send queue.

## Live demo path (confirmed 2026-11-04)

- App: `https://www.notya.io/demo` (mentions Gökhan Mamur + Cal.com)
- Cal: `https://cal.com/han-mamur-sugmbo/demo-tr` (30 min, Google Meet, host TZ America/New_York, visitor picks local time)
- Trial: `https://www.notya.io`

## Harvest snapshot (this pack)

- 1 491 public profiles scanned (Doktortakvimi + Doktorsitesi)
- **~98 call-ready** = özel muayenehane + valid phone (pedi 31 / KD 40 / derm 27, all İstanbul)
- Many `0850…` lines are Doktortakvimi click-to-call — still reach the practice; prefer `5xx` mobile when present

## Assets in this folder

| File | Use |
|------|-----|
| `tr-call-ready-leads.csv` | **Start here** — private practice + phone |
| `tr-istanbul-pedi-leads.csv` | Full harvest (all scores / hospital-mixed) |
| `tr-istanbul-pedi-leads.json` | Same + `ozet.oncelik_hedef` top 40 |
| `TR-PEDI-OUTREACH-TEMPLATES.md` | Kaan WhatsApp / e-posta / trial-only / demo close |
| `../scripts/tr-pedi-leads-istanbul.mjs` | Re-run harvest anytime |

## Funnel (cheap)

```
public listing → call-ready CSV
      → Kaan WhatsApp and/or e-posta (max ~20/day)
           ├─ books Cal.com → Gökhan 30' remote demo → trial + “invite 2 peers”
           └─ skips demo → free trial link → soft Cal.com later
```

**Primary CTA = demo booking.** Free trial is the soft alternative when they won’t take a call.  
Success metric this week: **booked demos + trial signups**, not “messages sent”.

---

## How to start (Day 0 → first sends)

### Day 0 — setup (do this once, before any message)

1. **WhatsApp Business for Notya — yes, create one.**  
   - Use **WhatsApp Business** (app), not your personal WhatsApp, not the paid Cloud API yet.  
   - New SIM / number dedicated to Notya (TR `5xx` if you can). Display name: `Notya` or `Notya · Kaan`.  
   - Business profile: short description (“Muayene notu + asistan — demo: notya.io/demo”), website `https://www.notya.io`, email `merhaba@notya.io`, hours.  
   - Why: doctors see a brand, not a random personal number; you keep work replies in one place; you can hand the phone to ops later.  
   - **Skip for now:** WhatsApp Business API / BSP (Twilio etc.) — overkill at ~20 manual messages/day. Upgrade only if volume or team needs it.

2. **E-posta** — public address is **`merhaba@notya.io`** (WhatsApp Business profile + outreach From/Reply-To). It **forwards to `kaan@notya.io`** and is live. Use e-posta when the CSV has no good mobile, or as a same-day follow-up after WhatsApp.

3. **Align Gökhan (15 min call)**  
   - Confirm Cal.com `han-mamur-sugmbo/demo-tr` has enough open slots (TR evenings / weekends help — he’s US).  
   - He only demos; he does **not** send cold invites.  
   - Agree: after each booked demo you ping him; after each completed demo he (or you) asks for 2 peer intros.

4. **Tracking sheet** (Google Sheet copy of `tr-call-ready-leads.csv`)  
   Columns to keep live: `durum` (`yeni` → `yazildi` → `cevap` → `demo_booked` / `trial` / `hayir`), `kanal` (wa/email), `tarih`, `not`.  
   Do **not** commit reply PII back into the repo.

5. **First cohort** — sort sheet: `brans=pediatri`, `sehir=istanbul`, prefer `5xx` mobiles over `0850`. Take the top **20**.

### Day 1 — first outreach block (~45–60 min)

1. Open templates: `TR-PEDI-OUTREACH-TEMPLATES.md` → WhatsApp block.  
2. For each of the 20: personalize `{İsim}` + ilçe; **lead with Cal.com demo**; trial is the second line.  
3. Send from Notya WhatsApp Business. Cap **~20/day**.  
4. Mark `yazildi` + date.  
5. Same day optional: e-posta to anyone with only `0850` / no WhatsApp delivery.

### When they reply

| Reply | You do |
|-------|--------|
| “Tamam / saat?” | Send **only** Cal.com link again; help them pick a slot. No deck. |
| “Demo olmaz, bakarım” | Free trial link + offer Cal later. |
| “İstemiyorum” | Soft stop; mark `hayir`. |
| Silence 3–4 days | One short bump (WhatsApp or e-posta), then stop. |

### After a demo is booked

1. Confirm in Cal.com + ping Gökhan.  
2. Day-of: short WhatsApp “Hocam, X’te görüşüyorsunuz — link Cal’de.”  
3. After demo: open trial if not already; ask for **2 meslektaş**; you send those invites from Notya WhatsApp.

### Days 2–7 rhythm

- Each morning: 15–20 new `yeni` → WhatsApp (demo-first).  
- Afternoon: reply queue + bump silences once.  
- End of day tally: `demo_booked`, `trial_opened`, `peer_intros`.  
- When pedi İstanbul `yeni` runs low → KD / derm rows, then re-harvest script.

## Daily loop (Kaan) — short

1. Sheet: `yeni` pedi İstanbul first.  
2. 15–20 WhatsApp (demo-first) from Notya Business number.  
3. Mark `yazildi`.  
4. Positive → Cal.com (mostly) or trial.  
5. Post-demo: trial + 2 peer intros (you send).  
6. Tally demos + trials.

## Guardrails

- No dernek membership dumps, no purchased lists, no automated blast.
- Soft stop on “istemiyorum”.
- Claims: structured note + asistan + doctor approval — never “AI replaces doctor”.
- Gökhan is US-based: say it once (“ABD’den görüntülü, saat sizin diliminizde”), then book.
- Do not imply Gökhan is writing from a TR practice WhatsApp — first message is from Kaan / Notya.

## Re-harvest

```bash
node scripts/tr-pedi-leads-istanbul.mjs
```

Sources: Doktortakvimi + Doktorsitesi · pediatri (İstanbul/Ankara/İzmir) · KD + dermatoloji (İstanbul).

## Country / specialty note

- Outreach copy is **TR-only** (EXEMPT for us/gb/ca/au/nz/uz product code).
- `/demo` booking URL is per-country env; TR production should keep Gökhan’s `demo-tr` Cal link.
- Product itself stays one app for all 40 branches — this pack only targets early TR pedi/KD/derm private practices for GTM.
