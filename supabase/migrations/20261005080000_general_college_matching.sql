-- Make the abbreviation rule general, without guessing.
--
-- Hand-listing NHCE, BMSIT, MSRIT, DSCE and CMRIT fixes five colleges and
-- leaves every other one to drift. The rule should derive from the name.
--
-- A dry run first showed why the obvious version is dangerous. Taking the
-- first letter of every significant word produces:
--
--   cit  -> CMR Institute of Technology
--   cit  -> Cambridge institute of technology    a different college
--   i    -> IIITB          s -> sngcet           v -> Vvce
--   bitm -> BMS Institute of Technology and Management   (really BMSIT)
--
-- A student typing CIT would have been filed under the wrong institution, and
-- "i" would have matched anything. So three rules:
--
--   1. A token that is already an acronym in the original — written in capitals
--      — is kept whole. "CMR Institute of Technology" gives CMRIT, not CIT, and
--      stops colliding with Cambridge.
--   2. An acronym shorter than three characters is discarded. One letter is not
--      an abbreviation, it is a coincidence waiting to happen.
--   3. An acronym that collides with another college, an existing alias, or a
--      college's own name is discarded for every side of the collision. Two
--      colleges sharing an abbreviation is a question for a human, and filing a
--      student under a guess is worse than leaving them unlinked.

create or replace function public.college_acronym(raw text)
returns text
language plpgsql
immutable
as $$
declare
  cleaned text;
  word text;
  out text := '';
begin
  if raw is null then
    return null;
  end if;

  -- Punctuation out, & spelled, so "Dr. T. Thimmaiah" and "B.M.S" behave.
  cleaned := btrim(regexp_replace(regexp_replace(raw, '&', ' and ', 'g'), '[^a-zA-Z0-9]', ' ', 'g'));
  if cleaned = '' then
    return null;
  end if;

  foreach word in array regexp_split_to_array(cleaned, '\s+') loop
    continue when word = '';
    continue when lower(word) in ('of', 'and', 'the', 'for', 'in', 'at', 'a', 'to');

    -- Already an acronym in the source: keep it whole.
    if length(word) >= 2 and word = upper(word) and word ~ '[A-Z]' then
      out := out || lower(word);
    else
      out := out || lower(left(word, 1));
    end if;
  end loop;

  -- One or two letters is not an abbreviation.
  if length(out) < 3 then
    return null;
  end if;

  return out;
end
$$;

-- Candidate acronyms, minus anything ambiguous.
create or replace function public.refresh_college_acronyms()
returns integer
language plpgsql
as $$
declare
  added integer := 0;
begin
  with candidate as (
    select c.id, public.college_acronym(c.name) as acr
    from public.colleges c
    where public.college_acronym(c.name) is not null
  ),
  -- Rule 3: drop an acronym claimed by more than one college, or already
  -- meaning something else.
  unambiguous as (
    -- The group holds exactly one distinct id, so take it from the array:
    -- Postgres has no min() for uuid.
    select acr, (array_agg(id))[1] as college_id
    from candidate
    group by acr
    having count(distinct id) = 1
  ),
  safe as (
    select u.acr, u.college_id
    from unambiguous u
    where not exists (select 1 from public.colleges c where c.slug = u.acr)
      and not exists (
        select 1 from public.college_aliases a
        where a.alias = u.acr and a.college_id <> u.college_id
      )
  )
  insert into public.college_aliases (alias, college_id)
  select acr, college_id from safe
  on conflict (alias) do nothing;

  get diagnostics added = row_count;
  return added;
end
$$;

select public.refresh_college_acronyms();

-- Any college added or renamed later gets the same treatment, so this does not
-- become a one-off that rots.
create or replace function public.college_acronym_sync()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_college_acronyms();
  return null;
end
$$;

drop trigger if exists colleges_acronym_sync on public.colleges;
create trigger colleges_acronym_sync
  after insert or update of name on public.colleges
  for each statement
  execute function public.college_acronym_sync();

-- Matching also ignores punctuation now, so "Dr T Thimmaiah" finds
-- "Dr. T. Thimmaiah Institute of Technology" without a hand-written alias.
create or replace function public.college_loose_key(raw text)
returns text
language sql
immutable
as $$
  select nullif(
    btrim(regexp_replace(
      lower(regexp_replace(regexp_replace(coalesce(raw, ''), '&', ' and ', 'g'), '[^a-zA-Z0-9]', ' ', 'g')),
      '\s+', ' ', 'g'
    )),
    ''
  )
$$;

-- Alias, then exact name, then the same name ignoring punctuation. Still fails
-- open: an unrecognised college stays unlinked and becomes its own record,
-- because wrongly merging two institutions is far harder to undo than adding
-- an alias.
create or replace function public.resolve_college(raw text)
returns uuid
language sql
stable
as $$
  select coalesce(
    (select college_id from public.college_aliases where alias = public.college_key(raw)),
    (select college_id from public.college_aliases where alias = public.college_loose_key(raw)),
    (select id from public.colleges where slug = public.college_key(raw)),
    (select id from public.colleges
      where public.college_loose_key(name) = public.college_loose_key(raw)
      limit 1)
  )
$$;

-- Pick up anyone an acronym now covers.
update public.user_profiles p
set college_id = public.resolve_college(p.college)
where p.college_id is null
  and public.resolve_college(p.college) is not null;
