-- Migration script to update existing schema for HATCH
-- Execute this in Supabase SQL Editor

-- 1. Add missing email column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Make email column unique and not null (after adding data)
-- First, let's populate email from auth.users if it's empty
UPDATE user_profiles 
SET email = auth_users.email 
FROM auth.users auth_users 
WHERE user_profiles.id = auth_users.id 
AND user_profiles.email IS NULL;

-- Now make it unique and not null
ALTER TABLE user_profiles 
ALTER COLUMN email SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_unique 
ON user_profiles(email);

-- 3. Update subscription tier values to match HATCH
UPDATE user_profiles 
SET subscription_tier = CASE 
  WHEN subscription_tier = 'basic_99' THEN 'explorer_99'
  WHEN subscription_tier = 'premium_149' THEN 'professional_149'
  ELSE subscription_tier
END;

-- 4. Update the constraint to use new tier names
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_subscription_tier_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'explorer_99', 'professional_149'));

-- 5. Update events table tier values
UPDATE events 
SET required_tier = CASE 
  WHEN required_tier = 'basic_99' THEN 'explorer_99'
  WHEN required_tier = 'premium_149' THEN 'professional_149'
  ELSE required_tier
END;

-- 6. Update events table constraint
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_required_tier_check;

ALTER TABLE events 
ADD CONSTRAINT events_required_tier_check 
CHECK (required_tier IN ('free', 'explorer_99', 'professional_149'));

-- 7. Add missing columns for HATCH features
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS events_attended INTEGER DEFAULT 0;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES user_profiles(id);

-- 8. Generate referral codes for existing users
UPDATE user_profiles 
SET referral_code = CONCAT('REF_', UPPER(SUBSTRING(id::text, 1, 8)))
WHERE referral_code IS NULL;

-- 9. Create missing tables for HATCH features

-- Attendance confirmations table
CREATE TABLE IF NOT EXISTS attendance_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'attended', 'not_attended')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment requests table (for QR payment system)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('explorer_99', 'professional_149')),
  amount DECIMAL(10,2) NOT NULL,
  is_annual BOOLEAN DEFAULT FALSE,
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  payment_method TEXT DEFAULT 'qr_code',
  qr_used TEXT CHECK (qr_used IN ('dwiraj', 'lochan')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referee_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'paid')),
  discount_applied DECIMAL(5,2) DEFAULT 0,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance_confirmations(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_transaction_id ON payment_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- 11. Enable RLS on new tables
ALTER TABLE attendance_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for new tables

-- Attendance confirmations policies
CREATE POLICY "Users can view own attendance" ON attendance_confirmations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create attendance records" ON attendance_confirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON attendance_confirmations
  FOR UPDATE USING (auth.uid() = user_id);

-- Payment requests policies
CREATE POLICY "Users can view own payment requests" ON payment_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment requests" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all payment requests" ON payment_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
    )
  );

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- 13. Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- 14. Storage policies for payment screenshots
CREATE POLICY "Users can upload payment screenshots" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own payment screenshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admin can view all payment screenshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-screenshots' 
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND email IN ('admin@HATCH.in', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
    )
  );

-- 15. Functions for HATCH features

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $
BEGIN
  NEW.referral_code := CONCAT('REF_', UPPER(SUBSTRING(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral codes for new users
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON user_profiles;
CREATE TRIGGER generate_referral_code_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Function to handle referral signup
CREATE OR REPLACE FUNCTION handle_referral_signup()
RETURNS TRIGGER AS $
BEGIN
  -- Update referral status when referee signs up
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE referrals 
    SET 
      referee_id = NEW.id,
      status = 'signed_up'
    WHERE referrer_id = NEW.referred_by 
    AND referee_email = NEW.email
    AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for referral signup
DROP TRIGGER IF EXISTS handle_referral_signup_trigger ON user_profiles;
CREATE TRIGGER handle_referral_signup_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_signup();

-- Function to handle referral payments
CREATE OR REPLACE FUNCTION handle_referral_payment()
RETURNS TRIGGER AS $
BEGIN
  -- When user upgrades to paid, update referral and give reward
  IF OLD.subscription_tier = 'free' 
     AND NEW.subscription_tier IN ('explorer_99', 'professional_149') THEN
    
    -- Update referral status to paid
    UPDATE referrals 
    SET status = 'paid'
    WHERE referee_id = NEW.id AND status = 'signed_up';
    
    -- Give reward to referrer (extend their subscription by 1 month)
    UPDATE user_profiles 
    SET subscription_expires_at = COALESCE(
      subscription_expires_at + INTERVAL '1 month',
      NOW() + INTERVAL '1 month'
    )
    WHERE id = NEW.referred_by
    AND NEW.referred_by IS NOT NULL;
    
    -- Mark reward as given
    UPDATE referrals 
    SET reward_given = true
    WHERE referee_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for referral payments
DROP TRIGGER IF EXISTS handle_referral_payment_trigger ON user_profiles;
CREATE TRIGGER handle_referral_payment_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_payment();

-- Function to approve payment request
CREATE OR REPLACE FUNCTION approve_payment_request(request_id UUID, admin_user_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  payment_record payment_requests%ROWTYPE;
  expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get payment request details
  SELECT * INTO payment_record 
  FROM payment_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found or already processed';
  END IF;
  
  -- Calculate expiry date
  IF payment_record.is_annual THEN
    expiry_date := NOW() + INTERVAL '1 year';
  ELSE
    expiry_date := NOW() + INTERVAL '1 month';
  END IF;
  
  -- Update user subscription
  UPDATE user_profiles 
  SET 
    subscription_tier = payment_record.plan_tier,
    subscription_expires_at = expiry_date,
    subscription_updated_at = NOW()
  WHERE id = payment_record.user_id;
  
  -- Mark payment as approved
  UPDATE payment_requests 
  SET 
    status = 'approved',
    processed_by = admin_user_id,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id;
  
  RETURN TRUE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject payment request
CREATE OR REPLACE FUNCTION reject_payment_request(request_id UUID, admin_user_id UUID, notes TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $
BEGIN
  -- Mark payment as rejected
  UPDATE payment_requests 
  SET 
    status = 'rejected',
    admin_notes = notes,
    processed_by = admin_user_id,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found or already processed';
  END IF;
  
  RETURN TRUE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Update existing events to use new tier names (if any exist)
UPDATE events 
SET required_tier = 'explorer_99' 
WHERE required_tier = 'basic_99';

UPDATE events 
SET required_tier = 'professional_149' 
WHERE required_tier = 'premium_149';

-- 17. Create admin user for HATCH if not exists
INSERT INTO user_profiles (id, email, username, full_name, college, graduation_year, subscription_tier) 
SELECT 
  auth_user.id,
  'admin@HATCH.in',
  'admin_HATCH',
  'HATCH Admin',
  'HATCH',
  2024,
  'professional_149'
FROM auth.users auth_user
WHERE auth_user.email = 'admin@HATCH.in'
AND NOT EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE email = 'admin@HATCH.in'
)
LIMIT 1;

-- If no auth user exists, create a placeholder profile
INSERT INTO user_profiles (id, email, username, full_name, college, graduation_year, subscription_tier) 
VALUES (
  gen_random_uuid(),
  'admin@HATCH.in',
  'admin_HATCH',
  'HATCH Admin',
  'HATCH',
  2024,
  'professional_149'
)
ON CONFLICT (email) DO NOTHING;

-- 18. Ensure RLS is properly configured
-- Re-enable RLS with proper policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can check username availability" ON user_profiles;

-- Create comprehensive policies for user_profiles
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Anyone can read user profiles for signup validation" ON user_profiles
  FOR SELECT USING (true);

-- Create policies for events
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Authenticated users can view all events" ON events;

CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT USING (status = 'published');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'HATCH migration completed successfully!';
  RAISE NOTICE 'Your existing schema has been updated to work with HATCH.';
  RAISE NOTICE 'You can now test the signup process.';
END;
$$;