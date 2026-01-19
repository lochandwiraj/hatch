-- Verification script to check if the auth fix worked
-- Run this after applying the fix to verify everything is working

-- 1. Check total counts
SELECT 
    'Auth Users (confirmed)' as type,
    COUNT(*) as count
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL

UNION ALL

SELECT 
    'User Profiles' as type,
    COUNT(*) as count
FROM user_profiles

UNION ALL

SELECT 
    'Missing Profiles' as type,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email_confirmed_at IS NOT NULL 
  AND up.id IS NULL;

-- 2. Check for duplicate usernames
SELECT 
    'Duplicate Usernames' as issue,
    COUNT(*) as count
FROM (
    SELECT username, COUNT(*) as cnt
    FROM user_profiles
    GROUP BY username
    HAVING COUNT(*) > 1
) duplicates;

-- 3. Check for profiles without emails
SELECT 
    'Profiles Missing Email' as issue,
    COUNT(*) as count
FROM user_profiles
WHERE email IS NULL OR email = '';

-- 4. Sample of recent profiles
SELECT 
    'Recent Profiles (last 5)' as info,
    username,
    email,
    subscription_tier,
    created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if the safe function exists
SELECT 
    'create_user_profile_safe function exists' as check,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_user_profile_safe'
    ) THEN 'YES' ELSE 'NO' END as result;

-- Success message
DO $
DECLARE
    missing_count INTEGER;
    duplicate_count INTEGER;
    missing_email_count INTEGER;
BEGIN
    -- Count missing profiles
    SELECT COUNT(*) INTO missing_count
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.id
    WHERE au.email_confirmed_at IS NOT NULL 
      AND up.id IS NULL;
    
    -- Count duplicate usernames
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT username, COUNT(*) as cnt
        FROM user_profiles
        GROUP BY username
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Count missing emails
    SELECT COUNT(*) INTO missing_email_count
    FROM user_profiles
    WHERE email IS NULL OR email = '';
    
    RAISE NOTICE '=== AUTH FIX VERIFICATION ===';
    
    IF missing_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All auth users have profiles';
    ELSE
        RAISE NOTICE '❌ ISSUE: % users still missing profiles', missing_count;
    END IF;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: No duplicate usernames';
    ELSE
        RAISE NOTICE '❌ ISSUE: % duplicate usernames found', duplicate_count;
    END IF;
    
    IF missing_email_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All profiles have emails';
    ELSE
        RAISE NOTICE '❌ ISSUE: % profiles missing emails', missing_email_count;
    END IF;
    
    IF missing_count = 0 AND duplicate_count = 0 AND missing_email_count = 0 THEN
        RAISE NOTICE '🎉 ALL CHECKS PASSED - Auth fix successful!';
    ELSE
        RAISE NOTICE '⚠️  Some issues found - may need additional fixes';
    END IF;
END;
$;