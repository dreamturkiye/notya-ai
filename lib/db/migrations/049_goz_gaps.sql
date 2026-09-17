-- GOZ-GAPS (2026-09-17): dry-eye structured record + glokom optional TOD/EGS interval hints stay in app code.
create table if not exists goz_kuru_goz (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null,
  tarih date not null default (timezone('Europe/Istanbul', now()))::date,
  osdi numeric(5,1),
  schirmer_sag numeric(5,1),
  schirmer_sol numeric(5,1),
  tbut_sag numeric(5,1),
  tbut_sol numeric(5,1),
  not_hekim text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists goz_kuru_goz_idx on goz_kuru_goz (patient_id, tarih desc);

do $$
declare t text;
begin
  foreach t in array array['goz_kuru_goz'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
exception when others then null;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('049', '049_goz_gaps.sql', null, now(), false, 'Göz gaps: goz_kuru_goz (OSDI/Schirmer/TBUT)')
on conflict (version) do nothing;
