grant usage on schema public to anon, authenticated;

grant select on public.events, public.tags, public.event_tags to anon, authenticated;
grant select, insert, update, delete on public.events, public.tags, public.event_tags, public.user_roles to authenticated;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
