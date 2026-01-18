-- Update user_profiles table to add subscription management fields
-- Execute this in Supabase SQL Editor

-- Add subscription_expires_at column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Add subscription_updated_at column to track when subscription was last changed
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing users to have proper subscription tracking
UPDATE user_profiles 
SET subscription_updated_at = NOW() 
WHERE subscription_updated_at IS NULL;

-- Create function to auto-downgrade expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    subscription_tier = 'free',
    subscription_expires_at = NULL,
    subscription_updated_at = NOW()
  WHERE 
    subscription_tier IN ('basic_99', 'premium_149') 
    AND subscription_expires_at IS NOT NULL 
    AND subscription_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically check for expired subscriptions
-- (This would ideally be run as a cron job, but for demo purposes we'll check on updates)
CREATE OR REPLACE FUNCTION trigger_check_expired_subscriptions()
RETURNS trigger AS $$
BEGIN
  PERFORM check_expired_subscriptions();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;