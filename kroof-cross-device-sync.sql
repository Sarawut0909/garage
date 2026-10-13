-- Run this in Supabase SQL Editor for project zgjfwzugvlpdanlbucll.
-- Shared data is readable by website visitors; only signed-in admins may change it.
create table if not exists public.kroof_site_data (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.kroof_site_data enable row level security;
grant select on public.kroof_site_data to anon, authenticated;
grant insert, update, delete on public.kroof_site_data to authenticated;
drop policy if exists "Public can read K-Roof site data" on public.kroof_site_data;
create policy "Public can read K-Roof site data" on public.kroof_site_data for select to anon, authenticated using (true);
drop policy if exists "Admins can write K-Roof site data" on public.kroof_site_data;
create policy "Admins can write K-Roof site data" on public.kroof_site_data for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kroof-site-images', 'kroof-site-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true;
drop policy if exists "Public can view K-Roof site images" on storage.objects;
create policy "Public can view K-Roof site images" on storage.objects for select to anon, authenticated
using (bucket_id = 'kroof-site-images');
drop policy if exists "Admins can upload K-Roof site images" on storage.objects;
create policy "Admins can upload K-Roof site images" on storage.objects for insert to authenticated
with check (bucket_id = 'kroof-site-images' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "Admins can update K-Roof site images" on storage.objects;
create policy "Admins can update K-Roof site images" on storage.objects for update to authenticated
using (bucket_id = 'kroof-site-images' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (bucket_id = 'kroof-site-images' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "Admins can delete K-Roof site images" on storage.objects;
create policy "Admins can delete K-Roof site images" on storage.objects for delete to authenticated
using (bucket_id = 'kroof-site-images' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
