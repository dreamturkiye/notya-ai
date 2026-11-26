-- 215 — DOZ-KAYDI-ISTEGE-BAGLI, part 2 (Kaan, 2026-11-26 11:06 ET: reminders must be optional for the patient too —
-- "some might be bothered"). CORE: every one of the 30 medical branches and the 10 Özel Branşlar.
--
--   ev_ilac_planlari.hatirlatma_acik   per-medicine reminder switch (default on; off = no push for that medicine's
--                                      doses and no two-day nudge to the patient; the plan itself is never deleted).
--   ev_tercihler.doz_secimi            the patient's one-time answer, three options:
--                                        'hatirlat_isaretle'  reminders + logging      (doz_kaydi = acik,  hatirlatma_acik = true)
--                                        'sadece_hatirlat'    reminders only           (doz_kaydi = kapali, hatirlatma_acik = true)
--                                        'istemiyorum'        no reminders, no logging (doz_kaydi = kapali, hatirlatma_acik = false)
--                                      null = not answered yet → reminders on (default) with a plain "Hatırlatmaları kapat".
--                                      The global switch stays ev_tercihler.hatirlatma_acik (208); quiet hours unchanged.
--
-- Access (hasta-izolasyon): RLS already on (208); no new policy, no grant; server-side writes scoped by doctor_id AND
-- patient_id; anon nothing. Existing rows: every plan keeps reminders on (previous behaviour). Applied to production with
-- the Supabase tools on 2026-11-26 UTC (migration log name: 215_doz_hatirlatma_istege_bagli).

alter table public.ev_ilac_planlari add column if not exists hatirlatma_acik boolean not null default true;
comment on column public.ev_ilac_planlari.hatirlatma_acik is 'DOZ-KAYDI-ISTEGE-BAGLI: per-medicine reminder switch (patient); false = no dose push / no two-day nudge for it';

alter table public.ev_tercihler add column if not exists doz_secimi text;
alter table public.ev_tercihler drop constraint if exists ev_tercihler_doz_secimi_ck;
alter table public.ev_tercihler add constraint ev_tercihler_doz_secimi_ck check (doz_secimi is null or doz_secimi in ('hatirlat_isaretle', 'sadece_hatirlat', 'istemiyorum'));
comment on column public.ev_tercihler.doz_secimi is 'DOZ-KAYDI-ISTEGE-BAGLI: one-time answer — hatirlat_isaretle / sadece_hatirlat / istemiyorum / null (not answered: reminders on)';

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('215', '215_doz_hatirlatma_istege_bagli.sql', null, now(), false,
  'DOZ-KAYDI-ISTEGE-BAGLI part 2: ev_ilac_planlari.hatirlatma_acik (default true) + ev_tercihler.doz_secimi (3 options / null); RLS unchanged, no new policy or grant')
on conflict (version) do nothing;

-- VERIFY (read-only):
--   select table_name, column_name, column_default from information_schema.columns where (table_name, column_name) in (('ev_ilac_planlari','hatirlatma_acik'),('ev_tercihler','doz_secimi'));
--   select count(*) from ev_ilac_planlari where hatirlatma_acik is distinct from true;  -- 0 right after apply
