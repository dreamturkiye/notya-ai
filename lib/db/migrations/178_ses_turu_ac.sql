-- SES-LAT-02 (Kaan, 2026-10-26 — voice launch audit): one-round-trip, genuinely atomic voice-turn open.
-- Replaces the 3-trip optimistic claim (read + write + verify-read) AND the separate history read in
-- /api/asistan/ses-llm: row lock, duplicate check, claim and row read in one statement.
--   · live lock (<= 45 s), same normalized fingerprint  -> kazandi=false (duplicate: ElevenLabs re-POST / echo)
--   · live lock, different message                      -> claim steals it (a real second question is never blocked)
--   · no lock / expired                                 -> claim
-- The Turkish-aware fuzzy same-info check stays in TypeScript on oncekiKilit (lib/asistan/sesTurKilit.ts).
-- `anahtar` is the TS-normalized fingerprint (trAramaNormalize) — SQL lower() is not tr-TR aware. Locks written by
-- the old code carry no anahtar: those fall back to a whitespace-normalized exact text comparison.
create or replace function public.ses_turu_ac(p_oturum uuid, p_doktor uuid, p_mesaj text, p_anahtar text, p_claim text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  k jsonb;
  canli boolean := false;
  ayni boolean := false;
  kazandi boolean := false;
begin
  select id, messages, active_context, persona_id, patient_id
    into r
    from asistan_sessions
   where id = p_oturum and doctor_id = p_doktor
   for update;
  if not found then
    return jsonb_build_object('yok', true, 'kazandi', false);
  end if;
  k := coalesce(r.active_context, '{}'::jsonb) -> 'sesTurKilit';
  if k is not null and k ? 'zaman' then
    begin
      canli := (extract(epoch from (now() - (k->>'zaman')::timestamptz)) * 1000) <= 45000;
    exception when others then
      canli := false;
    end;
  end if;
  if canli then
    ayni := case
      when coalesce(k->>'anahtar', '') <> '' then (k->>'anahtar') = coalesce(p_anahtar, '')
      else regexp_replace(coalesce(k->>'mesaj',''), '\s+', ' ', 'g') = regexp_replace(coalesce(p_mesaj,''), '\s+', ' ', 'g')
    end;
  end if;
  if not (canli and ayni) then
    update asistan_sessions
       set active_context = jsonb_set(
             coalesce(active_context, '{}'::jsonb),
             '{sesTurKilit}',
             jsonb_build_object(
               'mesaj', left(coalesce(p_mesaj, ''), 500),
               'anahtar', left(coalesce(p_anahtar, ''), 200),
               'zaman', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
               'claimId', p_claim))
     where id = p_oturum and doctor_id = p_doktor;
    kazandi := true;
  end if;
  return jsonb_build_object(
    'yok', false,
    'kazandi', kazandi,
    'oncekiKilit', k,
    'satir', jsonb_build_object(
      'id', r.id,
      'messages', coalesce(r.messages, '[]'::jsonb),
      'active_context', coalesce(r.active_context, '{}'::jsonb),
      'persona_id', r.persona_id,
      'patient_id', r.patient_id));
end
$$;
revoke all on function public.ses_turu_ac(uuid, uuid, text, text, text) from public;
grant execute on function public.ses_turu_ac(uuid, uuid, text, text, text) to service_role;
