-- NOTYA-KHD-clinic-fit (2026-09-16): Kadın Doğum visit-first clinic surface.
-- Additive only. Live gebelik_* tables remain CRUD truth; chapter engines consume them.
-- specialty_records.payload is still not a store — do not invent a second episode table.
-- Numbered 026 so it does not collide with upcoming Notya Belgeler 025_belge_analizleri.sql.

-- Episode-level clinic-fit blobs (risk formu, VTE, destek/aşı, lab, NST).
alter table gebelikler add column if not exists risk_formu jsonb default '{}'::jsonb;
alter table gebelikler add column if not exists vte_formu jsonb default '{}'::jsonb;
alter table gebelikler add column if not exists destek_asi jsonb default '{}'::jsonb;
alter table gebelikler add column if not exists lab_panel jsonb default '{}'::jsonb;
alter table gebelikler add column if not exists nst_kayitlari jsonb default '[]'::jsonb;

-- Per-izlem DÖBYR checklist ticks (yapıldı / reddedildi + neden).
alter table gebelik_izlemleri add column if not exists checklist jsonb default '{}'::jsonb;

comment on column gebelikler.risk_formu is
  'DÖBYR Gebelikte Risk Değerlendirme Formu ticks → drives risk_sinifi. Live CRUD truth.';
comment on column gebelikler.vte_formu is
  'DÖBYR VTE form ticks + computed score. Tromboprofilaksi hint only — no invented IU doses.';
comment on column gebelikler.destek_asi is
  'Folik / demir / D vit / Td / Tdap / influenza / Anti-D done|skipped + dates.';
comment on column gebelikler.lab_panel is
  'Structured GA-window labs: hemogram, idrar, HBsAg, IDC, TSH, OGTT, rubella, sifiliz, HIV (onamlı).';
comment on column gebelikler.nst_kayitlari is
  'NST studies mapped into specialty payload nst_studies. coreTraceId = row id, no second blob store.';
comment on column gebelik_izlemleri.checklist is
  'DÖBYR IZLEM1–4 checklist state: { [madde]: { durum: yapildi|reddedildi|bekliyor, neden? } }.';

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values (
  '026',
  '026_kd_clinic_fit.sql',
  null,
  now(),
  false,
  'KD clinic-fit: risk/VTE/destek/lab/NST blobs on gebelikler; izlem checklist jsonb. Additive. File numbered 026 to leave 025 for belge_analizleri.'
)
on conflict (version) do nothing;
