-- 084 — ASI-KARNESI-01 (2026-09-19): aşı karnesinden aktarılan satırın kanıt izi.
--
-- Dr. Gökhan Mamur (pediatri, beta hekim): hekim hastanın kağıt aşı karnesinin fotoğrafını çeker, Ayşe okur, hekim
-- TOPLU ONAYLAR (satır düzeltebilir) → satırlar `asilar`a kaynak='beyan' ile yazılır (dış kurumda yapılmış).
-- Kaan'ın kararı: karneden gelenler klinikte uygulananlardan GÖRSEL OLARAK AYRI — ayrım bu iki kolondan okunur.
--
--   belge_id      → okunan karnenin Kasa kaydı (medical_documents, şifreli). Belge silinirse iz kalır, bağ kopar.
--   hekim_onay_at → hekimin toplu onay anı. Onaysız satır bu yoldan hiç yazılmaz (sunucu reddeder).
--
-- YALNIZ EKLEME: iki boş kolon + kısmi dizin. Mevcut hiçbir satır değişmez; eski satırlarda ikisi de null.
-- Uygulanmamış ortamda rota kanıt izini notlar önekinde tutar (lib/asi/karneOkuma.ts → asiKaynakTuru ikisini de okur).
-- İdempotent — tekrar çalıştırmak güvenli. RLS: asilar zaten 052'de kapsanıyor; yeni tablo yok.

alter table asilar add column if not exists belge_id uuid references medical_documents(id) on delete set null;
alter table asilar add column if not exists hekim_onay_at timestamptz;

create index if not exists idx_asilar_belge on asilar(belge_id) where belge_id is not null;
