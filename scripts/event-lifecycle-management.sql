-- Event Lifecycle Management System
-- Automatically manages event lifecycle: completion badges and auto-deletion after 4 days

-- Step 1: Add archived_events table to store event data before deletion (for PDF generation)
CREATE TABLE IF NOT EXISTS archived_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_event_id UUID NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  organizer TEXT,
  category TEXT,
  mode TEXT,
  tier_requirement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add archived_attendance table to preserve attendance records
CREATE TABLE IF NOT EXISTS archived_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archived_event_id UUID NOT NULL REFERENCES archived_events(id) ON DELETE CASCADE,
  original_event_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  attended_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, archived_event_id)
);

-- Step 3: Create function to archive event data before deletion
CREATE OR REPLACE FUNCTION archive_event_data(event_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive the event details
  INSERT INTO archived_events (
    original_event_id,
    event_name,
    event_date,
    event_time,
    organizer,
    category,
    mode,
    tier_requirement
  )
  SELECT 
    id,
    title,
    event_date::DATE,
    event_time::TEXT,
    organizer,
    category,
    mode,
    required_tier
  FROM events
  WHERE id = event_id_param
  ON CONFLICT DO NOTHING;

  -- Archive attendance records for users who attended
  INSERT INTO archived_attendance (
    user_id,
    archived_event_id,
    original_event_id,
    event_name,
    event_date,
    attended_at
  )
  SELECT 
    ea.user_id,
    ae.id,
    ea.event_id,
    ae.event_name,
    ae.event_date,
    ea.attended_at
  FROM event_attendance ea
  JOIN archived_events ae ON ae.original_event_id = ea.event_id
  WHERE ea.event_id = event_id_param
  ON CONFLICT (user_id, archived_event_id) DO NOTHING;

  RAISE NOTICE 'Event % archived successfully', event_id_param;
END;
$$;

-- Step 4: Create function to delete old events (4 days after event date)
CREATE OR REPLACE FUNCTION delete_old_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  deleted_count INTEGER := 0;
BEGIN
  -- Find events that are 4+ days old
  FOR event_record IN
    SELECT id, title, event_date
    FROM events
    WHERE event_date::DATE < (CURRENT_DATE - INTERVAL '4 days')
  LOOP
    -- Archive the event data first
    PERFORM archive_event_data(event_record.id);
    
    -- Delete the event (cascade will handle related records)
    DELETE FROM events WHERE id = event_record.id;
    
    deleted_count := deleted_count + 1;
    RAISE NOTICE 'Deleted event: % (Date: %)', event_record.title, event_record.event_date;
  END LOOP;

  RAISE NOTICE 'Total events deleted: %', deleted_count;
END;
$$;

-- Step 5: Create function to get archived attendance for PDF generation
CREATE OR REPLACE FUNCTION get_user_archived_attendance(user_uuid UUID)
RETURNS TABLE (
  event_name TEXT,
  event_date DATE,
  event_time TEXT,
  organizer TEXT,
  category TEXT,
  mode TEXT,
  attended_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.event_name,
    aa.event_date,
    ae.event_time,
    ae.organizer,
    ae.category,
    ae.mode,
    aa.attended_at
  FROM archived_attendance aa
  JOIN archived_events ae ON aa.archived_event_id = ae.id
  WHERE aa.user_id = user_uuid
  ORDER BY aa.event_date DESC;
END;
$$;

-- Step 6: Create view for combined attendance (current + archived)
CREATE OR REPLACE VIEW user_complete_attendance AS
SELECT 
  ea.user_id,
  e.id as event_id,
  e.title as event_name,
  e.event_date::DATE as event_date,
  e.event_time::TEXT as event_time,
  e.organizer,
  e.category,
  e.mode,
  ea.attended_at,
  up.subscription_tier,
  e.required_tier,
  FALSE as is_archived
FROM event_attendance ea
JOIN events e ON ea.event_id = e.id
JOIN user_profiles up ON ea.user_id = up.id

UNION ALL

SELECT 
  aa.user_id,
  aa.original_event_id as event_id,
  aa.event_name,
  aa.event_date,
  ae.event_time,
  ae.organizer,
  ae.category,
  ae.mode,
  aa.attended_at,
  up.subscription_tier,
  ae.tier_requirement as required_tier,
  TRUE as is_archived
FROM archived_attendance aa
JOIN archived_events ae ON aa.archived_event_id = ae.id
JOIN user_profiles up ON aa.user_id = up.id;

-- Step 7: Grant permissions
GRANT SELECT ON archived_events TO authenticated;
GRANT SELECT ON archived_attendance TO authenticated;
GRANT SELECT ON user_complete_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_archived_attendance(UUID) TO authenticated;

-- Step 8: Enable RLS
ALTER TABLE archived_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_attendance ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
CREATE POLICY "Users can view archived events"
  ON archived_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own archived attendance"
  ON archived_attendance FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_archived_events_date ON archived_events(event_date);
CREATE INDEX IF NOT EXISTS idx_archived_events_original_id ON archived_events(original_event_id);
CREATE INDEX IF NOT EXISTS idx_archived_attendance_user ON archived_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_attendance_event ON archived_attendance(archived_event_id);
CREATE INDEX IF NOT EXISTS idx_events_date_cleanup ON events(event_date);

COMMENT ON TABLE archived_events IS 'Stores event data after deletion for PDF generation';
COMMENT ON TABLE archived_attendance IS 'Stores attendance records after event deletion for PDF generation';
COMMENT ON FUNCTION delete_old_events() IS 'Deletes events 4+ days old after archiving data';
COMMENT ON FUNCTION archive_event_data(UUID) IS 'Archives event and attendance data before deletion';
COMMENT ON VIEW user_complete_attendance IS 'Combined view of current and archived attendance for PDF generation';
