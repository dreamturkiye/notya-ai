-- 091 — NOTYA-ASI-NOT-01 (Kaan + Dr. Gökhan, 2026-09-23): muayenede uygulanan aşı, not onayında aşı kartına geçer.
--
-- notes.content_asilar: SOAP üretiminin çıkardığı "bu muayenede uygulanan aşılar" listesi (yalnız bu vizitte
--   yapıldığı söylenenler; planlanan / önerilen / daha önce yapılmış olanlar girmez). Hekim not formunda düzenler.
-- asilar.kaynak_note_id: satırı hangi onaylı not yazdı (lib/doktor/notAsiAktarim). Yeniden onayda yalnız bu notun
--   satırları güncellenir / silinir; elle, sesli Ayşe ya da karneyle eklenen satırlarda NULL kalır. Notun muayenesi
--   arşivlenince satır okumada gizlenir (lib/doktor/arsiv → arsivsizAsilar), satırın kendisi değişmez.
--
-- YALNIZ EKLEME (nullable kolonlar + kısmi indeks). İdempotent.

alter table notes add column if not exists content_asilar jsonb;
alter table asilar add column if not exists kaynak_note_id uuid references notes(id) on delete set null;
create index if not exists asilar_kaynak_note_idx on asilar (kaynak_note_id) where kaynak_note_id is not null;

-- PostgREST gömme (arsiv_kaynak:notes!kaynak_note_id) yeni FK'yi görsün.
notify pgrst, 'reload schema';

-- DOĞRULAMA (salt-okunur):
--   select table_name, column_name, data_type from information_schema.columns
--    where (table_name = 'notes' and column_name = 'content_asilar') or (table_name = 'asilar' and column_name = 'kaynak_note_id');
