-- Narrow the privilege guard to actual end-user requests.
--
-- guard_profile_privileges() exempted auth.role() = 'service_role', which only
-- identifies a request arriving through PostgREST with a service key. A
-- migration, or anything else on a direct connection, carries no JWT at all:
-- auth.role() is null, the guard treated it as an untrusted caller, and a
-- legitimate schema change failed with
--
--   P0001: college_id cannot be changed by this account
--
-- The question the guard actually wants to ask is "is this an end user?", and
-- the database already answers it: PostgREST connects as `authenticated` or
-- `anon`, while migrations and the service role do not.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Anything that is not an end-user request is already trusted: migrations,
  -- the service role, and direct administrative connections.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

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
