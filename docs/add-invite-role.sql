-- Migration: Add role column to invitations table
-- Run this in the Supabase SQL Editor before testing the invite form with role selection.

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'contributor'
    CHECK (role IN ('admin', 'contributor'));

-- Verify
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invitations'
  AND column_name = 'role';
