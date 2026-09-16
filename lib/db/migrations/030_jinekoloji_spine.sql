-- NOTYA-JINE-01 (Kaan 2026-09-16) — Office gynecology spine (kadın-doğum, non-pregnant home). Reuses kadin_sagligi,
-- onamlar, belge vault, lab_*, belge_analizleri, muayene_revizyonlar. Screening ≠ diagnosis; AI drafts only.

create table if not exists jine_vizitler (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tur text not null default 'yillik',                 -- yillik|akinti|ria|menopoz|pcos|infertilite|kontrol
  alanlar jsonb not null default '{}'::jsonb,         -- lmp, gravida_para, kontrasepsiyon, sigara, aile_meme_over, spekulum, bimanuel, tvus_*, meme_palpasyon, kirmizi_bayraklar
  not_id uuid references notes(id), created_at timestamptz not null default now()
);
create index if not exists jine_vizitler_hasta_idx on jine_vizitler (patient_id, created_at desc);

create table if not exists serviks_taramalari (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tarih date not null, pap_sonuc text, hpv text, belge_id uuid,
  taslak_aksiyon jsonb,                                -- {adim, sonrakiAy, guven, gerekce, kolposkopi} (system draft)
  resmi_plan text, sonraki_due date, hekim_onayladi boolean not null default false, onay_at timestamptz,
  kolposkopi jsonb,                                    -- {tarih, bulgu, biyopsi_belge_id, sonuc, cin, takip_ay}
  created_at timestamptz not null default now()
);
create index if not exists serviks_taramalari_hasta_idx on serviks_taramalari (patient_id, tarih desc);

create table if not exists cybh_episodlari (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tarih date not null default current_date, sikayet jsonb,   -- {renk, koku, kasinti, ph, whiff, clue_cell, hif, trichomonas, ulser}
  etkenler text[] not null default '{}', on_tani jsonb, ilk_genital_ulser boolean not null default false,
  hsv jsonb,                                           -- {tip, ilkAtak, atakYil, supresyon}
  partner jsonb,                                       -- {gerekli, bilgilendirildi, linked_patient_id?}
  lab_belge_id uuid, kapali boolean not null default false, created_at timestamptz not null default now()
);

create table if not exists pcos_kartlari (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  kriterler jsonb not null default '{}'::jsonb,        -- oligoAnovulasyon, hiperandrojenizm, pcomUs, menarsYil
  dislama jsonb not null default '{}'::jsonb,          -- tsh, prl, ohp17 done flags
  metabolik jsonb,                                     -- ogtt|hba1c, lipid
  degerlendirme jsonb, amenore_gun int, et_kontrol_gorevi boolean not null default false,
  hekim_tanisi text, updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists lezyon_myom_kist (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tur text not null,                                   -- myom|kist|polip|diger
  boyut_mm numeric, figo_tip text, yer text, semptom text, sonraki_us date, cerrahi_notu text,
  created_at timestamptz not null default now()
);

create table if not exists kontrasepsiyon (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  yontem text not null,                                -- ria_cu5|ria_cu10|ria_lng5|ria_lng8|okp|implant|enjeksiyon|kondom|diger
  baslangic date, son_kullanim date, sti_tarama_onaylandi boolean not null default false,
  ria_notu jsonb,                                      -- {ip_kontrol_tarihi, pid_uyari_bitis, takma_notu, ip_kontrol_yapildi}
  aktif boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists menopoz_hrt (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  semptom_skoru jsonb, on_kontrol jsonb, degerlendirme jsonb,
  hrt_basladi boolean not null default false, hrt_baslangic date, rejim text, yillik_gorevler jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists jine_gorevleri (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  kod text not null, ad text not null, due date, kaynak text,   -- serviks|cybh|ria|hrt|pcos|hsv|infertilite|partner
  durum text not null default 'acik', tamam_at timestamptz, not_metni text, created_at timestamptz not null default now()
);
create index if not exists jine_gorevleri_hasta_idx on jine_gorevleri (patient_id, durum, due);

-- kadin_sagligi gains the office fields the due engine needs
alter table kadin_sagligi add column if not exists son_pap date;
alter table kadin_sagligi add column if not exists son_hpv date;
alter table kadin_sagligi add column if not exists son_dxa date;
alter table kadin_sagligi add column if not exists histerektomi boolean not null default false;
alter table kadin_sagligi add column if not exists hrt boolean not null default false;
alter table kadin_sagligi add column if not exists hrt_baslangic date;
