# PERF-BUTCE-LOG — running performance-budget log

Append-only. One line per change in scope of `.cursor/rules/performans-butcesi-koruma.mdc`.
Never rewrite history here — a correction is a new line, not an edit to an old one.
Format: `date | change | metric: measured (pass/warn/fail) | note`.

Seeded from the baseline this budget is set against (`docs/audits/PERF-SAGLAMLIK-2026-10.md`):

2026-10-17 | PERF-SAGLAMLIK-2026-10 baseline established | page JS 18.6 kB, First Load 214 kB, portal median 62.3 ms, gorevSenkron round trips 2 (flat), hot-table plan Index Scan cost 2.37, 8/8 external calls timeout-covered (pass) | baseline — see audit doc for full method
2026-10-29 | SES-OMURGA-V2 voice/text path (ses-llm, ayseCevapla, chart cache, ses-ekran) | voice turn DB round trips before the brain: 6–9 sequential → 1 RPC (pass); synthetic queries before first speech, 2nd model-free chart question: 31 → 4 (pass, versioned chart cache); hot-path: no new sequential awaits, session write moved after the stream (pass); external calls: EL conversation token 8 s, EL signed URL 8 s (was none), EL agent pin 2.5 s, OpenRouter abort signal (pass); patient-file page bundle: untouched (n/a) | ses-ekran poll is now a 40-line window + 30 s auth memo; ses_tur_olcum carries per-turn timings from production
