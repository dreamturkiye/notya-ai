-- 195 (Claude, 2026-11-12) — WHATSAPP-ONBURO-01 "Ayşe ön büro": a new appointment by WhatsApp chat and automatic answers
-- to NON-MEDICAL questions from the doctor's own practice sheet (lib/iletisim/onburo).
--
-- WRITTEN ONLY — not applied by the job that wrote it (docs/OPEN-COMMITMENTS.md WHATSAPP-ONBURO-01). Idempotent, ADDITIVE,
-- and the SAME file on main and on every release branch. Safe on a database that does not carry the WhatsApp inbox yet
-- (migration 169): the two blocks that touch whatsapp_yanitlar and randevular check that the table exists first.
--
-- Until it is applied the feature is inert: lib/iletisim/onburo/sunucu.ts reads a missing settings table as OFF, the
-- settings card cannot save, and no code path writes any of the values introduced here.
--
--   1. whatsapp_on_buro_ayarlari — ONE row per doctor: the booking mode ('kapali' default | 'onay' | 'otomatik'), the
--      answers switch (default false) and the "Muayenehane bilgileri" sheet (jsonb: address, hours, fees … written by the
--      doctor). PRACTICE information only — no patient id, no patient data. RLS: the doctor reads his own row; every
--      write goes through the service role scoped by .eq('doctor_id', <session doctor>). No anon access.
--   2. whatsapp_yanitlar.on_buro (jsonb) — the conversation step of a front-desk card (which times were proposed, which
--      of this doctor's own matches were offered by first name) and, for an automatic answer, the answer text ENCRYPTED
--      plus the sheet keys it came from. A name given by an unknown sender is stored ENCRYPTED inside it.
--      whatsapp_yanitlar keeps its RLS from 169 (own-row + RESTRICTIVE hasta_izolasyon); a column add does not change it.
--   3. whatsapp_yanitlar.niyet may be 'randevu' (a new-appointment conversation).
--   4. randevular.kaynak may be 'whatsapp' (an appointment made in the chat goes through the portal's create path and is
--      covered by the same double-booking guarantee, which is scoped to kaynak IS NOT NULL — migration 116).
begin;
set local lock_timeout = '4s';

-- 1 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_on_buro_ayarlari (
  doctor_id uuid primary key references auth.users(id) on delete cascade,
  randevu_modu text not null default 'kapali' check (randevu_modu in ('kapali', 'onay', 'otomatik')),
  yanit_acik boolean not null default false,
  bilgi jsonb not null default '{}'::jsonb check (jsonb_typeof(bilgi) = 'object' and pg_column_size(bilgi) <= 65536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_on_buro_ayarlari enable row level security;
revoke all on public.whatsapp_on_buro_ayarlari from anon, authenticated;
grant select on public.whatsapp_on_buro_ayarlari to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'whatsapp_on_buro_ayarlari' and policyname = 'doktor kendi on buro ayari') then
    create policy "doktor kendi on buro ayari" on public.whatsapp_on_buro_ayarlari
      for select to authenticated using (doctor_id = auth.uid());
  end if;
end $$;

-- 2 + 3 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare c record;
begin
  if to_regclass('public.whatsapp_yanitlar') is not null then
    alter table public.whatsapp_yanitlar add column if not exists on_buro jsonb;
    for c in
      select conname from pg_constraint
      where conrelid = 'public.whatsapp_yanitlar'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%niyet %' and pg_get_constraintdef(oid) ilike '%yeniden_planla%'
    loop
      execute format('alter table public.whatsapp_yanitlar drop constraint %I', c.conname);
    end loop;
    alter table public.whatsapp_yanitlar add constraint whatsapp_yanitlar_niyet_check
      check (niyet in ('onay', 'iptal', 'yeniden_planla', 'soru', 'vazgec', 'diger', 'randevu'));
    -- The desk query of the Ön büro fısıltısı and the open-step lookup of a conversation (one doctor, one number, newest first).
    create index if not exists whatsapp_yanitlar_on_buro_idx on public.whatsapp_yanitlar (doctor_id, karsi_taraf_hash, created_at desc);
  end if;
end $$;

-- 4 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.randevular') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'randevular' and column_name = 'kaynak') then
    alter table public.randevular drop constraint if exists randevular_kaynak_check;
    alter table public.randevular add constraint randevular_kaynak_check check (kaynak is null or kaynak in ('portal', 'whatsapp')) not valid;
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('195', '195_whatsapp_on_buro.sql', null, now(), false,
  'WHATSAPP-ONBURO-01: Ayşe ön büro — per-doctor front-desk settings + practice sheet, card state column, niyet randevu, kaynak whatsapp')
on conflict (version) do nothing;

commit;
