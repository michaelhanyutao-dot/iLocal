create extension if not exists pgcrypto;

create type public.content_status as enum ('draft', 'review', 'active', 'inactive', 'archived');
create type public.content_kind as enum ('venue', 'event');
create type public.plan_status as enum ('saved', 'want_to_go', 'planned', 'visited', 'cancelled');
create type public.reminder_status as enum ('none', 'scheduled', 'sent', 'failed');
create type public.report_status as enum ('pending', 'reviewing', 'resolved', 'dismissed');
create type public.source_status as enum ('discovered', 'extracted', 'matched', 'needs_review', 'approved', 'rejected', 'published');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'zh' check (preferred_language in ('zh', 'en')),
  home_city text not null default 'Beijing',
  home_district text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null default ('ven_' || replace(gen_random_uuid()::text, '-', '')),
  name_zh text not null,
  name_en text,
  description_zh text,
  description_en text,
  province text not null default '北京市',
  city text not null default 'Beijing',
  district text,
  business_area text,
  address_zh text,
  address_en text,
  latitude double precision not null,
  longitude double precision not null,
  category text not null,
  venue_type text,
  average_price numeric(10,2),
  price_label_zh text,
  price_label_en text,
  phone text,
  official_url text,
  booking_url text,
  image_url text,
  images jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  opening_hours jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'draft',
  confidence_score numeric(3,2) not null default 0.80 check (confidence_score >= 0 and confidence_score <= 1),
  last_verified_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null default ('evt_' || replace(gen_random_uuid()::text, '-', '')),
  venue_id uuid references public.venues(id) on delete set null,
  venue_name_zh text,
  venue_name_en text,
  title_zh text not null,
  title_en text,
  description_zh text,
  description_en text,
  province text not null default '北京市',
  city text not null default 'Beijing',
  district text,
  business_area text,
  address_zh text,
  address_en text,
  latitude double precision not null,
  longitude double precision not null,
  category text not null,
  event_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  price numeric(10,2),
  price_label_zh text,
  price_label_en text,
  booking_url text,
  source_url text,
  image_url text,
  images jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  status public.content_status not null default 'draft',
  confidence_score numeric(3,2) not null default 0.80 check (confidence_score >= 0 and confidence_score <= 1),
  last_verified_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_kind public.content_kind not null,
  venue_id uuid references public.venues(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  status public.plan_status not null default 'saved',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_items_target_check check (
    (content_kind = 'venue' and venue_id is not null and event_id is null)
    or
    (content_kind = 'event' and event_id is not null)
  )
);

create unique index saved_items_unique_venue on public.saved_items(user_id, venue_id) where content_kind = 'venue';
create unique index saved_items_unique_event on public.saved_items(user_id, event_id) where content_kind = 'event';

create table public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_kind public.content_kind not null,
  venue_id uuid references public.venues(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  status public.plan_status not null default 'planned',
  planned_date date,
  starts_at timestamptz,
  ends_at timestamptz,
  reminder_type text not null default 'none',
  reminder_minutes integer,
  reminder_time timestamptz,
  reminder_status public.reminder_status not null default 'none',
  group_size integer,
  personal_note text,
  calendar_exported boolean not null default false,
  visited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_plans_target_check check (
    (content_kind = 'venue' and venue_id is not null)
    or
    (content_kind = 'event' and event_id is not null)
  )
);

create table public.user_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  source_plan_id uuid references public.user_plans(id) on delete set null,
  visited_date date not null,
  visited_time time,
  personal_note text,
  rating integer check (rating between 1 and 5),
  photo_url text,
  would_visit_again boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  session_id text,
  action_name text not null,
  content_kind public.content_kind,
  venue_id uuid references public.venues(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  properties jsonb not null default '{}'::jsonb,
  platform text not null default 'web',
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  content_kind public.content_kind not null,
  venue_id uuid references public.venues(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  report_type text not null,
  description text,
  status public.report_status not null default 'pending',
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_url text,
  source_name text,
  raw_payload jsonb not null default '{}'::jsonb,
  extracted_payload jsonb not null default '{}'::jsonb,
  confidence_score numeric(3,2) not null default 0.50 check (confidence_score >= 0 and confidence_score <= 1),
  review_status public.source_status not null default 'discovered',
  matched_venue_id uuid references public.venues(id) on delete set null,
  matched_event_id uuid references public.events(id) on delete set null,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_logs (
  id uuid primary key default gen_random_uuid(),
  content_kind public.content_kind not null,
  venue_id uuid references public.venues(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  verified_by uuid references auth.users(id),
  verification_method text not null,
  notes text,
  confidence_score numeric(3,2) check (confidence_score >= 0 and confidence_score <= 1),
  created_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger venues_updated_at before update on public.venues for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger saved_items_updated_at before update on public.saved_items for each row execute function public.set_updated_at();
create trigger user_plans_updated_at before update on public.user_plans for each row execute function public.set_updated_at();
create trigger user_visits_updated_at before update on public.user_visits for each row execute function public.set_updated_at();
create trigger reports_updated_at before update on public.reports for each row execute function public.set_updated_at();
create trigger sources_updated_at before update on public.sources for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.saved_items enable row level security;
alter table public.user_plans enable row level security;
alter table public.user_visits enable row level security;
alter table public.user_actions enable row level security;
alter table public.reports enable row level security;
alter table public.sources enable row level security;
alter table public.verification_logs enable row level security;

grant select on public.venues, public.events to anon;
grant select on public.venues, public.events to authenticated;
grant select, insert, update, delete on public.profiles, public.saved_items, public.user_plans, public.user_visits, public.user_actions, public.reports to authenticated;
grant select, insert, update, delete on public.venues, public.events, public.sources, public.verification_logs to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on function public.set_updated_at() to authenticated, service_role;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "venues_public_active_select"
  on public.venues for select
  to anon, authenticated
  using (status = 'active');

create policy "events_public_active_current_select"
  on public.events for select
  to anon, authenticated
  using (status = 'active' and (ends_at is null or ends_at >= now()));

create policy "venues_admin_write"
  on public.venues for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "events_admin_write"
  on public.events for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "saved_items_own_all"
  on public.saved_items for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_plans_own_all"
  on public.user_plans for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_visits_own_all"
  on public.user_visits for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_actions_insert_own_or_guest"
  on public.user_actions for insert
  to anon, authenticated
  with check ((user_id is null) or ((select auth.uid()) = user_id));

create policy "user_actions_admin_select"
  on public.user_actions for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "reports_insert_own_or_guest"
  on public.reports for insert
  to anon, authenticated
  with check ((user_id is null) or ((select auth.uid()) = user_id));

create policy "reports_select_own_or_admin"
  on public.reports for select
  to authenticated
  using (((select auth.uid()) = user_id) or ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'));

create policy "reports_admin_update"
  on public.reports for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "sources_admin_all"
  on public.sources for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "verification_logs_admin_all"
  on public.verification_logs for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create index venues_geo_idx on public.venues(latitude, longitude);
create index venues_category_idx on public.venues(category);
create index venues_status_idx on public.venues(status);
create index events_geo_idx on public.events(latitude, longitude);
create index events_starts_at_idx on public.events(starts_at);
create index events_status_idx on public.events(status);
create index saved_items_user_status_idx on public.saved_items(user_id, status);
create index user_plans_user_status_idx on public.user_plans(user_id, status);
create index user_actions_action_name_idx on public.user_actions(action_name);
