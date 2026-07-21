ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_category_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_category_check
  CHECK (category IN ('coffee', 'music', 'market', 'party', 'exhibition', 'bar', 'sports'));
