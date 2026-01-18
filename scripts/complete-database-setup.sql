-- Complete HATCH Database Setup
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table with all required columns
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  college TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  bio TEXT,
  skills TEXT[],
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'explorer_99', 'professional_149')),
  events_attended INTEGER DEFAULT 0,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  required_tier TEXT DEFAULT 'free' CHECK (required_tier IN ('free', 'explorer_99', 'professional_149')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_confirmations table
CREATE TABLE IF NOT EXISTS attendance_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'attended', 'not_attended')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
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
  processed_by UUID REFERENCES user_profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  referee_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'paid')),
  discount_applied DECIMAL(5,2) DEFAULT 0,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizer_listings table
CREATE TABLE IF NOT EXISTS organizer_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  organizer_name TEXT NOT NULL,
  organizer_email TEXT NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 4999.00,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  analytics_views INTEGER DEFAULT 0,
  analytics_clicks INTEGER DEFAULT 0,
  analytics_bookmarks INTEGER DEFAULT 0,
  featured_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('hackathons', 'webinars', 'success_stories', 'team_formation')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  upvotes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_sends table
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome_day1', 'welcome_day3', 'welcome_day5', 'welcome_day7', 'deadline_reminder', 'upgrade_prompt', 'win_back')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_required_tier ON events(required_tier);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance_confirmations(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_transaction_id ON payment_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view public profile info" ON user_profiles
  FOR SELECT USING (true);

-- RLS policies for events
CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (auth.uid() = created_by);

-- RLS policies for attendance_confirmations
CREATE POLICY "Users can view own attendance" ON attendance_confirmations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create attendance records" ON attendance_confirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON attendance_confirmations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for payment_requests
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

-- RLS policies for referrals
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment screenshots
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
      AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
    )
  );

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $
BEGIN
  NEW.referral_code := CONCAT('REF_', UPPER(SUBSTRING(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral codes
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON user_profiles;
CREATE TRIGGER generate_referral_code_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- Insert sample events for testing
INSERT INTO events (id, title, description, event_date, location, max_attendees, required_tier, status, created_by) VALUES
(
  uuid_generate_v4(),
  'React Conf 2024',
  'Join us for the biggest React conference of the year with industry experts sharing the latest trends and best practices.',
  '2024-03-15 10:00:00+00',
  'San Francisco, CA',
  500,
  'free',
  'published',
  (SELECT id FROM user_profiles WHERE email = 'dwiraj06@gmail.com' LIMIT 1)
),
(
  uuid_generate_v4(),
  'AI/ML Workshop',
  'Hands-on workshop covering machine learning fundamentals and practical applications using Python and TensorFlow.',
  '2024-03-20 14:00:00+00',
  'Online',
  100,
  'explorer_99',
  'published',
  (SELECT id FROM user_profiles WHERE email = 'dwiraj06@gmail.com' LIMIT 1)
),
(
  uuid_generate_v4(),
  'Startup Pitch Competition',
  'Present your startup idea to a panel of investors and win up to $50,000 in funding.',
  '2024-03-25 18:00:00+00',
  'New York, NY',
  200,
  'professional_149',
  'published',
  (SELECT id FROM user_profiles WHERE email = 'dwiraj06@gmail.com' LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- Create admin user if not exists
INSERT INTO user_profiles (id, email, username, full_name, college, graduation_year, subscription_tier) VALUES
(
  uuid_generate_v4(),
  'dwiraj06@gmail.com',
  'admin',
  'HATCH Admin',
  'HATCH',
  2024,
  'professional_149'
)
ON CONFLICT (email) DO NOTHING;