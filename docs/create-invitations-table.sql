-- Migration: Create invitations table
-- Run this in the Supabase SQL Editor.
-- The invite flow uses a custom token-based system (NOT Supabase Auth invites).

create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null,
  area_id     uuid not null references public.areas(id) on delete cascade,
  role        text not null default 'contributor'
                check (role in ('admin', 'contributor')),
  token       uuid not null default gen_random_uuid(),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (token)
);

create index if not exists invitations_org_id_idx on public.invitations (org_id);
create index if not exists invitations_token_idx  on public.invitations (token);

alter table public.invitations enable row level security;

-- Admins can view pending invitations for their org
create policy "Admins can view org invitations"
  on public.invitations for select
  using (org_id = public.get_user_org_id() and public.is_org_admin());

-- Admins can create invitations
create policy "Admins can insert invitations"
  on public.invitations for insert
  with check (org_id = public.get_user_org_id() and public.is_org_admin());

-- Admins can delete (cancel) invitations
create policy "Admins can delete invitations"
  on public.invitations for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());

-- Verify
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'invitations'
order by ordinal_position;
