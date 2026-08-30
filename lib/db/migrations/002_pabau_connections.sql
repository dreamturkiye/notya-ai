-- NOTYA-PABAU-01 — pabau_connections
-- The Pabau routes have queried this table since the first integration commit, but no migration
-- ever created it: the connect flow was written against an OAuth dance Pabau does not document.
-- Pabau's real integration auth is an API key created by the clinic (Setup → Developer Hub) or
-- handed to a marketplace app's configuration page. We store that key AES-256-GCM encrypted;
-- key_hint holds the last 4 characters for display only. One connection per user.

create table if not exists public.pabau_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  api_key_encrypted text not null,
  key_hint text not null default '',
  pabau_company_id text,
  last_synced_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pabau_connections enable row level security;
-- Service-role only: every access goes through our API routes, which scope by the
-- authenticated user. No anon/authenticated policies on purpose.

comment on table public.pabau_connections is
  'Encrypted Pabau API key per user. Written by /api/pabau/connect-key, read by /api/pabau/*.';
