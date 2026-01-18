-- Admin User Management Schema Updates
-- Compatible with existing HATCH database structure

-- Add tier expiration and admin tracking columns to existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tier_upgraded_by UUID REFERENCES auth.users(id), -- Admin who upgraded the user
ADD COLUMN IF NOT EXISTS tier_upgraded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS auto_downgrade_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email VARCHAR(255); -- Add email for easier admin access

-- Create payment submissions table for manual verification (compatible with existing structure)
CREATE TABLE IF NOT EXISTS payment_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50), -- Add username for admin review
    full_name VARCHAR(100), -- Add full name for admin review
    email VARCHAR(255), -- Add email for admin review
    transaction_id VARCHAR(50) NOT NULL,
    payment_screenshot_url TEXT,
    requested_tier VARCHAR(20) NOT NULL CHECK (requested_tier IN ('basic_99', 'premium_149')),
    amount_paid DECIMAL(10,2),
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_submissions_user_id ON payment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_status ON payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_expires ON user_profiles(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier_upgraded_at ON user_profiles(tier_upgraded_at);

-- Function to automatically downgrade expired subscriptions
CREATE OR REPLACE FUNCTION auto_downgrade_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        subscription_tier = 'free',
        subscription_expires_at = NULL,
        updated_at = NOW()
    WHERE 
        subscription_tier IN ('basic_99', 'premium_149')
        AND subscription_expires_at IS NOT NULL 
        AND subscription_expires_at < NOW()
        AND auto_downgrade_enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade user tier (called by admin)
CREATE OR REPLACE FUNCTION admin_upgrade_user_tier(
    target_user_id UUID,
    new_tier VARCHAR(20),
    admin_user_id UUID,
    duration_days INTEGER DEFAULT 30
)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        subscription_tier = new_tier,
        subscription_expires_at = CASE 
            WHEN new_tier = 'free' THEN NULL
            ELSE NOW() + INTERVAL '1 day' * duration_days
        END,
        tier_upgraded_by = admin_user_id,
        tier_upgraded_at = NOW(),
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate transaction ID format
CREATE OR REPLACE FUNCTION validate_transaction_id(txn_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Transaction ID validation rules:
    -- 1. Must be 10-20 characters long
    -- 2. Can contain alphanumeric characters and hyphens
    -- 3. Must start with a letter or number
    -- 4. Common patterns: UPI (12 digits), Bank (10-16 alphanumeric), PayTM (12-16 alphanumeric)
    
    RETURN (
        LENGTH(txn_id) BETWEEN 10 AND 20 AND
        txn_id ~ '^[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]$'
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate transaction ID on insert/update
CREATE OR REPLACE FUNCTION validate_payment_submission()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_transaction_id(NEW.transaction_id) THEN
        RAISE EXCEPTION 'Invalid transaction ID format. Must be 10-20 characters, alphanumeric with hyphens allowed.';
    END IF;
    
    -- Check for duplicate transaction IDs
    IF EXISTS (
        SELECT 1 FROM payment_submissions 
        WHERE transaction_id = NEW.transaction_id 
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) THEN
        RAISE EXCEPTION 'Transaction ID already exists. Please check your transaction ID.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'validate_payment_submission_trigger'
    ) THEN
        CREATE TRIGGER validate_payment_submission_trigger
            BEFORE INSERT OR UPDATE ON payment_submissions
            FOR EACH ROW EXECUTE FUNCTION validate_payment_submission();
    END IF;
END;
$$;

-- RLS Policies for payment_submissions
ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payment submissions" ON payment_submissions;
DROP POLICY IF EXISTS "Users can create own payment submissions" ON payment_submissions;
DROP POLICY IF EXISTS "Users can update own pending submissions" ON payment_submissions;
DROP POLICY IF EXISTS "Admins can manage all payment submissions" ON payment_submissions;

-- Users can only see their own submissions
CREATE POLICY "Users can view own payment submissions" ON payment_submissions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own submissions
CREATE POLICY "Users can create own payment submissions" ON payment_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending submissions
CREATE POLICY "Users can update own pending submissions" ON payment_submissions
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        status = 'pending'
    );

-- Admins can view and update all submissions (using email check)
CREATE POLICY "Admins can manage all payment submissions" ON payment_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

-- Add RLS policy for admins to view all user profiles
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

-- Add RLS policy for admins to update any user profile (for tier management)
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

-- Grant necessary permissions
GRANT ALL ON payment_submissions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Function to sync emails from auth.users to user_profiles (run once to populate existing data)
CREATE OR REPLACE FUNCTION sync_user_emails()
RETURNS void AS $$
BEGIN
    -- Update user_profiles with emails from auth.users
    UPDATE user_profiles 
    SET email = auth_users.email
    FROM auth.users auth_users
    WHERE user_profiles.id = auth_users.id
    AND (user_profiles.email IS NULL OR user_profiles.email = '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for payment screenshots (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment screenshots
DROP POLICY IF EXISTS "Users can upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;

CREATE POLICY "Users can upload payment screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-screenshots' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view payment screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-screenshots' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can view all payment screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-screenshots' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
        )
    );

-- Run the sync function to populate existing emails (optional - run manually if needed)
-- SELECT sync_user_emails();

-- Add comments for documentation
COMMENT ON FUNCTION validate_transaction_id IS 'Validates transaction ID format: 10-20 chars, alphanumeric with hyphens, examples: UPI123456789012, BANK1234567890, PAYTM123456789012';
COMMENT ON FUNCTION admin_upgrade_user_tier IS 'Admin function to upgrade user subscription tier with expiration tracking';
COMMENT ON FUNCTION auto_downgrade_expired_subscriptions IS 'Automatically downgrades expired subscriptions to free tier';
COMMENT ON TABLE payment_submissions IS 'Manual payment verification system with transaction ID validation';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Admin User Management schema applied successfully!';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '- Tier expiration tracking';
    RAISE NOTICE '- Admin tier management functions';
    RAISE NOTICE '- Payment submission system';
    RAISE NOTICE '- Transaction ID validation';
    RAISE NOTICE '- Storage policies for screenshots';
END;
$$;