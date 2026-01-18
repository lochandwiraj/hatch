-- Setup automatic user profile creation trigger
-- Execute this in Supabase SQL Editor

-- 1. First, add email column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Make sure we can populate email from auth metadata
-- (This will be handled by the trigger)

-- 3. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
BEGIN
  -- Get user metadata from the new auth user
  user_metadata := NEW.raw_user_meta_data;
  
  -- Insert into user_profiles table
  INSERT INTO public.user_profiles (
    id,
    email,
    username,
    full_name,
    college,
    graduation_year,
    subscription_tier
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(user_metadata->>'username', 'user_' || SUBSTRING(NEW.id::text, 1, 8)),
    COALESCE(user_metadata->>'full_name', 'New User'),
    COALESCE(user_metadata->>'college', ''),
    COALESCE((user_metadata->>'graduation_year')::integer, EXTRACT(YEAR FROM NOW())::integer),
    'free'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Make sure email column is unique and not null
-- First populate any missing emails
UPDATE user_profiles 
SET email = auth_users.email 
FROM auth.users auth_users 
WHERE user_profiles.id = auth_users.id 
AND (user_profiles.email IS NULL OR user_profiles.email = '');

-- Now make it not null and unique
ALTER TABLE user_profiles 
ALTER COLUMN email SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_email_unique'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
  END IF;
END;
$$;

-- 6. Temporarily disable RLS for testing
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.user_profiles TO authenticated;

-- Success message
SELECT 'Auth trigger setup complete! User profiles will be created automatically on signup.' as message;