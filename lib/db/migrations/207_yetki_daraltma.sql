-- 207 — Privilege tightening (security hygiene, 2026-11-24)
--
-- Supabase's stock default privileges give the `anon` and `authenticated` API roles ALL
-- table privileges in `public`, including TRUNCATE, REFERENCES and TRIGGER. RLS does not
-- govern those three. They cannot be used through the REST API (PostgREST never issues
-- them), so this is defence in depth: no SQL path running as anon/authenticated
-- (a SECURITY INVOKER function, a future RPC) can ever wipe a table, attach a trigger or
-- build a foreign key against our tables.
--
-- 1. protokol_sayaclari (migration 160) is touched only by the server (service_role):
--    RLS on, no policies. Remove every API-role grant.
-- 2. Every table in `public`: revoke TRUNCATE, REFERENCES, TRIGGER from anon/authenticated.
-- 3. Default privileges for tables created by `postgres` from now on: same three removed.
--
-- service_role and postgres keep everything. Row access (SELECT/INSERT/UPDATE/DELETE)
-- stays governed by RLS exactly as before.

revoke all on table public.protokol_sayaclari from anon, authenticated;

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, references, trigger on table public.%I from anon, authenticated', t.tablename);
  end loop;
end $$;

alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;
