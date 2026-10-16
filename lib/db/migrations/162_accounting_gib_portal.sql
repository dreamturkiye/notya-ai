-- NOTYA-ACCOUNTING-GIB-PORTAL-01 (Kaan, 2026-10-16) — dual doctor-type mode + free GİB Portalı as
-- the default e-belge path, replacing Paraşüt as a required dependency.
-- Additive only; no existing table touched destructively, same convention as 151/153/158.

-- Doctor picks exactly one legal issuing form: 'serbest_meslek' (solo/individual -> e-SMM only)
-- or 'sirket' (Ltd/AŞ -> e-Fatura/e-Arşiv only) — enforced in code (lib/accounting/module.ts's
-- isDocTypeAllowedForDoctorType), this column is just the stored choice. Default matches the
-- existing default_doc_type default ('esmm'), so no existing row's effective behavior changes.
alter table public.accounting_module_settings
  add column if not exists doctor_type text not null default 'serbest_meslek'
    check (doctor_type in ('serbest_meslek', 'sirket'));

-- How documents actually get issued: 'gib_portal' (default, free, manual entry into GİB's own
-- earsivportal.efatura.gov.tr — no integrator, no subscription) or 'integrator' (optional, a
-- pluggable EbelgeAdapter the doctor connects with their own account, e.g. Paraşüt or a future
-- low-volume entegratör). Every existing row (created before this column existed, i.e. before any
-- doctor had even seen an integrator-setup wizard) defaults to 'gib_portal' — correct, since the
-- only real-adapter path previously offered as default (generic_rest) was also never required to
-- be configured; this does not newly break anyone already relying on a configured integrator,
-- since the invoice engine only reads this column to decide which flow to show/run, and a doctor
-- who already has an active `accounting_ebelge_credentials` row needs to flip this to
-- 'integrator' explicitly in Entegrasyonlar to keep using it going forward.
alter table public.accounting_module_settings
  add column if not exists ebelge_mode text not null default 'gib_portal'
    check (ebelge_mode in ('gib_portal', 'integrator'));
