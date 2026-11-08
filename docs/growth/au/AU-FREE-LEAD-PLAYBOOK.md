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

## Harvest snapshot (seed pack, 2026-11-08)

| Bucket | File | Count | Notes |
|--------|------|------:|-------|
| **WhatsApp call-ready** | `au-whatsapp-call-ready.csv` | 16 | Contact-labelled `04xx` / listing mobile → `+614…` |
| Email / landline queue | `au-email-landline-queue.csv` | 10 | Derm + O&G mostly; ask for mobile on reply |
| ASDP paeds directory | `au-asdp-paeds-directory.csv` | 55 | Public ASDP Find-a-Specialist (all states); enrich for mobiles |
| Re-harvest script | `scripts/au-wa-leads-harvest.py` | — | ASDP CSRF harvest + practice-site mobile scrape |

**Specialty mix (WA-ready seed):** paeds 8 · O&G 2 · dietetics 6 · dermatology 0 mobiles yet (in email queue).  
**Gap:** dermatology WhatsApp numbers are scarce on public sites — keep enriching FACD clinic contact pages; use email meanwhile.

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
python3 scripts/au-wa-leads-harvest.py
# writes refresh under docs/growth/au/ (ASDP directory + optional site enrichment)
```

Manual enrichment still wins for derm/O&G mobiles: open the practice **Contact** page, prefer numbers labelled Mobile / WhatsApp / after-hours.
