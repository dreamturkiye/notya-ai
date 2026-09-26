-- 105 — NOTYA-MODEL-LUNA-01 (2026-09-26): ai_token_kullanim'a kademe + yükseltme nedeni.
-- HIZLI = GPT-6 Luna, GÜÇLÜ = Sonnet 5 (OpenRouter). "neden" GÜÇLÜ'ye neden gidildiğini sayar (Sonnet bütçe hedefi ~%15).
-- YALNIZ SAYAÇ: içerik / hasta verisi yok. YALNIZ EKLEME, idempotent. Uygulanmadan önce de kod çalışır
-- (lib/ai/kullanim.ts kolon yoksa eski satırı yazar).

alter table public.ai_token_kullanim add column if not exists kademe text check (kademe in ('guclu', 'hizli'));
alter table public.ai_token_kullanim add column if not exists neden text check (neden in ('transport', 'onayla', 'safety', 'vision', 'low_conf', 'uzman'));

create or replace view ai_token_kullanim_gunluk with (security_invoker = true) as
select
  date_trunc('day', created_at at time zone 'Europe/Istanbul')::date as gun,
  gorev,
  model,
  count(*) as cagri,
  sum(input_tokens) as input_tokens,
  sum(output_tokens) as output_tokens,
  sum(cache_read) as cache_read,
  sum(cache_creation) as cache_creation,
  sum(case when kesildi then 1 else 0 end) as kesilen,
  kademe,
  neden
from ai_token_kullanim
group by 1, 2, 3, kademe, neden;

revoke all on public.ai_token_kullanim_gunluk from anon, authenticated;
