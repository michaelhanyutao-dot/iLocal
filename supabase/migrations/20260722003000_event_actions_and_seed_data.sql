-- User event interactions: saved, liked, planned, visited.
CREATE TABLE IF NOT EXISTS public.event_user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('saved', 'liked', 'planned', 'visited')),
  planned_for DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id, action)
);

ALTER TABLE public.event_user_actions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.events TO anon, authenticated;
GRANT SELECT ON TABLE public.tags TO anon, authenticated;
GRANT SELECT ON TABLE public.event_tags TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_user_actions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

CREATE INDEX IF NOT EXISTS events_status_date_idx ON public.events (status, date, time);
CREATE INDEX IF NOT EXISTS events_category_idx ON public.events (category);
CREATE INDEX IF NOT EXISTS events_created_by_idx ON public.events (created_by);
CREATE INDEX IF NOT EXISTS event_user_actions_user_idx ON public.event_user_actions (user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS event_user_actions_event_idx ON public.event_user_actions (event_id, action);

DROP POLICY IF EXISTS "Users can view own event actions" ON public.event_user_actions;
CREATE POLICY "Users can view own event actions"
ON public.event_user_actions
FOR SELECT
TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own event actions" ON public.event_user_actions;
CREATE POLICY "Users can insert own event actions"
ON public.event_user_actions
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own event actions" ON public.event_user_actions;
CREATE POLICY "Users can update own event actions"
ON public.event_user_actions
FOR UPDATE
TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own event actions" ON public.event_user_actions;
CREATE POLICY "Users can delete own event actions"
ON public.event_user_actions
FOR DELETE
TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP TRIGGER IF EXISTS update_event_user_actions_updated_at ON public.event_user_actions;
CREATE TRIGGER update_event_user_actions_updated_at
BEFORE UPDATE ON public.event_user_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Keep public role-checking helpers callable only where needed.
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

INSERT INTO public.events (
  id, title, description, category, date, time, address, latitude, longitude,
  district, is_free, price, cover_image, organizer, attendees, status
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '独立音乐现场 - 春日限定',
    '本地独立乐队专场演出，感受原创音乐的力量',
    'music',
    '2026-07-22',
    '20:00',
    '北京市朝阳区工体北路8号三里屯SOHO',
    39.93530000,
    116.46040000,
    '朝阳区',
    false,
    120,
    null,
    '麻雀瓦舍',
    85,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '周末创意市集',
    '手工艺品、原创设计、美食小吃一应俱全',
    'market',
    '2026-07-25',
    '10:00',
    '北京市海淀区中关村大街1号中关村广场',
    39.97920000,
    116.30920000,
    '海淀区',
    true,
    null,
    null,
    '创意生活',
    156,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '798夜间艺术展',
    '当代艺术展，夜间延时开放。',
    'exhibition',
    '2026-07-23',
    '20:00',
    '北京市朝阳区酒仙桥路4号798艺术区',
    39.98450000,
    116.49500000,
    '朝阳区',
    false,
    50,
    null,
    '798艺术中心',
    203,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '户外音乐派对',
    '在星空下享受电子音乐的狂欢',
    'party',
    '2026-07-24',
    '19:00',
    '北京市顺义区温榆河公园',
    40.10110000,
    116.65430000,
    '顺义区',
    false,
    200,
    null,
    '夜猫子',
    324,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '酒吧驻唱夜',
    '本地歌手深情演唱，与美酒为伴',
    'bar',
    '2026-07-21',
    '21:30',
    '北京市东城区南锣鼓巷108号',
    39.94030000,
    116.40570000,
    '东城区',
    true,
    null,
    null,
    '老北京酒吧',
    67,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    '周末篮球友谊赛',
    '业余篮球爱好者聚集，享受运动快乐',
    'sports',
    '2026-07-26',
    '14:00',
    '北京市海淀区奥林匹克公园篮球场',
    39.99280000,
    116.39170000,
    '海淀区',
    true,
    null,
    null,
    '篮球联盟',
    24,
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  date = EXCLUDED.date,
  time = EXCLUDED.time,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  district = EXCLUDED.district,
  is_free = EXCLUDED.is_free,
  price = EXCLUDED.price,
  organizer = EXCLUDED.organizer,
  attendees = EXCLUDED.attendees,
  status = EXCLUDED.status;
