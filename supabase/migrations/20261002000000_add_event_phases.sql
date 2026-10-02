-- Optional phase schedule for multi-stage events.
--
-- A hackathon is rarely one date: it runs as rounds — registration, a
-- prototype stage, a final — each with its own window. Until now an event
-- carried a single event_date, so those stages had nowhere to live and ended
-- up buried in the description as prose.
--
-- Stored as jsonb rather than ten columns (phase1_start … phase5_end) because
-- the count varies per event and most events have none at all. Shape:
--
--   [{"phase": 1, "start": "2026-05-01", "end": "2026-05-10"}, ...]
--
-- Entirely optional: null means the event has no phases, which is the normal
-- case and stays the default for every row that already exists.

alter table public.events
  add column if not exists phases jsonb;

comment on column public.events.phases is
  'Optional stages for multi-round events. Array of up to 5 objects: '
  '{phase:int, start:date, end:date}. Null when the event has no phases.';

-- The cap is the database''s rule, not the form''s. The admin composer offers
-- five rows; without this, anything could write a sixth.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_phases_shape'
  ) then
    alter table public.events
      add constraint events_phases_shape
      check (
        phases is null
        or (
          jsonb_typeof(phases) = 'array'
          and jsonb_array_length(phases) <= 5
        )
      );
  end if;
end $$;
