-- Fix: Add reasonable limit to subscription duration to prevent date overflow
-- Maximum: 36500 days (100 years) to avoid PostgreSQL date range errors

CREATE OR REPLACE FUNCTION admin_upgrade_user_tier(
    target_user_id UUID,
    new_tier VARCHAR(20),
    admin_user_id UUID,
    duration_days INTEGER DEFAULT 30
)
RETURNS void AS $$
DECLARE
    capped_duration INTEGER;
BEGIN
    -- Cap duration at 36500 days (100 years) to prevent date overflow
    capped_duration := LEAST(duration_days, 36500);
    
    UPDATE user_profiles 
    SET 
        subscription_tier = new_tier,
        subscription_expires_at = CASE 
            WHEN new_tier = 'free' THEN NULL
            ELSE NOW() + INTERVAL '1 day' * capped_duration
        END,
        tier_upgraded_by = admin_user_id,
        tier_upgraded_at = NOW(),
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION admin_upgrade_user_tier IS 'Admin function to upgrade user subscription tier with expiration tracking. Duration is capped at 36500 days (100 years) to prevent date overflow.';
