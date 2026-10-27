-- Migration 181: STRIPE-NOTYA-01 (Kaan, 2026-10-27) — real Stripe billing for a doctor's OWN
-- Notya subscription (NOT lib/accounting/ — that module is the doctor billing THEIR patients;
-- this one is Notya billing the doctor).
--
-- `subscriptions` already existed as an iyzico-shaped stub (0 rows — never wired, per
-- docs/OPEN-COMMITMENTS.md STRIPE-NOTYA-01) with exactly the fields this job needs: tier, status,
-- trial_ends_at, current_period_start/end, user_count_limit (seats, for Hekim Koltuğu volume
-- pricing). We make it provider-agnostic and add Stripe's own identifiers instead of creating a
-- second table.
--
-- `users.subscription_tier` / `users.subscription_status` already exist and already default to
-- 'free' / 'active' — every hand-onboarded doctor (Dr. Gökhan included) already reads as active
-- today with no Stripe row at all. We add the Stripe identifiers there too (mirroring the
-- belt-and-suspenders pattern already used by app/api/users/trial) so the existing gates that
-- read users directly (app/api/sessions/start, app/api/doktor/seans-paketi, app/api/doktor/medula/
-- recete, lib/iletisim/kalkan) keep working unchanged, and stay untouched for every doctor who
-- never goes through the new Stripe checkout.

alter table public.subscriptions
  add column if not exists provider text not null default 'stripe' check (provider in ('iyzico', 'stripe')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text;

create unique index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id) where stripe_subscription_id is not null;

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

alter table public.users
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists trial_end timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

create unique index if not exists users_stripe_customer_id_idx
  on public.users (stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists users_stripe_subscription_id_idx
  on public.users (stripe_subscription_id) where stripe_subscription_id is not null;

comment on column public.users.subscription_status is
  'Default ''active'' protects every hand-onboarded doctor (STRIPE-NOTYA-01, 2026-10-27) — they
   have no stripe_subscription_id and are never touched by the webhook. Checkout-flow doctors get
   Stripe''s own values: trialing, active, past_due, canceled, unpaid. Gating in
   app/api/sessions/start only blocks canceled/unpaid, and only when stripe_subscription_id is set.';

alter table public.subscriptions enable row level security;
do $$
begin
  create policy "subscriptions_kendi_satiri" on public.subscriptions for select
    using (user_id = auth.uid());
exception when duplicate_object then null;
end $$;
