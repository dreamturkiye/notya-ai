---
name: specialty-audit-report
description: >-
  Produces readable specialty/product audit reports with depth pills
  (Strong/Partial/Thin/Missing), wow-bar charts, mandate matrices, pain-point
  cards, gap tables, and prioritized game changers — then publishes a dark,
  easy-on-the-eyes shareable HTML plus a Cursor canvas. Use when the user asks
  for an audit, specialty coverage review, gap analysis, wow-bar assessment,
  pre/post sprint audit, or a report for doctors/stakeholders like Gökhan to
  read. Prefer this over plain markdown tables.
---

# Specialty Audit Report

Boss feedback (verbatim): this audit style is *fantastic* — readable, easy on the eyes with colors and graphics, and very easy to understand. **Use this kind of audit report from now on.**

Gold reference (copy structure + tone, adapt domain content):

- Live HTML: `https://notya-ai.vercel.app/kd-jine-presprint-audit.html`
- Source: `public/kd-jine-presprint-audit.html` in notya-ai
- Canvas original: pre-sprint `kadin-dogum-specialty-audit.canvas.tsx` (transcript snapshot before JINE-04)

## When this skill applies

- Specialty / chapter / module audits (KD, derm, pediatri, tools, etc.)
- “Where are we strong / weak?”, gap lists, game changers, MoH vs product matrices
- Reports meant for a **human clinician or CEO** to skim (not just an eng dump)
- Pre-sprint and post-sprint snapshots (label which one clearly)

Do **not** replace a short bugfix note with this. Do use it when the deliverable is an **audit**.

## Deliverables (always)

1. **Cursor canvas** (`.canvas.tsx` under the workspace `canvases/` dir) — live beside chat.
2. **Shareable dark HTML** — same content/graphics, no login, no PHI.
   - Notya: `public/<slug>-audit.html` → `https://notya-ai.vercel.app/<slug>-audit.html`
   - Link from Araçlar / docs README when it’s a Notya product audit.
3. **Chat summary** — 5–10 lines: verdict + top 3 gaps + link to HTML (and canvas).

Ship HTML to production when Notya CEO-deploy rules apply (commit + push main/dev + Ready).

## Visual system (required)

Dark navy surface (`#060C18` / `#0D1526`), teal accent, flat (no gradients, no emoji icons, no heavy shadows).

### Depth pills (mandatory vocabulary)

| Depth | Meaning | Color |
|-------|---------|-------|
| **Strong** | Impressive / clinic-ready for that slice | teal / success |
| **Partial** | Real product, missing the wow treatment layer | amber / warning |
| **Thin** | Awareness / stubs / adapters only | red / danger |
| **Missing** | Explicitly absent or out of scope | red / danger |

Never invent alternate depth words (“Good”, “OK”, “TODO”).

### Layout blocks (in order)

1. **Banner** — Pre-sprint vs Post-sprint (or date/scope lock).
2. **H1 + lede** — what was audited × external anchors (MoH, guidelines, pain).
3. **Status pills** — 2–3 headline truths (strong / thin / wow gaps).
4. **Stat row (4)** — file count, shipped tickets, open tickets, audit bar label.
5. **Executive verdict callout** — one honest paragraph: what’s already impressive vs what won’t make an MD say “ulan bu başka”.
6. **Coverage depth table** — Domain | Depth pill | Note (concrete, not vague).
7. **Wow-bar chart** — horizontal bars 0–100 “completeness vs wow bar” with caption (how scored).
8. **Mandate / practice matrix** — Mandate | Level (MoH/BP/Law) | In product today | Gap to wow.
9. **Doctor pain points** — 2-col cards: pain + daily cost pill, Wow move, Now.
10. **Deep-dive sections** — only where gaps matter (e.g. STI, contraception, HMB): short callout + table with Coverage + Gap columns.
11. **Forms & tests gap list** — Form/test | Status | Action.
12. **Game changers (priority 1…N)** — Move | Why they’ll care | Size S/M/L pill.
13. **Recommended next ships** — 2–3 sprint cards (impress / velocity / mandate).
14. **Sources** — code paths + external refs; “intentionally out of wow now” list.

Post-sprint audits reuse the same chrome but may collapse to Strong domains + shipped game changers; keep a link to the pre-sprint sibling.

## Writing rules

- **Honest** — don’t inflate Partial to Strong; don’t fake live ministry write as shipped.
- **Clinic language** — Turkish MD pain (SUT, e-Doğum, GÖREN, poliklinik hızı), not only eng jargon.
- **Gap column is the point** — every weak row needs a specific next action, not “improve”.
- **Separate MoH vs best-practice** when they diverge.
- **No PHI** on public HTML.
- Prefer **graphics + pills** over walls of markdown. Chat gets a short digest; the HTML/canvas carries the audit.

## Canvas notes

- Import only from `cursor/canvas`.
- Use `Pill` tones: success / warning / danger / info / neutral.
- Use `BarChart` or equivalent for wow bars; `Stat`, `Callout`, `Table`, `Card` grids.
- Max-width ~1000–1100px; wrap pills.

## HTML notes

- Standalone file, inline CSS, mobile-friendly (stats 2-col, cards 1-col under ~900px).
- Bar rows: label | track fill % | numeric value.
- Footer: snapshot label + “no patient data”.
- Cross-link pre ↔ post when both exist.

## Anti-patterns

- Markdown-only audit when the user wanted something shareable/visual
- Rainbow decoration, emoji status icons, purple gradient AI-slop
- Empty “Strong” with empty notes
- Mixing pre- and post-sprint claims without labeling
- Publishing canvas Publish button as the share path — always ship HTML URL

## Quick checklist

```
- [ ] Depth pills only Strong|Partial|Thin|Missing
- [ ] Verdict callout answers “would a Turkish MD be wowed?”
- [ ] Wow bars + domain table + game changers present
- [ ] Gaps are actionable
- [ ] Canvas + public HTML + chat link
- [ ] Pre/post labeled; sources listed
```
