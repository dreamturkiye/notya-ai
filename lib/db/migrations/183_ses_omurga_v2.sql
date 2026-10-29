-- SES-OMURGA-V2 (Kaan, 2026-10-29 — "Ses Omurgası v2", the voice/text assistant fix; docs/SES-MIMARI-V2.md).
--
-- 1. ses_turu_ac_v2      one round trip before a voice turn: turn registry (call + turn position, latest wins),
--                        the session row (windowed history), the doctor's profile + preferences, patient ownership of
--                        the token / open patient, and the chart version stamps used by the chart cache.
-- 2. asistan_gecmis_ekle append-only history + field-level active_context merge. Overlapping writers can no longer drop
--                        each other's turns; a superseded voice request (same call, same turn, newer request seen) is
--                        refused, so only the request ElevenLabs actually plays reaches the history.
-- 3. asistan_oturum_pencere  the ses-ekran poll reads a window of the history, not the whole array.
-- 4. hasta_dosya_surum   version stamp per patient, bumped by triggers on every table the chart package reads; the
--                        compiled chart cache (lib/doktor/ogrenme/dosyaOnbellek.ts) is keyed on it.
-- 5. ses_tur_olcum       one timing row per voice turn (observability). No transcript, no clinical content.
--
-- Everything is service_role only (server routes already hold the service key). HASTA-IZOLASYON: every function
-- narrows by doctor_id AND the row id; ownership answers are booleans, never another doctor's data.

-- ─────────────────────────── 4. chart version stamp (first: the turn RPC reads it) ───────────────────────────
create table if not exists public.hasta_dosya_surum (
  patient_id uuid primary key,
  surum bigint not null default 1,
  guncelleme timestamptz not null default now()
);
alter table public.hasta_dosya_surum enable row level security;
revoke all on public.hasta_dosya_surum from anon, authenticated;

create or replace function public.hasta_dosya_surum_artir()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  j jsonb;
begin
  j := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  if tg_table_name = 'patients' then
    hid := (j->>'id')::uuid;
  elsif tg_table_name = 'notes' then
    select s.patient_id into hid from sessions s where s.id = nullif(j->>'session_id', '')::uuid;
  else
    hid := nullif(j->>'patient_id', '')::uuid;
  end if;
  if hid is not null then
    insert into hasta_dosya_surum (patient_id, surum, guncelleme) values (hid, 1, now())
    on conflict (patient_id) do update set surum = hasta_dosya_surum.surum + 1, guncelleme = now();
  end if;
  return null;
exception when others then
  -- A version stamp must never block a clinical write; a missed bump only costs the cache TTL (10 min).
  return null;
end
$$;
revoke all on function public.hasta_dosya_surum_artir() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['patients','sessions','notes','hasta_ilaclar','asilar','hasta_intake_formlari','hasta_goruntulemeler',
                           'hasta_belgeler','belge_analizleri','randevular','lab_satirlar','goruntu_calisma','sevkler',
                           'mchat_testleri','gelisim_taramalari','pedi_taramalar','cihaz_olcumleri','hasta_tetkik_istemleri']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('create or replace trigger hasta_dosya_surum_trg after insert or update or delete on public.%I for each row execute function public.hasta_dosya_surum_artir()', t);
    end if;
  end loop;
end
$$;

-- ─────────────────────────── 1. voice turn open ───────────────────────────
-- karar:
--   'kopya'  same call, same turn position, same text, already answered (<= 120 s): replay the stored spoken text,
--            no brain, no seq bump (ElevenLabs asked again for a turn it already has).
--   'ustune' same call, same turn position, still open (<= 60 s): this request supersedes it (latest wins).
--   'yeni'   anything else.
-- sesTur.turlar maps turn position -> the latest request seq for that turn (last 10 turns); asistan_gecmis_ekle uses it.
create or replace function public.ses_turu_ac_v2(
  p_oturum uuid, p_doktor uuid, p_cagri text, p_tur int, p_mesaj text, p_anahtar text,
  p_hasta uuid default null, p_pencere int default 60)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  k jsonb;
  ayni_cagri boolean := false;
  yas_ms double precision := 1e12;
  karar text := 'yeni';
  seq int := 1;
  turlar jsonb := '{}'::jsonb;
  acik uuid := null;
  pencere int := greatest(1, least(coalesce(p_pencere, 60), 400));
  n int;
begin
  select id, messages, active_context, persona_id, patient_id
    into r
    from asistan_sessions
   where id = p_oturum and doctor_id = p_doktor
   for update;
  if not found then
    return jsonb_build_object('yok', true);
  end if;
  k := coalesce(r.active_context, '{}'::jsonb) -> 'sesTur';
  if k is not null and jsonb_typeof(k) = 'object' and (k->>'cagri') = p_cagri then
    ayni_cagri := true;
    begin
      yas_ms := extract(epoch from (now() - (k->>'zaman')::timestamptz)) * 1000;
    exception when others then
      yas_ms := 1e12;
    end;
    seq := coalesce((k->>'seq')::int, 0) + 1;
    turlar := coalesce(k->'turlar', '{}'::jsonb);
  end if;
  if ayni_cagri and (k->>'tur')::int = p_tur and coalesce(k->>'anahtar', '') = coalesce(p_anahtar, '')
     and k->>'durum' = 'bitti' and yas_ms <= 120000 then
    karar := 'kopya';
    seq := coalesce((k->>'seq')::int, 0);
  elsif ayni_cagri and (k->>'tur')::int = p_tur and (k->>'durum') is distinct from 'bitti' and yas_ms <= 60000 then
    karar := 'ustune';
  end if;
  if karar <> 'kopya' then
    turlar := turlar || jsonb_build_object(p_tur::text, seq);
    -- keep the last 10 turn positions only
    select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into turlar
      from jsonb_each(turlar) where key ~ '^[0-9]+$' and key::int > p_tur - 10;
    update asistan_sessions
       set active_context = (coalesce(active_context, '{}'::jsonb) - 'sesTurKilit' - 'sesSonSoz')
             || jsonb_build_object('sesTur', jsonb_build_object(
                  'cagri', left(coalesce(p_cagri, ''), 120),
                  'tur', p_tur,
                  'seq', seq,
                  'anahtar', left(coalesce(p_anahtar, ''), 200),
                  'zaman', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                  'durum', 'acik',
                  'turlar', turlar))
     where id = p_oturum and doctor_id = p_doktor;
  end if;
  begin
    acik := nullif(r.active_context->>'currentPatientId', '')::uuid;
  exception when others then
    acik := null;
  end;
  n := coalesce(jsonb_array_length(case when jsonb_typeof(r.messages) = 'array' then r.messages else '[]'::jsonb end), 0);
  return jsonb_build_object(
    'yok', false,
    'karar', karar,
    'seq', seq,
    'onceki', k,
    'satir', jsonb_build_object(
      'id', r.id,
      'messages', coalesce((
        select jsonb_agg(e order by i)
          from jsonb_array_elements(case when jsonb_typeof(r.messages) = 'array' then r.messages else '[]'::jsonb end) with ordinality a(e, i)
         where i > n - pencere), '[]'::jsonb),
      'active_context', coalesce(r.active_context, '{}'::jsonb),
      'persona_id', r.persona_id,
      'patient_id', r.patient_id),
    'profil', (select to_jsonb(u) from users u where u.id = p_doktor),
    'tercih', (select to_jsonb(d) from doctor_preferences d where d.doctor_id = p_doktor limit 1),
    'hastaSahibi', (p_hasta is null or exists (select 1 from patients p where p.id = p_hasta and p.doctor_id = p_doktor)),
    'acikHasta', acik,
    'acikHastaSahibi', (acik is not null and exists (select 1 from patients p where p.id = acik and p.doctor_id = p_doktor)),
    'surumler', coalesce((
      select jsonb_object_agg(s.patient_id::text, s.surum)
        from hasta_dosya_surum s
        join patients p on p.id = s.patient_id and p.doctor_id = p_doktor
       where s.patient_id in (p_hasta, acik)), '{}'::jsonb));
end
$$;
revoke all on function public.ses_turu_ac_v2(uuid, uuid, text, int, text, text, uuid, int) from public, anon, authenticated;
grant execute on function public.ses_turu_ac_v2(uuid, uuid, text, int, text, text, uuid, int) to service_role;

-- ─────────────────────────── 2. append-only history ───────────────────────────
create or replace function public.asistan_gecmis_ekle(
  p_oturum uuid, p_doktor uuid, p_yeni jsonb, p_yama jsonb, p_sil text[],
  p_tur_bas text default null, p_hasta_yaz uuid default null, p_hasta_null boolean default false,
  p_persona text default null, p_sifirla boolean default false,
  p_cagri text default null, p_tur int default null, p_seq int default null, p_soz text default null,
  p_azami int default 300)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ac jsonb;
  st jsonb;
  sayfa boolean := false;
  yama jsonb := coalesce(p_yama, '{}'::jsonb);
  yeni_ac jsonb;
  mesajlar jsonb;
  hasta uuid;
  turun_seq int;
  azami int := greatest(20, least(coalesce(p_azami, 300), 2000));
begin
  select coalesce(active_context, '{}'::jsonb), case when jsonb_typeof(messages) = 'array' then messages else '[]'::jsonb end, patient_id
    into ac, mesajlar, hasta
    from asistan_sessions
   where id = p_oturum and doctor_id = p_doktor
   for update;
  if not found then
    return jsonb_build_object('yazildi', false, 'yok', true);
  end if;
  st := ac->'sesTur';
  if p_cagri is not null and p_tur is not null and p_seq is not null and st is not null and (st->>'cagri') = p_cagri then
    turun_seq := nullif(st->'turlar'->>(p_tur::text), '')::int;
    if turun_seq is not null and turun_seq <> p_seq then
      return jsonb_build_object('yazildi', false, 'ustune', true);
    end if;
  end if;
  -- NOTYA-SAYFA-HASTA-01: the doctor opened another patient's page while this turn ran — that focus stays.
  sayfa := (ac->>'odakKaynak') = 'sayfa' and (ac->>'currentPatientId') is not null
           and coalesce(ac->>'odakZaman', '') > coalesce(p_tur_bas, '');
  if sayfa then
    yama := yama - 'currentPatientId' - 'patientName' - 'odakKaynak' - 'odakZaman' - 'sesDevam';
  end if;
  yama := yama - 'sesTur';
  yeni_ac := (ac - coalesce(p_sil, array[]::text[])) || yama;
  if p_cagri is not null and st is not null and (st->>'cagri') = p_cagri and (st->>'tur')::int = p_tur
     and coalesce((st->>'seq')::int, -1) = coalesce(p_seq, -2) then
    yeni_ac := jsonb_set(yeni_ac, '{sesTur}', (yeni_ac->'sesTur') || jsonb_build_object('durum', 'bitti', 'soz', left(coalesce(p_soz, ''), 2000)));
  end if;
  mesajlar := (case when p_sifirla then '[]'::jsonb else mesajlar end) || coalesce(p_yeni, '[]'::jsonb);
  if jsonb_array_length(mesajlar) > azami then
    select coalesce(jsonb_agg(e order by i), '[]'::jsonb) into mesajlar
      from jsonb_array_elements(mesajlar) with ordinality a(e, i)
     where i > jsonb_array_length(mesajlar) - azami;
  end if;
  update asistan_sessions
     set messages = mesajlar,
         active_context = yeni_ac,
         persona_id = coalesce(p_persona, persona_id),
         patient_id = case
           when sayfa then nullif(ac->>'currentPatientId', '')::uuid
           when p_hasta_yaz is not null then p_hasta_yaz
           when p_hasta_null then null
           else patient_id end
   where id = p_oturum and doctor_id = p_doktor;
  return jsonb_build_object('yazildi', true, 'sayfa', sayfa);
end
$$;
revoke all on function public.asistan_gecmis_ekle(uuid, uuid, jsonb, jsonb, text[], text, uuid, boolean, text, boolean, text, int, int, text, int) from public, anon, authenticated;
grant execute on function public.asistan_gecmis_ekle(uuid, uuid, jsonb, jsonb, text[], text, uuid, boolean, text, boolean, text, int, int, text, int) to service_role;

-- ─────────────────────────── 3. windowed session read (ses-ekran poll) ───────────────────────────
create or replace function public.asistan_oturum_pencere(p_oturum uuid, p_doktor uuid, p_pencere int default 40)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', s.id,
    'messages', coalesce((
      select jsonb_agg(e order by i)
        from jsonb_array_elements(case when jsonb_typeof(s.messages) = 'array' then s.messages else '[]'::jsonb end) with ordinality a(e, i)
       where i > coalesce(jsonb_array_length(case when jsonb_typeof(s.messages) = 'array' then s.messages else '[]'::jsonb end), 0)
                 - greatest(1, least(coalesce(p_pencere, 40), 400))), '[]'::jsonb),
    'active_context', coalesce(s.active_context, '{}'::jsonb))
  from asistan_sessions s
  where s.id = p_oturum and s.doctor_id = p_doktor
$$;
revoke all on function public.asistan_oturum_pencere(uuid, uuid, int) from public, anon, authenticated;
grant execute on function public.asistan_oturum_pencere(uuid, uuid, int) to service_role;

-- ─────────────────────────── 5. per-turn timing ───────────────────────────
create table if not exists public.ses_tur_olcum (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  doctor_id uuid not null,
  oturum_id uuid,
  cagri text,
  tur_no int,
  seq int,
  karar text,
  rota text,
  neden text,
  ustune_yazildi boolean not null default false,
  iptal boolean not null default false,
  varis timestamptz,
  ilk_bayt_ms int,
  ilk_soz_ms int,
  model_ttft_ms int,
  toplam_ms int,
  araclar text[],
  arac_sayisi int,
  bolge text
);
create index if not exists ses_tur_olcum_doktor_zaman on public.ses_tur_olcum (doctor_id, created_at desc);
alter table public.ses_tur_olcum enable row level security;
revoke all on public.ses_tur_olcum from anon, authenticated;
grant select, insert on public.ses_tur_olcum to service_role;
grant usage, select on sequence public.ses_tur_olcum_id_seq to service_role;
