-- Teacher dashboard, assigned-student access, and teacher activity monitoring.

create table if not exists public.teacher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  school_name text,
  subject text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_student_assignments (
  teacher_id uuid not null references public.teacher_profiles(user_id) on delete cascade,
  student_id uuid not null references public.profiles(user_id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (teacher_id, student_id),
  check (teacher_id <> student_id)
);

create table if not exists public.teacher_activity_log (
  id bigint generated always as identity primary key,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (length(trim(action)) > 0),
  student_id uuid references public.profiles(user_id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists teacher_profiles_status_idx
  on public.teacher_profiles (status, display_name);

create index if not exists teacher_assignments_student_idx
  on public.teacher_student_assignments (student_id, teacher_id);

create index if not exists teacher_activity_teacher_created_idx
  on public.teacher_activity_log (teacher_id, created_at desc);

create index if not exists teacher_activity_student_created_idx
  on public.teacher_activity_log (student_id, created_at desc)
  where student_id is not null;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teacher_profiles teacher
    where teacher.user_id = (select auth.uid())
      and teacher.status = 'active'
  );
$$;

create or replace function public.is_teacher_assigned(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teacher_student_assignments assignment
    join public.teacher_profiles teacher
      on teacher.user_id = assignment.teacher_id
    where assignment.teacher_id = (select auth.uid())
      and assignment.student_id = p_student_id
      and teacher.status = 'active'
  );
$$;

revoke all on function public.is_teacher() from public;
revoke all on function public.is_teacher() from anon;
grant execute on function public.is_teacher() to authenticated;

revoke all on function public.is_teacher_assigned(uuid) from public;
revoke all on function public.is_teacher_assigned(uuid) from anon;
grant execute on function public.is_teacher_assigned(uuid) to authenticated;

alter table public.teacher_profiles enable row level security;
alter table public.teacher_student_assignments enable row level security;
alter table public.teacher_activity_log enable row level security;

drop policy if exists "teacher_profiles_self_read" on public.teacher_profiles;
create policy "teacher_profiles_self_read"
on public.teacher_profiles for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "teacher_profiles_admin_all" on public.teacher_profiles;
create policy "teacher_profiles_admin_all"
on public.teacher_profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "teacher_assignments_self_read" on public.teacher_student_assignments;
create policy "teacher_assignments_self_read"
on public.teacher_student_assignments for select
to authenticated
using (teacher_id = (select auth.uid()) and public.is_teacher());

drop policy if exists "teacher_assignments_admin_all" on public.teacher_student_assignments;
create policy "teacher_assignments_admin_all"
on public.teacher_student_assignments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "teacher_activity_self_read" on public.teacher_activity_log;
create policy "teacher_activity_self_read"
on public.teacher_activity_log for select
to authenticated
using (teacher_id = (select auth.uid()) and public.is_teacher());

drop policy if exists "teacher_activity_self_insert" on public.teacher_activity_log;
create policy "teacher_activity_self_insert"
on public.teacher_activity_log for insert
to authenticated
with check (
  teacher_id = (select auth.uid())
  and public.is_teacher()
  and (
    student_id is null
    or public.is_teacher_assigned(student_id)
  )
);

drop policy if exists "teacher_activity_admin_read" on public.teacher_activity_log;
create policy "teacher_activity_admin_read"
on public.teacher_activity_log for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles_teacher_assigned_select" on public.profiles;
create policy "profiles_teacher_assigned_select"
on public.profiles for select
to authenticated
using (public.is_teacher_assigned(user_id));

drop policy if exists "progress_teacher_assigned_select" on public.quiz_progress;
create policy "progress_teacher_assigned_select"
on public.quiz_progress for select
to authenticated
using (public.is_teacher_assigned(user_id));

drop policy if exists "activity_teacher_assigned_select" on public.activity_log;
create policy "activity_teacher_assigned_select"
on public.activity_log for select
to authenticated
using (public.is_teacher_assigned(user_id));

drop policy if exists "certificates_teacher_assigned_select" on public.certificates;
create policy "certificates_teacher_assigned_select"
on public.certificates for select
to authenticated
using (public.is_teacher_assigned(user_id));

grant select, insert, update, delete on public.teacher_profiles to authenticated;
grant select, insert, update, delete on public.teacher_student_assignments to authenticated;
grant select, insert on public.teacher_activity_log to authenticated;
grant usage, select on sequence public.teacher_activity_log_id_seq to authenticated;

comment on table public.teacher_profiles is
  'Teacher accounts enabled and managed by Heritage Quest administrators.';
comment on table public.teacher_student_assignments is
  'Students assigned to teachers. RLS limits teachers to their own assignments.';
comment on table public.teacher_activity_log is
  'Read-only monitoring history for teacher dashboard actions.';
