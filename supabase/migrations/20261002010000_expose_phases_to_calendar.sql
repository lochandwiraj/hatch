-- Expose events.phases through the view the calendar reads.
--
-- user_registered_events was created before events.phases existed, so the
-- column was invisible to every consumer of the view: a student could have
-- phases saved against an event they are registered for and the calendar had
-- no way to know. The column is appended last, which is what
-- `create or replace view` allows, so every existing column keeps its position
-- and nothing downstream shifts.

create or replace view public.user_registered_events as
 SELECT ur.id AS registration_id,
    ur.user_id,
    ur.registered_at,
    ur.registration_status,
    e.id,
    e.title,
    e.description,
    e.event_link,
    e.poster_image_url,
    e.category,
    e.tags,
    e.event_date,
    e.registration_deadline,
    e.required_tier,
    e.status,
    e.is_early_access,
    e.organizer,
    e.prize_pool,
    e.mode,
    e.eligibility,
    e.created_at,
    e.updated_at,
    e.event_time,
    e.phases
   FROM user_registrations ur
     JOIN events e ON ur.event_id = e.id
  WHERE ur.registration_status::text = 'registered'::text
  ORDER BY e.event_date;
