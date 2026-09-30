-- 110 — NOTYA-KADEME-01 (2026-09-30): model tiering on the Luna family (docs/ARCH-MODEL-TIERING.md).
-- kademe gains 'derin' (luna-pro, background heavy work); neden gains 'tier_up' (luna-none answer unusable → same
-- request retried on luna once). Code runs before this is applied: lib/ai/kullanim.ts rewrites the row without
-- neden, then without kademe, on a check violation — counters are never lost, only the label.
alter table public.ai_token_kullanim drop constraint if exists ai_token_kullanim_kademe_check;
alter table public.ai_token_kullanim add constraint ai_token_kullanim_kademe_check
  check (kademe in ('guclu', 'hizli', 'derin'));
alter table public.ai_token_kullanim drop constraint if exists ai_token_kullanim_neden_check;
alter table public.ai_token_kullanim add constraint ai_token_kullanim_neden_check
  check (neden in ('transport', 'onayla', 'safety', 'vision', 'low_conf', 'uzman', 'devre', 'tier_up'));
