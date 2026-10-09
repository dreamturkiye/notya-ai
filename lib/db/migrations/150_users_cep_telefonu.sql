-- 150 — NOTYA-ONBOARDING-01 (Kaan, 2026-10-09): the doctor's OWN mobile number.
--
-- Onboarding now asks every new doctor for a mobile number (app/onboarding/page.tsx, step 3). This column is
-- the doctor's own number; it is NOT one of the practice contact fields shown to patients (iletisim_*) and must
-- not be mixed with them. One stored form: +905XXXXXXXXX (lib/onboarding/cepTelefonu.ts applies the same pattern).
--
-- ADDITIVE only. Idempotent (safe to run twice). No DROP. The column is nullable with no default, so the table
-- is not rewritten. The CHECK is added NOT VALID and then validated (does not block writes; the value is NULL on
-- every existing row).
-- If the column is missing the product soft-fails: POST /api/users/profile saves the other answers, reports the
-- mobile number as not saved and logs it. It must still be applied BEFORE deploy — otherwise the number of a
-- doctor who finishes onboarding in between is not saved.
--
-- Number: 150, because 128–149 is reserved for another line of work.

alter table public.users add column if not exists cep_telefonu text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_cep_telefonu_bicim' and conrelid = 'public.users'::regclass) then
    alter table public.users add constraint users_cep_telefonu_bicim
      check (cep_telefonu is null or cep_telefonu ~ '^\+905[0-9]{9}$') not valid;
  end if;
end $$;

alter table public.users validate constraint users_cep_telefonu_bicim;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('150', '150_users_cep_telefonu.sql', null, now(), false,
  'NOTYA-ONBOARDING-01: users.cep_telefonu (the doctor''s own mobile, +905XXXXXXXXX) + format CHECK')
on conflict (version) do nothing;
