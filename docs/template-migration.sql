-- ============================================================
-- Pulse — Template Migration
-- Run this entire file in the Supabase SQL Editor.
-- Safe to run on a fresh database (no existing template data).
-- ============================================================


-- ─── 1. Fix the category check constraint ────────────────────
-- Rename 'Set' → 'Set in Order' to match the 6S terminology.

ALTER TABLE public.template_items
  DROP CONSTRAINT IF EXISTS template_items_category_check;

ALTER TABLE public.template_items
  ADD CONSTRAINT template_items_category_check
  CHECK (category IN ('Sort', 'Set in Order', 'Shine', 'Standardize', 'Sustain', 'Safety'));


-- ─── 2. Add is_default column ────────────────────────────────
-- Marks seeded items as non-deletable in the UI.

ALTER TABLE public.template_items
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;


-- ─── 3. Seed function ────────────────────────────────────────
-- Creates the audit template + 18 default items for a new org.
-- Called by the trigger below; never needs to be run manually.

CREATE OR REPLACE FUNCTION public.seed_default_template(
  p_org_id    uuid,
  p_creator   uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  -- Create the org's audit template
  INSERT INTO public.audit_templates (org_id, name, created_by)
  VALUES (p_org_id, '6S Audit Template', p_creator)
  RETURNING id INTO v_template_id;

  -- Seed the 18 default checklist items
  INSERT INTO public.template_items
    (template_id, org_id, category, description, sort_order, is_default)
  VALUES
    -- Sort
    (v_template_id, p_org_id, 'Sort',         'Unnecessary items removed from work area',            1, true),
    (v_template_id, p_org_id, 'Sort',         'Only required tools and materials are present',        2, true),
    (v_template_id, p_org_id, 'Sort',         'Red tag process in use for questionable items',        3, true),
    -- Set in Order
    (v_template_id, p_org_id, 'Set in Order', 'All items have a designated location',                1, true),
    (v_template_id, p_org_id, 'Set in Order', 'Locations are clearly labeled or marked',             2, true),
    (v_template_id, p_org_id, 'Set in Order', 'Items are returned to their location after use',      3, true),
    -- Shine
    (v_template_id, p_org_id, 'Shine',        'Work area is clean and free of debris',               1, true),
    (v_template_id, p_org_id, 'Shine',        'Equipment is clean and in good condition',            2, true),
    (v_template_id, p_org_id, 'Shine',        'Cleaning responsibilities are clearly assigned',      3, true),
    -- Standardize
    (v_template_id, p_org_id, 'Standardize',  'Visual standards are posted and visible',             1, true),
    (v_template_id, p_org_id, 'Standardize',  '5S standards are documented and accessible',          2, true),
    (v_template_id, p_org_id, 'Standardize',  'Area layout matches the standard visual',             3, true),
    -- Sustain
    (v_template_id, p_org_id, 'Sustain',      'Audit is being performed on schedule',                1, true),
    (v_template_id, p_org_id, 'Sustain',      'Team members follow 6S standards consistently',      2, true),
    (v_template_id, p_org_id, 'Sustain',      'Previous audit findings have been addressed',         3, true),
    -- Safety
    (v_template_id, p_org_id, 'Safety',       'Emergency exits are clear and unobstructed',          1, true),
    (v_template_id, p_org_id, 'Safety',       'PPE is available and properly stored',                2, true),
    (v_template_id, p_org_id, 'Safety',       'Hazardous materials are properly labeled and stored', 3, true);
END;
$$;


-- ─── 4. Trigger: auto-seed on org creation ───────────────────

CREATE OR REPLACE FUNCTION public.handle_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only seed if created_by is set (always true from onboarding)
  IF new.created_by IS NOT NULL THEN
    PERFORM public.seed_default_template(new.id, new.created_by);
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_org_created ON public.organizations;

CREATE TRIGGER on_org_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_org();


-- ─── 5. RLS policies for template tables ─────────────────────
-- Drops and recreates to ensure they exist regardless of whether
-- schema.sql was run previously.

-- audit_templates
DROP POLICY IF EXISTS "Org members can view audit templates"  ON public.audit_templates;
DROP POLICY IF EXISTS "Admins can insert audit templates"     ON public.audit_templates;
DROP POLICY IF EXISTS "Admins can update audit templates"     ON public.audit_templates;
DROP POLICY IF EXISTS "Admins can delete audit templates"     ON public.audit_templates;

CREATE POLICY "Org members can view audit templates"
  ON public.audit_templates FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Admins can insert audit templates"
  ON public.audit_templates FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id() AND public.is_org_admin());

CREATE POLICY "Admins can update audit templates"
  ON public.audit_templates FOR UPDATE
  USING (org_id = public.get_user_org_id() AND public.is_org_admin());

CREATE POLICY "Admins can delete audit templates"
  ON public.audit_templates FOR DELETE
  USING (org_id = public.get_user_org_id() AND public.is_org_admin());

-- template_items
DROP POLICY IF EXISTS "Org members can view template items"  ON public.template_items;
DROP POLICY IF EXISTS "Admins can insert template items"     ON public.template_items;
DROP POLICY IF EXISTS "Admins can update template items"     ON public.template_items;
DROP POLICY IF EXISTS "Admins can delete template items"     ON public.template_items;

CREATE POLICY "Org members can view template items"
  ON public.template_items FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Admins can insert template items"
  ON public.template_items FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id() AND public.is_org_admin());

CREATE POLICY "Admins can update template items"
  ON public.template_items FOR UPDATE
  USING (org_id = public.get_user_org_id() AND public.is_org_admin());

-- Allow deletion only of custom items (is_default = false)
CREATE POLICY "Admins can delete custom template items"
  ON public.template_items FOR DELETE
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
    AND is_default = false
  );

-- area_template_items
DROP POLICY IF EXISTS "Org members can view area template items"   ON public.area_template_items;
DROP POLICY IF EXISTS "Admins can insert area template items"      ON public.area_template_items;
DROP POLICY IF EXISTS "Admins can update area template items"      ON public.area_template_items;
DROP POLICY IF EXISTS "Admins can delete area template items"      ON public.area_template_items;

CREATE POLICY "Org members can view area template items"
  ON public.area_template_items FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Admins can insert area template items"
  ON public.area_template_items FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id() AND public.is_org_admin());

CREATE POLICY "Admins can update area template items"
  ON public.area_template_items FOR UPDATE
  USING (org_id = public.get_user_org_id() AND public.is_org_admin());

CREATE POLICY "Admins can delete area template items"
  ON public.area_template_items FOR DELETE
  USING (org_id = public.get_user_org_id() AND public.is_org_admin());
