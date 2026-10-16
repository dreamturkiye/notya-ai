-- 166 — NOTYA-HASTA-ILETISIMI-01 (Kaan, 2026-10-16): Hasta İletişimi (toplu mesaj) — UNIVERSAL,
-- every branş + Klinik, doktor AND personel (sekreter) full access.
--
-- Reuses 095_iletisim.sql as-is: same consent columns/history table, same contact-log table, same
-- pratikOturum() permission model. This migration only ADDS:
--   1) a third channel, SMS, to the existing per-channel consent model (patients.iletisim_izni_sms,
--      kanal CHECK widened) — captured at intake exactly like whatsapp/eposta already are.
--   2) 'vazgecme' as a consent-history kaynak — an unsubscribe link (e-posta) or a STOP/DUR reply
--      (SMS) flips the SAME consent column to false, which is what every send already gates on:
--      opt-out is enforced at the query layer, not a UI checkbox that a retry could bypass.
--   3) patients.etiketler — free-form tags for the bulk audience filter (specialty, last visit and
--      age range are computed from existing columns; tags are the one new filter dimension).
--   4) the doctor's own SMS-gateway connection (NOT Twilio — see lib/iletisim/sms/README.md):
--      iletisim_sms_ayarlari, one row per doctor, same "doctor's own account" shape as 096/097.
--   5) hasta_iletisim_kampanyalari / _alicilari — the bulk send itself and its per-recipient log.
--      Idempotency: unique(doctor_id, idempotency_key) on the campaign, unique(kampanya_id,
--      patient_id, kanal) on the recipient row — a retried or double-submitted send can insert the
--      same recipient row at most once, so the dispatcher's "already logged → skip" check (not a
--      race-prone read-then-write) is what actually blocks a double message.
--
-- ADDITIVE ONLY, additive CHECK widenings via drop+recreate (same values plus new ones — no data
-- loss). Idempotent. Fails soft until applied (lib/iletisim/toplu reads treat a missing table as
-- "feature off", same convention as 095).

-- ── 1) Third channel: SMS consent (same shape as whatsapp/eposta, 095 §1) ───────────────────────
alter table patients add column if not exists iletisim_izni_sms boolean;
alter table patients add column if not exists etiketler text[] not null default '{}';
create index if not exists patients_etiketler_idx on patients using gin (etiketler);

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'iletisim_izin_kayitlari_kanal_check') then
    alter table iletisim_izin_kayitlari drop constraint iletisim_izin_kayitlari_kanal_check;
  end if;
  alter table iletisim_izin_kayitlari add constraint iletisim_izin_kayitlari_kanal_check
    check (kanal in ('whatsapp', 'eposta', 'sms', 'gelen_belge'));

  if exists (select 1 from pg_constraint where conname = 'iletisim_izin_kayitlari_kaynak_check') then
    alter table iletisim_izin_kayitlari drop constraint iletisim_izin_kayitlari_kaynak_check;
  end if;
  alter table iletisim_izin_kayitlari add constraint iletisim_izin_kayitlari_kaynak_check
    -- 'vazgecme' = unsubscribe link (eposta) or STOP/DUR SMS reply — the patient withdrew consent.
    check (kaynak in ('bilgi_formu', 'hasta_profili', 'gonder_dugmesi', 'vazgecme'));

  if exists (select 1 from pg_constraint where conname = 'iletisim_kayitlari_kanal_check') then
    alter table iletisim_kayitlari drop constraint iletisim_kayitlari_kanal_check;
  end if;
  alter table iletisim_kayitlari add constraint iletisim_kayitlari_kanal_check
    check (kanal in ('whatsapp', 'eposta', 'sms'));
end $$;

-- ── 2) Doctor's own SMS gateway connection ───────────────────────────────────────────────────────
-- NOT Twilio / any paid per-message API (Kaan's standing decision, docs/OPEN-COMMITMENTS.md
-- GOZ-SMS-RECALL / DERM-SMS-RECALL: "TWILIO_SMS_FROM yapılandırılmadığı için" — never configure it).
-- Pluggable: 'saglayici' names the adapter (lib/iletisim/sms/gonderici.ts registry); the one real
-- zero-cost adapter shipped now is 'android_sms_gateway' (github.com/capcom6/android-sms-gateway,
-- MIT) — an open-source app the doctor installs on their OWN Android phone/SIM, exposing a local
-- or free-tier-cloud HTTP endpoint this backend calls. Credentials are the doctor's own gateway
-- login, encrypted at rest (encryptPII), never returned to the browser.
create table if not exists iletisim_sms_ayarlari (
  doctor_id uuid primary key references auth.users(id) on delete cascade,
  saglayici text not null default 'android_sms_gateway' check (saglayici in ('android_sms_gateway')),
  taban_url text,
  kullanici_adi text,
  sifre_encrypted text,
  gonderen_numara text,
  webhook_sirri_encrypted text,
  aktif boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table iletisim_sms_ayarlari enable row level security;
do $$ begin
  create policy "hasta_izolasyon_kendi_satiri" on iletisim_sms_ayarlari for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ── 3) Bulk campaigns ─────────────────────────────────────────────────────────────────────────────
create table if not exists hasta_iletisim_kampanyalari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 200),
  olusturan_user_id uuid references auth.users(id) on delete set null,
  olusturan_personel_id uuid references personel(id) on delete set null,
  olusturan_rol text not null check (olusturan_rol in ('doktor', 'sekreter')),
  kanal text not null check (kanal in ('sms', 'eposta', 'ikisi')),
  konu text,
  govde text not null check (char_length(govde) between 1 and 2000),
  sablon_anahtari text,
  filtre jsonb not null default '{}'::jsonb,
  tetikleyici text not null default 'manuel' check (tetikleyici in ('manuel', 'asi_stok')),
  asi_stok_lot_id uuid references asi_stok_lotlari(id) on delete set null,
  hedef_sayisi integer not null default 0,
  durum text not null default 'taslak' check (durum in ('taslak', 'gonderiliyor', 'tamamlandi', 'basarisiz')),
  created_at timestamptz not null default now(),
  tamamlanan_at timestamptz,
  unique (doctor_id, idempotency_key)
);
create index if not exists hasta_iletisim_kampanyalari_doktor_idx on hasta_iletisim_kampanyalari (doctor_id, created_at desc);

create table if not exists hasta_iletisim_kampanya_alicilari (
  id uuid primary key default gen_random_uuid(),
  kampanya_id uuid not null references hasta_iletisim_kampanyalari(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  kanal text not null check (kanal in ('sms', 'eposta')),
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'gonderildi', 'basarisiz', 'atlandi')),
  atlama_sebebi text check (atlama_sebebi is null or atlama_sebebi in ('izin_yok', 'adres_yok', 'gonderici_yok')),
  hata text,
  saglayici_mesaj_id text,
  gonderildi_at timestamptz,
  created_at timestamptz not null default now(),
  -- THE idempotency guard: a retried/double-submitted execute can insert this row once per
  -- (campaign, patient, channel) — a second attempt hits unique_violation and the dispatcher
  -- treats that as "already handled", never as license to send again.
  unique (kampanya_id, patient_id, kanal)
);
create index if not exists hasta_iletisim_kampanya_alicilari_kampanya_idx on hasta_iletisim_kampanya_alicilari (kampanya_id);

alter table hasta_iletisim_kampanyalari enable row level security;
alter table hasta_iletisim_kampanya_alicilari enable row level security;
do $$
declare t text;
begin
  -- UNIVERSAL: unlike 095's iletisim_kuyrugu (sekreter restricted to PERSONEL_TURLERI), this
  -- feature is explicitly "doktor, asistan, and secretary all get full create-and-send access" —
  -- this codebase's one non-doctor practice role is `personel` (rol='sekreter'; there is no
  -- separate DB-level "asistan" role to reuse — see lib/iletisim/toplu/README.md), so doktor and
  -- any active personel of that doctor get the SAME full access here, no type restriction.
  foreach t in array array['hasta_iletisim_kampanyalari', 'hasta_iletisim_kampanya_alicilari'] loop
    begin
      execute format(
        'create policy "pratik_erisimi" on public.%I for all
           using (doctor_id = auth.uid() or exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = %I.doctor_id))
           with check (doctor_id = auth.uid() or exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = %I.doctor_id))',
        t, t, t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('166', '166_hasta_iletisimi_toplu.sql', null, now(), false,
  'NOTYA-HASTA-ILETISIMI-01: SMS consent channel + vazgecme kaynak + etiketler + iletisim_sms_ayarlari + hasta_iletisim_kampanyalari/_alicilari — universal (doktor + personel full access), idempotent campaign sends')
on conflict (version) do nothing;

-- DOĞRULAMA (salt-okunur):
--   select column_name from information_schema.columns where table_name = 'patients' and column_name in ('iletisim_izni_sms','etiketler');
--   select tablename, policyname from pg_policies where tablename like 'hasta_iletisim_%' or tablename = 'iletisim_sms_ayarlari';
