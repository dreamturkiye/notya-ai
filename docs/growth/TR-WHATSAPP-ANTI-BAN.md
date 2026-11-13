# TR WhatsApp cold outreach — anti-ban rules (hard)

**Trigger:** 24h WhatsApp Business restriction after rapid identical cold sends (~1/min), 2026-11-10.

WhatsApp does **not** publish exact cold-outreach thresholds for the Business app. Official Business Messaging Policy + observed spam signals (velocity, near-identical copy, high first-contact ratio, low replies, blocks/reports) drive temporary restrictions. API “messaging limits” (250→2k…) are a **different product** — do not treat them as Business-app cold quotas.

**Honest limit:** cold outreach is high-risk by design (100% outbound-first). These rules cut risk; they cannot guarantee zero bans.

## What research actually says (2026-11-12)

Sources are industry observations (Maytapi, Wassuply, WASchedule, MoltFlow, BuzzRelay) — **not** Meta-published cold caps:

| Finding | Implication for us |
|---------|--------------------|
| No official Business-app msgs/day number | Optimise **pattern**, not a magic count |
| Strongest ban signals: **reports/blocks**, then velocity, identical copy, 100% first-contact | Unique variants + gaps matter more than a tiny daily ceiling |
| ~1/min cold to unsaved contacts is a primary velocity red flag | We already moved to **10–20 min** gaps — that alone removes the 2026-11-10 failure mode |
| Post-ban: resume softer; prior-ban numbers often need **~30–60% lower** volume than peers | Soft restart, then ramp — don’t stay at 6 forever |
| Practical cold bands quoted online | New/risky ~**20–50**/day; after a ban stay toward the **low end** and ramp only while clean |
| Cloud API tiers (250+) | N/A to this manual Business-app flow |

**Conclusion:** With **≥10 min** gaps + **unique full-quality variants**, **6/day is unnecessarily low** after the first soft day(s). Raise to a paced mid-teens/low-twenties cold cap while soft-restart still applies; then normal ~22/day if no new warnings.

## Hard caps (current — phase 2 post-ban)

| Rule | Soft restart (≤48h after unlock) | After soft (clean) |
|------|----------------------------------:|-------------------:|
| Min gap between **cold** sends | **12–20 min** (never < **10**) | **10–15 min** (never < **10**) |
| Max cold sends / hour | **5** | **5** |
| Max cold sends / calendar day (TR) | **16** | **22** |
| Max cold sends / rolling 24h | **18** | **25** |
| Identical / near-identical body | **Forbidden** | **Forbidden** |
| Quiet hours (TR) | **09:30–19:00** Europe/Istanbul | same |
| Ultra-soft day-1 floor (historical) | **6**/day — **retired** once paced gaps proven | — |

Quiet window ≈ 9.5h → at 12–15 min average gap, **~38–57** theoretical sends; we cap far below that so volume never looks like a blast.

`scripts/tr-outreach-next.py --check-pace` + `tr-wa-send-log.csv` + `tr-wa-pace-state.json` enforce gap/day/hour before SIRADAKİ.

## Copy rules (similarity signal)

1. **Never** paste the same body twice in a day (name-only swap counts as near-identical).
2. Every SIRADAKİ pack uses `scripts/tr-wa-message-variant.py` — **full-quality** variants of `TR-PEDI-OUTREACH-TEMPLATES.md`. Thin stubs forbidden.
3. Keep specialty clinical depth.
4. Always include: who you are (Kaan/Notya), what it does, branş list, time-save, Gökhan 30 dk, demo + deneme.
5. Links stay `www.` (no `https://`); dismiss OG card **X** before send.
6. Do **not** send follow-up/apology if first message was delivered — looks spammy.

## Session hygiene

- Save the contact **before** send.
- Paste → wait a few seconds → send.
- If 2+ blocks/reports in a day → **stop for 48h** and cut daily cap in half next open day.
- If delivery sticks on one grey tick for many numbers → **stop immediately**.
- Prefer days with some inbound replies over pure outbound streaks.
- Avoid same first-name back-to-back in the queue when easy (optics + fingerprint).

## Ramp after the 24h ban

1. Day unlocked + first paced day: ultra-soft was **6**/day (done).
2. **Now (phase 2):** soft **16**/day, gap ≥ **12 min**, unique variants — *only while no new warning*.
3. After soft window ends clean: **22**/day, gap ≥ **10 min**.
4. If another restriction hits: drop back to **8**/day for 48h, gap ≥ **20 min**.
5. Log every send via `--mark-gitti` → `tr-wa-send-log.csv`.

## Sources

- [WhatsApp Business Messaging Policy](https://www.whatsapp.com/legal/business-policy)
- [Meta WA policy enforcement](https://developers.facebook.com/docs/whatsapp/overview/policy-enforcement)
- [Maytapi — How WhatsApp detects spam](https://support.maytapi.com/anti-ban-and-best-practices/how-whatsapp-detects-spam)
- [Maytapi — Safe sending rates](https://support.maytapi.com/anti-ban-and-best-practices/safe-sending-rates)
- [Wassuply — Sending limits](https://wassuply.com/glossary/whatsapp-sending-limits/)
- [WASchedule anti-spam](https://waschedule.com/anti-spam)
- [BuzzRelay — message limits](https://buzzrelay.cc/docs/whatsapp-message-limits)

## Related

- Live queue: `TR-OUTREACH-DURUM.md`
- Copy pack: `TR-WHATSAPP-GONDERIM-PAKETI.md`
- Ledger: `tr-outreach-ledger.csv`
- Send timestamps: `tr-wa-send-log.csv`
- Pace config: `tr-wa-pace-state.json`
