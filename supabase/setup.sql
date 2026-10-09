-- VitalSense: run once in Supabase Dashboard > SQL Editor > New query > Run.
-- Safe to run more than once.
-- It makes every piece of user data follow the account (any device, any browser),
-- and makes sure each person can only read and write their own rows.

-- 1. Profiles ---------------------------------------------------------------
alter table public.profiles add column if not exists language text;
alter table public.profiles enable row level security;

drop policy if exists "vs_profiles_select_own" on public.profiles;
drop policy if exists "vs_profiles_insert_own" on public.profiles;
drop policy if exists "vs_profiles_update_own" on public.profiles;
create policy "vs_profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "vs_profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "vs_profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- 2. Product scans ------------------------------------------------------------
alter table public.scans add column if not exists category text;
alter table public.scans add column if not exists dietary_suitability jsonb;
alter table public.scans enable row level security;

drop policy if exists "vs_scans_select_own" on public.scans;
drop policy if exists "vs_scans_insert_own" on public.scans;
drop policy if exists "vs_scans_delete_own" on public.scans;
create policy "vs_scans_select_own" on public.scans for select using (auth.uid() = user_id);
create policy "vs_scans_insert_own" on public.scans for insert with check (auth.uid() = user_id);
create policy "vs_scans_delete_own" on public.scans for delete using (auth.uid() = user_id);

-- 3. Skin checks --------------------------------------------------------------
create table if not exists public.skin_checks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  taken_at bigint not null,
  data jsonb not null,
  photo_path text,
  created_at timestamptz not null default now()
);
create index if not exists skin_checks_user_taken on public.skin_checks (user_id, taken_at desc);
alter table public.skin_checks enable row level security;
drop policy if exists "vs_skin_all_own" on public.skin_checks;
create policy "vs_skin_all_own" on public.skin_checks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. Diary (one row per day) -------------------------------------------------
create table if not exists public.diary_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  day text not null,
  data jsonb not null,
  updated_at bigint not null default 0,
  primary key (user_id, day)
);
alter table public.diary_logs enable row level security;
drop policy if exists "vs_diary_all_own" on public.diary_logs;
create policy "vs_diary_all_own" on public.diary_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Settings: routine, goals, favorites ----------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  routine jsonb,
  goals jsonb,
  favorites jsonb,
  language text,
  updated_at bigint not null default 0
);
alter table public.user_settings enable row level security;
drop policy if exists "vs_settings_all_own" on public.user_settings;
create policy "vs_settings_all_own" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. Private storage for skin check photos ---------------------------------
-- Each person's photos live under a folder named after their user id.
insert into storage.buckets (id, name, public)
values ('skin-photos', 'skin-photos', false)
on conflict (id) do nothing;

drop policy if exists "vs_photos_select_own" on storage.objects;
drop policy if exists "vs_photos_insert_own" on storage.objects;
drop policy if exists "vs_photos_update_own" on storage.objects;
drop policy if exists "vs_photos_delete_own" on storage.objects;
create policy "vs_photos_select_own" on storage.objects for select
  using (bucket_id = 'skin-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vs_photos_insert_own" on storage.objects for insert
  with check (bucket_id = 'skin-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vs_photos_update_own" on storage.objects for update
  using (bucket_id = 'skin-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vs_photos_delete_own" on storage.objects for delete
  using (bucket_id = 'skin-photos' and (storage.foldername(name))[1] = auth.uid()::text);
