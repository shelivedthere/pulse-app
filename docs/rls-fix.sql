-- ============================================================
-- Pulse — RLS Policy Fix: organizations + profiles
-- Run this in the Supabase SQL Editor.
-- Uses DROP POLICY IF EXISTS so it is safe to run even if
-- some policies already exist from the original schema.sql.
-- ============================================================


-- ─── Ensure helper functions exist ───────────────────────────
-- (Recreating is safe — these are identical to schema.sql)

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


-- ─── organizations policies ───────────────────────────────────

drop policy if exists "Users can view their own organization"       on public.organizations;
drop policy if exists "Authenticated users can create an organization" on public.organizations;
drop policy if exists "Admins can update their organization"        on public.organizations;
drop policy if exists "Admins can delete their organization"        on public.organizations;

-- INSERT: any authenticated user may create one org (onboarding)
create policy "Authenticated users can create an organization"
  on public.organizations for insert
  with check (auth.uid() is not null);

-- SELECT: allow reading by org membership OR by being the creator.
-- The "created_by" fallback is essential during onboarding: the user has
-- just inserted the org row but their profile.org_id is still NULL, so
-- get_user_org_id() returns NULL and the membership check would fail.
-- Without this fallback the chained .insert().select('id') returns 403.
create policy "Users can view their own organization"
  on public.organizations for select
  using (
    id = public.get_user_org_id()
    or created_by = auth.uid()
  );

-- UPDATE: admin only, scoped to their org
create policy "Admins can update their organization"
  on public.organizations for update
  using (id = public.get_user_org_id() and public.is_org_admin());

-- DELETE: admin only, scoped to their org
create policy "Admins can delete their organization"
  on public.organizations for delete
  using (id = public.get_user_org_id() and public.is_org_admin());


-- ─── profiles policies ────────────────────────────────────────

drop policy if exists "Users can view profiles in their organization" on public.profiles;
drop policy if exists "Users can insert their own profile"           on public.profiles;
drop policy if exists "Users can update own profile; admins can update org members" on public.profiles;
drop policy if exists "Admins can delete org member profiles"        on public.profiles;

-- SELECT: own profile always visible; org members visible once org is set
create policy "Users can view profiles in their organization"
  on public.profiles for select
  using (
    id = auth.uid()
    or org_id = public.get_user_org_id()
  );

-- INSERT: users may only insert their own profile row.
-- The signup trigger (handle_new_user) runs as postgres and bypasses RLS,
-- so this policy covers any direct client-side inserts.
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- UPDATE: users may update their own row; admins may update org members.
-- The explicit WITH CHECK on (id = auth.uid()) ensures the onboarding
-- update (setting org_id + role = admin) is never blocked — the user's
-- own id never changes, so both USING and WITH CHECK pass cleanly.
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

-- DELETE: admin only
create policy "Admins can delete org member profiles"
  on public.profiles for delete
  using (org_id = public.get_user_org_id() and public.is_org_admin());
