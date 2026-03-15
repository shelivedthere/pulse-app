-- ============================================================
-- Pulse — Fix Duplicate Audit Templates
-- Run this in the Supabase SQL Editor ONCE.
--
-- Background: the on_org_created database trigger and the
-- original onboarding client code both created an audit_template
-- row on org creation, resulting in 2 rows per org. The
-- settings page uses .single() and returns null when it finds
-- 2 rows, causing "No template found."
--
-- This script:
--   1. Removes the duplicate (trigger-created) template and its
--      items, keeping the one created by the client (which has
--      the 18 seeded items linked to it via template_id).
--   2. Removes the now-redundant database trigger (seeding is
--      handled by the /api/onboarding/seed-template API route).
--   3. Verifies exactly one template exists per org.
-- ============================================================


-- ─── Step 1: Remove duplicate templates ──────────────────────
-- For each org that has more than one audit_template, keep the
-- one with the most template_items (the seeded one) and delete
-- the others.

WITH ranked AS (
  SELECT
    t.id,
    t.org_id,
    COUNT(ti.id) AS item_count,
    ROW_NUMBER() OVER (
      PARTITION BY t.org_id
      ORDER BY COUNT(ti.id) DESC, t.created_at ASC
    ) AS rn
  FROM public.audit_templates t
  LEFT JOIN public.template_items ti ON ti.template_id = t.id
  GROUP BY t.id, t.org_id
)
DELETE FROM public.audit_templates
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- Confirm: should return 0 rows (no orgs with duplicate templates)
SELECT org_id, COUNT(*) AS template_count
FROM public.audit_templates
GROUP BY org_id
HAVING COUNT(*) > 1;


-- ─── Step 2: Remove the database trigger ─────────────────────
-- Template seeding is now handled by the server-side API route
-- /api/onboarding/seed-template (uses service role, idempotent).
-- The trigger is no longer needed and caused the duplicate issue.

DROP TRIGGER IF EXISTS on_org_created ON public.organizations;
DROP FUNCTION IF EXISTS public.handle_new_org();
-- Note: seed_default_template() is also no longer needed,
-- but we leave it in place in case you want to call it manually.


-- ─── Step 3: Verify the result ───────────────────────────────
-- Run these SELECTs to confirm everything looks correct.

-- Should show exactly 1 row per org:
SELECT
  o.name AS org_name,
  t.id   AS template_id,
  t.name AS template_name,
  COUNT(ti.id) AS item_count
FROM public.organizations o
LEFT JOIN public.audit_templates t ON t.org_id = o.id
LEFT JOIN public.template_items ti ON ti.template_id = t.id
GROUP BY o.name, t.id, t.name
ORDER BY o.name;

-- Should show 18 items per template (6 categories × 3 items):
SELECT category, COUNT(*) AS item_count
FROM public.template_items
GROUP BY category
ORDER BY category;
