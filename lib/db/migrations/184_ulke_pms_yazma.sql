-- 184 AU-GAP-CLOSE-02 — PMS credential vault + write-back outbox (Best Practice / Genie / Gentu).
-- Honest scaffold: credentials may be stored encrypted; a queue row may be prepared. Nothing is marked
-- "synced" and no partner API is called until NOTYA_PMS_<VENDOR>_ETKIN=1 AND a real adapter exists.
-- Server only: no select policy for browser roles. Country-generic tables.

begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 184 refused: public.ulke_hesaplari is missing. Not a country database.';
  end if;
end $$;

create table if not exists public.ulke_pms_baglantilari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  saglayici text not null check (saglayici in ('best-practice', 'genie', 'gentu')),
  -- kimlik-kayitli = doctor saved credentials; partner-bekleniyor = adapter not live; dogrulanamadi = check failed.
  -- NEVER 'senkron' / 'synced'.
  baglanti_durum text not null default 'kimlik-kayitli'
    check (baglanti_durum in ('kimlik-kayitli', 'partner-bekleniyor', 'dogrulanamadi')),
  kimlik_encrypted text not null check (char_length(kimlik_encrypted) > 0),
  son_dort text check (son_dort is null or char_length(son_dort) between 2 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_pms_baglantilari_tekil unique (ulke, doctor_id, saglayici),
  constraint ulke_pms_baglantilari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);
create index if not exists ulke_pms_baglantilari_hekim_idx on public.ulke_pms_baglantilari (ulke, doctor_id);

create table if not exists public.ulke_pms_yazma_kuyrugu (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  note_id uuid not null,
  hedef text not null check (hedef in ('best-practice', 'genie', 'gentu')),
  paket_surum text not null check (char_length(paket_surum) between 1 and 40),
  govde_encrypted text not null check (char_length(govde_encrypted) > 0),
  -- bekliyor = queued; hazirlandi = payload ready; gonderildi reserved for real adapter ack only;
  -- hata / iptal. Worker must NOT set gonderildi while partner flag is off.
  durum text not null default 'bekliyor'
    check (durum in ('bekliyor', 'hazirlandi', 'gonderildi', 'hata', 'iptal')),
  hata_kodu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_pms_yazma_kuyrugu_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);
create index if not exists ulke_pms_yazma_kuyrugu_hekim_idx on public.ulke_pms_yazma_kuyrugu (ulke, doctor_id, durum, created_at desc);
create index if not exists ulke_pms_yazma_kuyrugu_not_idx on public.ulke_pms_yazma_kuyrugu (ulke, doctor_id, note_id);

alter table public.ulke_pms_baglantilari enable row level security;
alter table public.ulke_pms_yazma_kuyrugu enable row level security;
revoke all on table public.ulke_pms_baglantilari from anon, authenticated;
revoke all on table public.ulke_pms_yazma_kuyrugu from anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('184', '184_ulke_pms_yazma.sql', null, now(), false,
  'AU-GAP-CLOSE-02: PMS credential vault + write-back outbox. No fake Synced state.')
on conflict (version) do nothing;

commit;
