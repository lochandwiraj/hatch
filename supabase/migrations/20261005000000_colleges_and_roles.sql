-- Colleges as records, and a role on every account.
--
-- user_profiles.college is free text, and it has already drifted the way free
-- text does: "New Horizon College of Engineering" has six students and the
-- same name with a trailing space has two more. A college dashboard keyed on
-- that string would undercount its own students on the first day, so colleges
-- become rows and students point at them.
--
-- role is added here rather than inferred from an email list, because the
-- college sign-in is a real account that must never reach an admin screen, and
-- an array of addresses in the frontend cannot enforce that.

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- The normalized name. Doubles as the matching key for the backfill below.
  slug text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.colleges is
  'One row per institution. user_profiles.college_id points here; the legacy '
  'free-text user_profiles.college is kept as what the student typed.';

alter table public.user_profiles
  add column if not exists college_id uuid references public.colleges(id) on delete set null;

alter table public.user_profiles
  add column if not exists role text not null default 'student';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_role_check') then
    alter table public.user_profiles
      add constraint user_profiles_role_check
      check (role in ('student', 'college', 'admin'));
  end if;
end $$;

comment on column public.user_profiles.role is
  'student (default), college (sees only its own institution), admin.';

-- Case, spacing and trailing blanks are not different colleges.
create or replace function public.college_key(raw text)
returns text
language sql
immutable
as $$
  select nullif(lower(regexp_replace(btrim(coalesce(raw, '')), '\s+', ' ', 'g')), '')
$$;

-- Backfill: one row per distinct normalized name, keeping the spelling that
-- the most students used as the display name.
with norm as (
  select public.college_key(college) as key, btrim(college) as name, count(*) as n
  from public.user_profiles
  where public.college_key(college) is not null
  group by 1, 2
),
pick as (
  select distinct on (key) key, name
  from norm
  order by key, n desc, length(name) desc
)
insert into public.colleges (name, slug)
select name, key from pick
on conflict (slug) do nothing;

update public.user_profiles p
set college_id = c.id
from public.colleges c
where c.slug = public.college_key(p.college)
  and p.college_id is distinct from c.id;

create index if not exists user_profiles_college_id_idx on public.user_profiles (college_id);
create index if not exists user_profiles_role_idx on public.user_profiles (role);
