-- Attendance Confirmation System
-- Tracks which users have been asked about attendance for which events
-- Shows confirmation modal the day after events end

-- Create attendance_confirmations table to track which confirmations have been shown
CREATE TABLE IF NOT EXISTS attendance_confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one confirmation per user per event
    UNIQUE(user_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_confirmations_user_id ON attendance_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_confirmations_event_id ON attendance_confirmations(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_confirmations_confirmed_at ON attendance_confirmations(confirmed_at);

-- Enable RLS for security
ALTER TABLE attendance_confirmations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own confirmations
CREATE POLICY "Users can view own confirmations" ON attendance_confirmations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own confirmations
CREATE POLICY "Users can create own confirmations" ON attendance_confirmations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own confirmations
CREATE POLICY "Users can update own confirmations" ON attendance_confirmations
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all confirmations
CREATE POLICY "Admins can view all confirmations" ON attendance_confirmations
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'dwiraj06@gmail.com',
            'pokkalilochan@gmail.com', 
            'dwiraj@hatch.in',
            'lochan@hatch.in'
        )
    );

-- Grant permissions
GRANT ALL ON attendance_confirmations TO authenticated;

-- Function to get events that need attendance confirmation
-- Returns events that:
-- 1. User registered for
-- 2. Event ended yesterday or earlier
-- 3. User hasn't been asked about attendance yet
-- 4. User hasn't already marked attendance
CREATE OR REPLACE FUNCTION get_events_needing_attendance_confirmation(user_uuid UUID)
RETURNS TABLE (
    event_id UUID,
    title TEXT,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    event_time TIME,
    organizer TEXT,
    mode TEXT,
    category TEXT,
    registered_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as event_id,
        e.title,
        e.description,
        e.event_date,
        e.event_time,
        e.organizer,
        e.mode,
        e.category,
        ur.registered_at
    FROM events e
    JOIN user_registrations ur ON e.id = ur.event_id
    WHERE ur.user_id = user_uuid
    AND ur.registration_status = 'registered'
    AND e.status = 'published'
    -- Event ended at least 1 day ago (yesterday or earlier)
    AND CASE 
        WHEN e.event_time IS NOT NULL THEN 
            (e.event_date::DATE + e.event_time::TIME)::TIMESTAMP WITH TIME ZONE
        ELSE 
            e.event_date::TIMESTAMP WITH TIME ZONE
    END < (CURRENT_DATE - INTERVAL '0 days')::TIMESTAMP WITH TIME ZONE
    -- User hasn't been asked about attendance yet
    AND NOT EXISTS (
        SELECT 1 FROM attendance_confirmations ac
        WHERE ac.user_id = user_uuid AND ac.event_id = e.id
    )
    -- User hasn't already marked attendance
    AND NOT EXISTS (
        SELECT 1 FROM event_attendance ea
        WHERE ea.user_id = user_uuid AND ea.event_id = e.id
    )
    ORDER BY e.event_date DESC
    LIMIT 1; -- Only show one at a time to avoid overwhelming users
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_events_needing_attendance_confirmation(UUID) TO authenticated;

-- Function to mark attendance manually (called when user confirms)
CREATE OR REPLACE FUNCTION mark_manual_attendance(user_uuid UUID, event_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    attendance_exists BOOLEAN := FALSE;
BEGIN
    -- Check if attendance already exists
    SELECT EXISTS(
        SELECT 1 FROM event_attendance 
        WHERE user_id = user_uuid AND event_id = event_uuid
    ) INTO attendance_exists;
    
    IF attendance_exists THEN
        RETURN FALSE; -- Already marked
    END IF;
    
    -- Insert attendance record
    INSERT INTO event_attendance (
        user_id, 
        event_id, 
        auto_marked,
        attended_at
    ) VALUES (
        user_uuid,
        event_uuid,
        FALSE, -- Manual confirmation
        NOW()
    );
    
    -- Mark as confirmed so modal doesn't show again
    INSERT INTO attendance_confirmations (
        user_id,
        event_id,
        confirmed_at
    ) VALUES (
        user_uuid,
        event_uuid,
        NOW()
    ) ON CONFLICT (user_id, event_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_manual_attendance(UUID, UUID) TO authenticated;

-- Test the system
DO $$
DECLARE
    test_result INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ATTENDANCE CONFIRMATION SYSTEM READY!';
    RAISE NOTICE '✅ attendance_confirmations table created with RLS policies';
    RAISE NOTICE '✅ get_events_needing_attendance_confirmation() function created';
    RAISE NOTICE '✅ mark_manual_attendance() function created';
    RAISE NOTICE '';
    RAISE NOTICE 'How it works:';
    RAISE NOTICE '1. User registers for event (stored in user_registrations)';
    RAISE NOTICE '2. Event happens and ends';
    RAISE NOTICE '3. Next day when user visits HATCH, modal appears asking "Did you attend?"';
    RAISE NOTICE '4. If user clicks "Yes" → attendance recorded + stats updated';
    RAISE NOTICE '5. If user clicks "No" → just marked as confirmed (no attendance)';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions to use:';
    RAISE NOTICE '- Check for events needing confirmation: SELECT * FROM get_events_needing_attendance_confirmation(''user-uuid'');';
    RAISE NOTICE '- Mark manual attendance: SELECT mark_manual_attendance(''user-uuid'', ''event-uuid'');';
END $$;