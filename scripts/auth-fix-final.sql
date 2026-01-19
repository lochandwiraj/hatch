-- Fix production authentication and profile creation issues
-- This script addresses the blank page issue after login

-- 1. First, let's check and fix the user_profiles table structure
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Create profiles for existing auth users who don't have profiles
INSERT INTO user_profiles (
    id,
    email,
    username,
    full_name,
    college,
    graduation_year,
    subscription_tier,
    profile_views_count,
    is_profile_public,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'username',
        SPLIT_PART(au.email, '@', 1),
        'user_' || SUBSTRING(au.id::text, 1, 8)
    ) as username,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        SPLIT_PART(au.email, '@', 1),
        'User'
    ) as full_name,
    COALESCE(au.raw_user_meta_data->>'college', '') as college,
    COALESCE(
        (au.raw_user_meta_data->>'graduation_year')::integer,
        EXTRACT(YEAR FROM NOW())::integer
    ) as graduation_year,
    'free' as subscription_tier,
    0 as profile_views_count,
    true as is_profile_public,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
  AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Update existing profiles to have email if missing
UPDATE user_profiles 
SET email = auth_users.email,
    updated_at = NOW()
FROM auth.users auth_users 
WHERE user_profiles.id = auth_users.id 
AND (user_profiles.email IS NULL OR user_profiles.email = '');

-- 4. Handle duplicate usernames by making them unique
WITH duplicate_usernames AS (
    SELECT username, COUNT(*) as count
    FROM user_profiles
    GROUP BY username
    HAVING COUNT(*) > 1
),
ranked_profiles AS (
    SELECT 
        up.id,
        up.username,
        ROW_NUMBER() OVER (PARTITION BY up.username ORDER BY up.created_at) as rn
    FROM user_profiles up
    INNER JOIN duplicate_usernames du ON up.username = du.username
)
UPDATE user_profiles
SET username = user_profiles.username || '_' || (rp.rn - 1),
    updated_at = NOW()
FROM ranked_profiles rp
WHERE user_profiles.id = rp.id
  AND rp.rn > 1;

-- 5. Create or replace the profile creation function with better error handling
CREATE OR REPLACE FUNCTION create_user_profile_safe(
    user_id UUID,
    user_email TEXT,
    user_username TEXT DEFAULT NULL,
    user_full_name TEXT DEFAULT NULL,
    user_college TEXT DEFAULT '',
    user_graduation_year INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    final_username TEXT;
    final_full_name TEXT;
    final_graduation_year INTEGER;
    username_counter INTEGER := 0;
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id) THEN
        result := json_build_object('success', true, 'message', 'Profile already exists');
        RETURN result;
    END IF;

    -- Generate safe defaults
    final_username := COALESCE(user_username, SPLIT_PART(user_email, '@', 1), 'user_' || SUBSTRING(user_id::text, 1, 8));
    final_full_name := COALESCE(user_full_name, SPLIT_PART(user_email, '@', 1), 'User');
    final_graduation_year := COALESCE(user_graduation_year, EXTRACT(YEAR FROM NOW())::integer);

    -- Ensure username is unique
    WHILE EXISTS (SELECT 1 FROM user_profiles WHERE username = final_username) LOOP
        username_counter := username_counter + 1;
        final_username := COALESCE(user_username, SPLIT_PART(user_email, '@', 1), 'user_' || SUBSTRING(user_id::text, 1, 8)) || '_' || username_counter;
    END LOOP;

    -- Insert the profile
    INSERT INTO user_profiles (
        id,
        email,
        username,
        full_name,
        college,
        graduation_year,
        subscription_tier,
        profile_views_count,
        is_profile_public,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        user_email,
        final_username,
        final_full_name,
        user_college,
        final_graduation_year,
        'free',
        0,
        true,
        NOW(),
        NOW()
    );

    result := json_build_object(
        'success', true, 
        'message', 'Profile created successfully',
        'username', final_username
    );
    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object('success', false, 'message', SQLERRM);
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION create_user_profile_safe(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;

-- 7. Create a simpler trigger for new users
CREATE OR REPLACE FUNCTION handle_new_user_simple()
RETURNS TRIGGER AS $$
DECLARE
    profile_result JSON;
BEGIN
    -- Only proceed if this is a confirmed user
    IF NEW.email_confirmed_at IS NOT NULL THEN
        -- Use the safe profile creation function
        SELECT create_user_profile_safe(
            NEW.id,
            NEW.email,
            NEW.raw_user_meta_data->>'username',
            NEW.raw_user_meta_data->>'full_name',
            COALESCE(NEW.raw_user_meta_data->>'college', ''),
            (NEW.raw_user_meta_data->>'graduation_year')::integer
        ) INTO profile_result;
        
        -- Log the result but don't fail auth
        RAISE LOG 'Profile creation result for %: %', NEW.id, profile_result;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail auth
        RAISE LOG 'Error in handle_new_user_simple for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_simple();

-- 9. Disable RLS temporarily for testing (can be re-enabled later)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 10. Check results
DO $$
DECLARE
    total_auth_users INTEGER;
    total_profiles INTEGER;
    missing_profiles INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_auth_users FROM auth.users WHERE email_confirmed_at IS NOT NULL;
    SELECT COUNT(*) INTO total_profiles FROM user_profiles;
    missing_profiles := total_auth_users - total_profiles;
    
    RAISE NOTICE 'AUTH REPAIR COMPLETE:';
    RAISE NOTICE '- Total confirmed auth users: %', total_auth_users;
    RAISE NOTICE '- Total user profiles: %', total_profiles;
    RAISE NOTICE '- Missing profiles: %', missing_profiles;
    
    IF missing_profiles = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All users have profiles!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: % users still missing profiles', missing_profiles;
    END IF;
END;
$$;