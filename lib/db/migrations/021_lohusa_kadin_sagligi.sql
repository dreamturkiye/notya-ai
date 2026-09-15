-- NOTYA-KHD-03: lohusa izlemleri + kadın sağlığı (KETEM taramaları, kontrasepsiyon, menopoz)
create table if not exists lohusa_izlemleri (
  id uuid primary key default gen_random_uuid(),
  gebelik_id uuid not null references gebelikler(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  tarih date not null default current_date,
  dogum_sonrasi_gun int not null,
  tansiyon_sistolik int, tansiyon_diastolik int, ates numeric,
  kanama text, uterus_involusyon text, perine_insizyon text, emzirme text,
  duygu_durumu text, epds_puan int,
  not_metni text, not_id uuid references notes(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists lohusa_izlemleri_gebelik_idx on lohusa_izlemleri(gebelik_id, tarih desc);
alter table lohusa_izlemleri enable row level security;
create policy "doktor kendi lohusa izlemleri" on lohusa_izlemleri for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());

create table if not exists kadin_sagligi (
  patient_id uuid primary key references patients(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  son_serviks_tarama date, son_serviks_sonuc text,
  son_mamografi date, son_mamografi_sonuc text,
  son_kolorektal date,
  kontrasepsiyon_yontemi text, kontrasepsiyon_baslangic date,
  menarş_yasi int, adet_duzeni text, son_adet_tarihi date,
  menopoz_durumu text,            -- 'premenopoz' | 'perimenopoz' | 'postmenopoz'
  menopoz_yasi int,
  notlar text,
  updated_at timestamptz not null default now()
);
alter table kadin_sagligi enable row level security;
create policy "doktor kendi kadin sagligi kayitlari" on kadin_sagligi for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
