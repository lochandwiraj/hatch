-- Create user registrations table for calendar functionality
-- This tracks which events users have registered for

-- Create user_registrations table
CREATE TABLE IF NOT EXISTS user_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registration_status VARCHAR(20) DEFAULT 'registered' CHECK (registration_status IN ('registered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one registration per user per event
    UNIQUE(user_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_registrations_user_id ON user_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_registrations_event_id ON user_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_user_registrations_status ON user_registrations(registration_status);

-- Enable RLS for security
ALTER TABLE user_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own registrations
CREATE POLICY "Users can view own registrations" ON user_registrations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can create own registrations" ON user_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update own registrations" ON user_registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own registrations
CREATE POLICY "Users can delete own registrations" ON user_registrations
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_registrations TO authenticated;

-- Create a view for user's registered events with event details
CREATE OR REPLACE VIEW user_registered_events AS
SELECT 
    ur.id as registration_id,
    ur.user_id,
    ur.registered_at,
    ur.registration_status,
    e.*
FROM user_registrations ur
JOIN events e ON ur.event_id = e.id
WHERE ur.registration_status = 'registered'
ORDER BY e.event_date ASC;

-- Grant access to the view
GRANT SELECT ON user_registered_events TO authenticated;

-- Test the table
DO $$
BEGIN
    RAISE NOTICE '✅ User registrations table created successfully';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ user_registered_events view created';
    RAISE NOTICE '';
    RAISE NOTICE 'Calendar features now available:';
    RAISE NOTICE '- Track user event registrations';
    RAISE NOTICE '- Display registered events in calendar';
    RAISE NOTICE '- Registration confirmation system';
END $$;