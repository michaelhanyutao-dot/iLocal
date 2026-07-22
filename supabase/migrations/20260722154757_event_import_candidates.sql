CREATE TABLE IF NOT EXISTS public.event_import_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_platform IN ('xiaohongshu', 'manual', 'wechat', 'instagram', 'website', 'other')),
  source_url TEXT,
  source_title TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_event JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'imported')),
  quality_score DECIMAL(5, 2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  imported_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  imported_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.event_import_candidates ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_import_candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_import_candidates TO service_role;

CREATE INDEX IF NOT EXISTS event_import_candidates_status_idx
ON public.event_import_candidates (status, created_at DESC);

CREATE INDEX IF NOT EXISTS event_import_candidates_source_platform_idx
ON public.event_import_candidates (source_platform, created_at DESC);

CREATE INDEX IF NOT EXISTS event_import_candidates_created_by_idx
ON public.event_import_candidates (created_by);

DROP POLICY IF EXISTS "Moderators can view event import candidates" ON public.event_import_candidates;
CREATE POLICY "Moderators can view event import candidates"
ON public.event_import_candidates
FOR SELECT
TO authenticated
USING (
  public.has_role((select auth.uid()), 'admin')
  OR public.has_role((select auth.uid()), 'moderator')
);

DROP POLICY IF EXISTS "Moderators can insert event import candidates" ON public.event_import_candidates;
CREATE POLICY "Moderators can insert event import candidates"
ON public.event_import_candidates
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role((select auth.uid()), 'admin')
  OR public.has_role((select auth.uid()), 'moderator')
);

DROP POLICY IF EXISTS "Moderators can update event import candidates" ON public.event_import_candidates;
CREATE POLICY "Moderators can update event import candidates"
ON public.event_import_candidates
FOR UPDATE
TO authenticated
USING (
  public.has_role((select auth.uid()), 'admin')
  OR public.has_role((select auth.uid()), 'moderator')
)
WITH CHECK (
  public.has_role((select auth.uid()), 'admin')
  OR public.has_role((select auth.uid()), 'moderator')
);

DROP POLICY IF EXISTS "Admins can delete event import candidates" ON public.event_import_candidates;
CREATE POLICY "Admins can delete event import candidates"
ON public.event_import_candidates
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'));

DROP TRIGGER IF EXISTS update_event_import_candidates_updated_at ON public.event_import_candidates;
CREATE TRIGGER update_event_import_candidates_updated_at
BEFORE UPDATE ON public.event_import_candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
