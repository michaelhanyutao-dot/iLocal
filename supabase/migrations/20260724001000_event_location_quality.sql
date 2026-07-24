ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS location_accuracy TEXT NOT NULL DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS location_note TEXT,
ADD COLUMN IF NOT EXISTS location_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS location_verified_by UUID REFERENCES auth.users(id);

ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_location_accuracy_check;

ALTER TABLE public.events
ADD CONSTRAINT events_location_accuracy_check
CHECK (location_accuracy IN ('precise', 'area', 'unverified'));

CREATE INDEX IF NOT EXISTS events_location_accuracy_idx
ON public.events (location_accuracy);
