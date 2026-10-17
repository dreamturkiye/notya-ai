# PERF-BUTCE-LOG — running performance-budget log

Append-only. One line per change in scope of `.cursor/rules/performans-butcesi-koruma.mdc`.
Never rewrite history here — a correction is a new line, not an edit to an old one.
Format: `date | change | metric: measured (pass/warn/fail) | note`.

Seeded from the baseline this budget is set against (`docs/audits/PERF-SAGLAMLIK-2026-10.md`):

2026-10-17 | PERF-SAGLAMLIK-2026-10 baseline established | page JS 18.6 kB, First Load 214 kB, portal median 62.3 ms, gorevSenkron round trips 2 (flat), hot-table plan Index Scan cost 2.37, 8/8 external calls timeout-covered (pass) | baseline — see audit doc for full method
