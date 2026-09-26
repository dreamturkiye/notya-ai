-- NOTYA-PAKET-01 + NOTYA-SUT-01 (Kaan, 2026-09-26)
-- Onaylı seans paketi. Resmî sisteme gitmez. Additive. Uygulanmamış varsay.
-- 103 WhatsApp kalkanı ile çakışmaz; o tablolara dokunulmaz.
-- Tablo yoksa kapılar susar, reçete yazdır eskisi gibi çalışır.

alter table public.patients add column if not exists enabiz_gonderilmesin boolean;

create table if not exists public.seans_paketleri (
  id                  uuid primary key default gen_random_uuid(),
  doctor_id           uuid not null references auth.users(id) on delete cascade,
  patient_id          uuid not null references public.patients(id) on delete cascade,
  note_id             uuid,
  seans_id            uuid,
  kaynak              text not null,
  durum               text not null default 'taslak',
  json_encrypted      text not null,
  uyari_gecildi       boolean not null default false,
  uyari_gerekce       text,
  onaylayan_user_id   uuid,
  onay_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index if not exists seans_paketleri_not_idx
  on public.seans_paketleri (doctor_id, note_id) where note_id is not null;
create index if not exists seans_paketleri_bugun_idx
  on public.seans_paketleri (doctor_id, onay_at desc);

alter table public.seans_paketleri enable row level security;
do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.seans_paketleri for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.seans_paketleri as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;
