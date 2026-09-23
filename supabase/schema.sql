-- Heritage Quest Supabase schema
-- Run this in the Supabase SQL editor for the project used by the Vite app.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  dob date not null,
  age_group text not null check (age_group in ('entry','junior','scholar','open')),
  preferred_language text not null default 'en',
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  id text primary key,
  slug text unique not null,
  title text not null,
  category text,
  difficulty text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.chapters (
  slug text primary key,
  title text not null,
  description text,
  era text,
  tag text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text not null,
  chapter_slug text not null references public.chapters(slug) on delete cascade,
  age_group text not null default 'all'
    check (age_group in ('all','entry','junior','scholar','open')),
  difficulty text not null default 'Medium',
  question text not null,
  answers jsonb not null,
  correct_index integer not null check (correct_index between 0 and 3),
  explanation text,
  hint text,
  sort_order integer not null default 0,
  source_label text,
  primary key (id, age_group)
);

create table if not exists public.quiz_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_slug text not null,
  current_index integer not null default 0,
  score integer not null default 0,
  xp integer not null default 0,
  coins integer not null default 50,
  finished boolean not null default false,
  answers jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_slug)
);

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  chapter_slug text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_slug text not null,
  task_name text not null,
  verification_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  issued_at timestamptz not null default now(),
  unique (user_id, chapter_slug)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  calculated_age integer;
  calculated_group text;
begin
  calculated_age := extract(year from age(current_date, (new.raw_user_meta_data->>'dob')::date));

  calculated_group := case
    when calculated_age <= 5 then 'entry'
    when calculated_age <= 9 then 'junior'
    when calculated_age <= 16 then 'scholar'
    else 'open'
  end;

  insert into public.profiles (
    user_id,
    full_name,
    dob,
    age_group,
    preferred_language
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email, '@', 1)),
    (new.raw_user_meta_data->>'dob')::date,
    coalesce(nullif(new.raw_user_meta_data->>'age_group',''), calculated_group),
    coalesce(nullif(new.raw_user_meta_data->>'preferred_language',''), 'en')
  )
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    dob = excluded.dob,
    age_group = excluded.age_group,
    preferred_language = excluded.preferred_language,
    updated_at = now();

  return new;
exception
  when others then
    -- Never block account creation if optional metadata is malformed.
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.chapters enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_progress enable row level security;
alter table public.activity_log enable row level security;
alter table public.certificates enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "content_games_read" on public.games;
create policy "content_games_read"
on public.games for select
to authenticated
using (true);

drop policy if exists "content_chapters_read" on public.chapters;
create policy "content_chapters_read"
on public.chapters for select
to authenticated
using (true);

drop policy if exists "content_questions_read" on public.questions;
create policy "content_questions_read"
on public.questions for select
to authenticated
using (true);

drop policy if exists "progress_own_all" on public.quiz_progress;
create policy "progress_own_all"
on public.quiz_progress for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "activity_select_own" on public.activity_log;
create policy "activity_select_own"
on public.activity_log for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "activity_insert_own" on public.activity_log;
create policy "activity_insert_own"
on public.activity_log for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own"
on public.certificates for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "certificates_insert_own" on public.certificates;
create policy "certificates_insert_own"
on public.certificates for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "certificates_update_own" on public.certificates;
create policy "certificates_update_own"
on public.certificates for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists quiz_progress_user_updated_idx
  on public.quiz_progress (user_id, updated_at desc);

create index if not exists activity_log_user_created_idx
  on public.activity_log (user_id, created_at desc);

create index if not exists questions_chapter_age_idx
  on public.questions (chapter_slug, age_group, sort_order);
