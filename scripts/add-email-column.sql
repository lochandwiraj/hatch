-- Simple script to add email column to existing user_profiles table
-- Execute this in Supabase SQL Editor

-- 1. Add email column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Populate email from auth.users for existing profiles
UPDATE user_profiles 
SET email = auth_users.email 
FROM auth.users auth_users 
WHERE user_profiles.id = auth_users.id 
AND user_profiles.email IS NULL;

-- 3. Make email column NOT NULL and UNIQUE
ALTER TABLE user_profiles 
ALTER COLUMN email SET NOT NULL;

-- 4. Add unique constraint on email
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);

-- 5. Disable RLS temporarily for testing
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Email column added successfully! You can now test the signup process.' as message;