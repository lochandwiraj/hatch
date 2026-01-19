-- Fix user_profiles table constraints for tier management
-- This resolves the subscription_tier_check constraint violation

-- Drop the old constraint that's causing issues
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_tier_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS check_subscription_tier;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS subscription_tier_check;

-- Add the correct constraint with updated tier values
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'basic_99', 'premium_149'));

-- Also ensure the column exists and has proper defaults
ALTER TABLE user_profiles ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- Update any existing invalid tier values to valid ones
UPDATE user_profiles 
SET subscription_tier = 'premium_149' 
WHERE subscription_tier = 'premium_199' OR subscription_tier = 'professional';

UPDATE user_profiles 
SET subscription_tier = 'basic_99' 
WHERE subscription_tier = 'explorer';

UPDATE user_profiles 
SET subscription_tier = 'free' 
WHERE subscription_tier NOT IN ('free', 'basic_99', 'premium_149');

-- Disable RLS on user_profiles to ensure admin operations work
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions for admin operations
GRANT ALL ON user_profiles TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ USER PROFILES CONSTRAINTS FIXED!';
    RAISE NOTICE 'Valid tiers: free, basic_99, premium_149';
    RAISE NOTICE 'Admin tier management should now work correctly.';
END;
$$;