-- 188 — BELGE-NO-01 / REFERANS-01 / HASTA-DISA-AKTAR-01 (Kaan, 2026-11-05). ONE FILE FOR ALL SEVEN DATABASES: Türkiye
-- (main; numbered 188 so that one number names one schema everywhere — 187 is the country databases' copy of Türkiye's
-- 186) and the six country databases (us, gb, ca, au, nz, uz). Every table carries `ulke` and every function takes
-- `p_ulke`: Türkiye passes 'tr'; a country build passes its own code through its one door (lib/ulke/uygulama/tablolar.ts
-- → ulkeIslevi). ADDITIVE and idempotent; no existing row changes.
--
-- 1) belgeler + belge_surumleri   DOCUMENT NUMBER AND REVISIONS of every printable report (CORE, all 40 branches). One
--                                 document per (country, doctor, type, source record); a version per printed content
--                                 (SHA-256 of its canonical content), a reason required from revision 1. VERSIONS ARE
--                                 IMMUTABLE: triggers refuse UPDATE, DELETE and TRUNCATE of belge_surumleri; a document
--                                 row may only move its current revision forward and is never deleted. The public
--                                 verify function returns NO patient data: number, revision, date, the doctor's title and
--                                 name, current or superseded, and the hash.
-- 2) referans_kodlari / referanslar / referans_odulleri   THE DOCTOR REFERRAL PROGRAMME (CORE). A per-doctor code
--                                 (NTY-XXXX); a referral is recorded at sign-up and never gates it; a reward is claimed
--                                 only when the referred doctor's first paid invoice arrives (lib/billing/referans.ts, the
--                                 Stripe webhook). One reward per side per referral (unique), at most 12 referrer rewards
--                                 in a rolling 365 days, self-referral refused (same account, same e-mail, same clinic;
--                                 the card fingerprint is compared in the webhook where Stripe has one).
-- 3) hasta_disa_aktarim_kaydet    every patient-record export written to audit_logs (who, when, which patient, format).
--
-- ISOLATION: every route uses the service role and checks the doctor first (hasta-izolasyon). RLS is ON for every new
-- table with own-row SELECT for the browser role only; anon has nothing; no browser role may write; the functions are
-- executable by the service role alone.

-- ── 1) Documents ─────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.belgeler (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  belge_no text not null unique check (belge_no ~ '^NTY-[0-9]{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$'),
  doctor_id uuid not null,
  patient_id uuid,
  tur text not null check (tur in ('muayene_raporu', 'epikriz', 'ameliyat_notu', 'usg_obstetrik', 'usg_jinekolojik', 'nst', 'dogum_epikrizi', 'gebelik_ozeti', 'onam', 'asi_onam', 'recete', 'tetkik_istem', 'hasta_raporu', 'konsultasyon', 'arac_kaydi', 'hasta_disa_aktarim', 'not')),
  kaynak_id text not null check (kaynak_id ~ '^[A-Za-z0-9:_-]{1,80}$'),
  guncel_rev integer not null default 0 check (guncel_rev >= 0),
  created_at timestamptz not null default now(),
  unique (ulke, doctor_id, tur, kaynak_id)
);
create index if not exists belgeler_doktor_hasta_idx on public.belgeler (ulke, doctor_id, patient_id);

create table if not exists public.belge_surumleri (
  id uuid primary key default gen_random_uuid(),
  belge_id uuid not null references public.belgeler(id) on delete restrict,
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  rev integer not null check (rev >= 0),
  olusturuldu_at timestamptz not null default now(),
  yazar_id uuid not null,
  gerekce text,
  hekim text not null check (char_length(hekim) between 1 and 160),
  icerik_ozeti text not null check (icerik_ozeti ~ '^[0-9a-f]{64}$'),
  dogrulama_kodu text not null unique check (dogrulama_kodu ~ '^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{12}$'),
  unique (belge_id, rev),
  check (rev = 0 or (gerekce is not null and char_length(btrim(gerekce)) between 3 and 500))
);

create or replace function public.belge_surumu_degismez() returns trigger language plpgsql as $$
begin
  raise exception 'belge_surumleri: a printed version is never changed or removed (BELGE-NO-01)' using errcode = 'P0001';
end $$;

create or replace function public.belge_basligi_koru() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'belgeler: a document is never removed (BELGE-NO-01)' using errcode = 'P0001';
  end if;
  if new.id <> old.id or new.ulke <> old.ulke or new.belge_no <> old.belge_no or new.doctor_id <> old.doctor_id
     or new.patient_id is distinct from old.patient_id or new.tur <> old.tur or new.kaynak_id <> old.kaynak_id
     or new.created_at <> old.created_at or new.guncel_rev < old.guncel_rev then
    raise exception 'belgeler: only the current revision may move forward (BELGE-NO-01)' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Triggers created only where absent (idempotent without a DROP).
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'belge_surumleri_degismez' and tgrelid = 'public.belge_surumleri'::regclass) then
    create trigger belge_surumleri_degismez before update or delete on public.belge_surumleri for each row execute function public.belge_surumu_degismez();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'belge_surumleri_bosaltilamaz' and tgrelid = 'public.belge_surumleri'::regclass) then
    create trigger belge_surumleri_bosaltilamaz before truncate on public.belge_surumleri for each statement execute function public.belge_surumu_degismez();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'belgeler_koru' and tgrelid = 'public.belgeler'::regclass) then
    create trigger belgeler_koru before update or delete on public.belgeler for each row execute function public.belge_basligi_koru();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'belgeler_bosaltilamaz' and tgrelid = 'public.belgeler'::regclass) then
    create trigger belgeler_bosaltilamaz before truncate on public.belgeler for each statement execute function public.belge_surumu_degismez();
  end if;
end $$;

create or replace function public.belge_surum_ekle(
  p_doctor_id uuid, p_patient_id uuid, p_tur text, p_kaynak_id text, p_ozet text, p_hekim text, p_gerekce text,
  p_belge_no text, p_kod text, p_ulke text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  b public.belgeler;
  s public.belge_surumleri;
  g text := nullif(btrim(coalesce(p_gerekce, '')), '');
begin
  if p_ulke is null or p_ulke !~ '^[a-z]{2}$' then raise exception 'belge_surum_ekle: country' using errcode = '22023'; end if;
  insert into public.belgeler (ulke, belge_no, doctor_id, patient_id, tur, kaynak_id)
    values (p_ulke, p_belge_no, p_doctor_id, p_patient_id, p_tur, p_kaynak_id)
    on conflict (ulke, doctor_id, tur, kaynak_id) do nothing;
  select * into b from public.belgeler
    where ulke = p_ulke and doctor_id = p_doctor_id and tur = p_tur and kaynak_id = p_kaynak_id for update;
  select * into s from public.belge_surumleri where belge_id = b.id and rev = b.guncel_rev;
  if found then
    if s.icerik_ozeti = p_ozet then
      return jsonb_build_object('durum', 'tamam', 'yeni', false, 'belge_no', b.belge_no, 'rev', s.rev, 'tarih', s.olusturuldu_at, 'kod', s.dogrulama_kodu, 'ozet', s.icerik_ozeti);
    end if;
    if g is null or char_length(g) < 3 then
      return jsonb_build_object('durum', 'gerekce_gerekli', 'belge_no', b.belge_no, 'rev', s.rev, 'tarih', s.olusturuldu_at, 'kod', s.dogrulama_kodu, 'ozet', s.icerik_ozeti);
    end if;
    insert into public.belge_surumleri (belge_id, ulke, rev, yazar_id, gerekce, hekim, icerik_ozeti, dogrulama_kodu)
      values (b.id, p_ulke, b.guncel_rev + 1, p_doctor_id, left(g, 500), left(p_hekim, 160), p_ozet, p_kod) returning * into s;
    update public.belgeler set guncel_rev = s.rev where id = b.id;
  else
    insert into public.belge_surumleri (belge_id, ulke, rev, yazar_id, gerekce, hekim, icerik_ozeti, dogrulama_kodu)
      values (b.id, p_ulke, 0, p_doctor_id, null, left(p_hekim, 160), p_ozet, p_kod) returning * into s;
  end if;
  return jsonb_build_object('durum', 'tamam', 'yeni', true, 'belge_no', b.belge_no, 'rev', s.rev, 'tarih', s.olusturuldu_at, 'kod', s.dogrulama_kodu, 'ozet', s.icerik_ozeti);
end $$;

create or replace function public.belge_dogrula(p_kod text, p_ulke text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('belge_no', b.belge_no, 'rev', v.rev, 'tarih', v.olusturuldu_at, 'hekim', v.hekim,
                            'guncel', v.rev = b.guncel_rev, 'guncel_rev', b.guncel_rev, 'ozet', v.icerik_ozeti)
  from public.belge_surumleri v join public.belgeler b on b.id = v.belge_id
  where v.dogrulama_kodu = p_kod and v.ulke = p_ulke and b.ulke = p_ulke
$$;

-- ── 2) Referrals ─────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.referans_kodlari (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  kod text not null unique check (kod ~ '^NTY-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$'),
  created_at timestamptz not null default now(),
  primary key (ulke, doctor_id)
);
create table if not exists public.referanslar (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  kod text not null,
  davet_eden_id uuid not null,
  davet_edilen_id uuid not null,
  durum text not null default 'kayitli' check (durum in ('kayitli', 'odendi', 'engellendi')),
  neden text check (neden is null or char_length(neden) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ulke, davet_edilen_id),
  check (davet_eden_id <> davet_edilen_id)
);
create index if not exists referanslar_davet_eden_idx on public.referanslar (ulke, davet_eden_id);
create table if not exists public.referans_odulleri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  referans_id uuid not null references public.referanslar(id) on delete restrict,
  taraf text not null check (taraf in ('davet_eden', 'davet_edilen')),
  doctor_id uuid not null,
  durum text not null check (durum in ('isleniyor', 'verildi', 'bekliyor', 'sinir', 'engellendi', 'basarisiz')),
  tutar integer check (tutar is null or tutar > 0),
  para_birimi text check (para_birimi is null or para_birimi ~ '^[a-z]{3}$'),
  stripe_islem_id text,
  neden text check (neden is null or char_length(neden) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (referans_id, taraf)
);
create index if not exists referans_odulleri_doktor_idx on public.referans_odulleri (ulke, doctor_id, durum, created_at);

-- Are two accounts in the same clinic (Türkiye: clinic_members; a country: ulke_klinik_uyeleri)? Tables that do not exist are skipped.
create or replace function public.referans_ayni_klinik(a uuid, b uuid, p_ulke text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare sonuc boolean := false;
begin
  if to_regclass('public.clinic_members') is not null then
    execute 'select exists (select 1 from public.clinic_members x join public.clinic_members y on y.clinic_id = x.clinic_id
             where x.user_id = $1 and y.user_id = $2 and coalesce(x.is_active, true) and coalesce(y.is_active, true))'
      into sonuc using a, b;
    if sonuc then return true; end if;
  end if;
  if to_regclass('public.ulke_klinik_uyeleri') is not null then
    execute 'select exists (select 1 from public.ulke_klinik_uyeleri x join public.ulke_klinik_uyeleri y on y.klinik_id = x.klinik_id and y.ulke = x.ulke
             where x.ulke = $3 and x.doctor_id = $1 and y.doctor_id = $2)'
      into sonuc using a, b, p_ulke;
  end if;
  return coalesce(sonuc, false);
end $$;

create or replace function public.referans_kodu_al(p_doctor_id uuid, p_aday text, p_ulke text) returns text
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if p_ulke is null or p_ulke !~ '^[a-z]{2}$' then raise exception 'referans_kodu_al: country' using errcode = '22023'; end if;
  insert into public.referans_kodlari (ulke, doctor_id, kod) values (p_ulke, p_doctor_id, p_aday) on conflict (ulke, doctor_id) do nothing;
  select kod into k from public.referans_kodlari where ulke = p_ulke and doctor_id = p_doctor_id;
  return k;
end $$;

-- At sign-up. Never refuses an account: it only answers what happened to the code.
create or replace function public.referans_kaydet(p_kod text, p_yeni_id uuid, p_ulke text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare sahip uuid; e1 text; e2 text;
begin
  if p_kod is null or p_kod !~ '^NTY-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$' then return 'gecersiz'; end if;
  select doctor_id into sahip from public.referans_kodlari where kod = p_kod and ulke = p_ulke;
  if sahip is null then return 'gecersiz'; end if;
  if sahip = p_yeni_id then return 'kendisi'; end if;
  select lower(email) into e1 from auth.users where id = sahip;
  select lower(email) into e2 from auth.users where id = p_yeni_id;
  if e1 is not null and e1 = e2 then return 'kendisi'; end if;
  if public.referans_ayni_klinik(sahip, p_yeni_id, p_ulke) then return 'ayni_klinik'; end if;
  insert into public.referanslar (ulke, kod, davet_eden_id, davet_edilen_id) values (p_ulke, p_kod, sahip, p_yeni_id)
    on conflict (ulke, davet_edilen_id) do nothing;
  return case when found then 'kaydedildi' else 'zaten' end;
end $$;

-- On a paid invoice of p_odeyen_id: claim the rewards that are due now. Returns the claimed rows (durum 'isleniyor').
create or replace function public.referans_odul_hazirla(p_odeyen_id uuid, p_ulke text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.referanslar; sayi integer;
begin
  update public.referanslar set durum = 'odendi', updated_at = now()
    where ulke = p_ulke and davet_edilen_id = p_odeyen_id and durum = 'kayitli' returning * into r;
  if found then
    if public.referans_ayni_klinik(r.davet_eden_id, r.davet_edilen_id, p_ulke) then
      update public.referanslar set durum = 'engellendi', neden = 'ayni_klinik', updated_at = now() where id = r.id;
      insert into public.referans_odulleri (ulke, referans_id, taraf, doctor_id, durum, neden) values
        (p_ulke, r.id, 'davet_edilen', r.davet_edilen_id, 'engellendi', 'ayni_klinik'),
        (p_ulke, r.id, 'davet_eden', r.davet_eden_id, 'engellendi', 'ayni_klinik') on conflict (referans_id, taraf) do nothing;
    else
      insert into public.referans_odulleri (ulke, referans_id, taraf, doctor_id, durum) values (p_ulke, r.id, 'davet_edilen', r.davet_edilen_id, 'isleniyor')
        on conflict (referans_id, taraf) do nothing;
      select count(*) into sayi from public.referans_odulleri
        where ulke = p_ulke and doctor_id = r.davet_eden_id and taraf = 'davet_eden' and durum in ('verildi', 'isleniyor', 'bekliyor') and created_at > now() - interval '365 days';
      insert into public.referans_odulleri (ulke, referans_id, taraf, doctor_id, durum, neden) values
        (p_ulke, r.id, 'davet_eden', r.davet_eden_id, case when sayi >= 12 then 'sinir' else 'isleniyor' end, case when sayi >= 12 then 'yillik_sinir' end)
        on conflict (referans_id, taraf) do nothing;
    end if;
  end if;
  -- A reward waiting for this doctor's own first payment, or one whose processing was interrupted, is claimed again.
  update public.referans_odulleri set durum = 'isleniyor', updated_at = now()
    where ulke = p_ulke and doctor_id = p_odeyen_id and (durum = 'bekliyor' or (durum = 'isleniyor' and updated_at < now() - interval '10 minutes'));
  return coalesce((
    select jsonb_agg(jsonb_build_object('odul_id', o.id, 'taraf', o.taraf, 'doctor_id', o.doctor_id, 'referans_id', o.referans_id,
                                        'karsi_id', case when o.taraf = 'davet_eden' then x.davet_edilen_id else x.davet_eden_id end))
    from public.referans_odulleri o join public.referanslar x on x.id = o.referans_id
    where o.ulke = p_ulke and o.durum = 'isleniyor' and o.updated_at > now() - interval '10 minutes'
      and (o.doctor_id = p_odeyen_id or x.davet_edilen_id = p_odeyen_id)
  ), '[]'::jsonb);
end $$;

create or replace function public.referans_odul_sonuc(p_odul_id uuid, p_durum text, p_tutar integer, p_para_birimi text, p_islem_id text, p_neden text, p_ulke text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_durum not in ('verildi', 'bekliyor', 'engellendi', 'basarisiz') then raise exception 'referans_odul_sonuc: state' using errcode = '22023'; end if;
  update public.referans_odulleri
    set durum = p_durum, tutar = p_tutar, para_birimi = lower(p_para_birimi), stripe_islem_id = p_islem_id, neden = left(p_neden, 60), updated_at = now()
    where id = p_odul_id and ulke = p_ulke and durum = 'isleniyor';
end $$;

create or replace function public.referans_ozeti(p_doctor_id uuid, p_ulke text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'kod', (select kod from public.referans_kodlari where ulke = p_ulke and doctor_id = p_doctor_id),
    'davet', (select count(*) from public.referanslar where ulke = p_ulke and davet_eden_id = p_doctor_id),
    'odeyen', (select count(*) from public.referanslar where ulke = p_ulke and davet_eden_id = p_doctor_id and durum = 'odendi'),
    'verilen', (select count(*) from public.referans_odulleri where ulke = p_ulke and doctor_id = p_doctor_id and durum = 'verildi'),
    'son12ay', (select count(*) from public.referans_odulleri where ulke = p_ulke and doctor_id = p_doctor_id and taraf = 'davet_eden' and durum = 'verildi' and created_at > now() - interval '365 days'),
    'bekleyen', (select count(*) from public.referans_odulleri where ulke = p_ulke and doctor_id = p_doctor_id and durum in ('bekliyor', 'isleniyor'))
  )
$$;

-- ── 3) Patient-record export: the audit row ──────────────────────────────────────────────────────────────────
create or replace function public.hasta_disa_aktarim_kaydet(p_doctor_id uuid, p_patient_id uuid, p_bicim text, p_ulke text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_bicim not in ('pdf', 'json') or p_ulke !~ '^[a-z]{2}$' then raise exception 'hasta_disa_aktarim_kaydet: input' using errcode = '22023'; end if;
  insert into public.audit_logs (user_id, action, resource_type, resource_id, new_values, success)
    values (p_doctor_id, 'export', 'hasta_disa_aktarim', p_patient_id, jsonb_build_object('bicim', p_bicim, 'ulke', p_ulke), true);
end $$;

-- ── 4) Row-level security, grants ────────────────────────────────────────────────────────────────────────────
alter table public.belgeler enable row level security;
alter table public.belge_surumleri enable row level security;
alter table public.referans_kodlari enable row level security;
alter table public.referanslar enable row level security;
alter table public.referans_odulleri enable row level security;
revoke all on public.belgeler, public.belge_surumleri, public.referans_kodlari, public.referanslar, public.referans_odulleri from anon, authenticated;
grant select on public.belgeler, public.belge_surumleri, public.referans_kodlari, public.referanslar, public.referans_odulleri to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'belgeler' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.belgeler for select to authenticated using (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'belge_surumleri' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.belge_surumleri for select to authenticated
      using (exists (select 1 from public.belgeler b where b.id = belge_id and b.doctor_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'referans_kodlari' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.referans_kodlari for select to authenticated using (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'referanslar' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.referanslar for select to authenticated using (davet_eden_id = auth.uid() or davet_edilen_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'referans_odulleri' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.referans_odulleri for select to authenticated using (doctor_id = auth.uid());
  end if;
end $$;

revoke all on function public.belge_surum_ekle(uuid, uuid, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.belge_dogrula(text, text) from public, anon, authenticated;
revoke all on function public.referans_ayni_klinik(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.referans_kodu_al(uuid, text, text) from public, anon, authenticated;
revoke all on function public.referans_kaydet(text, uuid, text) from public, anon, authenticated;
revoke all on function public.referans_odul_hazirla(uuid, text) from public, anon, authenticated;
revoke all on function public.referans_odul_sonuc(uuid, text, integer, text, text, text, text) from public, anon, authenticated;
revoke all on function public.referans_ozeti(uuid, text) from public, anon, authenticated;
revoke all on function public.hasta_disa_aktarim_kaydet(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.belge_surumu_degismez() from public, anon, authenticated;
revoke all on function public.belge_basligi_koru() from public, anon, authenticated;
grant execute on function public.belge_surum_ekle(uuid, uuid, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.belge_dogrula(text, text) to service_role;
grant execute on function public.referans_ayni_klinik(uuid, uuid, text) to service_role;
grant execute on function public.referans_kodu_al(uuid, text, text) to service_role;
grant execute on function public.referans_kaydet(text, uuid, text) to service_role;
grant execute on function public.referans_odul_hazirla(uuid, text) to service_role;
grant execute on function public.referans_odul_sonuc(uuid, text, integer, text, text, text, text) to service_role;
grant execute on function public.referans_ozeti(uuid, text) to service_role;
grant execute on function public.hasta_disa_aktarim_kaydet(uuid, uuid, text, text) to service_role;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('188', '188_belge_no_referans_disa_aktarim.sql', null, now(), false,
  'BELGE-NO-01: belgeler + belge_surumleri (immutable versions, verify without patient data); REFERANS-01: referans_kodlari/referanslar/referans_odulleri; HASTA-DISA-AKTAR-01: export audit function')
on conflict (version) do nothing;

-- Applied in four parts (188a tables, 188b functions, 188c triggers, 188d grants + ledger) on every project, the same content.
-- Rollback (manual, never automatic; the triggers must be dropped first, and printed versions are records):
--   drop function if exists public.hasta_disa_aktarim_kaydet, public.referans_ozeti, public.referans_odul_sonuc,
--     public.referans_odul_hazirla, public.referans_kaydet, public.referans_kodu_al, public.referans_ayni_klinik,
--     public.belge_dogrula, public.belge_surum_ekle;
--   drop table if exists public.referans_odulleri, public.referanslar, public.referans_kodlari;
--   (belgeler / belge_surumleri are kept: they back documents already printed)
