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


-- Security hardening and optimized RLS
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

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
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

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
        end,
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
        end,
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
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

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

revoke all on function public.get_quiz_questions(text,text) from public;
revoke all on function public.get_quiz_questions(text,text) from anon;
grant execute on function public.get_quiz_questions(text,text) to authenticated;

revoke all on function public.check_quiz_answer(text,text,text,text) from public;
revoke all on function public.check_quiz_answer(text,text,text,text) from anon;
grant execute on function public.check_quiz_answer(text,text,text,text) to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "progress_own_all" on public.quiz_progress;
create policy "progress_own_all"
on public.quiz_progress for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "activity_select_own" on public.activity_log;
create policy "activity_select_own"
on public.activity_log for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "activity_insert_own" on public.activity_log;
create policy "activity_insert_own"
on public.activity_log for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own"
on public.certificates for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "certificates_insert_own" on public.certificates;
create policy "certificates_insert_own"
on public.certificates for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "certificates_update_own" on public.certificates;
create policy "certificates_update_own"
on public.certificates for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);


-- Dynamic leaderboard from real student quiz progress.
create or replace function public.get_dynamic_leaderboard(
  p_period text default 'Weekly'
)
returns table (
  rank bigint,
  user_id uuid,
  name text,
  points bigint,
  badges bigint,
  registered_days integer,
  is_current boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  return query
  with scored as (
    select
      p.user_id,
      p.full_name as name,
      greatest(1, (current_date - p.created_at::date) + 1)::integer as registered_days,
      coalesce(
        sum(
          case
            when lower(p_period) = 'daily'
              and qp.updated_at >= now() - interval '24 hours'
              then qp.score
            when lower(p_period) = 'weekly'
              and qp.updated_at >= now() - interval '7 days'
              then qp.score
            when lower(p_period) in ('all time','all-time','all_time')
              then qp.score
            else 0
          end
        ),
        0
      )::bigint as points,
      (
        select count(*)::bigint
        from public.certificates c
        where c.user_id = p.user_id
      ) as badges
    from public.profiles p
    left join public.quiz_progress qp on qp.user_id = p.user_id
    group by p.user_id, p.full_name, p.created_at
  ),
  ranked as (
    select
      row_number() over (order by s.points desc, s.name asc)::bigint as rank,
      s.user_id,
      s.name,
      s.points,
      s.badges,
      s.registered_days
    from scored s
  )
  select
    r.rank,
    r.user_id,
    r.name,
    r.points,
    r.badges,
    r.registered_days,
    (r.user_id = (select auth.uid())) as is_current
  from ranked r
  order by r.rank;
end;
$$;

revoke all on function public.get_dynamic_leaderboard(text) from public;
revoke all on function public.get_dynamic_leaderboard(text) from anon;
grant execute on function public.get_dynamic_leaderboard(text) to authenticated;

create index if not exists quiz_progress_updated_idx
  on public.quiz_progress (updated_at desc);

create index if not exists certificates_user_idx
  on public.certificates (user_id);


-- Admin CMS roles, settings and content permissions
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','editor')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from anon;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.site_settings (
  id text primary key default 'main',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.site_settings (id, payload)
values (
  'main',
  jsonb_build_object(
    'heroEyebrow','GAMES FOR A GREATER TOMORROW',
    'heroTitle','Discover India',
    'heroAccent','Through Play!',
    'heroDescription','Fun games. Real stories. Our incredible heritage. Explore India’s history, culture, monuments and civilizations through interactive learning adventures.',
    'heroImage','/assets/hero-heritage.jpg',
    'featuredTitle','Learn India. Understand India.',
    'featuredAccent','Preserve India’s Heritage.',
    'featuredDescription','Discover people, places, events and traditions through 12 quiz chapters, 2 additional study materials and 120 mixed normal-and-advanced questions.',
    'featuredImage','/assets/hero-heritage.jpg',
    'introVideo','/videos/heritage-quest-intro.mp4',
    'dailyChallengeQuestions',5,
    'weeklyGoalPoints',700,
    'homeQuizModeTitle','Quiz Challenges',
    'homeQuizModeDescription','Choose a heritage chapter and answer age-appropriate questions with hints, explanations, XP and certificates.',
    'homeQuizModeImage','/assets/games/ancient-india.webp',
    'homeWordModeTitle','Heritage Word Quest',
    'homeWordModeDescription','Read a heritage clue, then tap the shuffled letters in the correct order to build the answer.',
    'homeWordModeImage','/assets/games/word-quest.svg'
  )
)
on conflict (id) do nothing;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read"
on public.admin_users for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "site_settings_read" on public.site_settings;
create policy "site_settings_read"
on public.site_settings for select
to authenticated
using (true);

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_audit_read" on public.admin_audit_log;
create policy "admin_audit_read"
on public.admin_audit_log for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_audit_insert" on public.admin_audit_log;
create policy "admin_audit_insert"
on public.admin_audit_log for insert
to authenticated
with check (public.is_admin() and admin_user_id = (select auth.uid()));

drop policy if exists "games_admin_all" on public.games;
create policy "games_admin_all"
on public.games for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "chapters_admin_all" on public.chapters;
create policy "chapters_admin_all"
on public.chapters for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "questions_admin_all" on public.questions;
create policy "questions_admin_all"
on public.questions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "progress_admin_all" on public.quiz_progress;
create policy "progress_admin_all"
on public.quiz_progress for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "activity_admin_all" on public.activity_log;
create policy "activity_admin_all"
on public.activity_log for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "certificates_admin_all" on public.certificates;
create policy "certificates_admin_all"
on public.certificates for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('game-images', 'game-images', true)
on conflict (id) do update set public = true;

drop policy if exists "game_images_admin_select" on storage.objects;
create policy "game_images_admin_select"
on storage.objects for select
to authenticated
using (bucket_id = 'game-images' and public.is_admin());

drop policy if exists "game_images_admin_insert" on storage.objects;
create policy "game_images_admin_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'game-images' and public.is_admin());

drop policy if exists "game_images_admin_update" on storage.objects;
create policy "game_images_admin_update"
on storage.objects for update
to authenticated
using (bucket_id = 'game-images' and public.is_admin())
with check (bucket_id = 'game-images' and public.is_admin());

drop policy if exists "game_images_admin_delete" on storage.objects;
create policy "game_images_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'game-images' and public.is_admin());

create index if not exists admin_audit_created_idx
  on public.admin_audit_log (created_at desc);


create index if not exists admin_audit_admin_user_idx
  on public.admin_audit_log (admin_user_id);

create index if not exists site_settings_updated_by_idx
  on public.site_settings (updated_by);


-- Certificate medal tiers based on quiz marks.
alter table public.certificates
  add column if not exists correct_answers integer not null default 0,
  add column if not exists total_questions integer not null default 10,
  add column if not exists award_tier text not null default 'bronze';

alter table public.certificates
  drop constraint if exists certificates_award_tier_check;

alter table public.certificates
  add constraint certificates_award_tier_check
  check (award_tier in ('bronze','silver','gold'));

create index if not exists certificates_award_tier_idx
  on public.certificates (award_tier);


-- Private student profile pictures.
alter table public.profiles
  add column if not exists avatar_path text;

insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', false)
on conflict (id) do update set public = false;

drop policy if exists "profile_pictures_select_own" on storage.objects;
create policy "profile_pictures_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
  )
);

drop policy if exists "profile_pictures_insert_own" on storage.objects;
create policy "profile_pictures_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "profile_pictures_update_own" on storage.objects;
create policy "profile_pictures_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "profile_pictures_delete_own" on storage.objects;
create policy "profile_pictures_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create index if not exists profiles_avatar_path_idx
  on public.profiles (avatar_path)
  where avatar_path is not null;


-- Heritage Word Quest age-based anagram game.
create table if not exists public.word_puzzles (
  id text primary key,
  game_slug text not null default 'heritage-word-quest',
  age_group text not null check (age_group in ('entry','junior','scholar','open','all')),
  difficulty text not null default 'Medium',
  clue text not null,
  answer text not null,
  hint text,
  explanation text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.word_puzzles enable row level security;

drop policy if exists "word_puzzles_admin_all" on public.word_puzzles;
create policy "word_puzzles_admin_all"
on public.word_puzzles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists word_puzzles_game_age_order_idx
  on public.word_puzzles (game_slug, age_group, sort_order);

create or replace function public.get_word_puzzles(
  p_game_slug text default 'heritage-word-quest',
  p_age_group text default 'scholar'
)
returns table (
  id text,
  clue text,
  hint text,
  difficulty text,
  letters jsonb,
  answer_pattern text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1 from public.word_puzzles q
    where q.game_slug = p_game_slug and q.age_group = p_age_group
  ) then
    return query
      select
        q.id,
        q.clue,
        q.hint,
        q.difficulty,
        (
          select jsonb_agg(ch order by random())
          from regexp_split_to_table(
            regexp_replace(upper(q.answer), '[^A-Z0-9]', '', 'g'),
            ''
          ) as ch
          where ch <> ''
        ),
        regexp_replace(upper(q.answer), '[A-Z0-9]', '_', 'g'),
        q.sort_order
      from public.word_puzzles q
      where q.game_slug = p_game_slug and q.age_group = p_age_group
      order by q.sort_order
      limit 10;
  else
    return query
      select
        q.id,
        q.clue,
        q.hint,
        q.difficulty,
        (
          select jsonb_agg(ch order by random())
          from regexp_split_to_table(
            regexp_replace(upper(q.answer), '[^A-Z0-9]', '', 'g'),
            ''
          ) as ch
          where ch <> ''
        ),
        regexp_replace(upper(q.answer), '[A-Z0-9]', '_', 'g'),
        q.sort_order
      from public.word_puzzles q
      where q.game_slug = p_game_slug and q.age_group = 'all'
      order by q.sort_order
      limit 10;
  end if;
end;
$$;

create or replace function public.check_word_puzzle_answer(
  p_game_slug text,
  p_puzzle_id text,
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
  q public.word_puzzles%rowtype;
  selected_normalized text;
  answer_normalized text;
  is_correct boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select * into q
  from public.word_puzzles
  where id = p_puzzle_id
    and game_slug = p_game_slug
    and age_group = p_age_group
  limit 1;

  if not found then
    select * into q
    from public.word_puzzles
    where id = p_puzzle_id
      and game_slug = p_game_slug
      and age_group = 'all'
    limit 1;
  end if;

  if not found then
    raise exception 'Word puzzle not found';
  end if;

  selected_normalized :=
    regexp_replace(upper(coalesce(p_selected_answer,'')), '[^A-Z0-9]', '', 'g');
  answer_normalized :=
    regexp_replace(upper(q.answer), '[^A-Z0-9]', '', 'g');
  is_correct := selected_normalized = answer_normalized;

  return query
  select
    is_correct,
    q.answer,
    coalesce(
      q.explanation,
      'Great work. Remember the clue and the heritage word together.'
    ),
    q.difficulty,
    case
      when not is_correct then 0
      when q.difficulty = 'Advanced' then 30
      when q.difficulty = 'Entry' then 10
      else 20
    end;
end;
$$;

revoke all on function public.get_word_puzzles(text,text) from public;
revoke all on function public.get_word_puzzles(text,text) from anon;
grant execute on function public.get_word_puzzles(text,text) to authenticated;

revoke all on function public.check_word_puzzle_answer(text,text,text,text) from public;
revoke all on function public.check_word_puzzle_answer(text,text,text,text) from anon;
grant execute on function public.check_word_puzzle_answer(text,text,text,text) to authenticated;


-- Homepage direct game-mode cards are stored inside site_settings.payload.
update public.site_settings
set payload = coalesce(payload,'{}'::jsonb) || jsonb_build_object(
  'homeQuizModeTitle', coalesce(payload->>'homeQuizModeTitle','Quiz Challenges'),
  'homeQuizModeDescription', coalesce(payload->>'homeQuizModeDescription','Choose a heritage chapter and answer age-appropriate questions with hints, explanations, XP and certificates.'),
  'homeQuizModeImage', coalesce(payload->>'homeQuizModeImage','/assets/games/ancient-india.webp'),
  'homeWordModeTitle', coalesce(payload->>'homeWordModeTitle','Heritage Word Quest'),
  'homeWordModeDescription', coalesce(payload->>'homeWordModeDescription','Read a heritage clue, then tap the shuffled letters in the correct order to build the answer.'),
  'homeWordModeImage', coalesce(payload->>'homeWordModeImage','/assets/games/word-quest.svg')
),
updated_at = now()
where id='main';


-- Dynamic quiz game display order.
alter table public.games
  add column if not exists display_order integer not null default 999;

alter table public.games
  drop constraint if exists games_display_order_positive;

alter table public.games
  add constraint games_display_order_positive
  check (display_order > 0);

create index if not exists games_display_order_idx
  on public.games (display_order, title);

create or replace function public.move_game_position(
  p_game_id text,
  p_new_position integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_position integer;
  v_new_position integer;
  v_count integer;
  v_slug text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select display_order, slug
  into v_old_position, v_slug
  from public.games
  where id = p_game_id;

  if not found then
    raise exception 'Game not found';
  end if;

  if v_slug = 'heritage-word-quest' then
    raise exception 'Heritage Word Quest is a separate game mode and is not part of the quiz order';
  end if;

  select count(*)::integer
  into v_count
  from public.games
  where slug <> 'heritage-word-quest';

  v_new_position :=
    greatest(1, least(coalesce(p_new_position, v_old_position), v_count));

  if v_new_position = v_old_position then
    return;
  end if;

  if v_new_position < v_old_position then
    update public.games
    set display_order = display_order + 1,
        updated_at = now()
    where slug <> 'heritage-word-quest'
      and id <> p_game_id
      and display_order >= v_new_position
      and display_order < v_old_position;
  else
    update public.games
    set display_order = display_order - 1,
        updated_at = now()
    where slug <> 'heritage-word-quest'
      and id <> p_game_id
      and display_order > v_old_position
      and display_order <= v_new_position;
  end if;

  update public.games
  set display_order = v_new_position,
      updated_at = now()
  where id = p_game_id;
end;
$$;

revoke all on function public.move_game_position(text, integer) from public;
revoke all on function public.move_game_position(text, integer) from anon;
grant execute on function public.move_game_position(text, integer) to authenticated;
