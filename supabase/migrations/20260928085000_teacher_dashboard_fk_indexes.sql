-- Index nullable audit foreign keys used by teacher dashboard administration.

create index if not exists teacher_profiles_created_by_idx
  on public.teacher_profiles (created_by)
  where created_by is not null;

create index if not exists teacher_assignments_assigned_by_idx
  on public.teacher_student_assignments (assigned_by)
  where assigned_by is not null;
