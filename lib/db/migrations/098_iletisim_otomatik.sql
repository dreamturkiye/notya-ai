-- 098 — NOTYA-ILETISIM-04 (Kaan, 2026-09-25): automatic sending from the doctor's own Gmail/Outlook (096) and
-- WhatsApp Business (097), wired to the Hazır mesajlar queue (095).
--
-- Once a doctor has connected an account, non-clinical queue items (randevu, hasta bilgi formu, Sağlığım'da yeni
-- mesaj) whose patient consented to that channel leave by themselves; everything else stays one-tap. This
-- migration only adds bookkeeping so that
--   • an item is sent automatically AT MOST ONCE: the sender claims it first with a conditional update
--     (otomatik_durum is null → 'gonderiliyor'); a human opening the item claims it too ('elle'), so a machine
--     and a person never both send it;
--   • a failed automatic attempt goes back to the human queue with a short Turkish reason (otomatik_hata);
--   • the contact log says the message left by itself, through which account, with the provider's message id.
--
-- No message text is stored anywhere (as in 095). ADDITIVE ONLY: nullable / defaulted columns, existing rows
-- untouched. Idempotent. NOT APPLIED by the job that wrote it — applied after review. Until then the automatic
-- sender stays off (it cannot claim an item without these columns) and the product behaves exactly as with 095.
-- RLS: no new tables; the 095 policies on both tables cover the new columns.

-- ── 1) Queue: automatic attempt state ─────────────────────────────────────────────────────────────
--   null           untouched — the automatic sender may claim it
--   gonderiliyor   claimed by the automatic sender (a stale claim > 10 min is shown to people again)
--   gonderildi     sent automatically (durum is 'gonderildi' too)
--   gonderilemedi  every ready channel failed → waits for a human, reason in otomatik_hata
--   elle           a person opened it in the send flow → never sent automatically
alter table iletisim_kuyrugu add column if not exists otomatik_durum text;
alter table iletisim_kuyrugu add column if not exists otomatik_deneme_at timestamptz;
alter table iletisim_kuyrugu add column if not exists otomatik_hata text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'iletisim_kuyrugu_otomatik_durum_check') then
    alter table iletisim_kuyrugu add constraint iletisim_kuyrugu_otomatik_durum_check
      check (otomatik_durum is null or otomatik_durum in ('gonderiliyor', 'gonderildi', 'gonderilemedi', 'elle'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'iletisim_kuyrugu_otomatik_hata_check') then
    alter table iletisim_kuyrugu add constraint iletisim_kuyrugu_otomatik_hata_check
      check (otomatik_hata is null or char_length(otomatik_hata) <= 200);
  end if;
end $$;
-- the dispatcher's sweep: waiting, untouched items of the last two days
create index if not exists iletisim_kuyrugu_otomatik_idx on iletisim_kuyrugu (planlanan_gun, doctor_id)
  where durum = 'bekliyor' and otomatik_durum is null;

-- ── 2) Contact log: sent by itself, through which account ─────────────────────────────────────────
alter table iletisim_kayitlari add column if not exists otomatik boolean not null default false;
-- 'gmail' | 'outlook' | 'whatsapp_business'
alter table iletisim_kayitlari add column if not exists saglayici text;
-- Gmail message id / WhatsApp wamid (matches whatsapp_teslim_durumlari.mesaj_id); Outlook returns none
alter table iletisim_kayitlari add column if not exists saglayici_mesaj_id text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'iletisim_kayitlari_saglayici_check') then
    alter table iletisim_kayitlari add constraint iletisim_kayitlari_saglayici_check
      check ((saglayici is null or char_length(saglayici) <= 40) and (saglayici_mesaj_id is null or char_length(saglayici_mesaj_id) <= 300));
  end if;
end $$;
-- "Bugün N mesaj kendiliğinden gönderildi" on Ana Sayfa
create index if not exists iletisim_kayitlari_otomatik_idx on iletisim_kayitlari (doctor_id, created_at desc) where otomatik;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('098', '098_iletisim_otomatik.sql', null, now(), false, 'NOTYA-ILETISIM-04: otomatik gönderim — kuyruk sahiplenme/hata alanları, iletisim_kayitlari.otomatik + sağlayıcı mesaj kimliği')
on conflict (version) do nothing;

-- DOĞRULAMA (salt-okunur):
--   select column_name from information_schema.columns where table_name in ('iletisim_kuyrugu', 'iletisim_kayitlari') and (column_name like 'otomatik%' or column_name like 'saglayici%');
