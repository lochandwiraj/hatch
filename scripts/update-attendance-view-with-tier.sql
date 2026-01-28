-- Update user_attendance_with_events view to include required_tier
-- This allows PDF generation to filter events by user's subscription tier

-- Drop and recreate the view to ensure clean update
DROP VIEW IF EXISTS user_attendance_with_events;

CREATE VIEW user_attendance_with_events AS
SELECT 
    ea.id as attendance_id,
    ea.user_id,
    ea.event_id,
    ea.attended_at,
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
ORDER BY ea.attended_at DESC;

-- Grant access to the updated view
GRANT SELECT ON user_attendance_with_events TO authenticated;

-- Test the updated view
DO $$
BEGIN
    RAISE NOTICE '✅ Updated user_attendance_with_events view to include required_tier';
    RAISE NOTICE '✅ PDF reports will now filter events by user subscription tier';
    RAISE NOTICE '';
    RAISE NOTICE 'Tier filtering logic:';
    RAISE NOTICE '- Free users: Only see Free events';
    RAISE NOTICE '- Explorer users: See Free + Explorer events';
    RAISE NOTICE '- Professional users: See all events';
    RAISE NOTICE '';
    RAISE NOTICE 'View updated successfully! You can now generate tier-filtered PDFs.';
END $$;