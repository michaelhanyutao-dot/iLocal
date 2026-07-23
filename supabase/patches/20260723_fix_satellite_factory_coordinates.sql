-- Fix the published "海淀卫星厂树夏音乐会" location.
-- Coordinates are Tencent/GCJ-02 compatible and point to 北京卫星制造厂科技园 / 知春路甲63号.

UPDATE public.events
SET
  address = '北京市海淀区知春路甲63号北京卫星制造厂科技园',
  latitude = 39.97737,
  longitude = 116.32725,
  district = '海淀区',
  updated_at = now()
WHERE id = 'd307d247-9664-4b94-b5e2-93eeca115af2'
  AND title = '海淀卫星厂树夏音乐会';

UPDATE public.event_import_candidates
SET
  normalized_event = jsonb_set(
    jsonb_set(
      jsonb_set(
        normalized_event,
        '{address}',
        to_jsonb('北京市海淀区知春路甲63号北京卫星制造厂科技园'::text),
        true
      ),
      '{latitude}',
      to_jsonb(39.97737::numeric),
      true
    ),
    '{longitude}',
    to_jsonb(116.32725::numeric),
    true
  ),
  updated_at = now()
WHERE source_platform = 'xiaohongshu'
  AND source_title = '7.24/25海淀卫星厂树夏音乐会🥳两天免费！';
