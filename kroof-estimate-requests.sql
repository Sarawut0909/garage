-- Create a private table for website estimate requests. Safe to run once.
create table if not exists public.kroof_estimate_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  phone text,
  location text,
  car_count text,
  roof_style text,
  roof_material text,
  width_m numeric not null,
  length_m numeric not null,
  extra text,
  source text not null default 'website',
  status text not null default 'new'
);

create index if not exists kroof_estimate_requests_created_at_idx
  on public.kroof_estimate_requests (created_at desc);
create index if not exists kroof_estimate_requests_phone_created_idx
  on public.kroof_estimate_requests (phone, created_at desc);

alter table public.kroof_estimate_requests enable row level security;
-- No anon/authenticated policies are intentionally created. Only the server-side
-- Edge Function uses the service role key to insert/read requests.
