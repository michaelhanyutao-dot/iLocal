ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS source_platform TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_title TEXT,
ADD COLUMN IF NOT EXISTS source_notes TEXT,
ADD COLUMN IF NOT EXISTS cover_source_url TEXT,
ADD COLUMN IF NOT EXISTS source_checked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS source_checked_by UUID REFERENCES auth.users(id);

ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_source_platform_check;

ALTER TABLE public.events
ADD CONSTRAINT events_source_platform_check
CHECK (source_platform IN ('xiaohongshu', 'manual', 'wechat', 'instagram', 'website', 'other'));

CREATE INDEX IF NOT EXISTS events_source_platform_idx
ON public.events (source_platform, created_at DESC);

CREATE INDEX IF NOT EXISTS events_source_checked_at_idx
ON public.events (source_checked_at);
