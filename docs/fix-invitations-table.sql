-- Fix: Ensure invitations table is complete and correct
-- Safe to run even if the table already partially exists.

-- 1. Create table if missing
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

-- 2. Add any missing columns (safe if they already exist)
alter table public.invitations
  add column if not exists role text not null default 'contributor'
    check (role in ('admin', 'contributor'));

alter table public.invitations
  add column if not exists token uuid not null default gen_random_uuid();

alter table public.invitations
  add column if not exists accepted_at timestamptz;

alter table public.invitations
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- 3. Ensure unique index on token
create unique index if not exists invitations_token_idx on public.invitations (token);
create index if not exists invitations_org_id_idx on public.invitations (org_id);

-- 4. Enable RLS
alter table public.invitations enable row level security;

-- 5. Recreate policies (drop first so this is idempotent)
drop policy if exists "Admins can view org invitations"  on public.invitations;
drop policy if exists "Admins can insert invitations"    on public.invitations;
drop policy if exists "Admins can delete invitations"    on public.invitations;

create policy "Admins can view org invitations"
  on public.invitations for select
  using (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can insert invitations"
  on public.invitations for insert
  with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete invitations"
  on public.invitations for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());

-- 6. Verify final state
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'invitations'
order by ordinal_position;
