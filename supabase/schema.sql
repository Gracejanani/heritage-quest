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
  storage_path text,
  issued_at timestamptz not null default now(),
  unique (user_id, chapter_slug)
);

alter table public.certificates
  add column if not exists storage_path text;

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




-- Secure quiz delivery: students can read question text/options without the answer key.
create or replace function public.get_quiz_questions(
  p_chapter_slug text,
  p_age_group text default 'scholar'
)
returns table (
  id text,
  difficulty text,
  question text,
  answers jsonb,
  hint text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.questions q
    where q.chapter_slug = p_chapter_slug
      and q.age_group = p_age_group
  ) then
    return query
      select
        q.id,
        case
          when p_age_group = 'entry' then 'Entry'
          when p_age_group = 'junior' then 'Medium'
          when q.sort_order in (4, 7, 10) then 'Advanced'
          else 'Medium'
        end as difficulty,
        q.question,
        q.answers,
        q.hint,
        q.sort_order
      from public.questions q
      where q.chapter_slug = p_chapter_slug
        and q.age_group = p_age_group
      order by q.sort_order
      limit 10;
  else
    return query
      select
        q.id,
        case
          when p_age_group = 'entry' then 'Entry'
          when p_age_group = 'junior' then 'Medium'
          when q.sort_order in (4, 7, 10) then 'Advanced'
          else 'Medium'
        end as difficulty,
        q.question,
        q.answers,
        q.hint,
        q.sort_order
      from public.questions q
      where q.chapter_slug = p_chapter_slug
        and q.age_group = 'all'
      order by q.sort_order
      limit 10;
  end if;
end;
$$;

create or replace function public.check_quiz_answer(
  p_chapter_slug text,
  p_question_id text,
  p_age_group text,
  p_selected_answer text
)
returns table (
  correct boolean,
  correct_answer text,
  explanation text,
  difficulty text,
  xp integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.questions%rowtype;
  v_correct boolean;
  v_difficulty text;
begin
  select *
  into q
  from public.questions
  where chapter_slug = p_chapter_slug
    and id = p_question_id
    and age_group = p_age_group
  limit 1;

  if not found then
    select *
    into q
    from public.questions
    where chapter_slug = p_chapter_slug
      and id = p_question_id
      and age_group = 'all'
    limit 1;
  end if;

  if not found then
    raise exception 'Question not found';
  end if;

  v_difficulty := case
    when p_age_group = 'entry' then 'Entry'
    when p_age_group = 'junior' then 'Medium'
    when q.sort_order in (4, 7, 10) then 'Advanced'
    else 'Medium'
  end;

  v_correct := p_selected_answer = (q.answers ->> q.correct_index);

  return query
  select
    v_correct,
    q.answers ->> q.correct_index,
    q.explanation,
    v_difficulty,
    case
      when not v_correct then 0
      when v_difficulty = 'Advanced' then 30
      when v_difficulty = 'Entry' then 10
      else 20
    end;
end;
$$;

revoke all on function public.get_quiz_questions(text, text) from public;
revoke all on function public.check_quiz_answer(text, text, text, text) from public;
grant execute on function public.get_quiz_questions(text, text) to authenticated;
grant execute on function public.check_quiz_answer(text, text, text, text) to authenticated;

-- Private certificate files. Each user can only access files in their own folder.
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

drop policy if exists "certificate_files_select_own" on storage.objects;
create policy "certificate_files_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "certificate_files_insert_own" on storage.objects;
create policy "certificate_files_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "certificate_files_update_own" on storage.objects;
create policy "certificate_files_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = auth.uid()::text
);
