-- Update Attendance System for Universal Prompts
-- This updates the system to show attendance prompts to ALL users for past events

-- Function to get pending attendance prompts based on user's tier
CREATE OR REPLACE FUNCTION get_pending_attendance_prompts(user_uuid UUID)
RETURNS TABLE (
    prompt_id UUID,
    event_id UUID,
    event_title TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    prompt_date DATE
) AS $
DECLARE
    user_tier TEXT;
    allowed_tiers TEXT[];
BEGIN
    -- Get user's current subscription tier
    SELECT subscription_tier INTO user_tier
    FROM user_profiles 
    WHERE id = user_uuid;
    
    -- Set allowed event tiers based on user's subscription tier
    CASE user_tier
        WHEN 'free' THEN 
            allowed_tiers := ARRAY['free'];
        WHEN 'basic_99' THEN 
            allowed_tiers := ARRAY['free', 'basic_99'];
        WHEN 'premium_149' THEN 
            allowed_tiers := ARRAY['free', 'basic_99', 'premium_149'];
        ELSE 
            allowed_tiers := ARRAY['free']; -- Default to free if tier not recognized
    END CASE;
    
    RETURN QUERY
    SELECT 
        gen_random_uuid() as prompt_id,
        e.id as event_id,
        e.title as event_title,
        e.event_date,
        (e.event_date::DATE + INTERVAL '1 day')::DATE as prompt_date
    FROM events e
    LEFT JOIN event_attendance ea ON ea.event_id = e.id AND ea.user_id = user_uuid
    WHERE e.status = 'published'
    AND e.event_date::DATE < CURRENT_DATE  -- Event has passed
    AND (e.event_date::DATE + INTERVAL '1 day')::DATE <= CURRENT_DATE  -- It's day after or later
    AND e.required_tier = ANY(allowed_tiers)  -- Only events user's tier can access
    AND (ea.attended IS NULL OR ea.id IS NULL)  -- Not yet confirmed attendance
    ORDER BY e.event_date DESC
    LIMIT 5;  -- Limit to 5 most recent events to avoid overwhelming users
END;
$ LANGUAGE plpgsql;

-- Updated confirm_attendance function with tier validation
CREATE OR REPLACE FUNCTION confirm_attendance(user_uuid UUID, event_uuid UUID, did_attend BOOLEAN)
RETURNS JSONB AS $
DECLARE
    result JSONB;
    existing_record_id UUID;
    user_tier TEXT;
    event_tier TEXT;
    allowed_tiers TEXT[];
    can_attend BOOLEAN := false;
BEGIN
    -- Get user's tier and event's required tier
    SELECT subscription_tier INTO user_tier
    FROM user_profiles 
    WHERE id = user_uuid;
    
    SELECT required_tier INTO event_tier
    FROM events 
    WHERE id = event_uuid;
    
    -- Check if user's tier allows access to this event
    CASE user_tier
        WHEN 'free' THEN 
            allowed_tiers := ARRAY['free'];
        WHEN 'basic_99' THEN 
            allowed_tiers := ARRAY['free', 'basic_99'];
        WHEN 'premium_149' THEN 
            allowed_tiers := ARRAY['free', 'basic_99', 'premium_149'];
        ELSE 
            allowed_tiers := ARRAY['free'];
    END CASE;
    
    -- Check if event tier is in allowed tiers
    can_attend := event_tier = ANY(allowed_tiers);
    
    IF NOT can_attend THEN
        result := jsonb_build_object(
            'success', false,
            'message', 'You cannot confirm attendance for events outside your subscription tier.',
            'attended', false
        );
        RETURN result;
    END IF;
    
    -- Check if attendance record exists, if not create one
    SELECT id INTO existing_record_id 
    FROM event_attendance 
    WHERE user_id = user_uuid AND event_id = event_uuid;
    
    IF existing_record_id IS NULL THEN
        -- Create new attendance record
        INSERT INTO event_attendance (user_id, event_id, attended, attendance_confirmed_at)
        VALUES (user_uuid, event_uuid, did_attend, NOW())
        RETURNING id INTO existing_record_id;
    ELSE
        -- Update existing record
        UPDATE event_attendance 
        SET 
            attended = did_attend,
            attendance_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE id = existing_record_id;
    END IF;
    
    IF did_attend THEN
        -- Reset monthly attendance if needed
        PERFORM reset_monthly_attendance(user_uuid);
        
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
$ LANGUAGE plpgsql;

-- Success message
DO $
BEGIN
    RAISE NOTICE 'Tier-based attendance system updated successfully!';
    RAISE NOTICE 'Changes:';
    RAISE NOTICE '- Free users: Only get prompts for Free events';
    RAISE NOTICE '- Explorer users: Get prompts for Free + Explorer events';
    RAISE NOTICE '- Professional users: Get prompts for Free + Explorer + Professional events';
    RAISE NOTICE '- Only confirmed attendance counts toward monthly limits';
END;
$;