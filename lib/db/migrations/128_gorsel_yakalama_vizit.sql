-- GORSEL-YAKALAMA-01 (2026-10-14): universal capture → attach-to-visit linkage.
-- Connects the three previously-disconnected dermatoloji imaging layers (muayene notu / core
-- hasta_goruntulemeler / derm_lezyonlar+derm_ziyaretleri) by giving the ALREADY-UNIVERSAL imaging
-- table one new nullable column, instead of inventing a fourth table. Every specialty that already
-- writes to hasta_goruntulemeler (dermatoloji, göz, gebelik, …) gets visit linkage for free.
--
-- "Visit" here is the universal muayene unit every specialty's note screen already has — `sessions`
-- (not the dermatoloji-only `derm_ziyaretleri`, which is a derm-internal visit log one level below
-- this and stays untouched). `notes.session_id` → `sessions.id`; `notlar/[id]` is a note id, so the
-- capture UI resolves the note's `sessionId` first (see app/api/notes/[id]/route.ts) and tags the
-- image with THAT id. Nullable + ON DELETE SET NULL: every existing row (and every upload from a
-- screen that has no visit context yet, e.g. the Deri › Görüntü generic archive) keeps working
-- unchanged.
alter table hasta_goruntulemeler
  add column if not exists visit_id uuid references sessions(id) on delete set null;

create index if not exists hasta_goruntulemeler_visit_idx on hasta_goruntulemeler (visit_id);

comment on column hasta_goruntulemeler.visit_id is
  'Nullable FK → sessions(id). The muayene (visit) a captured image/PDF was attached to inline, if any. '
  'Ownership is enforced in application code (HASTA-IZOLASYON-01) via seansSahibi(), never by RLS alone: '
  'the row''s own doctor_id/patient_id stay the primary isolation boundary; visit_id is additional context.';

-- No new RLS policy needed: hasta_goruntulemeler already has "doctor sees own only" USING (auth.uid()
-- = doctor_id) from migration 002 — service-role routes (the only writers) enforce patient+visit
-- ownership in application code per .cursor/skills/hasta-izolasyon/SKILL.md.

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values (
  '128',
  '128_gorsel_yakalama_vizit.sql',
  null,
  now(),
  false,
  'GORSEL-YAKALAMA-01: hasta_goruntulemeler.visit_id (→ sessions). Connects muayene notu ↔ core imaging ↔ derm lezyon/ziyaret layers. Additive, nullable, no RLS change.'
)
on conflict (version) do nothing;
