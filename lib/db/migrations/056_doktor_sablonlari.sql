-- 056 — ARACLAR-CILA-01 Faz 4 (2026-09-19): Araçlar › Sık kullandıklarım / hızlı şablonlar.
-- YALNIZ EKLEME: yeni tablo; mevcut veri değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Muayenehane hekimi aynı 20-30 tabloyu tekrar tekrar görür. Bu tablo hekimin KENDİ yazdığı vizit
-- şablonlarını tutar: alışılmış tanı, reçete taslağı, kontrol aralığı ve not. Doz / ilaç metni
-- tamamen hekimin kendi yazdığıdır — Notya doz önermez, ön tanımlı şablon gelmez (doz kilidi).
--
-- İZOLASYON: burada HASTA verisi yoktur; satır hekime aittir (doktor-izolasyon). Başka hekimin
-- şablonu görünmez: API her sorguda doctor_id = oturum sahibi ile daraltır, RLS de ikinci hattır.

create table if not exists doktor_sablonlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  ad text not null check (char_length(ad) between 1 and 80),
  tani text check (tani is null or char_length(tani) <= 300),
  recete_taslagi text check (recete_taslagi is null or char_length(recete_taslagi) <= 2000),
  kontrol_araligi text check (kontrol_araligi is null or char_length(kontrol_araligi) <= 120),
  notlar text check (notlar is null or char_length(notlar) <= 2000),
  kullanim_sayisi integer not null default 0 check (kullanim_sayisi >= 0),
  son_kullanim timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists doktor_sablonlari_doktor_idx on doktor_sablonlari (doctor_id, kullanim_sayisi desc, son_kullanim desc nulls last);

alter table doktor_sablonlari enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'doktor_sablonlari' and policyname = 'doktor kendi sablonlari') then
    create policy "doktor kendi sablonlari" on doktor_sablonlari for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('056', '056_doktor_sablonlari.sql', null, now(), false, 'ARACLAR-CILA-01 Faz 4: doktor_sablonlari (hekime özel hızlı şablonlar) — RLS + doktor politikası')
on conflict (version) do nothing;
