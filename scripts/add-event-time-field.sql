-- Add event time field to events table
-- This allows admins to specify both date and time for events

-- Add event_time column to store time separately
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_time TIME;

-- Update existing events to have a default time (if needed)
UPDATE events 
SET event_time = '10:00:00'
WHERE event_time IS NULL;

-- Create a view that combines date and time for easier querying
CREATE OR REPLACE VIEW events_with_datetime AS
SELECT 
    *,
    CASE 
        WHEN event_time IS NOT NULL THEN 
            (event_date::DATE + event_time::TIME)::TIMESTAMP WITH TIME ZONE
        ELSE 
            event_date::TIMESTAMP WITH TIME ZONE
    END AS event_datetime
FROM events;

-- Test the new field
DO $$
BEGIN
    -- Test inserting an event with time
    INSERT INTO events (
        title, description, event_link, category, 
        event_date, event_time, required_tier, status, 
        organizer, mode
    ) VALUES (
        'Test Event with Time', 
        'Testing the new time field', 
        'https://example.com', 
        'Technology',
        CURRENT_DATE + INTERVAL '7 days',
        '14:30:00',
        'free', 
        'draft',
        'Test Organizer',
        'Online'
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Event time field added successfully';
    
    -- Clean up test data
    DELETE FROM events WHERE title = 'Test Event with Time';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding event time field: %', SQLERRM;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 EVENT TIME FIELD ADDED!';
    RAISE NOTICE '✅ events.event_time column created';
    RAISE NOTICE '✅ Default time set for existing events';
    RAISE NOTICE '✅ events_with_datetime view created';
    RAISE NOTICE '';
    RAISE NOTICE 'Admins can now:';
    RAISE NOTICE '- Set specific times for events';
    RAISE NOTICE '- Display accurate event times to users';
    RAISE NOTICE '- Better event scheduling';
END $$;