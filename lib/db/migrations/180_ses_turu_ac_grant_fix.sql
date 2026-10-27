-- SES-TURU-AC-GRANT-01 (2026-10-27, launch audit): migration 178's `revoke all ... from public` did
-- not remove the direct EXECUTE grants held by `anon`/`authenticated` on this function from before
-- (PUBLIC revokes don't touch explicit per-role grants) -- confirmed live via
-- information_schema.routine_privileges: anon and authenticated both had EXECUTE. ses_turu_ac is a
-- normal SECURITY DEFINER RPC (not a trigger) that reads/writes a voice session's messages,
-- active_context and patient_id given only a client-supplied p_oturum/p_doktor pair, with no internal
-- auth.uid() check -- callable anonymously via /rest/v1/rpc/ses_turu_ac. Intent (migration 178's own
-- comment + sesTurKilit.ts) is service_role-only (server-side callers already hold the service key).
revoke execute on function public.ses_turu_ac(uuid, uuid, text, text, text) from anon, authenticated;

-- DOĞRULAMA (salt-okunur):
--   select grantee, privilege_type from information_schema.routine_privileges where routine_name = 'ses_turu_ac';
--   -- beklenen: yalnız service_role (+postgres/owner)
-- Applied to production (anjayzospuurymjmmtim) 2026-10-27; verified anon/authenticated no longer listed.
