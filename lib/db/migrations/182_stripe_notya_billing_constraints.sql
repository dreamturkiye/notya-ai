-- Migration 182: STRIPE-NOTYA-01 follow-up — subscriptions.tier/status CHECK constraints were
-- hardcoded to an old, abandoned vocabulary (tier: starter/pro/klinik/hastane; status:
-- active/cancelled/past_due/trialing/paused — British spelling, no 'canceled'/'unpaid') that
-- matches neither the real product catalog (Metin Asistan, Sesli Pro, Muayenehane, Klinik Taban,
-- Klinik Hekim Koltuğu) nor Stripe's own subscription.status strings. Caught before the walkthrough
-- in this same job — would have failed every upsert from lib/billing/stripeSync.ts otherwise.

alter table public.subscriptions drop constraint if exists subscriptions_tier_check;
alter table public.subscriptions add constraint subscriptions_tier_check check (
  tier = any (array[
    'starter', 'pro', 'klinik', 'hastane',               -- legacy iyzico-era values, kept so dead code never 500s
    'metin_asistan', 'sesli_pro', 'muayenehane', 'klinik_taban', 'klinik_koltuk',  -- real catalog
    'unknown'                                              -- stripeSync fallback when a price id isn't in the catalog
  ])
);

alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check check (
  status = any (array[
    'active', 'cancelled', 'past_due', 'trialing', 'paused',  -- legacy values (British spelling)
    'canceled', 'unpaid', 'incomplete', 'incomplete_expired'  -- Stripe's own subscription.status strings
  ])
);

-- Same two vocabularies were hardcoded on users.subscription_tier / users.subscription_status —
-- caught the same way, same reason.
alter table public.users drop constraint if exists users_subscription_tier_check;
alter table public.users add constraint users_subscription_tier_check check (
  subscription_tier = any (array[
    'free', 'starter', 'pro', 'klinik', 'hastane',
    'metin_asistan', 'sesli_pro', 'muayenehane', 'klinik_taban', 'klinik_koltuk',
    'unknown'
  ])
);

alter table public.users drop constraint if exists users_subscription_status_check;
alter table public.users add constraint users_subscription_status_check check (
  subscription_status = any (array[
    'active', 'cancelled', 'past_due', 'trialing',
    'canceled', 'unpaid', 'incomplete', 'incomplete_expired'
  ])
);
