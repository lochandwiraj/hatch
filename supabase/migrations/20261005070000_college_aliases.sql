-- Known names for the same college, and a rule that keeps applying.
--
-- Normalizing case, whitespace and one misspelling was never going to be
-- enough, because students type an abbreviation as often as a name. The table
-- currently holds Ramaiah three times — "M S Ramaiah Institute of Technology",
-- "Ramaiah Institute of Technology" and "MSRIT" — and BMS twice, each counted
-- as a different institution.
--
-- This adds an alias table so NHCE resolves to New Horizon rather than
-- becoming a 25th college the next time someone types it, merges the
-- duplicates that exist today, and links new signups automatically so the
-- problem stops recurring.

create table if not exists public.college_aliases (
  alias text primary key,
  college_id uuid not null references public.colleges(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.college_aliases is
  'Normalized alternative names and abbreviations for a college. The alias '
  'column holds the output of college_key(), never raw input.';

alter table public.college_aliases enable row level security;
drop policy if exists college_aliases_select on public.college_aliases;
create policy college_aliases_select on public.college_aliases
  for select to authenticated using (true);

-- Canonical names first, so the survivor of each merge reads properly.
update public.colleges set name = 'BMS Institute of Technology and Management'
  where public.college_key(name) = 'bms institute of technology and management';
update public.colleges set name = 'M S Ramaiah Institute of Technology'
  where public.college_key(name) = 'm s ramaiah institute of technology';
update public.colleges set name = 'Dayananda Sagar College of Engineering'
  where public.college_key(name) = 'dayanandh sagar college';
update public.colleges set name = 'CMR Institute of Technology'
  where public.college_key(name) = 'cmr institute of technology';

-- Groups of names that are one college. Each group names its survivor first.
create temporary table merge_groups (canonical text, variant text) on commit drop;
insert into merge_groups (canonical, variant) values
  ('bms institute of technology and management', 'bms institute of technology'),
  ('m s ramaiah institute of technology',        'ramaiah institute of technology'),
  ('m s ramaiah institute of technology',        'msrit');

-- Re-point students onto the survivor.
update public.user_profiles p
set college_id = keep.id
from merge_groups g
join public.colleges keep on public.college_key(keep.name) = g.canonical
join public.colleges dup  on public.college_key(dup.name)  = g.variant
where p.college_id = dup.id
  and dup.id <> keep.id;

-- Record the variant as an alias before the row disappears.
insert into public.college_aliases (alias, college_id)
select g.variant, keep.id
from merge_groups g
join public.colleges keep on public.college_key(keep.name) = g.canonical
on conflict (alias) do nothing;

delete from public.colleges c
using merge_groups g
join public.colleges keep on public.college_key(keep.name) = g.canonical
where public.college_key(c.name) = g.variant
  and c.id <> keep.id;

-- Abbreviations in common use. Seeded only for colleges that exist; the
-- alias table is the place to add more without touching code.
insert into public.college_aliases (alias, college_id)
select a.alias, c.id
from (values
  ('nhce',                                   'new horizon college of engineering'),
  ('new horizon',                            'new horizon college of engineering'),
  ('new horizon college',                    'new horizon college of engineering'),
  ('bmsit',                                  'bms institute of technology and management'),
  ('bmsitm',                                 'bms institute of technology and management'),
  ('bmsit&m',                                'bms institute of technology and management'),
  ('msrit',                                  'm s ramaiah institute of technology'),
  ('ms ramaiah institute of technology',     'm s ramaiah institute of technology'),
  ('ramaiah institute of technology',        'm s ramaiah institute of technology'),
  ('dsce',                                   'dayananda sagar college of engineering'),
  ('dayananda sagar',                        'dayananda sagar college of engineering'),
  ('dayananda sagar college',                'dayananda sagar college of engineering'),
  ('dayanandh sagar college',                'dayananda sagar college of engineering'),
  ('cmrit',                                  'cmr institute of technology'),
  ('cmr institute of technology',            'cmr institute of technology')
) as a(alias, target)
join public.colleges c on public.college_key(c.name) = a.target
on conflict (alias) do nothing;

-- Resolution: an alias wins, then an exact normalized name.
create or replace function public.resolve_college(raw text)
returns uuid
language sql
stable
as $$
  select coalesce(
    (select college_id from public.college_aliases where alias = public.college_key(raw)),
    (select id from public.colleges where slug = public.college_key(raw))
  )
$$;

-- Link a profile to a college from whatever the student typed.
--
-- Fires after guard_profile_privileges, which sorts earlier by name, so the
-- guard sees college_id unchanged and does not reject a student for editing
-- their own college text.
create or replace function public.set_college_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.college is null or btrim(new.college) = '' then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.college is not distinct from old.college and new.college_id is not null then
    return new;
  end if;
  new.college_id := coalesce(public.resolve_college(new.college), new.college_id);
  return new;
end
$$;

drop trigger if exists set_college_link on public.user_profiles;
create trigger set_college_link
  before insert or update of college on public.user_profiles
  for each row
  execute function public.set_college_link();

-- Anything still unlinked that an alias now covers.
update public.user_profiles p
set college_id = public.resolve_college(p.college)
where p.college_id is null
  and public.resolve_college(p.college) is not null;
