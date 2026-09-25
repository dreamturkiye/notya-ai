-- 094 SEC-RLS-OFF-01 (Kaan, 2026-09-25)
-- 17 public tables had RLS disabled and were readable/writable with the anon key (shipped in every browser).
-- Mali and Avukat have not launched (Kaan: they come later); at apply time 16 tables were empty, mali_belgeler had 3 rows.
-- Enabling RLS with NO policies denies anon/authenticated entirely; the service role (server code) is unaffected.
-- When Sprint 3 (Mali + Avukat) starts, add owner policies per table before any browser-side access.
-- Rollback (only if something breaks): alter table public.<t> disable row level security;
alter table public.mali_portal_tokens enable row level security;
alter table public.mali_belgeler enable row level security;
alter table public.mali_musteriler enable row level security;
alter table public.mali_actions enable row level security;
alter table public.mali_preferences enable row level security;
alter table public.mali_sessions enable row level security;
alter table public.mali_beyan_takvimi enable row level security;
alter table public.musevvekiller enable row level security;
alter table public.avukat_preferences enable row level security;
alter table public.deliller enable row level security;
alter table public.avukat_sessions enable row level security;
alter table public.sure_takibi enable row level security;
alter table public.dilekce_kuyrugu enable row level security;
alter table public.logs enable row level security;
alter table public.normalized_transactions enable row level security;
alter table public.ingestion_log enable row level security;
alter table public.review_queue enable row level security;
