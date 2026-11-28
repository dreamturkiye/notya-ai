# AU free-lead playbook — demos + free trials (WhatsApp side job)

**Classification:** growth / GTM ops (not product spine). **Australia only.**  
**Keep separate from Türkiye:** all AU assets live under `docs/growth/au/`. Do not append AU rows into `docs/growth/tr-*.csv` or TR playbooks (those stay on the TR outreach branch / stash).

**Product surfaces**

| Surface | URL |
|---------|-----|
| AU demo page | `https://au.notya.io/au/demo` |
| Cal (AU) | `https://cal.com/han-mamur-sugmbo/demo-au` |
| AU trial / app | `https://au.notya.io` |
| WhatsApp-safe links | `www.au.notya.io/...` (no `https://`) |

## Roles

| Role | Who | Does |
|------|-----|------|
| **Invites / outreach** | **Kaan (Notya)** | WhatsApp Business + email from call-ready CSV |
| **Public email** | **`hello@notya.io`** / `merhaba@notya.io` forward | Reply-To on email; WA profile |
| **Demo host** | **Dr Gökhan Mamur** | 30' remote video via Cal `demo-au` (visitor TZ · Google Meet) |
| **Trial** | Notya / Kaan | Open AU account if they skip or after demo |

## Why this shape

- Goal is **demos and/or free trials** on the AU pack.  
- Agent free work: public directories + practice sites → call-ready CSV → AU-English templates with **AU Araçlar** → Kaan’s send queue.  
- Specialty focus this wave: **paediatrics, obstetrics & gynaecology, dermatology, clinical dietetics (APD)**.

## Harvest snapshot (TR-scale HealthShare pull)

Same shape as Türkiye’s Doktortakvimi harvest: **full specialty directory CSV** + **call-ready** (has phone) + **WhatsApp-ready** (`04xx` → `+614`).

| Bucket | File | Notes |
|--------|------|-------|
| **Full harvest** | `au-healthshare-leads.csv` (+ `.json`) | All HealthShare profiles in focus specialties |
| **Call-ready** | `au-call-ready-leads.csv` | At least one phone on the profile |
| **WhatsApp-ready** | `au-whatsapp-call-ready.csv` | AU mobile `+614…` |
| Email / landline extras | `au-email-landline-queue.csv` | Manual FACD / rooms queue |
| ASDP paeds supplement | `au-asdp-paeds-directory.csv` | College Find-a-Specialist |
| Re-harvest | `scripts/au-wa-leads-harvest.py` | HealthShare A–Z × specialty + profile enrich |

**Focus specialties:** paediatrics · obstetrics-gynaecology · dermatology · dietetics (APD).  
**Source:** HealthShare public API (`specialty` filter + profile locations for phone/email/website).  
**This pull (2026-11-08):** **7022** unique · **4405** with phone · **540** with AU mobile — ahead of TR’s ~5.6k full / ~3k call-ready on the phone tier; WA mobiles are scarcer on AU public listings than TR `5xx`.

## Funnel

```
public listing / practice site
      → au-whatsapp-call-ready.csv  (04xx + private practice)
           → Kaan WhatsApp (AU English + AU Araçlar bullets)
                ├─ books Cal demo-au → Gökhan 30' → trial + “invite 2 peers”
                └─ skips call → free trial www.au.notya.io
      → au-email-landline-queue.csv when only landline/email
```

## Day-0 setup

1. **WhatsApp Business** dedicated to Notya (or a second chat labelled AU). Display name `Notya` / `Notya · Kaan`. Profile: AU demo link, email, hours.  
2. **Do not** reuse the TR send queue numbers or TR Turkish templates.  
3. Confirm Cal `demo-au` has AU-friendly slots (evenings AEST/AEDT help).  
4. Sheet copy of `au-whatsapp-call-ready.csv` with live `status` / `channel` / `date` / `notes`.

## Quiet hours

No cold WhatsApp after **20:00 local** in the lead’s state (use NSW/VIC/QLD/… clock, not Turkey time). Resume ~**09:00–19:00** local.

## Country / specialty classification (for agents)

- **Core GTM ops**, not a product-spine change — no 40-branch or six-country code propagation required for this folder.  
- Message **Araçlar** names must stay AU (`WHO growth percentiles`, `CTG … (RANZCOG)`, `Dermoscopy ABCD`, `ADIME` / `kJ` / `MST` / `IDDSI`) — never Turkish tool titles (`Büyüme & Persentil`, `Gebelik takvimi`, …).  
- TR list remains on the TR outreach branch; this side job does not move or merge those CSVs.

## How to re-harvest

```bash
# Full TR-scale pull (HealthShare search + profile phones). ~15–30 min.
PYTHONUNBUFFERED=1 python3 -u scripts/au-wa-leads-harvest.py --asdp

# Resume enrich from search checkpoint only:
PYTHONUNBUFFERED=1 python3 -u scripts/au-wa-leads-harvest.py \
  --resume-json docs/growth/au/au-healthshare-search.json
```

Start outreach from `au-whatsapp-call-ready.csv`, then `au-call-ready-leads.csv` (landline/email). Full list for scoring / filters: `au-healthshare-leads.csv`.
