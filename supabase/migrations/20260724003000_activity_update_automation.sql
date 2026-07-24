ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_source_platform_check;

ALTER TABLE public.events
ADD CONSTRAINT events_source_platform_check
CHECK (source_platform IN ('xiaohongshu', 'manual', 'wechat', 'instagram', 'website', 'partner_api', 'csv', 'other'));

ALTER TABLE public.event_import_candidates
DROP CONSTRAINT IF EXISTS event_import_candidates_source_platform_check;

ALTER TABLE public.event_import_candidates
ADD CONSTRAINT event_import_candidates_source_platform_check
CHECK (source_platform IN ('xiaohongshu', 'manual', 'wechat', 'instagram', 'website', 'partner_api', 'csv', 'other'));

CREATE TABLE IF NOT EXISTS public.event_update_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'xiaohongshu'
    CHECK (platform IN ('xiaohongshu', 'manual', 'wechat', 'instagram', 'website', 'partner_api', 'csv', 'other')),
  city TEXT NOT NULL DEFAULT '北京',
  query TEXT NOT NULL,
  category_hint TEXT,
  cadence TEXT NOT NULL DEFAULT 'manual'
    CHECK (cadence IN ('manual', 'hourly', 'daily', 'weekly')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_update_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.event_update_sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  trigger_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (trigger_type IN ('manual', 'schedule', 'webhook', 'dry_run')),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  discovered_count INTEGER NOT NULL DEFAULT 0 CHECK (discovered_count >= 0),
  candidate_count INTEGER NOT NULL DEFAULT 0 CHECK (candidate_count >= 0),
  duplicate_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
  error_message TEXT,
  source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_import_candidates
ADD COLUMN IF NOT EXISTS automation_source_id UUID REFERENCES public.event_update_sources(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS automation_run_id UUID REFERENCES public.event_update_runs(id) ON DELETE SET NULL;

ALTER TABLE public.event_update_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_update_runs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_update_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_update_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_update_sources TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_update_runs TO service_role;

CREATE INDEX IF NOT EXISTS event_update_sources_status_idx
ON public.event_update_sources (status, platform, city);

CREATE UNIQUE INDEX IF NOT EXISTS event_update_sources_unique_rule_idx
ON public.event_update_sources (platform, city, query);

CREATE INDEX IF NOT EXISTS event_update_sources_next_run_at_idx
ON public.event_update_sources (next_run_at)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS event_update_runs_source_created_idx
ON public.event_update_runs (source_id, created_at DESC);

CREATE INDEX IF NOT EXISTS event_update_runs_status_created_idx
ON public.event_update_runs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS event_import_candidates_automation_source_idx
ON public.event_import_candidates (automation_source_id, created_at DESC);

CREATE INDEX IF NOT EXISTS event_import_candidates_automation_run_idx
ON public.event_import_candidates (automation_run_id, created_at DESC);

DROP POLICY IF EXISTS "Moderators can view event update sources" ON public.event_update_sources;
CREATE POLICY "Moderators can view event update sources"
ON public.event_update_sources
FOR SELECT
TO authenticated
USING (
  public.has_role((select auth.uid()), 'admin')
  OR public.has_role((select auth.uid()), 'moderator')
);

DROP POLICY IF EXISTS "Moderators can insert event update sources" ON public.event_update_sources;
CREATE POLICY "Moderators can insert event update sources"
ON public.event_update_sources
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role((select auth.uid()), 'admin')
  OR public.has_role((select auth.uid()), 'moderator')
);

DROP POLICY IF EXISTS "Moderators can update event update sources" ON public.event_update_sources;
CREATE POLICY "Moderators can update event update sources"
ON public.event_update_sources
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

DROP POLICY IF EXISTS "Admins can delete event update sources" ON public.event_update_sources;
CREATE POLICY "Admins can delete event update sources"
ON public.event_update_sources
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Moderators can view event update runs" ON public.event_update_runs;
CREATE POLICY "Moderators can view event update runs"
ON public.event_update_runs
FOR SELECT
TO authenticated
USING (
  public.has_role((select auth.uid()), 'admin')
  OR public.has_role((select auth.uid()), 'moderator')
);

DROP POLICY IF EXISTS "Moderators can insert event update runs" ON public.event_update_runs;
CREATE POLICY "Moderators can insert event update runs"
ON public.event_update_runs
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role((select auth.uid()), 'admin')
  OR public.has_role((select auth.uid()), 'moderator')
);

DROP POLICY IF EXISTS "Moderators can update event update runs" ON public.event_update_runs;
CREATE POLICY "Moderators can update event update runs"
ON public.event_update_runs
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

DROP POLICY IF EXISTS "Admins can delete event update runs" ON public.event_update_runs;
CREATE POLICY "Admins can delete event update runs"
ON public.event_update_runs
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'));

DROP TRIGGER IF EXISTS update_event_update_sources_updated_at ON public.event_update_sources;
CREATE TRIGGER update_event_update_sources_updated_at
BEFORE UPDATE ON public.event_update_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_update_runs_updated_at ON public.event_update_runs;
CREATE TRIGGER update_event_update_runs_updated_at
BEFORE UPDATE ON public.event_update_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.event_update_sources (name, platform, city, query, category_hint, cadence, status, notes)
VALUES
  ('小红书 北京音乐演出', 'xiaohongshu', '北京', '北京 周末 音乐 演出 livehouse 音乐会', 'music', 'manual', 'active', '优先找真实活动海报、票务链接、场地门牌和主办方信息。'),
  ('小红书 北京展览艺术', 'xiaohongshu', '北京', '北京 展览 艺术 画廊 美术馆 周末', 'exhibition', 'manual', 'active', '优先确认展期、开放时间、门票和场馆地址。'),
  ('小红书 北京咖啡市集', 'xiaohongshu', '北京', '北京 咖啡 市集 周末 快闪', 'coffee', 'manual', 'active', '市集类通常地址不够精确，候选应标为 area 或 unverified。'),
  ('小红书 北京酒吧驻唱', 'xiaohongshu', '北京', '北京 酒吧 驻唱 jazz open mic', 'bar', 'manual', 'active', '注意活动是否需要预约、低消或门票。'),
  ('小红书 北京派对社交', 'xiaohongshu', '北京', '北京 派对 社交 交友 周末 活动', 'party', 'manual', 'active', '社交活动需要额外核验主办方和安全性。')
ON CONFLICT DO NOTHING;
