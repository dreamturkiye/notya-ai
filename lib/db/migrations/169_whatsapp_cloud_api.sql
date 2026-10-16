-- 169 — WHATSAPP-API-01 (2026-10-16): WhatsApp Business Cloud API, full loop on top of 097 / 103.
--
-- WRITTEN ONLY — NOT APPLIED by the agent that wrote it. Idempotent and ADDITIVE: no existing column or row changes.
-- Until it is applied the code fails closed: no WhatsApp message is sent (no audit trail = no send), the inbound reply
-- pipeline is silent, the card keeps working for the connection state of 097.
--
-- What is new
--   1) doktor_whatsapp_baglantilari  + quality rating, messaging tier, health timestamp, KVKK consent timestamp.
--      (waba_id / phone_number_id stay plain: Meta business identifiers, not patient data, and the webhook has to
--       find the doctor BY phone_number_id. The access token stays encrypted — token_encrypted, AES-256-GCM.)
--   2) whatsapp_mesaj_gunlugu        APPEND-ONLY audit log of every inbound / outbound message and every connection
--                                    or automatic-action event (KVKK). Bodies encrypted; the counterpart is a keyed hash.
--   3) whatsapp_yanitlar             patient replies as structured events ("Gelen Yanıtlar" inbox).
--   4) whatsapp_kota_saatlik         rolling 24h send counter per doctor (Meta messaging tiers: 250 / 1K / 10K / 100K).
--      + whatsapp_kota_al / _iade    atomic reserve / release (advisory lock per doctor).
--   5) whatsapp_gunluk_imha          the ONLY way to purge the audit log (retention, 2 years — see /kvkk).
--
-- ISOLATION: own-row policy + the RESTRICTIVE patient-ownership policy of 052 / 103 / 168. Server code uses the
-- service role (RLS bypassed on purpose) and scopes every query by doctor_id; RLS is the second line.

-- ── 1) Connection: quality, tier, consent ─────────────────────────────────────────────────────────────
alter table public.doktor_whatsapp_baglantilari add column if not exists kalite_puani text;
alter table public.doktor_whatsapp_baglantilari add column if not exists mesaj_limiti_tier text;
alter table public.doktor_whatsapp_baglantilari add column if not exists saglik_guncellendi timestamptz;
alter table public.doktor_whatsapp_baglantilari add column if not exists kvkk_onay_at timestamptz;
alter table public.doktor_whatsapp_baglantilari add column if not exists kvkk_onay_surum text;
alter table public.doktor_whatsapp_baglantilari add column if not exists uyari_at timestamptz;

-- ── 2) Audit log (append-only) ────────────────────────────────────────────────────────────────────────
-- No foreign keys on purpose: the trail must outlive a deleted patient / disconnected number (same reasoning as 168).
-- `ayrinti` carries ids, intent labels and flags ONLY — never a name, a phone number or message text.
create table if not exists public.whatsapp_mesaj_gunlugu (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid,
  yon text not null check (yon in ('gelen', 'giden', 'olay')),
  tur text not null check (char_length(tur) between 1 and 40),
  durum text not null check (durum in ('deneniyor', 'gonderildi', 'basarisiz', 'belirsiz', 'alindi', 'olay')),
  wamid text,
  kaynak_wamid text,
  idem_anahtar text check (idem_anahtar is null or char_length(idem_anahtar) <= 200),
  karsi_taraf_hash text,
  sablon_kodu text,
  govde_encrypted text,
  hata_kodu text,
  ayrinti jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_mesaj_gunlugu_doktor_idx on public.whatsapp_mesaj_gunlugu (doctor_id, created_at desc);
create index if not exists whatsapp_mesaj_gunlugu_wamid_idx on public.whatsapp_mesaj_gunlugu (doctor_id, wamid) where wamid is not null;
-- Idempotent send: one "deneniyor" (attempt) row per (doctor, key). A second attempt with the same key is refused.
create unique index if not exists whatsapp_mesaj_gunlugu_idem_idx
  on public.whatsapp_mesaj_gunlugu (doctor_id, idem_anahtar)
  where yon = 'giden' and durum = 'deneniyor' and idem_anahtar is not null;
-- A delivered inbound message is logged once.
create unique index if not exists whatsapp_mesaj_gunlugu_gelen_idx
  on public.whatsapp_mesaj_gunlugu (doctor_id, wamid)
  where yon = 'gelen' and wamid is not null;

create or replace function public.whatsapp_mesaj_gunlugu_degismez() returns trigger
language plpgsql as $$
begin
  -- Only whatsapp_gunluk_imha() (retention) sets this transaction-local flag.
  if tg_op = 'DELETE' and coalesce(current_setting('notya.whatsapp_imha', true), '') = 'on' then
    return old;
  end if;
  raise exception 'whatsapp_mesaj_gunlugu is append-only (% blocked)', tg_op;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_whatsapp_mesaj_gunlugu_degismez') then
    create trigger trg_whatsapp_mesaj_gunlugu_degismez
      before update or delete on public.whatsapp_mesaj_gunlugu
      for each row execute function public.whatsapp_mesaj_gunlugu_degismez();
  end if;
end $$;

-- Retention: rows older than p_oncesi. Returns the number of rows removed. Service role only.
create or replace function public.whatsapp_gunluk_imha(p_oncesi timestamptz) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_adet bigint;
begin
  if p_oncesi is null or p_oncesi > now() - interval '1 year' then
    raise exception 'whatsapp_gunluk_imha: retention cutoff must be at least one year in the past';
  end if;
  perform set_config('notya.whatsapp_imha', 'on', true);
  delete from public.whatsapp_mesaj_gunlugu where created_at < p_oncesi;
  get diagnostics v_adet = row_count;
  perform set_config('notya.whatsapp_imha', 'off', true);
  return v_adet;
end $$;

-- ── 3) Patient replies (the inbox) ────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_yanitlar (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  randevu_id uuid references public.randevular(id) on delete set null,
  wamid text not null,
  karsi_taraf_hash text not null,
  -- E.164 digits, encrypted: needed to answer a sender who is not (or not uniquely) a patient record.
  karsi_taraf_encrypted text,
  govde_encrypted text,
  tip text,
  niyet text not null check (niyet in ('onay', 'iptal', 'yeniden_planla', 'soru', 'vazgec', 'diger')),
  niyet_kaynagi text not null default 'kural' check (niyet_kaynagi in ('kural', 'yapay_zeka', 'varsayilan')),
  eslesme text not null default 'bilinmeyen',
  durum text not null default 'yeni' check (durum in ('yeni', 'goruldu', 'islendi')),
  -- what the system already did on its own: randevu_onaylandi | randevu_iptal | vazgec_uygulandi | slot_onerildi
  otomatik_eylem text,
  eylem_sonucu text,
  onerilen_slotlar jsonb,
  secilen_slot timestamptz,
  islendi_at timestamptz,
  islenen_user_id uuid,
  created_at timestamptz not null default now(),
  unique (doctor_id, wamid)
);

create index if not exists whatsapp_yanitlar_gelen_idx on public.whatsapp_yanitlar (doctor_id, durum, created_at desc);

-- ── 4) Rolling 24h counter (Meta messaging tiers) ─────────────────────────────────────────────────────
create table if not exists public.whatsapp_kota_saatlik (
  doctor_id uuid not null,
  saat timestamptz not null,
  adet integer not null default 0 check (adet >= 0),
  primary key (doctor_id, saat)
);

-- Reserve one send. Counts every hour bucket whose END is within the last 24h (conservative: never undercounts).
create or replace function public.whatsapp_kota_al(p_doctor uuid, p_limit integer) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_toplam integer;
  v_saat timestamptz := date_trunc('hour', now());
begin
  if p_doctor is null or p_limit is null or p_limit < 1 then
    return jsonb_build_object('ok', false, 'kullanilan', 0);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('wa_kota:' || p_doctor::text, 0));
  select coalesce(sum(adet), 0) into v_toplam
    from public.whatsapp_kota_saatlik
   where doctor_id = p_doctor and saat + interval '1 hour' > now() - interval '24 hours';
  if v_toplam >= p_limit then
    return jsonb_build_object('ok', false, 'kullanilan', v_toplam);
  end if;
  insert into public.whatsapp_kota_saatlik (doctor_id, saat, adet) values (p_doctor, v_saat, 1)
  on conflict (doctor_id, saat) do update set adet = public.whatsapp_kota_saatlik.adet + 1;
  return jsonb_build_object('ok', true, 'kullanilan', v_toplam + 1);
end $$;

-- Give back a reservation when Meta refused the message before accepting it.
create or replace function public.whatsapp_kota_iade(p_doctor uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('wa_kota:' || p_doctor::text, 0));
  update public.whatsapp_kota_saatlik set adet = adet - 1
   where doctor_id = p_doctor
     and saat = (select max(saat) from public.whatsapp_kota_saatlik where doctor_id = p_doctor and adet > 0);
end $$;

-- ── 5) RLS ────────────────────────────────────────────────────────────────────────────────────────────
alter table public.whatsapp_mesaj_gunlugu enable row level security;
alter table public.whatsapp_yanitlar enable row level security;
alter table public.whatsapp_kota_saatlik enable row level security;

-- Browser roles never write these tables; the server (service role) does. Read access is own-row only.
revoke all on public.whatsapp_mesaj_gunlugu from anon, authenticated;
revoke all on public.whatsapp_yanitlar from anon, authenticated;
revoke all on public.whatsapp_kota_saatlik from anon, authenticated;
grant select on public.whatsapp_mesaj_gunlugu to authenticated;
grant select on public.whatsapp_yanitlar to authenticated;
grant select on public.whatsapp_kota_saatlik to authenticated;

revoke all on function public.whatsapp_kota_al(uuid, integer) from public, anon, authenticated;
revoke all on function public.whatsapp_kota_iade(uuid) from public, anon, authenticated;
revoke all on function public.whatsapp_gunluk_imha(timestamptz) from public, anon, authenticated;
grant execute on function public.whatsapp_kota_al(uuid, integer) to service_role;
grant execute on function public.whatsapp_kota_iade(uuid) to service_role;
grant execute on function public.whatsapp_gunluk_imha(timestamptz) to service_role;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'whatsapp_mesaj_gunlugu' and policyname = 'doktor kendi whatsapp gunlugu') then
    create policy "doktor kendi whatsapp gunlugu" on public.whatsapp_mesaj_gunlugu
      for select to authenticated using (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'whatsapp_mesaj_gunlugu' and policyname = 'hasta_izolasyon_hasta_sahipligi') then
    create policy hasta_izolasyon_hasta_sahipligi on public.whatsapp_mesaj_gunlugu as restrictive for all to authenticated, anon
      using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
      with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'whatsapp_yanitlar' and policyname = 'doktor kendi whatsapp yanitlari') then
    create policy "doktor kendi whatsapp yanitlari" on public.whatsapp_yanitlar
      for select to authenticated using (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'whatsapp_yanitlar' and policyname = 'hasta_izolasyon_hasta_sahipligi') then
    create policy hasta_izolasyon_hasta_sahipligi on public.whatsapp_yanitlar as restrictive for all to authenticated, anon
      using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
      with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'whatsapp_kota_saatlik' and policyname = 'doktor kendi whatsapp kotasi') then
    create policy "doktor kendi whatsapp kotasi" on public.whatsapp_kota_saatlik
      for select to authenticated using (doctor_id = auth.uid());
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('169', '169_whatsapp_cloud_api.sql', null, now(), false,
  'WHATSAPP-API-01: append-only whatsapp_mesaj_gunlugu, whatsapp_yanitlar inbox, rolling 24h tier counter, connection quality/tier/consent columns')
on conflict (version) do nothing;

-- Rollback (manual, never automatic):
--   drop function if exists public.whatsapp_gunluk_imha(timestamptz); drop function if exists public.whatsapp_kota_iade(uuid);
--   drop function if exists public.whatsapp_kota_al(uuid, integer); drop table if exists public.whatsapp_kota_saatlik;
--   drop table if exists public.whatsapp_yanitlar; drop table if exists public.whatsapp_mesaj_gunlugu;
--   alter table public.doktor_whatsapp_baglantilari drop column if exists kalite_puani, drop column if exists mesaj_limiti_tier, ...
