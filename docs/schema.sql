-- ============================================================
-- Pulse — Complete Database Schema
-- Run this entire file in the Supabase SQL Editor (one paste)
-- Project URL: https://iiwpeqrzobfsziizwfsf.supabase.co
-- ============================================================


-- ─── Helper: auto-update updated_at columns ─────────────────

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─── 1. organizations ────────────────────────────────────────

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);


-- ─── 2. profiles ─────────────────────────────────────────────
-- One row per auth user. Created automatically on sign-up via trigger.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid references public.organizations(id) on delete set null,
  full_name   text,
  email       text,
  role        text check (role in ('admin', 'contributor')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _org_id           uuid;
  _role             text;
  _assigned_area_id uuid;
begin
  -- Read invite metadata if present (null-safe — regular sign-ups have no metadata)
  _org_id           := (new.raw_user_meta_data->>'org_id')::uuid;
  _role             := new.raw_user_meta_data->>'role';
  _assigned_area_id := (new.raw_user_meta_data->>'assigned_area_id')::uuid;

  -- Validate role value — fall back to null if something unexpected was passed
  if _role not in ('admin', 'contributor') then
    _role := null;
  end if;

  insert into public.profiles (id, email, org_id, role, assigned_area_id)
  values (new.id, new.email, _org_id, _role, _assigned_area_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── 3. areas ────────────────────────────────────────────────

create table public.areas (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger areas_updated_at
  before update on public.areas
  for each row execute function public.handle_updated_at();


-- ─── 4. audit_templates ──────────────────────────────────────
-- One master template per organization.

create table public.audit_templates (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null default '6S Audit Template',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger audit_templates_updated_at
  before update on public.audit_templates
  for each row execute function public.handle_updated_at();


-- ─── 5. template_items ───────────────────────────────────────
-- Individual checklist line items, grouped by 6S category.

create table public.template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.audit_templates(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  category    text not null check (category in (
                'Sort', 'Set', 'Shine', 'Standardize', 'Sustain', 'Safety'
              )),
  description text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);


-- ─── 6. area_template_items ──────────────────────────────────
-- Per-area overrides: admins can toggle individual items off for specific areas.

create table public.area_template_items (
  id               uuid primary key default gen_random_uuid(),
  area_id          uuid not null references public.areas(id) on delete cascade,
  template_item_id uuid not null references public.template_items(id) on delete cascade,
  org_id           uuid not null references public.organizations(id) on delete cascade,
  is_active        boolean not null default true,
  unique (area_id, template_item_id)
);


-- ─── 7. audits ───────────────────────────────────────────────

create table public.audits (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  area_id       uuid not null references public.areas(id) on delete cascade,
  conducted_by  uuid references auth.users(id) on delete set null,
  score         numeric(5, 2) check (score >= 0 and score <= 100),
  ai_summary    text,
  submitted_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);


-- ─── 8. audit_item_scores ────────────────────────────────────
-- One score row per template item per audit.

create table public.audit_item_scores (
  id               uuid primary key default gen_random_uuid(),
  audit_id         uuid not null references public.audits(id) on delete cascade,
  template_item_id uuid not null references public.template_items(id) on delete restrict,
  org_id           uuid not null references public.organizations(id) on delete cascade,
  score            text not null check (score in ('pass', 'partial', 'fail')),
  note             text,
  created_at       timestamptz not null default now(),
  unique (audit_id, template_item_id)
);


-- ─── 9. action_items ─────────────────────────────────────────

create table public.action_items (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id) on delete cascade,
  area_id             uuid not null references public.areas(id) on delete cascade,
  audit_id            uuid references public.audits(id) on delete set null,
  audit_item_score_id uuid references public.audit_item_scores(id) on delete set null,
  description         text not null,
  raw_finding         text,
  owner_name          text,
  owner_email         text,
  due_date            date,
  status              text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger action_items_updated_at
  before update on public.action_items
  for each row execute function public.handle_updated_at();


-- ─── 10. invitations ──────────────────────────────────────────
-- Custom token-based invite flow. Invited users receive an email with a
-- link containing `token`. The accept route sets their profile's org/role.

create table public.invitations (
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


-- ─── Indexes ─────────────────────────────────────────────────

create index on public.profiles (org_id);
create index on public.areas (org_id);
create index on public.audit_templates (org_id);
create index on public.template_items (template_id);
create index on public.template_items (org_id);
create index on public.area_template_items (area_id);
create index on public.area_template_items (template_item_id);
create index on public.audits (org_id, area_id);
create index on public.audits (area_id);
create index on public.audits (submitted_at);
create index on public.audit_item_scores (audit_id);
create index on public.action_items (org_id);
create index on public.action_items (area_id);
create index on public.action_items (status);
create index on public.invitations (org_id);
create index on public.invitations (token);


-- ─── Row Level Security ──────────────────────────────────────

alter table public.organizations      enable row level security;
alter table public.profiles           enable row level security;
alter table public.areas              enable row level security;
alter table public.audit_templates    enable row level security;
alter table public.template_items     enable row level security;
alter table public.area_template_items enable row level security;
alter table public.audits             enable row level security;
alter table public.audit_item_scores  enable row level security;
alter table public.action_items       enable row level security;
alter table public.invitations        enable row level security;


-- ─── RLS Helper Functions ────────────────────────────────────
-- security definer prevents RLS recursion when reading profiles

create or replace function public.get_user_org_id()
returns uuid
language sql
security definer
stable
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_org_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  )
$$;


-- ─── RLS Policies: organizations ─────────────────────────────

create policy "Users can view their own organization"
  on public.organizations for select
  using (
    id = public.get_user_org_id()
    or created_by = auth.uid()
  );

create policy "Authenticated users can create an organization"
  on public.organizations for insert
  with check (auth.uid() is not null);

create policy "Admins can update their organization"
  on public.organizations for update
  using (id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete their organization"
  on public.organizations for delete
  using (id = public.get_user_org_id() and public.is_org_admin());


-- ─── RLS Policies: profiles ──────────────────────────────────

create policy "Users can view profiles in their organization"
  on public.profiles for select
  using (org_id = public.get_user_org_id() or id = auth.uid());

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Users can update own profile; admins can update org members"
  on public.profiles for update
  using (
    id = auth.uid()
    or (org_id = public.get_user_org_id() and public.is_org_admin())
  )
  with check (
    id = auth.uid()
    or (org_id = public.get_user_org_id() and public.is_org_admin())
  );

create policy "Admins can delete org member profiles"
  on public.profiles for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());


-- ─── RLS Policies: areas ─────────────────────────────────────

create policy "Org members can view areas"
  on public.areas for select
  using (org_id = public.get_user_org_id());

create policy "Admins can insert areas"
  on public.areas for insert
  with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can update areas"
  on public.areas for update
  using (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete areas"
  on public.areas for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());


-- ─── RLS Policies: audit_templates ───────────────────────────

create policy "Org members can view audit templates"
  on public.audit_templates for select
  using (org_id = public.get_user_org_id());

create policy "Admins can insert audit templates"
  on public.audit_templates for insert
  with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can update audit templates"
  on public.audit_templates for update
  using (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete audit templates"
  on public.audit_templates for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());


-- ─── RLS Policies: template_items ────────────────────────────

create policy "Org members can view template items"
  on public.template_items for select
  using (org_id = public.get_user_org_id());

create policy "Admins can insert template items"
  on public.template_items for insert
  with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can update template items"
  on public.template_items for update
  using (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete template items"
  on public.template_items for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());


-- ─── RLS Policies: area_template_items ───────────────────────

create policy "Org members can view area template items"
  on public.area_template_items for select
  using (org_id = public.get_user_org_id());

create policy "Admins can insert area template items"
  on public.area_template_items for insert
  with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can update area template items"
  on public.area_template_items for update
  using (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete area template items"
  on public.area_template_items for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());


-- ─── RLS Policies: audits ────────────────────────────────────

create policy "Org members can view audits"
  on public.audits for select
  using (org_id = public.get_user_org_id());

create policy "Org members can insert audits"
  on public.audits for insert
  with check (org_id = public.get_user_org_id());

create policy "Conductors and admins can update audits"
  on public.audits for update
  using (org_id = public.get_user_org_id()
    and (conducted_by = auth.uid() or public.is_org_admin()));

create policy "Admins can delete audits"
  on public.audits for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());


-- ─── RLS Policies: audit_item_scores ─────────────────────────

create policy "Org members can view audit item scores"
  on public.audit_item_scores for select
  using (org_id = public.get_user_org_id());

create policy "Org members can insert audit item scores"
  on public.audit_item_scores for insert
  with check (org_id = public.get_user_org_id());

create policy "Org members can update audit item scores"
  on public.audit_item_scores for update
  using (org_id = public.get_user_org_id());

create policy "Admins can delete audit item scores"
  on public.audit_item_scores for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());


-- ─── RLS Policies: action_items ──────────────────────────────

create policy "Org members can view action items"
  on public.action_items for select
  using (org_id = public.get_user_org_id());

create policy "Org members can insert action items"
  on public.action_items for insert
  with check (org_id = public.get_user_org_id());

create policy "Org members can update action items"
  on public.action_items for update
  using (org_id = public.get_user_org_id());

create policy "Admins can delete action items"
  on public.action_items for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());


-- ─── RLS Policies: invitations ───────────────────────────────

create policy "Admins can view org invitations"
  on public.invitations for select
  using (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can insert invitations"
  on public.invitations for insert
  with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete invitations"
  on public.invitations for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());
