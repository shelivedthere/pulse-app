-- ============================================================
-- Pulse — Action Items Table + RLS
-- Safe to run on existing database (uses IF NOT EXISTS /
-- DROP IF EXISTS). Run this before testing action item saves.
-- ============================================================


-- ─── Create table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.action_items (
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
  status              text not null default 'open'
                      check (status in ('open', 'in_progress', 'closed')),
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ─── updated_at trigger ──────────────────────────────────────

DROP TRIGGER IF EXISTS action_items_updated_at ON public.action_items;

CREATE TRIGGER action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS action_items_org_id_idx   ON public.action_items (org_id);
CREATE INDEX IF NOT EXISTS action_items_area_id_idx  ON public.action_items (area_id);
CREATE INDEX IF NOT EXISTS action_items_status_idx   ON public.action_items (status);
CREATE INDEX IF NOT EXISTS action_items_audit_id_idx ON public.action_items (audit_id);


-- ─── RLS ─────────────────────────────────────────────────────

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view action items"   ON public.action_items;
DROP POLICY IF EXISTS "Org members can insert action items" ON public.action_items;
DROP POLICY IF EXISTS "Org members can update action items" ON public.action_items;
DROP POLICY IF EXISTS "Admins can delete action items"      ON public.action_items;

CREATE POLICY "Org members can view action items"
  ON public.action_items FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Org members can insert action items"
  ON public.action_items FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Org members can update action items"
  ON public.action_items FOR UPDATE
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Admins can delete action items"
  ON public.action_items FOR DELETE
  USING (org_id = public.get_user_org_id() AND public.is_org_admin());
