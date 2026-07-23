insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'event-covers',
  'event-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view event covers" on storage.objects;
create policy "Public can view event covers"
on storage.objects
for select
to public
using (bucket_id = 'event-covers');

drop policy if exists "Operators can upload event covers" on storage.objects;
create policy "Operators can upload event covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-covers'
  and (
    public.has_role((select auth.uid()), 'admin')
    or public.has_role((select auth.uid()), 'moderator')
  )
);

drop policy if exists "Operators can update event covers" on storage.objects;
create policy "Operators can update event covers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-covers'
  and (
    public.has_role((select auth.uid()), 'admin')
    or public.has_role((select auth.uid()), 'moderator')
  )
)
with check (
  bucket_id = 'event-covers'
  and (
    public.has_role((select auth.uid()), 'admin')
    or public.has_role((select auth.uid()), 'moderator')
  )
);

drop policy if exists "Operators can delete event covers" on storage.objects;
create policy "Operators can delete event covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-covers'
  and public.has_role((select auth.uid()), 'admin')
);
