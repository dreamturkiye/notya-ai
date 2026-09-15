-- NOTYA-KHD-07 (Kaan 2026-09-14 gece, gap-fill against Williams/Berek&Novak/Temel KHD Bilgisi +
-- SB DÖBYR referans listesi). Mevcut tabloları genişletir, yeni tablo yaratmaz (basit alan ekleri).

alter table gebelikler add column if not exists olu_dogum int;              -- D
alter table gebelikler add column if not exists ektopik int;                -- E
alter table gebelikler add column if not exists onceki_sezaryen_sayisi int;
alter table gebelikler add column if not exists onceki_sezaryen_kesi_tipi text;
alter table gebelikler add column if not exists cogul_gebelik_tipi text;    -- 'tekil' | 'dikoryonik' | 'monokoryonik-diamniyotik' | 'monokoryonik-monoamniyotik'
alter table gebelikler add column if not exists risk_sinifi text default 'dusuk';  -- SB Risk Değerlendirme Formu: 'dusuk' | 'orta' | 'yuksek'
alter table gebelikler add column if not exists risk_sinifi_notu text;
alter table gebelikler add column if not exists ilk_vizit_lab jsonb;        -- {hemogram, ferritin, tsh, hbsag, hiv, vdrl, hcv, idrarKultur, aclikGlukoz}
alter table gebelikler add column if not exists indirekt_coombs jsonb;      -- [{tarih, sonuc}]
alter table gebelikler add column if not exists anti_d_uygulamalari jsonb default '[]'::jsonb; -- [{tarih, doz, endikasyon}]

alter table gebelik_izlemleri add column if not exists servikal_uzunluk numeric;  -- mm, 18-22hf
alter table gebelik_izlemleri add column if not exists ogtt jsonb;                -- {tip:'50g'|'75g'|'100g', acilk, birSaat, ikiSaat, ucSaat, tani}
alter table gebelik_izlemleri add column if not exists gbs_kultur text;           -- 35-37hf: 'pozitif'|'negatif'|'bekleniyor'
alter table gebelik_izlemleri add column if not exists tehlike_isaretleri jsonb default '[]'::jsonb; -- ['kanama','siddetli-bas-agrisi',...]

-- Pediatri köprüsü: doğumda anne kaydından yeni bebek hastası oluşturulduğunda iz bırakır.
alter table gebelikler add column if not exists yenidogan_patient_id uuid references patients(id) on delete set null;
