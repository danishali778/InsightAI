-- Migration 012: Enforce private-only dashboards while public sharing is disabled.

UPDATE public.dashboards
SET is_public = false
WHERE is_public IS DISTINCT FROM false;

ALTER TABLE public.dashboards
  ALTER COLUMN is_public SET DEFAULT false;

ALTER TABLE public.dashboards
  ALTER COLUMN is_public SET NOT NULL;

ALTER TABLE public.dashboards
  DROP CONSTRAINT IF EXISTS dashboards_private_only;

ALTER TABLE public.dashboards
  ADD CONSTRAINT dashboards_private_only CHECK (is_public = false);
