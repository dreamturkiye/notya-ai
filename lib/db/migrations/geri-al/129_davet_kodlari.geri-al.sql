-- ROLLBACK of migration 129 (davet_kodlari). NOTYA-ULKE-SABLON-01.
-- Removes the invitation codes and their two functions. Unused codes are lost; issue new ones if the table comes back.
--
-- Touches of Türkiye's objects: none (one row removed from the ledger).
-- Run the rollbacks in REVERSE order (135 first, 128 last): each assumes the later ones are already rolled back.
-- Safe to run twice. One transaction. NEVER RUN by the job that wrote it, on any database except the throwaway
-- local PostgreSQL of scripts/ulke-goc-kaniti.mjs.

begin;
set local lock_timeout = '4s';

drop function if exists public.davet_kodu_kullan(text, text);
drop function if exists public.davet_kodu_iade(text, text);
drop function if exists public.davet_kodu_iade(text);
drop table if exists public.davet_kodlari;

delete from schema_migrations where version = '129';

commit;
