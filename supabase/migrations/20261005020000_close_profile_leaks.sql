-- Close the two holes that made the previous migration cosmetic.
--
-- RLS policies are OR'd. Turning RLS on activated policies that had been
-- sitting dormant on this table, and two of them gave everything away:
--
--   "Anyone can check username availability"  SELECT to public USING (true)
--       Every row, to everyone, signed in or not. It existed because signup
--       checks whether a username is taken by selecting from this table while
--       logged out.
--
--   "Allow public read access to public profiles"   is_profile_public = true
--   "Public profiles are viewable by everyone"      is_profile_public = true
--       The column defaults to true and all 38 rows have it, so these exposed
--       every student's email, college and graduation year to anonymous
--       callers — for a public profile page that does not exist. Nothing in
--       app/ renders one; the column is referenced only as a label on the
--       profile settings screen.
--
-- Username checking keeps working through a function that answers the question
-- without handing back rows.

create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.user_profiles
    where lower(username) = lower(btrim(candidate))
  )
$$;

comment on function public.is_username_available(text) is
  'Answers taken/not taken for signup without exposing any row. Replaces a '
  'USING (true) policy that made every profile world-readable.';

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

drop policy if exists "Anyone can check username availability" on public.user_profiles;
drop policy if exists "Allow public read access to public profiles" on public.user_profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.user_profiles;

-- Superseded by profiles_select_admin, which reads the role column. This one
-- still named dwiraj@eventscout.in and lochan@eventscout.in — a domain the
-- product no longer uses — and re-queried user_profiles from inside a policy
-- on user_profiles.
drop policy if exists "Admins can view all user profiles" on public.user_profiles;
drop policy if exists "Admins can update any user profile" on public.user_profiles;
