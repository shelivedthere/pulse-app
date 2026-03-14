-- ============================================================
-- Pulse — RBAC Migration (F12)
-- Run this in the Supabase SQL Editor after schema.sql
-- ============================================================


-- ─── area_assignments ────────────────────────────────────────
-- Links contributor users to the specific areas they're responsible for.
-- Admins are not constrained by assignments — they see everything.

create table if not exists public.area_assignments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  area_id     uuid not null references public.areas(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, area_id)
);

create index on public.area_assignments (org_id);
create index on public.area_assignments (user_id);
create index on public.area_assignments (area_id);

alter table public.area_assignments enable row level security;

create policy "Org members can view area assignments"
  on public.area_assignments for select
  using (org_id = public.get_user_org_id());

create policy "Admins can insert area assignments"
  on public.area_assignments for insert
  with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete area assignments"
  on public.area_assignments for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());


-- ─── invitations ─────────────────────────────────────────────
-- Pending invitations sent by admins to prospective contributors.

create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null,
  area_id     uuid not null references public.areas(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_by  uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create index on public.invitations (token);
create index on public.invitations (org_id);
create index on public.invitations (email);

alter table public.invitations enable row level security;

-- Admins manage invitations for their org
create policy "Admins can view org invitations"
  on public.invitations for select
  using (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can insert invitations"
  on public.invitations for insert
  with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can update invitations"
  on public.invitations for update
  using (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete invitations"
  on public.invitations for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());
