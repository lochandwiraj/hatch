-- Update Branding from EventScout to HATCH and Pricing from 199 to 149
-- This script updates all database references to the new branding and pricing

-- Update any existing user profiles with old tier names
UPDATE user_profiles 
SET subscription_tier = 'premium_149'
WHERE subscription_tier = 'premium_199';

-- Update any existing events with old tier requirements
UPDATE events 
SET required_tier = 'premium_149'
WHERE required_tier = 'premium_199';

-- Update any existing payment submissions with old tier names
UPDATE payment_submissions 
SET requested_tier = 'premium_149'
WHERE requested_tier = 'premium_199';

-- Update any existing payment requests with old tier names (if table exists)
UPDATE payment_requests 
SET plan_tier = 'premium_149'
WHERE plan_tier = 'premium_199';

-- Update admin user profile names and company references
UPDATE user_profiles 
SET 
    full_name = REPLACE(full_name, 'EventScout', 'HATCH'),
    company = REPLACE(company, 'EventScout', 'HATCH')
WHERE full_name LIKE '%EventScout%' OR company LIKE '%EventScout%';

-- Update any event descriptions or content that might reference EventScout
UPDATE events 
SET 
    title = REPLACE(title, 'EventScout', 'HATCH'),
    description = REPLACE(description, 'EventScout', 'HATCH'),
    organizer = REPLACE(organizer, 'EventScout', 'HATCH')
WHERE title LIKE '%EventScout%' 
   OR description LIKE '%EventScout%' 
   OR organizer LIKE '%EventScout%';

-- Success message
DO $
BEGIN
    RAISE NOTICE 'Branding and pricing updated successfully!';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '- EventScout → HATCH';
    RAISE NOTICE '- premium_199 → premium_149';
    RAISE NOTICE '- ₹199 → ₹149';
    RAISE NOTICE '- Annual: ₹1,999 → ₹1,499';
    RAISE NOTICE '- eventscout.in → hatch.in';
END;
$;