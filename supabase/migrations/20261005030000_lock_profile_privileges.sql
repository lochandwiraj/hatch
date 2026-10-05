-- Stop an account from granting itself privileges.
--
-- The update policy tried to pin role and college_id with
--
--   role = public.current_app_role()
--
-- in its WITH CHECK. That cannot work. current_app_role() reads the same row
-- being updated, inside the same transaction, so by the time the check runs it
-- already returns the NEW value: the condition compares 'admin' with 'admin'
-- and passes. A college account could make itself an administrator, which a
-- verification pass caught by trying it.
--
-- A policy has no access to the old row, so the rule belongs in a BEFORE
-- UPDATE trigger, where OLD and NEW are both available.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The service role runs migrations and the admin API; it is already trusted
  -- and bypasses RLS, so it must not be caught here.
  if coalesce(auth.role(), '') in ('service_role', 'supabase_admin') then
    return new;
  end if;

  -- In a BEFORE trigger the table still holds the old row, so this reads the
  -- caller's existing role rather than the one they are trying to write.
  if public.current_app_role() = 'admin' then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'role cannot be changed by this account';
  end if;

  if new.college_id is distinct from old.college_id then
    raise exception 'college_id cannot be changed by this account';
  end if;

  return new;
end
$$;

drop trigger if exists profiles_guard_privileges on public.user_profiles;
create trigger profiles_guard_privileges
  before update on public.user_profiles
  for each row
  execute function public.guard_profile_privileges();

-- With the trigger owning the rule, the policy no longer needs a comparison
-- that cannot be made correctly in a policy.
drop policy if exists profiles_update_own on public.user_profiles;
create policy profiles_update_own on public.user_profiles
  for update to authenticated
  using (id = auth.uid() or public.current_app_role() = 'admin')
  with check (id = auth.uid() or public.current_app_role() = 'admin');
