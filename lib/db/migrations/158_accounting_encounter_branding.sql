-- NOTYA-ACCOUNTING-ENCOUNTER-01 (Kaan's CEO brief, 2026-10-15) — closes three audit gaps:
--   (A) invoice <-> clinical visit link, so "Faturala" at the end of a muayene can create a draft
--       invoice tied to that specific visit instead of a free-text, manually-typed patient id.
--   (B) practice/company profile fields (IBAN, logo) for a real-looking invoice/makbuz PDF header.
--   (C) 'parasut' added to the e-belge vendor allow-list (lib/accounting/ebelge/parasut.ts).
-- Additive only; no existing table touched destructively, same convention as 151/153.

-- (A) accounting_invoices.encounter_id -> sessions.id (the existing muayene/visit table, NOT a
-- new "encounters" table — this schema's clinical visit record IS `sessions`, see lib/db/schema.sql).
-- Nullable: billing can still stand alone with no clinical visit behind it (ARCH doc §2.2).
alter table public.accounting_invoices
  add column if not exists encounter_id uuid references public.sessions(id) on delete set null;

create index if not exists accounting_invoices_encounter_idx
  on public.accounting_invoices (encounter_id) where encounter_id is not null;

-- (B) Practice/company profile additions on the existing tax-profile table (extends rather than
-- adding a new table, per the brief's own "or extend an existing settings table" option).
-- IBAN is financial-account data, same sensitivity tier as the TCKN/VKN already encrypted on this
-- row — reuse the same AES-256-GCM envelope (lib/security/encryption.ts), never stored in clear.
alter table public.accounting_tax_profiles
  add column if not exists iban_enc text,
  add column if not exists logo_mime_type text check (logo_mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  add column if not exists logo_byte_length integer check (logo_byte_length is null or (logo_byte_length > 0 and logo_byte_length <= 2097152)),
  add column if not exists logo_image_encrypted text;

-- (C) 'parasut' joins the e-belge vendor allow-list (lib/accounting/ebelge/parasut.ts — real,
-- cross-referenced-confidence adapter; see that file's header and CHECKLIST.md for sourcing).
alter table public.accounting_ebelge_credentials drop constraint if exists accounting_ebelge_credentials_vendor_check;
alter table public.accounting_ebelge_credentials
  add constraint accounting_ebelge_credentials_vendor_check
  check (vendor in ('generic_rest', 'parasut', 'nes', 'qnb_esolutions', 'logo', 'other'));
