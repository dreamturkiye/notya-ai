# Full power of two brains in one (NOTYA-IKI-BEYIN-BIRDE)

**Date:** 2026-10-03  
**Decision:** Kaan — restore pre–tek-beyin answer QoS without restoring dual-brain cost or ElevenLabs speech degradation.

## Why not roll back to two brains

The 2026-09-25 dual-brain setup was mature on **answers**, but:

1. **Cost** — ElevenLabs hosted an LLM *and* chat had its own.
2. **Speech** — a fat ConvAI agent (long prompt, many client tools, long spoken dumps) caused slur / rush / crawl (`NOTYA-SES-KILIT-01`, `NOTYA-SES-SLUR-01`).

Rolling back would buy QoS and re-buy both failures.

## Architecture

| Layer | Role | Hard rules |
|---|---|---|
| **ElevenLabs** | Thin mouth: mic, turn-taking, TTS | Short agent prompt; Flash v2.5 + speed 1 + no expressive mode (SES-KILIT); ≤5 spoken beats for ordinary chat (SES-SLUR); Custom LLM → our server |
| **`ayseCevapla`** | Strong brain: search, chart, calendar, cards | High-confidence routers = fast path (no model, no slowdown); everything else = Luna + read tools (`hasta_bul`, `randevu_takvim`, …) — the power the old voice brain had |

## Confidence gate (`lib/asistan/ikiBeyinBirde.ts`)

Trusted fast path (stays snappy):

- Explicit count / list / cohort ("kaç hastam var?", "astım tanılı hastaları listele")
- Multi-match / "which patient?"
- Deterministic "X dosyası açık"
- Named who-answer with a real patient
- Calendar, identity (when the named person matches), record tables, quick card

Falls through to model + read tools (old 2-brain power):

- Empty `"0 hasta · Filtre: …"` when the doctor did **not** ask an explicit count/list
- Any other search sentence without an explicit practice intent
- Identity answered from the open chart while the sentence named somebody else

Kill switch: `AYSE_IKI_BEYIN_BIRDE_KAPALI=1` (pre-gate behaviour).

## What this does not change

- TTS lock and spoken-beat caps (speech quality stays protected)
- Write/action tools and spoken confirmation spine
- Isolation / KVKK identity rules
- Fish remains opt-in (`AYSE_SES_SAGLAYICI=fish`); Ayşe default is ElevenLabs

## Proof

- Unit: `lib/asistan/ikiBeyinBirde.test.ts`
- Routing table (`ayseRota.test.ts`) must keep high-confidence rows on `arama` / `takvim` / `kayit` / `hizli-kart` and clinical non-count rows on `model` with `hasta_bul` offered
- Live: Dr. Gökhan mic session — answer power *and* no slur/speed drift
