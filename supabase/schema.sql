-- Inhandy database setup. Run once in Supabase → SQL Editor → New query.

-- Everything a user has saved in the app, as one JSON document per user.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Each user can only see and change their own row.
alter table public.user_data enable row level security;

drop policy if exists "Read own data" on public.user_data;
create policy "Read own data" on public.user_data
  for select using (auth.uid() = user_id);

drop policy if exists "Add own data" on public.user_data;
create policy "Add own data" on public.user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "Change own data" on public.user_data;
create policy "Change own data" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Delete own data" on public.user_data;
create policy "Delete own data" on public.user_data
  for delete using (auth.uid() = user_id);

-- "Delete my account": removes the signed-in user's login, and their data with it (on delete cascade).
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
