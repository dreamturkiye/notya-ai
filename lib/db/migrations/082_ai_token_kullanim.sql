-- 082 — NOTYA-MALIYET-01 (2026-09-19): Claude çağrı başına token sayaçları (maliyet izleme).
-- AD: ai_token_kullanim — "ai_kullanim" NOTYA-KOTA-01 günlük kota tablosudur (doctor_id, gun, kova, sayac); ona dokunulmaz.
-- YALNIZ SAYAÇ: prompt, yanıt, hasta adı / kimliği / klinik içerik YAZILMAZ. patient_id kolonu BİLEREK yok.
-- Yazan: lib/ai/cagir.ts → lib/ai/kullanim.ts (servis rolü). İstemciden yazma yok.
-- YALNIZ EKLEME: yeni tablo + indeks + RLS. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.

create table if not exists ai_token_kullanim (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- çağrıyı tetikleyen hekim/kullanıcı (bilinmiyorsa null: arka plan işleri, portal, WhatsApp girişi)
  doctor_id uuid references auth.users(id) on delete set null,
  -- lib/ai/modeller.ts Gorev (soap, klinik-analiz, goruntu-inceleme, sohbet …)
  gorev text not null,
  -- yanıtı üreten model (API yanıtındaki model alanı)
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cache_read integer not null default 0 check (cache_read >= 0),
  cache_creation integer not null default 0 check (cache_creation >= 0),
  -- stop_reason = max_tokens (F3 kesilme izleme)
  kesildi boolean not null default false
);
create index if not exists ai_token_kullanim_zaman_idx on ai_token_kullanim (created_at desc);
create index if not exists ai_token_kullanim_gorev_idx on ai_token_kullanim (gorev, created_at desc);
create index if not exists ai_token_kullanim_doktor_idx on ai_token_kullanim (doctor_id, created_at desc);

-- RLS: servis rolü RLS'i atlar (yazma yalnız sunucudan). Hekim yalnız KENDİ satırlarını okuyabilir; ekleme/güncelleme/
-- silme politikası YOK → istemci (anon/authenticated) yazamaz.
alter table public.ai_token_kullanim enable row level security;
do $$
begin
  create policy "ai_token_kullanim_kendi_satiri_oku" on public.ai_token_kullanim for select to authenticated using (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- Maliyet izleme görünümü: gün × görev × model toplamları (içerik yok). Yalnız servis rolü / SQL Editor okur.
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
  sum(case when kesildi then 1 else 0 end) as kesilen
from ai_token_kullanim
group by 1, 2, 3;

-- Görünüm yalnız servis rolü / SQL Editor içindir (security_invoker RLS'i zaten uygular; ek olarak istemci rollerinden geri alınır).
revoke all on public.ai_token_kullanim_gunluk from anon, authenticated;
