-- Let a college read its own students' activity, and let an admin read all of
-- it.
--
-- Two gaps turned up here. user_registrations had no admin policy at all, only
-- own-row, so even an administrator could not read registrations through the
-- public key — the admin screens have simply never needed to. And the admin
-- rule on event_attendance still matched an email array containing
-- dwiraj@hatch.in and lochan@hatch.in, a domain the product does not use.
--
-- Both now go through the role on the profile, like everything else.

-- Does this user belong to the college the caller represents? Definer, so the
-- lookup does not depend on the caller's own visibility of user_profiles.
create or replace function public.is_my_college_student(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles p
    where p.id = target
      and p.college_id is not null
      and p.college_id = public.current_college_id()
  )
$$;

revoke all on function public.is_my_college_student(uuid) from public;
grant execute on function public.is_my_college_student(uuid) to authenticated;

-- Registrations ------------------------------------------------------------
drop policy if exists registrations_select_admin on public.user_registrations;
create policy registrations_select_admin on public.user_registrations
  for select to authenticated
  using (public.current_app_role() = 'admin');

drop policy if exists registrations_select_college on public.user_registrations;
create policy registrations_select_college on public.user_registrations
  for select to authenticated
  using (
    public.current_app_role() = 'college'
    and public.is_my_college_student(user_id)
  );

-- Attendance ---------------------------------------------------------------
-- Replaces the email-array rule, which also granted ALL rather than SELECT.
drop policy if exists "Admins can view all attendance" on public.event_attendance;

drop policy if exists attendance_select_admin on public.event_attendance;
create policy attendance_select_admin on public.event_attendance
  for select to authenticated
  using (public.current_app_role() = 'admin');

drop policy if exists attendance_select_college on public.event_attendance;
create policy attendance_select_college on public.event_attendance
  for select to authenticated
  using (
    public.current_app_role() = 'college'
    and public.is_my_college_student(user_id)
  );

-- A college reads. It never writes a student's registration or attendance, so
-- no insert, update or delete policy is added for it.
