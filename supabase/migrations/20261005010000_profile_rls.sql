-- Row level security on user_profiles.
--
-- The table had RLS disabled, so any signed-in account could read all 38
-- student records through the public key. That is already more than a student
-- should see; it becomes a breach the moment a college account exists, because
-- that login would read every student in the product rather than its own.
--
-- The rules are the ones the product already means:
--   a student sees their own row,
--   a college sees the students of its own institution and nobody else's,
--   an admin sees everything,
--   the service role bypasses RLS entirely, as it always does, so the admin
--   API and these migrations keep working.
--
-- Rollback, if anything looks wrong:
--   alter table public.user_profiles disable row level security;

-- Authority comes from the row, not from an array of addresses in the frontend
-- that the database has no way to check. Verified first that both addresses
-- exist in this column, because the admin screens read every profile with the
-- public key and survive RLS only through profiles_select_admin.
update public.user_profiles
set role = 'admin'
where lower(coalesce(email, '')) in ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com')
  and role <> 'admin';

-- These read user_profiles from inside a policy ON user_profiles, which would
-- recurse forever. security definer runs them as the owner, outside RLS, which
-- breaks the cycle. search_path is pinned so neither can be redirected.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.user_profiles where id = auth.uid()), 'student')
$$;

create or replace function public.current_college_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select college_id from public.user_profiles where id = auth.uid()
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.current_college_id() from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_college_id() to authenticated;

alter table public.user_profiles enable row level security;

drop policy if exists profiles_select_own on public.user_profiles;
create policy profiles_select_own on public.user_profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_select_admin on public.user_profiles;
create policy profiles_select_admin on public.user_profiles
  for select to authenticated
  using (public.current_app_role() = 'admin');

drop policy if exists profiles_select_college on public.user_profiles;
create policy profiles_select_college on public.user_profiles
  for select to authenticated
  using (
    public.current_app_role() = 'college'
    and public.current_college_id() is not null
    and college_id = public.current_college_id()
  );

-- A student may edit their own row but not promote themselves: role and
-- college_id have to come back unchanged. The comparison uses the definer
-- functions rather than a subquery so the check cannot recurse.
drop policy if exists profiles_update_own on public.user_profiles;
create policy profiles_update_own on public.user_profiles
  for update to authenticated
  using (id = auth.uid() or public.current_app_role() = 'admin')
  with check (
    public.current_app_role() = 'admin'
    or (
      id = auth.uid()
      and role = public.current_app_role()
      and college_id is not distinct from public.current_college_id()
    )
  );

drop policy if exists profiles_insert_own on public.user_profiles;
create policy profiles_insert_own on public.user_profiles
  for insert to authenticated
  with check (id = auth.uid() or public.current_app_role() = 'admin');

-- Colleges are reference data: readable once signed in, written only through
-- the service role.
alter table public.colleges enable row level security;
drop policy if exists colleges_select_all on public.colleges;
create policy colleges_select_all on public.colleges
  for select to authenticated
  using (true);
