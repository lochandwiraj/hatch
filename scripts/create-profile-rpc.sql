-- Create RPC function for user profile creation
-- Execute this in Supabase SQL Editor

-- 1. Create RPC function to safely create user profile
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
    result := json_build_object('success', false, 'message', 'Profile already exists');
    RETURN result;
  END IF;

  -- Check if username is taken
  IF EXISTS (SELECT 1 FROM user_profiles WHERE username = user_username) THEN
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

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;

-- 3. Also create the trigger as backup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
BEGIN
  -- Get user metadata from the new auth user
  user_metadata := NEW.raw_user_meta_data;
  
  -- Only create profile if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
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
    -- Log the error but don't fail the auth signup
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger on auth.users table (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
SELECT 'RPC function and trigger created successfully!' as message;