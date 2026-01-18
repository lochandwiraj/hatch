-- Complete fix for auth and user profile setup
-- Execute this in Supabase SQL Editor

-- 1. Add email column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Populate email from auth.users for existing profiles
UPDATE user_profiles 
SET email = auth_users.email 
FROM auth.users auth_users 
WHERE user_profiles.id = auth_users.id 
AND (user_profiles.email IS NULL OR user_profiles.email = '');

-- 3. Make email NOT NULL and add unique constraint
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

-- 4. Disable RLS temporarily for testing
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 5. Create RPC function for safe profile creation
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_username TEXT,
  user_full_name TEXT,
  user_college TEXT,
  user_graduation_year INTEGER
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id) THEN
    result := json_build_object('success', true, 'message', 'Profile already exists');
    RETURN result;
  END IF;

  -- Check if username is taken by another user
  IF EXISTS (SELECT 1 FROM user_profiles WHERE username = user_username AND id != user_id) THEN
    result := json_build_object('success', false, 'message', 'Username already taken');
    RETURN result;
  END IF;

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
    is_profile_public
  ) VALUES (
    user_id,
    user_email,
    user_username,
    user_full_name,
    user_college,
    user_graduation_year,
    'free',
    0,
    true
  );

  result := json_build_object('success', true, 'message', 'Profile created successfully');
  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'message', SQLERRM);
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.user_profiles TO authenticated;

-- 7. Create trigger as backup (for email confirmation flow)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
BEGIN
  -- Only proceed if this is a confirmed user and profile doesn't exist
  IF NEW.email_confirmed_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
    user_metadata := NEW.raw_user_meta_data;
    
    INSERT INTO public.user_profiles (
      id,
      email,
      username,
      full_name,
      college,
      graduation_year,
      subscription_tier,
      profile_views_count,
      is_profile_public
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(user_metadata->>'username', 'user_' || SUBSTRING(NEW.id::text, 1, 8)),
      COALESCE(user_metadata->>'full_name', 'New User'),
      COALESCE(user_metadata->>'college', ''),
      COALESCE((user_metadata->>'graduation_year')::integer, EXTRACT(YEAR FROM NOW())::integer),
      'free',
      0,
      true
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE LOG 'Error in handle_new_user for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Test the setup by checking if everything is ready
DO $$
DECLARE
  email_col_exists BOOLEAN;
  constraint_exists BOOLEAN;
BEGIN
  -- Check if email column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'email'
  ) INTO email_col_exists;
  
  -- Check if unique constraint exists
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_email_unique'
  ) INTO constraint_exists;
  
  IF email_col_exists AND constraint_exists THEN
    RAISE NOTICE 'SUCCESS: Setup complete! Email column exists with unique constraint.';
    RAISE NOTICE 'You can now test the signup process.';
  ELSE
    RAISE NOTICE 'WARNING: Setup may be incomplete. Email column: %, Constraint: %', email_col_exists, constraint_exists;
  END IF;
END;
$$;