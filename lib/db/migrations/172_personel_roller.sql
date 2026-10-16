-- ============================================================
-- Migration 172: personel rolleri (sekreter / asistan / hasta_danismani) + rol değişikliği denetim günlüğü
-- ============================================================
-- MOBIL-PERSONEL-01 (Pediatri Beta Audit item 2b). Idempotent: safe to run twice. NOT applied by the author —
-- the lead applies it to production and to the six country projects (us, gb, ca, au, nz, uz).
--
--  1) personel.rol CHECK widened: 'sekreter' (unchanged) + 'asistan' (klinik yardımcı / hemşire)
--     + 'hasta_danismani' (hasta danışmanı). Existing rows are all 'sekreter' and stay that way.
--  2) randevu_olaylari.yapan CHECK widened so a hasta_danismani acting on a portal appointment request can be logged.
--  3) The RLS policies that today admit "any active personel" are narrowed to the roles that may use them.
--     Server routes use the service role and enforce the same matrix in application code
--     (lib/doktor/personelYetki.ts); this is the second line for direct PostgREST access.
--       iletisim_kuyrugu / iletisim_kayitlari : sekreter + hasta_danismani (payment reminders: sekreter only)
--       iletisim_izin_kayitlari               : sekreter + hasta_danismani
--       gelen_belgeler                        : sekreter only (and only while the doctor's switch is on)
--       hasta_iletisim_kampanyalari/_alicilari: sekreter only (bulk campaigns)
--     asistan gets NO direct-table policy (it reads through the API only).
--  4) personel_rol_gecmisi — append-only log of invites, role changes, (de)activations and removals.
--     Written by the API routes (actor known) and by a trigger for direct, non-service-role changes.

-- ── 1) personel.rol ──────────────────────────────────────────────────────────────────────────────────
do $$
declare c record;
begin
  -- drop whatever CHECK currently constrains personel.rol (008 created it inline, so the name is generated)
  for c in
    select conname from pg_constraint
    where conrelid = 'public.personel'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%rol%'
  loop
    execute format('alter table public.personel drop constraint %I', c.conname);
  end loop;
  alter table public.personel
    add constraint personel_rol_check check (rol in ('sekreter', 'asistan', 'hasta_danismani'));
end $$;

-- ── 2) randevu_olaylari.yapan ────────────────────────────────────────────────────────────────────────
do $$
declare c record;
begin
  if to_regclass('public.randevu_olaylari') is null then return; end if;
  for c in
    select conname from pg_constraint
    where conrelid = 'public.randevu_olaylari'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%yapan%'
  loop
    execute format('alter table public.randevu_olaylari drop constraint %I', c.conname);
  end loop;
  alter table public.randevu_olaylari
    add constraint randevu_olaylari_yapan_check
    check (yapan in ('hasta', 'doktor', 'sekreter', 'asistan', 'hasta_danismani', 'sistem'));
end $$;

-- ── 3) narrow the staff RLS policies by role ─────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.iletisim_kuyrugu') is not null then
    drop policy if exists "personel_randevu_kuyrugu" on public.iletisim_kuyrugu;
    create policy "personel_randevu_kuyrugu" on public.iletisim_kuyrugu for all
      using (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu', 'odeme_hatirlatma')
             and exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kuyrugu.doctor_id
                         and (pe.rol = 'sekreter' or (pe.rol = 'hasta_danismani' and iletisim_kuyrugu.tur <> 'odeme_hatirlatma'))))
      with check (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu', 'odeme_hatirlatma')
             and exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kuyrugu.doctor_id
                         and (pe.rol = 'sekreter' or (pe.rol = 'hasta_danismani' and iletisim_kuyrugu.tur <> 'odeme_hatirlatma'))));
  end if;

  if to_regclass('public.iletisim_kayitlari') is not null then
    drop policy if exists "personel_randevu_kayitlari" on public.iletisim_kayitlari;
    create policy "personel_randevu_kayitlari" on public.iletisim_kayitlari for all
      using (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu', 'odeme_hatirlatma')
             and exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kayitlari.doctor_id
                         and (pe.rol = 'sekreter' or (pe.rol = 'hasta_danismani' and iletisim_kayitlari.tur <> 'odeme_hatirlatma'))))
      with check (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu', 'odeme_hatirlatma')
             and exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kayitlari.doctor_id
                         and (pe.rol = 'sekreter' or (pe.rol = 'hasta_danismani' and iletisim_kayitlari.tur <> 'odeme_hatirlatma'))));
  end if;

  if to_regclass('public.iletisim_izin_kayitlari') is not null then
    drop policy if exists "personel_izin_kayitlari" on public.iletisim_izin_kayitlari;
    create policy "personel_izin_kayitlari" on public.iletisim_izin_kayitlari for all
      using (exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_izin_kayitlari.doctor_id
                     and pe.rol in ('sekreter', 'hasta_danismani')))
      with check (exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_izin_kayitlari.doctor_id
                     and pe.rol in ('sekreter', 'hasta_danismani')));
  end if;

  if to_regclass('public.gelen_belgeler') is not null then
    drop policy if exists "personel_gelen_belgeler" on public.gelen_belgeler;
    create policy "personel_gelen_belgeler" on public.gelen_belgeler for all
      using (exists (select 1 from public.personel pe join public.users u on u.id = pe.doktor_id
                     where pe.user_id = auth.uid() and pe.aktif and pe.rol = 'sekreter'
                       and pe.doktor_id = gelen_belgeler.doctor_id and u.gelen_belge_sekreter))
      with check (exists (select 1 from public.personel pe join public.users u on u.id = pe.doktor_id
                     where pe.user_id = auth.uid() and pe.aktif and pe.rol = 'sekreter'
                       and pe.doktor_id = gelen_belgeler.doctor_id and u.gelen_belge_sekreter));
  end if;

  if to_regclass('public.hasta_iletisim_kampanyalari') is not null then
    drop policy if exists "pratik_erisimi" on public.hasta_iletisim_kampanyalari;
    create policy "pratik_erisimi" on public.hasta_iletisim_kampanyalari for all
      using (doctor_id = auth.uid() or exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.rol = 'sekreter' and pe.doktor_id = hasta_iletisim_kampanyalari.doctor_id))
      with check (doctor_id = auth.uid() or exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.rol = 'sekreter' and pe.doktor_id = hasta_iletisim_kampanyalari.doctor_id));
  end if;
  if to_regclass('public.hasta_iletisim_kampanya_alicilari') is not null then
    drop policy if exists "pratik_erisimi" on public.hasta_iletisim_kampanya_alicilari;
    create policy "pratik_erisimi" on public.hasta_iletisim_kampanya_alicilari for all
      using (doctor_id = auth.uid() or exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.rol = 'sekreter' and pe.doktor_id = hasta_iletisim_kampanya_alicilari.doctor_id))
      with check (doctor_id = auth.uid() or exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.rol = 'sekreter' and pe.doktor_id = hasta_iletisim_kampanya_alicilari.doctor_id));
  end if;
end $$;

-- ── 4) personel_rol_gecmisi: append-only audit log ───────────────────────────────────────────────────
create table if not exists public.personel_rol_gecmisi (
  id uuid primary key default gen_random_uuid(),
  doktor_id uuid not null references auth.users(id) on delete cascade,
  -- no FK to personel on purpose: the log must outlive a removed staff member
  personel_id uuid not null,
  personel_email text,
  olay text not null check (olay in ('davet', 'rol_degisti', 'aktiflik_degisti', 'kaldirildi')),
  eski_rol text,
  yeni_rol text,
  eski_aktif boolean,
  yeni_aktif boolean,
  -- the doctor (or the DB user) who did it: set by the API routes; for a direct PostgREST change, auth.uid()
  yapan_id uuid,
  kaynak text not null default 'api' check (kaynak in ('api', 'dogrudan')),
  created_at timestamptz not null default now()
);
create index if not exists idx_personel_rol_gecmisi_doktor on public.personel_rol_gecmisi (doktor_id, created_at desc);

create or replace function public.personel_rol_gecmisi_salt_ekle() returns trigger
language plpgsql as $$
begin
  -- pg_trigger_depth() > 1 → inside the FK cascade of an auth.users delete (account erasure)
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'personel_rol_gecmisi is append-only';
end $$;

drop trigger if exists trg_personel_rol_gecmisi_salt_ekle on public.personel_rol_gecmisi;
create trigger trg_personel_rol_gecmisi_salt_ekle
  before update or delete on public.personel_rol_gecmisi
  for each row execute function public.personel_rol_gecmisi_salt_ekle();

alter table public.personel_rol_gecmisi enable row level security;
do $$
begin
  -- the doctor reads their own staff history; nobody writes through PostgREST (API routes use the service role)
  if not exists (select 1 from pg_policies where tablename = 'personel_rol_gecmisi' and policyname = 'doktor_kendi_personel_gecmisi') then
    create policy "doktor_kendi_personel_gecmisi" on public.personel_rol_gecmisi
      for select to authenticated using (doktor_id = auth.uid());
  end if;
end $$;

-- Safety net: a role / activation change made DIRECTLY by an authenticated client (auth.uid() is set, i.e. not
-- the service role) is logged here. API changes are logged by the route, which knows the actor.
create or replace function public.personel_rol_denetim() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' and (new.rol is distinct from old.rol) then
    insert into public.personel_rol_gecmisi (doktor_id, personel_id, personel_email, olay, eski_rol, yeni_rol, yapan_id, kaynak)
    values (new.doktor_id, new.id, new.email, 'rol_degisti', old.rol, new.rol, auth.uid(), 'dogrudan');
  elsif tg_op = 'UPDATE' and (new.aktif is distinct from old.aktif) then
    insert into public.personel_rol_gecmisi (doktor_id, personel_id, personel_email, olay, eski_aktif, yeni_aktif, yapan_id, kaynak)
    values (new.doktor_id, new.id, new.email, 'aktiflik_degisti', old.aktif, new.aktif, auth.uid(), 'dogrudan');
  elsif tg_op = 'DELETE' then
    insert into public.personel_rol_gecmisi (doktor_id, personel_id, personel_email, olay, eski_rol, yapan_id, kaynak)
    values (old.doktor_id, old.id, old.email, 'kaldirildi', old.rol, auth.uid(), 'dogrudan');
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_personel_rol_denetim on public.personel;
create trigger trg_personel_rol_denetim
  after update or delete on public.personel
  for each row execute function public.personel_rol_denetim();

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('172', '172_personel_roller.sql', null, now(), false,
  'MOBIL-PERSONEL-01: personel.rol sekreter/asistan/hasta_danismani, randevu_olaylari.yapan widened, staff RLS narrowed per role, append-only personel_rol_gecmisi')
on conflict (version) do nothing;

-- Rollback (manual, never automatic; only valid while no asistan / hasta_danismani rows exist):
--   alter table public.personel drop constraint personel_rol_check;
--   alter table public.personel add constraint personel_rol_check check (rol in ('sekreter'));
--   drop trigger if exists trg_personel_rol_denetim on public.personel; drop table if exists public.personel_rol_gecmisi;
--   (the narrowed RLS policies in section 3 are stricter than before; re-run 095/099/157/166 policy sections to restore)
