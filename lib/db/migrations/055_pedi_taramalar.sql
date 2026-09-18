-- 055 — PEDI-ARACLAR-02 (2026-09-18): Araçlar › Pediatri gelişim taraması paneli + kohort.
-- YALNIZ EKLEME: yeni tablo; mevcut veri değişmez. İdempotent — tekrar çalıştırmak güvenli.
-- Hekimin panelde işaretlediği tarama / profilaksi kayıtları (işitme, kırmızı refle, görme, ROP yönlendirmesi, SB otizm
-- değerlendirmesi, D vitamini, demir, 9. ay Hb). M-CHAT-R/F (mchat_testleri) ve GİDR (gelisim_taramalari) kendi
-- tablolarında kalır. Nota ekleme yalnız hekim onayıyla gununNotunaEkle üzerinden (not_id buraya yazılır).

create table if not exists pedi_taramalar (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  tur text not null check (tur in ('isitme', 'kirmizi_refle', 'gorme', 'rop', 'otizm', 'dvit', 'demir', 'hb')),
  tarih date not null,
  sonuc text not null default 'yapildi' check (sonuc in ('yapildi', 'normal', 'ileri_degerlendirme', 'sevk')),
  not_metni text check (not_metni is null or char_length(not_metni) <= 500),
  not_id uuid references notes(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists pedi_taramalar_hasta_idx on pedi_taramalar (patient_id, tur, tarih desc);
create index if not exists pedi_taramalar_doktor_idx on pedi_taramalar (doctor_id, tur);

alter table pedi_taramalar enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'pedi_taramalar' and policyname = 'doktor kendi pedi_taramalar') then
    create policy "doktor kendi pedi_taramalar" on pedi_taramalar for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  end if;
end $$;

-- 052 ile aynı RESTRICTIVE hasta sahipliği (yeni tablo 052 çalıştıktan sonra oluştuğu için burada açıkça).
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.pedi_taramalar as restrictive for all to authenticated, anon
    using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('055', '055_pedi_taramalar.sql', null, now(), false, 'PEDI-ARACLAR-02: pedi_taramalar (gelişim paneli + kohort) — RLS + restrictive hasta sahipliği')
on conflict (version) do nothing;
