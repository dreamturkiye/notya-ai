-- 121 — NOTYA-TAKIP-01 (2026-10-04): durable practice follow-up cases (kontrol / gelmedi / konsültasyon).
-- Ops layer that coordinates doctor + sekreter + hasta portal + Hazır mesajlar — does NOT replace
-- branş kohort engines or lab plan-matching. Soft-fail until applied (lib/doktor/takip/*).
-- ADDITIVE only. Idempotent.

create table if not exists public.takip_isleri (
  id uuid primary key default gen_random_uuid(),
  doktor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  -- kontrol = visit follow-up window from approved note
  -- gelmedi = no-show callback (stays open across days)
  -- konsultasyon = open sevk / konsültasyon waiting for reply
  tur text not null check (tur in ('kontrol', 'gelmedi', 'konsultasyon')),
  durum text not null default 'acik' check (durum in ('acik', 'kapandi')),
  -- YYYY-MM-DD (TR calendar intent). Null for gelmedi (due immediately).
  vade date,
  kosullu boolean not null default false,
  kaynak_not_id uuid,
  kaynak_randevu_id uuid,
  kaynak_sevk_id uuid,
  -- Short practice-facing summary (may quote the doctor's plan clause). Never diagnosis codes.
  ozet text not null default '',
  alinti text,
  kapandi_at timestamptz,
  -- randevu | vizit | yanit | manuel | iptal | senkron
  kapandi_neden text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_takip_acik_doktor
  on public.takip_isleri (doktor_id, vade nulls first, created_at)
  where durum = 'acik';

create index if not exists idx_takip_acik_hasta
  on public.takip_isleri (doktor_id, patient_id)
  where durum = 'acik';

-- One open case per source row (re-open after close is a new row).
create unique index if not exists idx_takip_acik_kontrol_not
  on public.takip_isleri (doktor_id, kaynak_not_id)
  where durum = 'acik' and tur = 'kontrol' and kaynak_not_id is not null;

create unique index if not exists idx_takip_acik_gelmedi_rv
  on public.takip_isleri (doktor_id, kaynak_randevu_id)
  where durum = 'acik' and tur = 'gelmedi' and kaynak_randevu_id is not null;

create unique index if not exists idx_takip_acik_konsult_sevk
  on public.takip_isleri (doktor_id, kaynak_sevk_id)
  where durum = 'acik' and tur = 'konsultasyon' and kaynak_sevk_id is not null;

alter table public.takip_isleri enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'takip_isleri' and policyname = 'doktor kendi takip isleri') then
    create policy "doktor kendi takip isleri" on public.takip_isleri
      for all using (doktor_id = auth.uid()) with check (doktor_id = auth.uid());
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('121', '121_takip_isleri.sql', null, now(), false,
  'NOTYA-TAKIP-01: takip_isleri — kontrol / gelmedi / konsültasyon ops cases (doctor + desk + portal)')
on conflict (version) do nothing;
