-- 214 — DOZ-KAYDI-ISTEGE-BAGLI (Kaan, 2026-11-26: "Go ahead and make the change."). CORE: every one of the 30 medical
-- branches and the 10 Özel Branşlar (Sağlığım › Doz Takvimi is one shared module).
--
-- Reminders stay the core and stay on by default. Logging doses becomes optional: an unmarked dose is "kayıt yok", never
-- "alınmadı", and adherence % is computed only for medicines the patient chose to log.
--
--   ev_ilac_planlari.kayit_tutma   the patient's own choice for ONE medicine: 'acik' (I mark my doses) / 'kapali'
--                                  (reminder only) / null (not chosen → follows ev_tercihler.doz_kaydi; a doctor-flagged
--                                  kritik medicine defaults to 'acik' — logging requested, explained to the patient).
--   ev_tercihler.doz_kaydi         the patient's one-time answer to "Dozlarınızı işaretlemek ister misiniz?":
--                                  'acik' / 'kapali' / null (not answered → reminder only). doz_kaydi_at = when answered.
--
-- Access (hasta-izolasyon): both tables already have RLS on (208); no new policy, no grant — reads / writes stay
-- server-side (service role) scoped by doctor_id AND patient_id; anon gets nothing. Existing rows keep working (null =
-- previous behaviour for kritik medicines, reminder-only for the rest). Applied to production with the Supabase tools on
-- 2026-11-26 UTC (migration log name: 214_doz_kaydi_istege_bagli).

alter table public.ev_ilac_planlari add column if not exists kayit_tutma text;
alter table public.ev_ilac_planlari drop constraint if exists ev_ilac_planlari_kayit_tutma_ck;
alter table public.ev_ilac_planlari add constraint ev_ilac_planlari_kayit_tutma_ck check (kayit_tutma is null or kayit_tutma in ('acik', 'kapali'));
comment on column public.ev_ilac_planlari.kayit_tutma is 'DOZ-KAYDI-ISTEGE-BAGLI: patient choice for this medicine — acik (logs doses) / kapali (reminder only) / null (follows ev_tercihler.doz_kaydi; kritik → acik)';

alter table public.ev_tercihler add column if not exists doz_kaydi text;
alter table public.ev_tercihler add column if not exists doz_kaydi_at timestamptz;
alter table public.ev_tercihler drop constraint if exists ev_tercihler_doz_kaydi_ck;
alter table public.ev_tercihler add constraint ev_tercihler_doz_kaydi_ck check (doz_kaydi is null or doz_kaydi in ('acik', 'kapali'));
comment on column public.ev_tercihler.doz_kaydi is 'DOZ-KAYDI-ISTEGE-BAGLI: one-time answer — acik / kapali / null (not answered = reminder only)';

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('214', '214_doz_kaydi_istege_bagli.sql', null, now(), false,
  'DOZ-KAYDI-ISTEGE-BAGLI: ev_ilac_planlari.kayit_tutma + ev_tercihler.doz_kaydi / doz_kaydi_at (acik/kapali/null; RLS unchanged, no new policy or grant)')
on conflict (version) do nothing;

-- VERIFY (read-only):
--   select table_name, column_name, data_type from information_schema.columns where (table_name, column_name) in (('ev_ilac_planlari','kayit_tutma'),('ev_tercihler','doz_kaydi'),('ev_tercihler','doz_kaydi_at'));
--   select relname, relrowsecurity from pg_class where relname in ('ev_ilac_planlari', 'ev_tercihler');  -- both true
--   select grantee, privilege_type from information_schema.role_table_grants where table_name in ('ev_ilac_planlari','ev_tercihler') and grantee = 'anon';  -- expect 0 rows
