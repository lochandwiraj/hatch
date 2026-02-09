-- Add is_annual column to payment_submissions table
-- This column is needed to track whether a payment is for annual or monthly subscription

-- Add the is_annual column if it doesn't exist
DO $$ 
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_submissions' 
        AND column_name = 'is_annual'
    ) THEN
        ALTER TABLE payment_submissions 
        ADD COLUMN is_annual BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Added is_annual column to payment_submissions table';
    ELSE
        RAISE NOTICE 'is_annual column already exists in payment_submissions table';
    END IF;
END $$;

-- Update existing records to set is_annual based on amount
-- This is a one-time migration for existing data
UPDATE payment_submissions 
SET is_annual = CASE 
    WHEN requested_tier = 'basic_99' AND amount_paid >= 999 THEN TRUE
    WHEN requested_tier = 'premium_149' AND amount_paid >= 1499 THEN TRUE
    ELSE FALSE
END
WHERE is_annual IS NULL OR is_annual = FALSE;

-- Add comment to document the column
COMMENT ON COLUMN payment_submissions.is_annual IS 'TRUE for annual subscriptions (365 days), FALSE for monthly (30 days)';

-- Also ensure the payment_requests table has the is_annual column (if it exists)
DO $$ 
BEGIN
    -- Check if payment_requests table exists and add is_annual column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'payment_requests'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'payment_requests' 
            AND column_name = 'is_annual'
        ) THEN
            ALTER TABLE payment_requests 
            ADD COLUMN is_annual BOOLEAN DEFAULT FALSE;
            
            RAISE NOTICE 'Added is_annual column to payment_requests table';
        END IF;
    END IF;
END $$;

-- Verify the column was added
SELECT 
    'payment_submissions' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_submissions' 
AND column_name = 'is_annual'

UNION ALL

SELECT 
    'payment_requests' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_requests' 
AND column_name = 'is_annual';

-- Show sample data to verify
SELECT 
    'Current payment_submissions data:' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_annual = TRUE THEN 1 END) as annual_payments,
    COUNT(CASE WHEN is_annual = FALSE THEN 1 END) as monthly_payments
FROM payment_submissions;

SELECT 
    id,
    requested_tier,
    amount_paid,
    is_annual,
    created_at
FROM payment_submissions 
ORDER BY created_at DESC 
LIMIT 5;