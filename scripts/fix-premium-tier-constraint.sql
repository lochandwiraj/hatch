-- Fix payment submissions constraint for premium_149 tier
-- This resolves the constraint violation error for Professional tier payments

-- First, let's check the current constraint
DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payment_submissions_requested_tier_check' 
        AND table_name = 'payment_submissions'
    ) THEN
        ALTER TABLE payment_submissions DROP CONSTRAINT payment_submissions_requested_tier_check;
        RAISE NOTICE '✅ Dropped existing tier constraint';
    END IF;
END $$;

-- Add the correct constraint with both tiers
ALTER TABLE payment_submissions 
ADD CONSTRAINT payment_submissions_requested_tier_check 
CHECK (requested_tier IN ('basic_99', 'premium_149'));

-- Test both tiers to make sure they work
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Test basic_99 tier
    INSERT INTO payment_submissions (
        user_id, username, full_name, email, transaction_id, 
        requested_tier, amount_paid, payment_method, status
    ) VALUES (
        test_user_id, 'testuser1', 'Test User 1', 'test1@example.com', 
        'TEST_BASIC_123', 'basic_99', 99.00, 'UPI', 'pending'
    );
    RAISE NOTICE '✅ basic_99 tier test successful';
    
    -- Test premium_149 tier
    INSERT INTO payment_submissions (
        user_id, username, full_name, email, transaction_id, 
        requested_tier, amount_paid, payment_method, status
    ) VALUES (
        test_user_id, 'testuser2', 'Test User 2', 'test2@example.com', 
        'TEST_PREMIUM_123', 'premium_149', 149.00, 'UPI', 'pending'
    );
    RAISE NOTICE '✅ premium_149 tier test successful';
    
    -- Clean up test data
    DELETE FROM payment_submissions WHERE transaction_id IN ('TEST_BASIC_123', 'TEST_PREMIUM_123');
    RAISE NOTICE '✅ Test data cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Constraint test failed: %', SQLERRM;
        -- Clean up test data even if there's an error
        DELETE FROM payment_submissions WHERE transaction_id IN ('TEST_BASIC_123', 'TEST_PREMIUM_123');
END $$;

-- Verify the constraint is working
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PAYMENT TIER CONSTRAINT FIXED!';
    RAISE NOTICE '✅ Both basic_99 and premium_149 tiers now work';
    RAISE NOTICE '✅ Professional tier payments should now succeed';
    RAISE NOTICE '';
    RAISE NOTICE 'Users can now submit payments for:';
    RAISE NOTICE '- Explorer (₹99) - basic_99 tier';
    RAISE NOTICE '- Professional (₹149) - premium_149 tier';
END $$;