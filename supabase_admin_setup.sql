-- K-Roof garage website: administrator allowlist
-- Run this in Supabase SQL Editor after creating an Auth user for the shop administrator.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Signed-in users may only verify their own admin membership.
drop policy if exists "admin can read own membership" on public.admin_users;
create policy "admin can read own membership"
on public.admin_users for select to authenticated
using (user_id = auth.uid());

-- Add the administrator user after creating them in Supabase Auth:
-- insert into public.admin_users(user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
