-- "Collage" is not a kind of college.
--
-- The first backfill normalized case and whitespace, which merged
-- "New Horizon College of Engineering" with its trailing-space twin but not
-- with "New Horizon Collage Of Engineering" — a different string, so a
-- different row, so a student of the same institution counted separately.
--
-- This corrects the spelling everywhere it was typed, then merges any colleges
-- whose names collide once corrected, keeping whichever row already holds the
-- most students and re-pointing the rest. It is written generally rather than
-- against the two rows that happen to be wrong today, because the next
-- misspelling will arrive the same way: students type this field by hand.

-- What the student typed, kept honest.
update public.user_profiles
set college = regexp_replace(college, '\mcollage\M', 'college', 'gi')
where college ~* '\mcollage\M';

-- The spelling on the college record itself.
update public.colleges
set name = regexp_replace(name, '\mcollage\M', 'college', 'gi')
where name ~* '\mcollage\M';

-- Re-point students from every duplicate onto one survivor per corrected name.
with corrected as (
  select
    c.id,
    public.college_key(c.name) as key,
    (select count(*) from public.user_profiles p where p.college_id = c.id) as students
  from public.colleges c
),
survivor as (
  select distinct on (key) key, id as keep_id
  from corrected
  order by key, students desc, id
)
update public.user_profiles p
set college_id = s.keep_id
from corrected c
join survivor s on s.key = c.key
where p.college_id = c.id
  and c.id <> s.keep_id;

-- Drop the now-empty duplicates.
with corrected as (
  select c.id, public.college_key(c.name) as key,
         (select count(*) from public.user_profiles p where p.college_id = c.id) as students
  from public.colleges c
),
survivor as (
  select distinct on (key) key, id as keep_id
  from corrected
  order by key, students desc, id
)
delete from public.colleges c
using corrected x
join survivor s on s.key = x.key
where c.id = x.id
  and x.id <> s.keep_id;

-- Bring each slug back in line with its corrected name.
update public.colleges
set slug = public.college_key(name)
where slug is distinct from public.college_key(name);
