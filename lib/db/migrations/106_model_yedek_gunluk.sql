-- 106 — NOTYA-MODEL-LUNAPRO-01 (2026-09-27): birincil GPT-6 Luna-Pro, koruyucu Sonnet 5 (dört kapı: G1 transport,
-- G2 low_conf, G3 safety, G4 devre). 105'in neden kısıtına 'devre' eklenir; koruyucu payını gün × görev izleyen görünüm.
-- Ölçüt: koruyucu payı (hedef < %15). YALNIZ SAYAÇ: içerik / hasta verisi yok. YALNIZ EKLEME, idempotent.
-- Uygulanmadan önce de kod çalışır (lib/ai/kullanim.ts check ihlalinde satırı neden'siz yazar).
-- Uygulama: node scripts/run-sql-migration.mjs lib/db/migrations/106_model_yedek_gunluk.sql (Claude — canlı denetimle birlikte)

-- Emekli nedenler (onayla, vision, uzman) geçmiş satırlar için listede kalır.
alter table public.ai_token_kullanim drop constraint if exists ai_token_kullanim_neden_check;
alter table public.ai_token_kullanim add constraint ai_token_kullanim_neden_check
  check (neden in ('transport', 'onayla', 'safety', 'vision', 'low_conf', 'uzman', 'devre'));

create or replace view v_model_yedek_gunluk with (security_invoker = true) as
select
  date_trunc('day', created_at at time zone 'Europe/Istanbul')::date as gun,
  gorev,
  count(*) as toplam_cagri,
  count(*) filter (where kademe = 'guclu') as koruyucu_cagri,
  round(count(*) filter (where kademe = 'guclu')::numeric / nullif(count(*), 0), 4) as koruyucu_payi,
  count(*) filter (where neden = 'transport') as neden_transport,
  count(*) filter (where neden = 'low_conf') as neden_low_conf,
  count(*) filter (where neden = 'safety') as neden_safety,
  count(*) filter (where neden = 'devre') as neden_devre,
  count(*) filter (where kademe = 'guclu' and neden is null) as neden_bilinmiyor
from ai_token_kullanim
group by 1, 2;

revoke all on public.v_model_yedek_gunluk from anon, authenticated;
