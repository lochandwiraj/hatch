-- Automatic Subscription Expiration System
-- This script creates a system to automatically reset expired subscriptions to 'free'

-- 1. Create function to check and reset expired subscriptions
CREATE OR REPLACE FUNCTION reset_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
BEGIN
  -- Update expired subscriptions to free tier
  UPDATE user_profiles 
  SET 
    subscription_tier = 'free',
    subscription_expires_at = NULL,
    subscription_updated_at = NOW()
  WHERE 
    subscription_tier != 'free' 
    AND subscription_expires_at IS NOT NULL 
    AND subscription_expires_at <= NOW();
  
  -- Get count of updated records
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log the expiration event
  INSERT INTO subscription_expiration_log (
    expired_count,
    processed_at
  ) VALUES (
    expired_count,
    NOW()
  );
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create log table for tracking subscription expirations
CREATE TABLE IF NOT EXISTS subscription_expiration_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expired_count INTEGER NOT NULL DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscription_expiration_log_processed_at 
ON subscription_expiration_log(processed_at);

-- 3. Create function to get subscription status for a user
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE(
  current_tier TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.subscription_tier,
    up.subscription_expires_at,
    CASE 
      WHEN up.subscription_expires_at IS NULL THEN FALSE
      WHEN up.subscription_expires_at <= NOW() THEN TRUE
      ELSE FALSE
    END as is_expired,
    CASE 
      WHEN up.subscription_expires_at IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (up.subscription_expires_at - NOW()))::INTEGER
    END as days_remaining
  FROM user_profiles up
  WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to extend subscription (for admin use)
CREATE OR REPLACE FUNCTION extend_user_subscription(
  user_uuid UUID,
  extension_days INTEGER,
  admin_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current expiry date
  SELECT subscription_expires_at INTO current_expiry
  FROM user_profiles 
  WHERE id = user_uuid;
  
  -- Calculate new expiry date
  IF current_expiry IS NULL OR current_expiry <= NOW() THEN
    -- If no expiry or already expired, start from now
    current_expiry := NOW();
  END IF;
  
  -- Update subscription expiry
  UPDATE user_profiles 
  SET 
    subscription_expires_at = current_expiry + (extension_days || ' days')::INTERVAL,
    subscription_updated_at = NOW()
  WHERE id = user_uuid;
  
  -- Log the extension
  INSERT INTO subscription_extension_log (
    user_id,
    extension_days,
    extended_by,
    extended_at
  ) VALUES (
    user_uuid,
    extension_days,
    admin_user_id,
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create log table for subscription extensions
CREATE TABLE IF NOT EXISTS subscription_extension_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  extension_days INTEGER NOT NULL,
  extended_by UUID REFERENCES user_profiles(id),
  extended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_extension_log_user_id 
ON subscription_extension_log(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_extension_log_extended_at 
ON subscription_extension_log(extended_at);

-- 6. Update the payment approval function to handle annual subscriptions properly
CREATE OR REPLACE FUNCTION approve_payment_request(request_id UUID, admin_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  payment_record payment_requests%ROWTYPE;
  expiry_date TIMESTAMP WITH TIME ZONE;
  current_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get payment request details
  SELECT * INTO payment_record 
  FROM payment_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found or already processed';
  END IF;
  
  -- Get user's current subscription expiry
  SELECT subscription_expires_at INTO current_expiry
  FROM user_profiles 
  WHERE id = payment_record.user_id;
  
  -- Calculate new expiry date
  IF current_expiry IS NULL OR current_expiry <= NOW() THEN
    -- If no current subscription or expired, start from now
    IF payment_record.is_annual THEN
      expiry_date := NOW() + INTERVAL '365 days';  -- Exactly 365 days
    ELSE
      expiry_date := NOW() + INTERVAL '30 days';   -- Exactly 30 days
    END IF;
  ELSE
    -- If current subscription is active, extend from current expiry
    IF payment_record.is_annual THEN
      expiry_date := current_expiry + INTERVAL '365 days';
    ELSE
      expiry_date := current_expiry + INTERVAL '30 days';
    END IF;
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
  
  -- Log the subscription activation
  INSERT INTO subscription_activation_log (
    user_id,
    payment_request_id,
    tier_activated,
    expires_at,
    is_annual,
    activated_by,
    activated_at
  ) VALUES (
    payment_record.user_id,
    request_id,
    payment_record.plan_tier,
    expiry_date,
    payment_record.is_annual,
    admin_user_id,
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create subscription activation log table
CREATE TABLE IF NOT EXISTS subscription_activation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  payment_request_id UUID REFERENCES payment_requests(id),
  tier_activated TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_annual BOOLEAN DEFAULT FALSE,
  activated_by UUID REFERENCES user_profiles(id),
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_activation_log_user_id 
ON subscription_activation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_activation_log_activated_at 
ON subscription_activation_log(activated_at);

-- 8. Create a view for easy subscription monitoring
CREATE OR REPLACE VIEW subscription_status_view AS
SELECT 
  up.id as user_id,
  up.username,
  up.email,
  up.full_name,
  up.subscription_tier,
  up.subscription_expires_at,
  up.subscription_updated_at,
  CASE 
    WHEN up.subscription_expires_at IS NULL THEN 'No Expiry'
    WHEN up.subscription_expires_at <= NOW() THEN 'Expired'
    WHEN up.subscription_expires_at <= NOW() + INTERVAL '7 days' THEN 'Expiring Soon'
    ELSE 'Active'
  END as status,
  CASE 
    WHEN up.subscription_expires_at IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM (up.subscription_expires_at - NOW()))::INTEGER
  END as days_remaining,
  CASE 
    WHEN up.subscription_expires_at IS NULL THEN NULL
    ELSE EXTRACT(HOUR FROM (up.subscription_expires_at - NOW()))::INTEGER
  END as hours_remaining
FROM user_profiles up
WHERE up.subscription_tier != 'free' OR up.subscription_expires_at IS NOT NULL;

-- 9. Grant necessary permissions
GRANT EXECUTE ON FUNCTION reset_expired_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION extend_user_subscription(UUID, INTEGER, UUID) TO authenticated;

-- Grant select permissions on views and log tables
GRANT SELECT ON subscription_status_view TO authenticated;
GRANT SELECT ON subscription_expiration_log TO authenticated;
GRANT SELECT ON subscription_extension_log TO authenticated;
GRANT SELECT ON subscription_activation_log TO authenticated;

-- 10. Create RLS policies for log tables
ALTER TABLE subscription_expiration_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_extension_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_activation_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admin can view expiration logs" ON subscription_expiration_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
    )
  );

CREATE POLICY "Admin can view extension logs" ON subscription_extension_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
    )
  );

CREATE POLICY "Admin can view activation logs" ON subscription_activation_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND email IN ('dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in')
    )
  );

-- Users can view their own extension and activation logs
CREATE POLICY "Users can view own extension logs" ON subscription_extension_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activation logs" ON subscription_activation_log
  FOR SELECT USING (auth.uid() = user_id);

-- 11. Create a function to manually run expiration check (for testing)
CREATE OR REPLACE FUNCTION check_subscription_expiration()
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  email TEXT,
  subscription_tier TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.username,
    up.email,
    up.subscription_tier,
    up.subscription_expires_at,
    CASE 
      WHEN up.subscription_expires_at IS NULL THEN FALSE
      WHEN up.subscription_expires_at <= NOW() THEN TRUE
      ELSE FALSE
    END as is_expired,
    CASE 
      WHEN up.subscription_expires_at IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (up.subscription_expires_at - NOW()))::INTEGER
    END as days_remaining
  FROM user_profiles up
  WHERE up.subscription_tier != 'free' 
    AND up.subscription_expires_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_subscription_expiration() TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Subscription expiration system created successfully!';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '- reset_expired_subscriptions(): Resets expired subscriptions to free';
  RAISE NOTICE '- get_user_subscription_status(user_id): Gets subscription status for a user';
  RAISE NOTICE '- extend_user_subscription(user_id, days, admin_id): Extends subscription';
  RAISE NOTICE '- check_subscription_expiration(): Lists all subscriptions and their status';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '- subscription_status_view: Easy monitoring of all subscriptions';
  RAISE NOTICE '';
  RAISE NOTICE 'Log tables created:';
  RAISE NOTICE '- subscription_expiration_log: Tracks automatic expirations';
  RAISE NOTICE '- subscription_extension_log: Tracks manual extensions';
  RAISE NOTICE '- subscription_activation_log: Tracks new activations';
END $$;