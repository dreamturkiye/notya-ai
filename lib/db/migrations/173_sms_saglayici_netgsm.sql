-- 173_sms_saglayici_netgsm.sql
-- NETGSM-01 (Kaan, 2026-10-16): a second bulk-SMS adapter — the doctor's OWN NetGSM account — for doctors
-- who use an iPhone (an iPhone cannot run android-sms-gateway). Notya pays nothing and holds no SMS account;
-- the doctor pays NetGSM per message and pastes API credentials into Ayarlar › İletişim › SMS.
--
-- Additive and idempotent. The default provider STAYS 'android_sms_gateway', so every existing row and every
-- existing doctor is unaffected. The row-level policy from 166 ("hasta_izolasyon_kendi_satiri":
-- doctor_id = auth.uid()) already covers the new columns — unchanged, nothing broader is added. The server
-- reads/writes this table with the service role scoped by .eq('doctor_id', doktorId) (hasta-izolasyon skill).
--
-- NetGSM credentials are stored exactly like the Android gateway password: the password is encrypted at rest
-- (encryptPII → netgsm_sifre_encrypted) and never returned to the browser. The usercode and the approved
-- sender name ("başlık") are not secrets on their own and are stored in plaintext, like kullanici_adi.
-- (Number 172 is reserved by another job.)

alter table iletisim_sms_ayarlari add column if not exists netgsm_kullanici_adi text;
alter table iletisim_sms_ayarlari add column if not exists netgsm_sifre_encrypted text;
alter table iletisim_sms_ayarlari add column if not exists netgsm_baslik text;

-- Widen the provider check (166 created it inline: iletisim_sms_ayarlari_saglayici_check). Drop-if-exists + add
-- is safe to re-run.
alter table iletisim_sms_ayarlari drop constraint if exists iletisim_sms_ayarlari_saglayici_check;
alter table iletisim_sms_ayarlari add constraint iletisim_sms_ayarlari_saglayici_check
  check (saglayici in ('android_sms_gateway', 'netgsm'));

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('173', '173_sms_saglayici_netgsm.sql', null, now(), false,
  'NETGSM-01: iletisim_sms_ayarlari gains netgsm_kullanici_adi / netgsm_sifre_encrypted / netgsm_baslik and saglayici may be ''netgsm''; default stays android_sms_gateway')
on conflict (version) do nothing;

-- DOĞRULAMA (salt-okunur):
--   select column_name from information_schema.columns where table_name = 'iletisim_sms_ayarlari' and column_name like 'netgsm_%';
--   select pg_get_constraintdef(oid) from pg_constraint where conname = 'iletisim_sms_ayarlari_saglayici_check';
--   select tablename, policyname from pg_policies where tablename = 'iletisim_sms_ayarlari';
