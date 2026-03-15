-- ============================================================
-- Pulse — Clean Slate Template Reseed
-- Run this entire block in the Supabase SQL Editor at once.
--
-- WARNING: Step 1 also deletes audit_item_scores rows that
-- reference the old template_items. This removes per-item
-- scoring detail from past audits. The audit records themselves
-- (scores, summaries, action items) are NOT touched.
-- Only run this if you are OK losing that item-level detail.
-- ============================================================


DO $$
DECLARE
  r            RECORD;
  v_template   uuid;
BEGIN

  -- ── Step 1: Wipe existing template data ────────────────────
  -- audit_item_scores references template_items with ON DELETE
  -- RESTRICT, so it must be cleared first.
  DELETE FROM public.audit_item_scores;
  DELETE FROM public.template_items;
  DELETE FROM public.audit_templates;

  RAISE NOTICE 'Step 1 complete — all template data cleared';


  -- ── Steps 2–4: Reseed one template + 18 items per org ──────
  FOR r IN
    SELECT id AS org_id, created_by
    FROM public.organizations
    ORDER BY created_at ASC
  LOOP

    -- Step 2+3: Insert the audit template for this org
    INSERT INTO public.audit_templates (org_id, name, created_by)
    VALUES (r.org_id, 'Default 6S Template', r.created_by)
    RETURNING id INTO v_template;

    RAISE NOTICE 'Created template % for org %', v_template, r.org_id;

    -- Step 4: Insert the 18 default items
    INSERT INTO public.template_items
      (template_id, org_id, category, description, sort_order, is_default)
    VALUES
      -- Sort
      (v_template, r.org_id, 'Sort',         'Unnecessary items removed from work area',            1, true),
      (v_template, r.org_id, 'Sort',         'Only required tools and materials are present',        2, true),
      (v_template, r.org_id, 'Sort',         'Red tag process in use for questionable items',        3, true),
      -- Set in Order
      (v_template, r.org_id, 'Set in Order', 'All items have a designated location',                1, true),
      (v_template, r.org_id, 'Set in Order', 'Locations are clearly labeled or marked',             2, true),
      (v_template, r.org_id, 'Set in Order', 'Items are returned to their location after use',      3, true),
      -- Shine
      (v_template, r.org_id, 'Shine',        'Work area is clean and free of debris',               1, true),
      (v_template, r.org_id, 'Shine',        'Equipment is clean and in good condition',            2, true),
      (v_template, r.org_id, 'Shine',        'Cleaning responsibilities are clearly assigned',      3, true),
      -- Standardize
      (v_template, r.org_id, 'Standardize',  'Visual standards are posted and visible',             1, true),
      (v_template, r.org_id, 'Standardize',  '5S standards are documented and accessible',          2, true),
      (v_template, r.org_id, 'Standardize',  'Area layout matches the standard visual',             3, true),
      -- Sustain
      (v_template, r.org_id, 'Sustain',      'Audit is being performed on schedule',                1, true),
      (v_template, r.org_id, 'Sustain',      'Team members follow 6S standards consistently',      2, true),
      (v_template, r.org_id, 'Sustain',      'Previous audit findings have been addressed',         3, true),
      -- Safety
      (v_template, r.org_id, 'Safety',       'Emergency exits are clear and unobstructed',          1, true),
      (v_template, r.org_id, 'Safety',       'PPE is available and properly stored',                2, true),
      (v_template, r.org_id, 'Safety',       'Hazardous materials are properly labeled and stored', 3, true);

    RAISE NOTICE 'Seeded 18 items for template %', v_template;

  END LOOP;

  RAISE NOTICE 'Steps 2–4 complete — all orgs reseeded';


  -- ── Step 5: Add UNIQUE constraint ──────────────────────────
  -- Drop first in case a previous attempt left it behind.
  ALTER TABLE public.template_items
    DROP CONSTRAINT IF EXISTS template_items_unique_per_template;

  ALTER TABLE public.template_items
    ADD CONSTRAINT template_items_unique_per_template
    UNIQUE (template_id, description);

  RAISE NOTICE 'Step 5 complete — UNIQUE constraint added';

END;
$$;


-- ── Step 6: Verify ───────────────────────────────────────────
-- Run these three checks. All values should be exactly as shown.

-- 6a. No duplicates (should return 0 rows):
SELECT template_id, description, COUNT(*) AS copies
FROM public.template_items
GROUP BY template_id, description
HAVING COUNT(*) > 1;

-- 6b. Exactly 3 items per category per template:
SELECT
  t.name        AS template_name,
  ti.category,
  COUNT(*)      AS item_count
FROM public.template_items ti
JOIN public.audit_templates t ON t.id = ti.template_id
GROUP BY t.name, ti.category
ORDER BY t.name, ti.category;

-- 6c. Exactly 18 items total per template:
SELECT
  t.name    AS template_name,
  COUNT(*) AS total_items
FROM public.template_items ti
JOIN public.audit_templates t ON t.id = ti.template_id
GROUP BY t.name
ORDER BY t.name;
