-- DAH-WOW-SMOKE-FU (2026-09-17): tarama sonucu hekim "Nota ekle" ile nota eklendiğinde işaretlenir; NudgeBar CTA'yı o sonuç için gizler.
alter table dahiliye_taramalar add column if not exists nota_eklendi_at timestamptz;
