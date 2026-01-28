-- Automatic Attendance System
-- Automatically marks registered users as "attended" when event time passes

-- First, create event_attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auto_marked BOOLEAN DEFAULT FALSE, -- Track if attendance was automatically marked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one attendance record per user per event
    UNIQUE(user_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_attendance_user_id ON event_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_auto_marked ON event_attendance(auto_marked);

-- Enable RLS for security
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_attendance
-- Users can view their own attendance
CREATE POLICY "Users can view own attendance" ON event_attendance
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own attendance (manual check-in)
CREATE POLICY "Users can create own attendance" ON event_attendance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own attendance
CREATE POLICY "Users can update own attendance" ON event_attendance
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all attendance
CREATE POLICY "Admins can view all attendance" ON event_attendance
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'dwiraj06@gmail.com',
            'pokkalilochan@gmail.com', 
            'dwiraj@hatch.in',
            'lochan@hatch.in'
        )
    );

-- Grant permissions
GRANT ALL ON event_attendance TO authenticated;

-- Function to automatically mark attendance for past events
CREATE OR REPLACE FUNCTION auto_mark_attendance()
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    event_record RECORD;
    registration_record RECORD;
BEGIN
    -- Find events that have passed their scheduled time and haven't been processed
    FOR event_record IN 
        SELECT e.id, e.title, e.event_date, e.event_time,
               CASE 
                   WHEN e.event_time IS NOT NULL THEN 
                       (e.event_date::DATE + e.event_time::TIME)::TIMESTAMP WITH TIME ZONE
                   ELSE 
                       e.event_date::TIMESTAMP WITH TIME ZONE
               END AS event_datetime
        FROM events e
        WHERE e.status = 'published'
        AND CASE 
                WHEN e.event_time IS NOT NULL THEN 
                    (e.event_date::DATE + e.event_time::TIME)::TIMESTAMP WITH TIME ZONE
                ELSE 
                    e.event_date::TIMESTAMP WITH TIME ZONE
            END < NOW()
        -- Only process events that don't already have auto-marked attendance
        AND NOT EXISTS (
            SELECT 1 FROM event_attendance ea 
            WHERE ea.event_id = e.id AND ea.auto_marked = TRUE
        )
    LOOP
        -- Mark attendance for all registered users of this event
        FOR registration_record IN
            SELECT ur.user_id, ur.event_id
            FROM user_registrations ur
            WHERE ur.event_id = event_record.id
            AND ur.registration_status = 'registered'
            -- Don't create duplicate attendance records
            AND NOT EXISTS (
                SELECT 1 FROM event_attendance ea
                WHERE ea.user_id = ur.user_id AND ea.event_id = ur.event_id
            )
        LOOP
            -- Insert attendance record
            INSERT INTO event_attendance (
                user_id, 
                event_id, 
                auto_marked,
                marked_at
            ) VALUES (
                registration_record.user_id,
                registration_record.event_id,
                TRUE,
                NOW()
            );
            
            processed_count := processed_count + 1;
        END LOOP;
        
        RAISE NOTICE 'Auto-marked attendance for event: % (ID: %)', event_record.title, event_record.id;
    END LOOP;
    
    RAISE NOTICE 'Auto-marked attendance for % users across past events', processed_count;
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's attendance statistics
CREATE OR REPLACE FUNCTION get_user_attendance_stats(user_uuid UUID)
RETURNS TABLE (
    total_registered INTEGER,
    total_attended INTEGER,
    attendance_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ur.id)::INTEGER as total_registered,
        COUNT(ea.id)::INTEGER as total_attended,
        CASE 
            WHEN COUNT(ur.id) > 0 THEN 
                ROUND((COUNT(ea.id)::DECIMAL / COUNT(ur.id)::DECIMAL) * 100, 2)
            ELSE 0
        END as attendance_rate
    FROM user_registrations ur
    LEFT JOIN event_attendance ea ON ur.user_id = ea.user_id AND ur.event_id = ea.event_id
    WHERE ur.user_id = user_uuid
    AND ur.registration_status = 'registered';
END;
$$ LANGUAGE plpgsql;

-- Create a view for user attendance with event details
CREATE OR REPLACE VIEW user_attendance_with_events AS
SELECT 
    ea.id as attendance_id,
    ea.user_id,
    ea.event_id,
    ea.marked_at,
    ea.auto_marked,
    e.title as event_title,
    e.event_date,
    e.event_time,
    e.organizer,
    e.category,
    e.mode,
    e.required_tier,
    ur.registered_at
FROM event_attendance ea
JOIN events e ON ea.event_id = e.id
LEFT JOIN user_registrations ur ON ea.user_id = ur.user_id AND ea.event_id = ur.event_id
ORDER BY ea.marked_at DESC;

-- Grant access to views and functions
GRANT SELECT ON user_attendance_with_events TO authenticated;
GRANT EXECUTE ON FUNCTION auto_mark_attendance() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_attendance_stats(UUID) TO authenticated;

-- Test the automatic attendance system
DO $$
DECLARE
    test_result INTEGER;
BEGIN
    -- Run the auto-mark function to process any past events
    SELECT auto_mark_attendance() INTO test_result;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 AUTOMATIC ATTENDANCE SYSTEM READY!';
    RAISE NOTICE '✅ event_attendance table created with RLS policies';
    RAISE NOTICE '✅ auto_mark_attendance() function created';
    RAISE NOTICE '✅ get_user_attendance_stats() function created';
    RAISE NOTICE '✅ user_attendance_with_events view created';
    RAISE NOTICE '✅ Processed % existing past events', test_result;
    RAISE NOTICE '';
    RAISE NOTICE 'How it works:';
    RAISE NOTICE '1. Users register for events (stored in user_registrations)';
    RAISE NOTICE '2. When event time passes, auto_mark_attendance() runs';
    RAISE NOTICE '3. All registered users automatically get attendance = "attended"';
    RAISE NOTICE '4. Attendance stats are available via get_user_attendance_stats()';
    RAISE NOTICE '';
    RAISE NOTICE 'To run automatic marking manually:';
    RAISE NOTICE 'SELECT auto_mark_attendance();';
    RAISE NOTICE '';
    RAISE NOTICE 'To check user stats:';
    RAISE NOTICE 'SELECT * FROM get_user_attendance_stats(''user-uuid-here'');';
END $$;