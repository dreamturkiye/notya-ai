-- SES-TURU-AC-GRANT-AU-01 (2026-10-27, AU launch-readiness audit): same hole found and fixed on
-- Türkiye production today (main's migration 180_ses_turu_ac_grant_fix.sql) but never ported to
-- Australia. anon/authenticated both held EXECUTE on this RPC -- confirmed live via
-- information_schema.routine_privileges on sllwiuhobuagumwbvulf. ses_turu_ac is a normal
-- SECURITY DEFINER RPC (not a trigger) that reads/writes a voice session's messages, active_context
-- and patient_id given only a client-supplied p_oturum/p_doktor pair, with no internal auth.uid()
-- check -- callable anonymously via /rest/v1/rpc/ses_turu_ac if those UUIDs are known or guessed.
-- Intent is service_role-only (server-side callers already hold the service key).
revoke execute on function public.ses_turu_ac(uuid, uuid, text, text, text) from anon, authenticated;

-- DOĞRULAMA (salt-okunur):
--   select grantee, privilege_type from information_schema.routine_privileges where routine_name = 'ses_turu_ac';
--   -- beklenen: yalnız service_role (+postgres/owner)
-- Applied to AU production (sllwiuhobuagumwbvulf) 2026-10-27; verified anon/authenticated no longer listed.
