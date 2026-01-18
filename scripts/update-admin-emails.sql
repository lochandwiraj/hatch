-- Update Admin Emails - Add pokkalilochan@gmail.com as Admin
-- This script updates all admin email checks to include the new admin email

-- Update RLS policies for payment_submissions
DROP POLICY IF EXISTS "Admins can manage all payment submissions" ON payment_submissions;
CREATE POLICY "Admins can manage all payment submissions" ON payment_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

-- Update RLS policies for user_profiles
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles" ON user_profiles
    FOR SELECT USING (
        auth.uid() = id OR -- Users can view their own profile
        is_profile_public = true OR -- Anyone can view public profiles
        EXISTS (
            SELECT 1 FROM user_profiles admin_profile
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

DROP POLICY IF EXISTS "Admins can update any user profile" ON user_profiles;
CREATE POLICY "Admins can update any user profile" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = id OR -- Users can update their own profile
        EXISTS (
            SELECT 1 FROM user_profiles admin_profile
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

-- Update storage policies for payment screenshots
DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
CREATE POLICY "Admins can view all payment screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-screenshots' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

-- Update event attendance policies (if they exist)
DROP POLICY IF EXISTS "Admins can view all attendance" ON event_attendance;
CREATE POLICY "Admins can view all attendance" ON event_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

DROP POLICY IF EXISTS "Admins can view all prompts" ON attendance_prompts;
CREATE POLICY "Admins can view all prompts" ON attendance_prompts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

-- Update payment requests policies (if they exist)
DROP POLICY IF EXISTS "Admin can manage all payment requests" ON payment_requests;
CREATE POLICY "Admin can manage all payment requests" ON payment_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
    )
  );

-- Success message
DO $
BEGIN
    RAISE NOTICE 'Admin emails updated successfully!';
    RAISE NOTICE 'New admin emails:';
    RAISE NOTICE '- dwiraj06@gmail.com';
    RAISE NOTICE '- pokkalilochan@gmail.com';
    RAISE NOTICE '- dwiraj@HATCH.in';
    RAISE NOTICE '- lochan@HATCH.in';
END;
$;