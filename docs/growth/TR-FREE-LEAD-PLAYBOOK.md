# TR free-lead playbook — demos + free trials (no stand)

**Classification:** growth / GTM ops (not product spine). Turkey outreach only.  
**Product demo surface:** shared `/demo` + `NEXT_PUBLIC_DEMO_BOOKING_URL` → Cal.com `han-mamur-sugmbo/demo-tr`.

## Why this shape

- Dr. Gökhan Mamur lives in the **US**, demos **remotely** via the in-app Cal.com link. Visitors book in **their** timezone.
- Goal is volume of **demos and/or free trials** — both feed word-of-mouth. Stand budget = 0.
- Agent free work (1–2 days): harvest public listings → call-ready CSV → templates → approval queue.

## Live demo path (confirmed 2026-11-04)

- App: `https://www.notya.io/demo` (mentions Gökhan Mamur + Cal.com)
- Cal: `https://cal.com/han-mamur-sugmbo/demo-tr` (US host, visitor timezone)
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
| `TR-PEDI-OUTREACH-TEMPLATES.md` | WhatsApp / e-posta / Gökhan peer / trial-only / demo close |
| `../scripts/tr-pedi-leads-istanbul.mjs` | Re-run harvest anytime |

## Funnel (cheap)

```
public listing → call-ready CSV
      → WhatsApp/SMS (max ~20/day, approved)
           ├─ books Cal.com → Gökhan 60' remote demo → trial + “invite 2 peers”
           └─ skips demo → free trial link → soft Cal.com later
```

Success metric this week: **booked demos + trial signups**, not “messages sent”.

## Daily loop (Kaan / ops)

1. Open `tr-call-ready-leads.csv`, filter `brans=pediatri`, `sehir=istanbul`, `durum=yeni`.
2. Personalize 15–20 WhatsApp from templates (name + ilçe).
3. Mark `durum=yazildi` in your working copy (don’t commit PII replies).
4. Positive reply → Cal.com or trial only. No pitch deck dump.
5. After each demo: trial + peer-forward script (templates § demo kapanış).
6. End of day: count `demo_booked`, `trial_opened`, `peer_intros`.

## Guardrails

- No dernek membership dumps, no purchased lists, no automated blast.
- Soft stop on “istemiyorum”.
- Claims: structured note + asistan + doctor approval — never “AI replaces doctor”.
- Gökhan is US-based: say it once (“ABD’den görüntülü, saat sizin diliminizde”), then book.

## Re-harvest

```bash
node scripts/tr-pedi-leads-istanbul.mjs
```

Sources: Doktortakvimi + Doktorsitesi · pediatri (İstanbul/Ankara/İzmir) · KD + dermatoloji (İstanbul).

## Country / specialty note

- Outreach copy is **TR-only** (EXEMPT for us/gb/ca/au/nz/uz product code).
- `/demo` booking URL is per-country env; TR production should keep Gökhan’s `demo-tr` Cal link.
- Product itself stays one app for all 40 branches — this pack only targets early TR pedi/KD/derm private practices for GTM.
