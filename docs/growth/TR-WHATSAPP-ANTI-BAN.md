# TR WhatsApp cold outreach — anti-ban rules (hard)

**Trigger:** 24h WhatsApp Business restriction after rapid identical cold sends (~1/min), 2026-11-10.

WhatsApp does **not** publish exact thresholds. Official Business Messaging Policy + observed spam signals (velocity, near-identical copy, high first-contact ratio, low replies, blocks/reports) drive temporary restrictions. After a ban, tolerance drops — restart softer than before.

**Honest limit:** cold outreach is high-risk by design (100% outbound-first). These rules cut risk; they cannot guarantee zero bans.

## Hard caps (post-ban, until 14 clean days)

| Rule | Value |
|------|------:|
| Min gap between **cold** sends | **12–20 min** (random; never < 10 min) |
| Max cold sends / hour | **4** |
| Max cold sends / calendar day (TR) | **12** |
| Max cold sends / rolling 24h | **15** |
| Identical / near-identical body | **Forbidden** — use a fresh variant every send |
| Quiet hours (TR) | No cold WA **before 09:30** or **after 19:00** Europe/Istanbul |
| After any restriction ends | **48h** very soft: max **6**/day, gap ≥ **20 min** |

`scripts/tr-outreach-next.py --check-pace` and the send log enforce the gap/day caps before proposing SIRADAKİ.

## Copy rules (similarity signal)

1. **Never** paste the same body twice in a day (name-only swap counts as near-identical).
2. Every SIRADAKİ pack uses `scripts/tr-wa-message-variant.py` — structural variants (opening, bullet order, CTA wording).
3. Keep specialty bullets, but shuffle order / pick 4 of 5.
4. Prefer one soft question (boosts reply rate): e.g. “Kısa bir bakış ister misiniz?”
5. Links stay `www.` (no `https://`); dismiss OG card **X** before send.
6. Do **not** send follow-up/apology if first message was delivered — looks spammy.

## Session hygiene

- Save the contact **before** send (looks less like a blast list).
- Type or paste → wait a few seconds → send (don’t machine-gun).
- If 2+ people block/report in a day → **stop for 48h**.
- If delivery sticks on one grey tick for many numbers → **stop immediately**.
- Prefer days with some inbound replies over pure outbound streaks.

## After the 24h ban (this cycle)

1. Confirm the number can send again.
2. First day unlocked: **max 6** cold sends, gap ≥ **20 min**, all unique variants.
3. Days 2–7: ramp to **8 → 10 → 12**/day only if no new warnings.
4. Log every send in `tr-wa-send-log.csv` via `--mark-gitti` (auto).

## Sources (policy / practice)

- [WhatsApp Business Messaging Policy](https://www.whatsapp.com/legal/business-policy)
- [Meta WA policy / spam enforcement](https://developers.facebook.com/docs/whatsapp/overview/policy-enforcement)
- Industry observations on velocity + similarity stacking (not official thresholds)

## Related

- Live queue: `TR-OUTREACH-DURUM.md`
- Copy pack: `TR-WHATSAPP-GONDERIM-PAKETI.md`
- Ledger: `tr-outreach-ledger.csv`
- Send timestamps: `tr-wa-send-log.csv`
