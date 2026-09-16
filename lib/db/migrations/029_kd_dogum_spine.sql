-- NOTYA-KD-02 (Kaan 2026-09-16) — Kadın-doğum obstetrics spine (audit fix): tasks, onam, travay/partograf, doğum event,
-- C/S package, complications, taburcu gate, bebek kartı. Visible only for branş kadin_dogum (bebek tasks → pediatri).
-- Reuses gebelikler / gebelik_izlemleri / lohusa_izlemleri (019/026), belge vault, lab_*, belge_analizleri, muayene_revizyonlar.

create table if not exists gebelik_gorevleri (
  id              uuid primary key default gen_random_uuid(),
  gebelik_id      uuid not null references gebelikler(id) on delete cascade,
  patient_id      uuid not null references patients(id),
  doctor_id       uuid not null references auth.users(id),
  kod             text not null,                 -- görev şablon kodu (ikili_nt, gdm, rhogam …)
  ad              text not null,
  tur             text not null,                 -- lab|usg|onam|tarama|karar|ilac|test|plan
  hedef_baslangic date not null,
  hedef_bitis     date not null,
  sert            boolean not null default false,
  kacirilinca     text,
  durum           text not null default 'bekliyor',   -- bekliyor|pencerede|kacirildi|tamam|atlandi (recomputed on read; stored for lists)
  tamam_at        timestamptz,
  belge_id        uuid,                          -- vault document that fulfilled it (lab/US belge)
  analiz_id       uuid references belge_analizleri(id),
  not_metni       text,
  created_at      timestamptz not null default now(),
  unique (gebelik_id, kod)
);
create index if not exists gebelik_gorevleri_gebelik_idx on gebelik_gorevleri (gebelik_id, hedef_baslangic);

create table if not exists onamlar (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id),
  doctor_id       uuid not null references auth.users(id),
  gebelik_id      uuid references gebelikler(id) on delete set null,
  sablon_kodu     text not null,
  sablon_adi      text not null,
  icerik          jsonb not null,                -- snapshot of the template at signing time (maddeler, riskler, ekKutu)
  ek_kutu_isaretli boolean not null default false, -- e.g. tüp ligasyonu
  hasta_onayladi  boolean not null default false,  -- checkbox (V1); e-imza later
  onay_at         timestamptz,
  imzali_belge_id uuid,                          -- scanned signed copy in the vault (optional)
  not_metni       text,
  created_at      timestamptz not null default now()
);
create index if not exists onamlar_hasta_idx on onamlar (patient_id, created_at desc);

create table if not exists dogum_olaylari (
  id              uuid primary key default gen_random_uuid(),
  gebelik_id      uuid not null references gebelikler(id) on delete cascade,
  patient_id      uuid not null references patients(id),
  doctor_id       uuid not null references auth.users(id),
  durum           text not null default 'travay',   -- travay|dogum|lohusa|taburcu|kapandi
  travay_baslangic timestamptz,
  cs_karar_at     timestamptz,                   -- decision-to-C/S timestamp
  cs_endikasyon   text[] not null default '{}',   -- from CS_ENDIKASYONLARI (doctor selects)
  cs_endikasyon_not text,
  fetal_distres   jsonb,                         -- {ktg_patern, mekonyum, aksiyon, zaman}
  dogum_sekli     text,                          -- nsd|mudahaleli|cs_elektif|cs_acil|ssvd
  dogum_zamani    timestamptz,
  preop           jsonb,                         -- {cbc, kan_grubu, kros, aclik, anestezi, antibiyotik}
  intraop         jsonb,                         -- {kesi, uterus, plasenta, kanama_ml, komplikasyon, bebek_cikis_saati, apgar1, apgar5, kilo}
  postop          jsonb,                         -- {"2s":{...},"6s":{...},"24s":{...}} kanama, idrar, barsak, yara, ates, mobilizasyon
  ssvd            jsonb,                         -- {onceki_kesi_tipi, ruptur_onami}
  preterm         jsonb,                         -- {hafta, pprom, tokoliz, betametazon, mgso4, antibiyotik, koryoamniyonit}
  pph             jsonb,                         -- {tahmin_ml, uterotonik, histerektomi, acil}
  canli_dogum     boolean,
  lohusa          jsonb,                         -- {ziyaretler:[{kod,tarih,not}]}
  not_metni       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists dogum_olaylari_gebelik_idx on dogum_olaylari (gebelik_id, created_at desc);

create table if not exists travay_partograf (
  id              uuid primary key default gen_random_uuid(),
  dogum_id        uuid not null references dogum_olaylari(id) on delete cascade,
  doctor_id       uuid not null references auth.users(id),
  zaman           timestamptz not null,
  servikal_acilma numeric, inis text, kasilma_10dk int, kasilma_sure int, fetal_kalp int,
  anne_nabiz int, ta_sistolik int, ta_diastolik int, ates numeric, idrar text, amniyon text, oksitosin numeric, ilac text, not_metni text,
  created_at      timestamptz not null default now()
);
create index if not exists travay_partograf_dogum_idx on travay_partograf (dogum_id, zaman);

create table if not exists komplikasyonlar (
  id              uuid primary key default gen_random_uuid(),
  dogum_id        uuid not null references dogum_olaylari(id) on delete cascade,
  patient_id      uuid not null references patients(id),
  doctor_id       uuid not null references auth.users(id),
  kime            text not null,                 -- anne|bebek
  ad              text not null,
  ayrinti         text,
  acil            boolean not null default false,
  zaman           timestamptz not null default now()
);

create table if not exists bebek_kartlari (
  id              uuid primary key default gen_random_uuid(),
  dogum_id        uuid not null references dogum_olaylari(id) on delete cascade,
  gebelik_id      uuid not null references gebelikler(id),
  anne_patient_id uuid not null references patients(id),
  bebek_patient_id uuid references patients(id),  -- created in this doctor's roster on live birth (pediatri owns after)
  doctor_id       uuid not null references auth.users(id),
  sira            int not null default 1,        -- çoğul gebelik
  cinsiyet        text,                          -- K|E
  dogum_zamani    timestamptz,
  gebelik_haftasi numeric,
  kilo_gram       int, boy_cm numeric, bas_cevresi_cm numeric,
  apgar1 int, apgar5 int,
  canli            boolean not null default true,
  yenidogan_tarama jsonb not null default '{}'::jsonb,  -- ntp1, ntp2_randevu, hepb1, vitk, isitme, pulseox, kirmizi_refleks, gkd, dvit, emzirme (+tarih)
  gorevler         jsonb not null default '[]'::jsonb,  -- [{kod, ad, sahip, tamam}]
  komplikasyonlar  text[] not null default '{}',
  erkek_ek         jsonb,                        -- {sunnet_onam_id, uroloji_gorevi}
  created_at      timestamptz not null default now()
);

create table if not exists taburcu_checklist (
  id              uuid primary key default gen_random_uuid(),
  dogum_id        uuid not null references dogum_olaylari(id) on delete cascade,
  bebek_id        uuid references bebek_kartlari(id) on delete cascade,
  doctor_id       uuid not null references auth.users(id),
  maddeler        jsonb not null default '{}'::jsonb,   -- TaburcuChecklist booleans
  istisna         jsonb,                                -- {tur: red|erken_taburcu|sevk, aciklama}
  kapatildi       boolean not null default false,
  kapatildi_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
