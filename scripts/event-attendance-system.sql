-- Event Attendance Tracking System
-- Comprehensive system for tracking event attendance with tier-based limits

-- Add attendance tracking columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS events_attended_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_attendance_reset DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS total_events_attended INTEGER DEFAULT 0;

-- Create event_attendance table to track individual event attendance
CREATE TABLE IF NOT EXISTS event_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attended BOOLEAN DEFAULT NULL, -- NULL = not confirmed, TRUE = attended, FALSE = did not attend
    attendance_confirmed_at TIMESTAMP WITH TIME ZONE,
    attendance_prompt_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Create attendance_prompts table to track when to send attendance confirmations
CREATE TABLE IF NOT EXISTS attendance_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    prompt_date DATE NOT NULL, -- Date when prompt should be sent (day after event)
    sent BOOLEAN DEFAULT FALSE,
    responded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_attendance_user_id ON event_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_prompts_prompt_date ON attendance_prompts(prompt_date);
CREATE INDEX IF NOT EXISTS idx_attendance_prompts_sent ON attendance_prompts(sent);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_reset ON user_profiles(last_attendance_reset);

-- Function to get tier-based attendance limits
CREATE OR REPLACE FUNCTION get_attendance_limit(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
    CASE tier
        WHEN 'free' THEN RETURN 5;
        WHEN 'basic_99' THEN RETURN 10;
        WHEN 'premium_149' THEN RETURN 999; -- Unlimited (high number)
        ELSE RETURN 5; -- Default to free tier
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can attend more events this month
CREATE OR REPLACE FUNCTION can_attend_event(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    events_this_month INTEGER;
    tier_limit INTEGER;
BEGIN
    -- Get user's current tier and events attended this month
    SELECT subscription_tier, events_attended_this_month 
    INTO user_tier, events_this_month
    FROM user_profiles 
    WHERE id = user_uuid;
    
    -- Get tier limit
    tier_limit := get_attendance_limit(user_tier);
    
    -- Check if user can attend more events
    RETURN events_this_month < tier_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to register user for an event
CREATE OR REPLACE FUNCTION register_for_event(user_uuid UUID, event_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    can_register BOOLEAN;
    user_tier TEXT;
    events_this_month INTEGER;
    tier_limit INTEGER;
    result JSONB;
BEGIN
    -- Reset monthly attendance if needed
    PERFORM reset_monthly_attendance(user_uuid);
    
    -- Check if user can register
    can_register := can_attend_event(user_uuid);
    
    -- Get user info for response
    SELECT subscription_tier, events_attended_this_month 
    INTO user_tier, events_this_month
    FROM user_profiles 
    WHERE id = user_uuid;
    
    tier_limit := get_attendance_limit(user_tier);
    
    IF can_register THEN
        -- Insert or update attendance record
        INSERT INTO event_attendance (user_id, event_id, registered_at)
        VALUES (user_uuid, event_uuid, NOW())
        ON CONFLICT (user_id, event_id) 
        DO UPDATE SET registered_at = NOW();
        
        -- Create attendance prompt for day after event
        INSERT INTO attendance_prompts (user_id, event_id, event_date, prompt_date)
        SELECT user_uuid, event_uuid, e.event_date, (e.event_date::DATE + INTERVAL '1 day')::DATE
        FROM events e 
        WHERE e.id = event_uuid
        ON CONFLICT DO NOTHING;
        
        result := jsonb_build_object(
            'success', true,
            'message', 'Successfully registered for event',
            'events_remaining', tier_limit - events_this_month - 1
        );
    ELSE
        result := jsonb_build_object(
            'success', false,
            'message', 'Monthly event limit reached',
            'current_tier', user_tier,
            'events_attended', events_this_month,
            'tier_limit', tier_limit,
            'upgrade_needed', CASE 
                WHEN user_tier = 'free' THEN 'basic_99'
                WHEN user_tier = 'basic_99' THEN 'premium_149'
                ELSE NULL
            END
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm event attendance
CREATE OR REPLACE FUNCTION confirm_attendance(user_uuid UUID, event_uuid UUID, did_attend BOOLEAN)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Update attendance record
    UPDATE event_attendance 
    SET 
        attended = did_attend,
        attendance_confirmed_at = NOW()
    WHERE user_id = user_uuid AND event_id = event_uuid;
    
    -- Mark prompt as responded
    UPDATE attendance_prompts 
    SET responded = true 
    WHERE user_id = user_uuid AND event_id = event_uuid;
    
    IF did_attend THEN
        -- Increment attendance counters
        UPDATE user_profiles 
        SET 
            events_attended_this_month = events_attended_this_month + 1,
            total_events_attended = total_events_attended + 1,
            updated_at = NOW()
        WHERE id = user_uuid;
        
        result := jsonb_build_object(
            'success', true,
            'message', 'Attendance confirmed! Event added to your profile.',
            'attended', true
        );
    ELSE
        result := jsonb_build_object(
            'success', true,
            'message', 'Thanks for the update. Better luck next time!',
            'attended', false
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly attendance (called automatically)
CREATE OR REPLACE FUNCTION reset_monthly_attendance(user_uuid UUID)
RETURNS void AS $$
DECLARE
    last_reset DATE;
    current_month_start DATE;
BEGIN
    -- Get user's last reset date
    SELECT last_attendance_reset INTO last_reset
    FROM user_profiles 
    WHERE id = user_uuid;
    
    -- Calculate current month start
    current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    
    -- Reset if it's a new month
    IF last_reset < current_month_start THEN
        UPDATE user_profiles 
        SET 
            events_attended_this_month = 0,
            last_attendance_reset = current_month_start,
            updated_at = NOW()
        WHERE id = user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending attendance prompts for a user
CREATE OR REPLACE FUNCTION get_pending_attendance_prompts(user_uuid UUID)
RETURNS TABLE (
    prompt_id UUID,
    event_id UUID,
    event_title TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    prompt_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.id,
        ap.event_id,
        e.title,
        e.event_date,
        ap.prompt_date
    FROM attendance_prompts ap
    JOIN events e ON ap.event_id = e.id
    WHERE ap.user_id = user_uuid
    AND ap.sent = false
    AND ap.responded = false
    AND ap.prompt_date <= CURRENT_DATE
    ORDER BY ap.prompt_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically downgrade expired subscriptions (enhanced)
CREATE OR REPLACE FUNCTION auto_downgrade_expired_subscriptions()
RETURNS void AS $$
BEGIN
    -- Downgrade expired subscriptions
    UPDATE user_profiles 
    SET 
        subscription_tier = 'free',
        subscription_expires_at = NULL,
        updated_at = NOW()
    WHERE 
        subscription_tier IN ('basic_99', 'premium_149')
        AND subscription_expires_at IS NOT NULL 
        AND subscription_expires_at < NOW()
        AND auto_downgrade_enabled = true;
        
    -- Reset monthly attendance for all users if it's a new month
    UPDATE user_profiles 
    SET 
        events_attended_this_month = 0,
        last_attendance_reset = DATE_TRUNC('month', CURRENT_DATE)::DATE,
        updated_at = NOW()
    WHERE last_attendance_reset < DATE_TRUNC('month', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for new tables
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_prompts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own attendance records
CREATE POLICY "Users can manage own attendance" ON event_attendance
    FOR ALL USING (auth.uid() = user_id);

-- Users can view their own attendance prompts
CREATE POLICY "Users can view own prompts" ON attendance_prompts
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all attendance data
CREATE POLICY "Admins can view all attendance" ON event_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

CREATE POLICY "Admins can view all prompts" ON attendance_prompts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

-- Grant permissions
GRANT ALL ON event_attendance TO authenticated;
GRANT ALL ON attendance_prompts TO authenticated;

-- Create a view for user attendance statistics
CREATE OR REPLACE VIEW user_attendance_stats AS
SELECT 
    up.id,
    up.username,
    up.full_name,
    up.subscription_tier,
    up.events_attended_this_month,
    up.total_events_attended,
    up.last_attendance_reset,
    get_attendance_limit(up.subscription_tier) as monthly_limit,
    (get_attendance_limit(up.subscription_tier) - up.events_attended_this_month) as events_remaining
FROM user_profiles up;

-- Grant access to the view
GRANT SELECT ON user_attendance_stats TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Event Attendance System schema applied successfully!';
    RAISE NOTICE 'New features:';
    RAISE NOTICE '- Event registration with tier-based limits';
    RAISE NOTICE '- Attendance confirmation system';
    RAISE NOTICE '- Monthly attendance reset';
    RAISE NOTICE '- Automatic subscription expiration';
    RAISE NOTICE '- Attendance statistics tracking';
END;
$$;