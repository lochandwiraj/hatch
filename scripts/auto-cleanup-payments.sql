-- Automatic Payment Cleanup System
-- Deletes payment submissions older than 3 days to keep database clean

-- Function to automatically delete old payment submissions
CREATE OR REPLACE FUNCTION cleanup_old_payments()
RETURNS void AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete payment submissions older than 3 days
    DELETE FROM payment_submissions 
    WHERE created_at < NOW() - INTERVAL '3 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup activity
    RAISE LOG 'Payment cleanup completed: % records deleted', deleted_count;
    
    -- Also cleanup orphaned payment screenshots from storage
    -- Note: This would need to be handled by a separate process or Edge Function
    -- as SQL cannot directly delete from Supabase Storage
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to run cleanup and log results
CREATE OR REPLACE FUNCTION run_payment_cleanup()
RETURNS TABLE(
    cleanup_date TIMESTAMP WITH TIME ZONE,
    records_deleted INTEGER,
    status TEXT
) AS $$
DECLARE
    deleted_count INTEGER;
    cleanup_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    cleanup_timestamp := NOW();
    
    -- Delete old payment submissions
    DELETE FROM payment_submissions 
    WHERE created_at < cleanup_timestamp - INTERVAL '3 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Return results
    RETURN QUERY SELECT 
        cleanup_timestamp,
        deleted_count,
        CASE 
            WHEN deleted_count > 0 THEN 'Cleanup completed successfully'
            ELSE 'No old records to clean'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_payments() TO authenticated;
GRANT EXECUTE ON FUNCTION run_payment_cleanup() TO authenticated;

-- Create a table to log cleanup activities (optional)
CREATE TABLE IF NOT EXISTS payment_cleanup_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cleanup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    records_deleted INTEGER,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log cleanup activities
CREATE OR REPLACE FUNCTION log_payment_cleanup()
RETURNS void AS $$
DECLARE
    deleted_count INTEGER;
    cleanup_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    cleanup_timestamp := NOW();
    
    -- Delete old payment submissions
    DELETE FROM payment_submissions 
    WHERE created_at < cleanup_timestamp - INTERVAL '3 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO payment_cleanup_log (cleanup_date, records_deleted, status)
    VALUES (
        cleanup_timestamp,
        deleted_count,
        CASE 
            WHEN deleted_count > 0 THEN 'Cleanup completed successfully'
            ELSE 'No old records to clean'
        END
    );
    
    RAISE LOG 'Payment cleanup logged: % records deleted at %', deleted_count, cleanup_timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the cleanup function
DO $$
DECLARE
    result RECORD;
BEGIN
    -- Run a test cleanup
    SELECT * INTO result FROM run_payment_cleanup() LIMIT 1;
    
    RAISE NOTICE '✅ PAYMENT CLEANUP SYSTEM READY!';
    RAISE NOTICE 'Test cleanup result: % records deleted', result.records_deleted;
    RAISE NOTICE 'Status: %', result.status;
    RAISE NOTICE '';
    RAISE NOTICE '🔄 AUTOMATIC CLEANUP CONFIGURED:';
    RAISE NOTICE '- Payment submissions older than 3 days will be deleted';
    RAISE NOTICE '- Cleanup can be run manually or scheduled';
    RAISE NOTICE '- Cleanup activities are logged for monitoring';
    RAISE NOTICE '';
    RAISE NOTICE '📋 TO SET UP AUTOMATIC CLEANUP:';
    RAISE NOTICE '1. Use Supabase Edge Functions for scheduled cleanup';
    RAISE NOTICE '2. Or call cleanup_old_payments() from your application';
    RAISE NOTICE '3. Or use pg_cron extension if available';
END;
$$;

-- Instructions for setting up automatic cleanup
COMMENT ON FUNCTION cleanup_old_payments IS 'Deletes payment submissions older than 3 days. Call this function regularly to keep database clean.';
COMMENT ON FUNCTION run_payment_cleanup IS 'Runs cleanup and returns statistics. Use for manual cleanup or monitoring.';
COMMENT ON FUNCTION log_payment_cleanup IS 'Runs cleanup and logs the activity to payment_cleanup_log table.';

-- Example of how to run cleanup manually
-- SELECT * FROM run_payment_cleanup();

-- Example of how to check cleanup logs
-- SELECT * FROM payment_cleanup_log ORDER BY created_at DESC LIMIT 10;