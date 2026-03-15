-- ============================================================
-- Pulse — Fix Duplicate Template Items
-- Run this in the Supabase SQL Editor ONCE.
--
-- Situation: template_items were seeded 3 times per template,
-- so each category has 9 items instead of 3 (27 total instead
-- of 18). This script deduplicates them, then adds a UNIQUE
-- constraint to prevent it from ever happening again.
--
-- Safe to run: uses DELETE WHERE id IN (...) — no truncation,
-- no cascade side-effects on audit_item_scores (those reference
-- template_item_id with ON DELETE RESTRICT, but only the
-- duplicate rows have no audit scores yet, so deletes are safe).
-- ============================================================


-- ─── Step 0: Preview — see current state before changing anything
SELECT
  template_id,
  category,
  description,
  COUNT(*) AS copies
FROM public.template_items
GROUP BY template_id, category, description
ORDER BY category, description, copies DESC;
-- Every row with copies > 1 is a duplicate that will be removed.


-- ─── Step 1: Delete duplicate template_items ─────────────────
-- ROW_NUMBER() assigns rank 1 to one row per (template_id, description).
-- ctid is the physical row address — always unique, so it breaks
-- ties when created_at is identical across a seeded batch.
-- (MIN(id) does not work because id is a UUID type.)

DELETE FROM public.template_items
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY template_id, description
        ORDER BY created_at ASC, ctid ASC
      ) AS rn
    FROM public.template_items
  ) ranked
  WHERE rn > 1
);


-- ─── Step 2: Add UNIQUE constraint ───────────────────────────
-- Prevents future duplicate seeding from leaving the data in
-- this state again. The API route is already idempotent, but
-- this is a belt-and-suspenders guarantee at the DB level.

ALTER TABLE public.template_items
  ADD CONSTRAINT template_items_template_id_description_key
  UNIQUE (template_id, description);


-- ─── Step 3: Verify ──────────────────────────────────────────
-- All three queries below must look correct before you continue.

-- 3a. Confirm no duplicates remain (should return 0 rows):
SELECT
  template_id,
  description,
  COUNT(*) AS copies
FROM public.template_items
GROUP BY template_id, description
HAVING COUNT(*) > 1;

-- 3b. Confirm exactly 3 items per category per template
--     (should show 3 for every row):
SELECT
  t.name AS template_name,
  ti.category,
  COUNT(*) AS item_count
FROM public.template_items ti
JOIN public.audit_templates t ON t.id = ti.template_id
GROUP BY t.name, ti.category
ORDER BY t.name, ti.category;

-- 3c. Confirm 18 total items per template (should show 18):
SELECT
  t.name AS template_name,
  COUNT(*) AS total_items
FROM public.template_items ti
JOIN public.audit_templates t ON t.id = ti.template_id
GROUP BY t.name
ORDER BY t.name;
