-- NOTYA-BLE-01 (Kaan 2026-09-15) — Cihaz Köprüsü: Bluetooth / vendor-app device readings and files.
-- Audit trail behind every device-sourced value. The clinical value itself still lives in notes.vitaller
-- (approved by the doctor as before — "not onayı = ölçüm onayı"); this table records where it came from.
-- 022/023 were already taken (genetik taramalar, KHD gap fill) — hence 024.

create table if not exists cihaz_olcumleri (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references auth.users(id),
  patient_id    uuid not null references patients(id),
  note_id       uuid references notes(id),             -- muayene bağı (null = dosyaya alındı, nota bağlanmadı)
  tur           text not null,                         -- ates|tansiyon|nabiz|spo2|kilo|glukoz|steteskop|ekg|usg|diger
  deger         text,                                  -- "37.2" / "120/80" — sayısal ölçümler
  birim         text,
  ayrinti       jsonb not null default '{}'::jsonb,    -- sistolik/diastolik, spo2, kaynakBirim, cihaz zaman damgası…
  belge_id      uuid,                                  -- vault document id (dosya ölçümleri: ses/PDF/görüntü)
  kaynak        text not null,                         -- ble|vendor|dosya|manuel
  transport     text not null,                         -- webbluetooth|ioswebble|share-target|dosya-import|withings
  profil        text,                                  -- 'Health Thermometer' (GATT) / 'Eko PDF' (dosya)
  cihaz         jsonb not null default '{}'::jsonb,    -- {ad, uretici, model, seriNo, yazilim}
  ham_hex       text,                                  -- GATT ham baytlar (audit / hata ayıklama)
  olcum_zamani  timestamptz,                           -- cihaz damgası varsa
  alindi        timestamptz not null default now(),
  onaylandi     boolean not null default false         -- doktor onay kartında "Nota ekle" dedi
);
create index if not exists cihaz_olcumleri_note_idx on cihaz_olcumleri (note_id);
create index if not exists cihaz_olcumleri_hasta_idx on cihaz_olcumleri (patient_id, alindi desc);

-- Hatırlanan cihazlar: doktor bir kez eşleştirir; sonraki seçicide o cihaz önce gösterilir.
create table if not exists doktor_cihazlar (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references auth.users(id),
  cihaz_adi     text,
  uretici       text,
  model         text,
  seri_no       text,
  profil        text,                                  -- hangi ölçümü verir (GATT profil id)
  son_kullanim  timestamptz not null default now(),
  unique (doctor_id, seri_no)
);

-- Uyumsuz cihaz raporları: standart profil konuşmayan cihazlar buradan docs/CIHAZ-UYUMLULUK.md'ye taşınır.
create table if not exists cihaz_uyumsuzluk_raporlari (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references auth.users(id),
  cihaz_adi     text,
  hata          text,
  created_at    timestamptz not null default now()
);
