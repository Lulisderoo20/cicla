create table if not exists public.cicla_shares (
  share_id text primary key,
  owner_secret text not null,
  partner_token text not null,
  owner_name text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists cicla_shares_partner_idx
  on public.cicla_shares (share_id, partner_token);

alter table public.cicla_shares enable row level security;

drop policy if exists "cicla_shares_public_rw" on public.cicla_shares;

create policy "cicla_shares_public_rw"
  on public.cicla_shares
  for all
  to anon
  using (true)
  with check (true);
