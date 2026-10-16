-- 167 — NOTYA-HASTA-ILETISIMI-01 hardening: resumable bulk sends + fail-closed e-mail.
--
-- A request that times out / crashes mid-send leaves recipient rows in 'bekliyor'. With only
-- unique(kampanya_id, patient_id, kanal) a retry skipped them forever. This adds the minimum
-- needed to resume safely WITHOUT weakening that unique guarantee:
--   talep_at  — when the row was last claimed for sending (insert time on first attempt).
--   deneme    — attempt counter, used as a compare-and-swap token so two concurrent retries
--               cannot both claim the same stale row (UPDATE ... WHERE deneme = <seen value>).
--               Capped in code (a row is re-attempted at most once; then it is marked basarisiz).
-- It also widens atlama_sebebi with the fail-closed / cleanup reason codes:
--   vazgec_baglantisi_yok — e-mail NOT sent because no unsubscribe link could be signed
--                           (PORTAL_TOKEN_SECRET unset). Never send mail without an opt-out.
--   hedef_disi            — a stale 'bekliyor' row whose patient left the audience; never sent.
--
-- ADDITIVE ONLY (two columns with defaults; CHECK widened to a superset). Idempotent.

alter table hasta_iletisim_kampanya_alicilari add column if not exists talep_at timestamptz;
alter table hasta_iletisim_kampanya_alicilari add column if not exists deneme integer not null default 1;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'hasta_iletisim_kampanya_alicilari_atlama_sebebi_check') then
    alter table hasta_iletisim_kampanya_alicilari drop constraint hasta_iletisim_kampanya_alicilari_atlama_sebebi_check;
  end if;
  alter table hasta_iletisim_kampanya_alicilari add constraint hasta_iletisim_kampanya_alicilari_atlama_sebebi_check
    check (atlama_sebebi is null or atlama_sebebi in ('izin_yok', 'adres_yok', 'gonderici_yok', 'vazgec_baglantisi_yok', 'hedef_disi'));
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('167', '167_hasta_iletisimi_toplu_devam.sql', null, now(), false,
  'NOTYA-HASTA-ILETISIMI-01 hardening: talep_at/deneme for resumable sends (atomic claim), atlama_sebebi += vazgec_baglantisi_yok, hedef_disi')
on conflict (version) do nothing;

-- DOĞRULAMA (salt-okunur):
--   select column_name from information_schema.columns where table_name = 'hasta_iletisim_kampanya_alicilari' and column_name in ('talep_at','deneme');
