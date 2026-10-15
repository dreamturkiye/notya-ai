-- 157 — NOTYA-ACCOUNTING-COMPLIANCE-01 (Kaan, 2026-10-15): late-payment reminder drafts.
--
-- Deliberately does NOT create a new message-sending table. Payment reminders reuse the existing
-- "Hazır mesajlar" queue (iletisim_kuyrugu, migration 095) and contact log (iletisim_kayitlari) —
-- the same human-tap-to-send pipeline every other patient message type already uses — rather than
-- building a parallel one. This migration only adds the columns a payment-reminder queue ITEM
-- needs that no other message type does: which invoice it's about, and the amount/reference/tier
-- snapshot computed at draft-generation time (lib/accounting/ar/reminders.ts), so the prepared
-- text never needs this module to look anything up again when a human opens it to send.
--
-- Money: odeme_tutar_kurus is an integer kuruş snapshot, never a float, same rule as every other
-- money column in lib/accounting (lib/accounting/ledger/money.ts).
--
-- ADDITIVE ONLY: all four columns are nullable; every existing queue row and every other message
-- type is completely unaffected. Idempotent (add column if not exists).

alter table iletisim_kuyrugu add column if not exists invoice_id uuid references accounting_invoices(id) on delete set null;
alter table iletisim_kuyrugu add column if not exists odeme_tutar_kurus integer;
alter table iletisim_kuyrugu add column if not exists odeme_fatura_ref text;
alter table iletisim_kuyrugu add column if not exists odeme_kademe smallint;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'iletisim_kuyrugu_odeme_kademe_check') then
    alter table iletisim_kuyrugu add constraint iletisim_kuyrugu_odeme_kademe_check
      check (odeme_kademe is null or odeme_kademe in (1, 2));
  end if;
end $$;
create index if not exists iletisim_kuyrugu_invoice_idx on iletisim_kuyrugu (invoice_id) where invoice_id is not null;

-- ── Staff RLS policies: add 'odeme_hatirlatma' to the tur list (lib/iletisim/kuyruk.ts's
-- PERSONEL_TURLERI, the application-level gate, already includes it — this is the second line of
-- defense per migration 095's own comment). 095 may already be applied in a live environment, so
-- its policies are replaced here rather than edited in place, which would not reach an
-- already-migrated database. Same policy bodies as 095, only the tur list changes.
drop policy if exists "personel_randevu_kuyrugu" on iletisim_kuyrugu;
create policy "personel_randevu_kuyrugu" on iletisim_kuyrugu for all
  using (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu', 'odeme_hatirlatma')
         and exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kuyrugu.doctor_id))
  with check (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu', 'odeme_hatirlatma')
         and exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kuyrugu.doctor_id));

drop policy if exists "personel_randevu_kayitlari" on iletisim_kayitlari;
create policy "personel_randevu_kayitlari" on iletisim_kayitlari for all
  using (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu', 'odeme_hatirlatma')
         and exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kayitlari.doctor_id))
  with check (tur in ('randevu_hatirlatma', 'randevu_degisikligi', 'randevu_iptali', 'tetkik_getirin', 'bilgi_formu', 'odeme_hatirlatma')
         and exists (select 1 from personel pe where pe.user_id = auth.uid() and pe.aktif and pe.doktor_id = iletisim_kayitlari.doctor_id));
