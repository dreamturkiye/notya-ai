-- NOTYA-KHD-06: genetik/kromozomal tarama kayıtları. Bu tablo RİSK HESAPLAMAZ — yalnız
-- laboratuvarın/sertifikalı yazılımın bildirdiği sonuçları ve invaziv test/genetik danışmanlık
-- akışını saklar (bkz. lib/clinical/genetikTarama.ts başlık yorumu).
create table if not exists genetik_taramalar (
  id uuid primary key default gen_random_uuid(),
  gebelik_id uuid not null references gebelikler(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  tur text not null,                -- 'ikili' | 'uclu-dortlu' | 'nipt' | 'invazif' | 'risk-sorgu'
  tarih date not null default current_date,
  hafta int,
  veri jsonb not null,              -- tur'a göre şekil (IkiliTestSonucu vb.) — sunucu hesaplamaz
  not_id uuid references notes(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists genetik_taramalar_gebelik_idx on genetik_taramalar(gebelik_id, tarih desc);
alter table genetik_taramalar enable row level security;
create policy "doktor kendi genetik taramalari" on genetik_taramalar for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
