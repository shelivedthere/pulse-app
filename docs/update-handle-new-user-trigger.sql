-- Migration: Update handle_new_user trigger to read invite metadata
-- Run this in the Supabase SQL Editor.
--
-- When a user signs up via an invite link, Supabase Auth stores the metadata
-- passed to inviteUserByEmail() in raw_user_meta_data. This trigger reads
-- org_id, role, and assigned_area_id from that metadata so the profile is
-- fully set up on first sign-in — no onboarding flow needed for invited users.

-- 1. Ensure profiles.assigned_area_id exists (safe no-op if already present)
alter table public.profiles
  add column if not exists assigned_area_id uuid references public.areas(id) on delete set null;


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

-- Verify the function was updated
select prosrc
from pg_proc
where proname = 'handle_new_user'
  and pronamespace = 'public'::regnamespace;
