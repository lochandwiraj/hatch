-- Payment system schema for QR code payments
-- Execute this in Supabase SQL Editor

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_requests_transaction_id ON payment_requests(transaction_id);

-- Enable RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
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

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for payment screenshots
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

-- Function to update user subscription after payment approval
CREATE OR REPLACE FUNCTION approve_payment_request(request_id UUID, admin_user_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject payment request
CREATE OR REPLACE FUNCTION reject_payment_request(request_id UUID, admin_user_id UUID, notes TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();