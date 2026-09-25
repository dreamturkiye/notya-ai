-- 095 — NOTYA-ILETISIM-01 (Kaan, 2026-09-25): one-tap email + WhatsApp from the doctor's OWN accounts.
--
-- Notya prepares a message and opens it in the sender's own WhatsApp / mail (wa.me, mailto:, Gmail web,
-- Outlook web); a human taps send. This migration stores only what that needs:
--   • patients.iletisim_izni_*    KVKK açık rıza per channel (randevu + bilgilendirme messages; the
--                                 messages carry no clinical information). NULL = unknown (every patient
--                                 registered before this migration) — treated as "no" until marked.
--   • iletisim_izin_kayitlari     history of every consent change: who marked it, when, from where.
--   • users.iletisim_*            the doctor's own WhatsApp number / email and where emails open.
--   • iletisim_kayitlari          contact log: opened (acildi) → confirmed sent (gonderildi).
--   • iletisim_kuyrugu            "Hazır mesajlar": prepared messages waiting for a human tap.
--                                 (doctor_id, tekil_anahtar) is unique → a trigger can never double an item.
--
-- STAFF (NOTYA-RANDEVU-01 personel, rol sekreter): may see/work ONLY appointment items
--   (randevu_hatirlatma, randevu_degisikligi, randevu_iptali, tetkik_getirin, bilgi_formu) of the doctor
--   they work for. The API enforces this in application code (service-role client, lib/iletisim/kuyruk.ts
--   PERSONEL_TURLERI); the staff policies below are the second line, same model as 052.
--
-- ISOLATION: same pattern as 052_hasta_izolasyon_rls.sql — own-row policy + a RESTRICTIVE patient-ownership
-- policy. The restrictive policy here also admits the doctor's active staff (052's version only knows
-- auth.uid() = doctor), otherwise it would AND-away the staff policy.
--
-- ADDITIVE ONLY: new columns are nullable, new tables are empty; existing data is untouched. Idempotent.
-- NOT APPLIED by the job that wrote it — applied after review. The code fails soft until then
-- (empty queue, unknown consent, no log).

-- ── 1) Patient consent (current state) ────────────────────────────────────────────────────────────
alter table patients add column if not exists iletisim_izni_whatsapp boolean;
alter table patients add column if not exists iletisim_izni_eposta boolean;
alter table patients add column if not exists iletisim_izni_guncelleme timestamptz;
alter table patients add column if not exists iletisim_izni_guncelleyen uuid references auth.users(id) on delete set null;

-- ── 2) Consent history ────────────────────────────────────────────────────────────────────────────
create table if not exists iletisim_izin_kayitlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  kanal text not null check (kanal in ('whatsapp', 'eposta')),
  izin boolean not null,
  -- bilgi_formu = the patient ticked it on the intake form; hasta_profili = edited on the profile;
  -- gonder_dugmesi = "İzin alındı olarak işaretle" on the send button
  kaynak text not null check (kaynak in ('bilgi_formu', 'hasta_profili', 'gonder_dugmesi')),
  kaydeden_user_id uuid references auth.users(id) on delete set null,
  kaydeden_personel_id uuid references personel(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists iletisim_izin_kayitlari_hasta_idx on iletisim_izin_kayitlari (doctor_id, patient_id, created_at desc);

-- ── 3) Doctor's own accounts ──────────────────────────────────────────────────────────────────────
alter table users add column if not exists iletisim_whatsapp text;
alter table users add column if not exists iletisim_eposta text;
alter table users add column if not exists iletisim_eposta_acilis text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_iletisim_eposta_acilis_check') then
    alter table users add constraint users_iletisim_eposta_acilis_check
      check (iletisim_eposta_acilis is null or iletisim_eposta_acilis in ('uygulama', 'gmail', 'outlook'));
  end if;
end $$;

-- ── 4) Contact log ────────────────────────────────────────────────────────────────────────────────
create table if not exists iletisim_kayitlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  kanal text not null check (kanal in ('whatsapp', 'eposta')),
  tur text not null check (char_length(tur) between 1 and 40),
  -- set when a secretary sent it (personel.id); NULL = the doctor
  gonderen_personel_id uuid references personel(id) on delete set null,
  gonderen_user_id uuid references auth.users(id) on delete set null,
  durum text not null default 'acildi' check (durum in ('acildi', 'gonderildi')),
  kuyruk_id uuid,
  randevu_id uuid references randevular(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists iletisim_kayitlari_hasta_idx on iletisim_kayitlari (doctor_id, patient_id, created_at desc);
create index if not exists iletisim_kayitlari_doktor_idx on iletisim_kayitlari (doctor_id, created_at desc);

-- ── 5) Hazır mesajlar queue ───────────────────────────────────────────────────────────────────────
create table if not exists iletisim_kuyrugu (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  tur text not null check (char_length(tur) between 1 and 40),
  randevu_id uuid references randevular(id) on delete cascade,
  asi_id uuid,
  konu_id uuid,
  -- Turkish calendar day the item belongs to; "Bugün N mesaj hazır" counts items up to today
  planlanan_gun date not null,
  tekil_anahtar text not null check (char_length(tekil_anahtar) between 1 and 200),
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'gonderildi', 'atlandi')),
  -- "Sonra": stays waiting, moves behind the rest
  ertelendi_at timestamptz,
  isleyen_user_id uuid references auth.users(id) on delete set null,
  isleyen_personel_id uuid references personel(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, tekil_anahtar)
);
create index if not exists iletisim_kuyrugu_bekleyen_idx on iletisim_kuyrugu (doctor_id, planlanan_gun) where durum = 'bekliyor';

-- ── 6) RLS ────────────────────────────────────────────────────────────────────────────────────────
alter table iletisim_izin_kayitlari enable row level security;
alter table iletisim_kayitlari enable row level security;
alter table iletisim_kuyrugu enable row level security;

do $$
declare
  t text;
begin
  -- doctor: own rows (052 hasta_izolasyon_kendi_satiri pattern)
  foreach t in array array['iletisim_izin_kayitlari', 'iletisim_kayitlari', 'iletisim_kuyrugu'] loop
    begin
      execute format('create policy "hasta_izolasyon_kendi_satiri" on public.%I for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid())', t);
    exception when duplicate_object then null;
    end;
    -- restrictive patient ownership: the patient belongs to the row's doctor, and the caller is that
    -- doctor or one of their active staff
    begin
      execute format(
        -- columns of the policy's own table are qualified (%1$I.col): unqualified doctor_id inside the
        -- subquery would bind to patients.doctor_id and make the check vacuous
        'create policy "hasta_izolasyon_hasta_sahipligi" on public.%1$I as restrictive for all to authenticated, anon
           using (exists (select 1 from public.patients p where p.id = %1$I.patient_id and p.doctor_id = %1$I.doctor_id
                   and (p.doctor_id = auth.uid() or exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = p.doctor_id))))
           with check (exists (select 1 from public.patients p where p.id = %1$I.patient_id and p.doctor_id = %1$I.doctor_id
                   and (p.doctor_id = auth.uid() or exists (select 1 from public.personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = p.doctor_id))))',
        t);
    exception when duplicate_object then null;
    end;
  end loop;

  -- staff: appointment items only, of the doctor they work for
  if not exists (select 1 from pg_policies where tablename = 'iletisim_kuyrugu' and policyname = 'personel_randevu_kuyrugu') then
    create policy "personel_randevu_kuyrugu" on iletisim_kuyrugu for all
      using (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu')
             and exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kuyrugu.doctor_id))
      with check (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu')
             and exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kuyrugu.doctor_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'iletisim_kayitlari' and policyname = 'personel_randevu_kayitlari') then
    create policy "personel_randevu_kayitlari" on iletisim_kayitlari for all
      using (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu')
             and exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kayitlari.doctor_id))
      with check (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu')
             and exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kayitlari.doctor_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'iletisim_izin_kayitlari' and policyname = 'personel_izin_kayitlari') then
    create policy "personel_izin_kayitlari" on iletisim_izin_kayitlari for all
      using (exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_izin_kayitlari.doctor_id))
      with check (exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_izin_kayitlari.doctor_id));
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('095', '095_iletisim.sql', null, now(), false, 'NOTYA-ILETISIM-01: iletişim izni (patients + geçmiş), doktor iletişim ayarları, iletisim_kayitlari, iletisim_kuyrugu — RLS + personel (yalnız randevu) politikaları')
on conflict (version) do nothing;

-- DOĞRULAMA (salt-okunur):
--   select column_name from information_schema.columns where table_name = 'patients' and column_name like 'iletisim_%';
--   select tablename, policyname, permissive from pg_policies where tablename like 'iletisim_%' order by 1, 2;
