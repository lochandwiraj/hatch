-- Update user_profiles table for new tier structure and referral system
-- Execute this in Supabase SQL Editor

-- Update subscription tier enum to new values
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_subscription_tier_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'explorer_99', 'professional_149'));

-- Add referral system columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES user_profiles(id);

-- Generate referral codes for existing users
UPDATE user_profiles 
SET referral_code = CONCAT('REF_', UPPER(SUBSTRING(id::text, 1, 8)))
WHERE referral_code IS NULL;

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

-- Create event organizer listings table
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

-- Create community posts table
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

-- Create community comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email automation tracking table
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome_day1', 'welcome_day3', 'welcome_day5', 'welcome_day7', 'deadline_reminder', 'upgrade_prompt', 'win_back')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Update events table to support new tier structure
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_required_tier_check;

ALTER TABLE events 
ADD CONSTRAINT events_required_tier_check 
CHECK (required_tier IN ('free', 'explorer_99', 'professional_149'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_organizer_listings_event_id ON organizer_listings(event_id);
CREATE INDEX IF NOT EXISTS idx_organizer_listings_featured_until ON organizer_listings(featured_until);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_user_id ON email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_email_type ON email_sends(email_type);

-- Enable RLS on new tables
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- RLS policies for organizer listings (admin only for now)
CREATE POLICY "Admin can manage organizer listings" ON organizer_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND email = 'admin@HATCH.in'
    )
  );

-- RLS policies for community posts
CREATE POLICY "Users can view approved posts" ON community_posts
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can manage own posts" ON community_posts
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for community comments
CREATE POLICY "Users can view comments on approved posts" ON community_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_posts 
      WHERE id = post_id AND is_approved = true
    )
  );

CREATE POLICY "Users can manage own comments" ON community_comments
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for email sends (admin only)
CREATE POLICY "Admin can manage email sends" ON email_sends
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND email = 'admin@HATCH.in'
    )
  );

-- Function to generate referral code for new users
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := CONCAT('REF_', UPPER(SUBSTRING(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral codes
CREATE TRIGGER generate_referral_code_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Function to handle referral signup
CREATE OR REPLACE FUNCTION handle_referral_signup()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for referral signup
CREATE TRIGGER handle_referral_signup_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_signup();

-- Function to track referral payments
CREATE OR REPLACE FUNCTION handle_referral_payment()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for referral payments
CREATE TRIGGER handle_referral_payment_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_payment();