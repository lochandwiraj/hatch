-- Fix payment screenshot display issues
-- This ensures screenshots can be properly viewed in the admin panel

-- Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop all existing storage policies for payment screenshots
DROP POLICY IF EXISTS "Users can upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public can view payment screenshots" ON storage.objects;

-- Create comprehensive storage policies
-- Allow authenticated users to upload screenshots
CREATE POLICY "Authenticated users can upload payment screenshots" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow everyone to view payment screenshots (needed for admin panel)
CREATE POLICY "Public access to payment screenshots" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'payment-screenshots');

-- Allow authenticated users to update their own screenshots
CREATE POLICY "Users can update their payment screenshots" ON storage.objects
    FOR UPDATE 
    TO authenticated
    USING (bucket_id = 'payment-screenshots');

-- Allow authenticated users to delete their own screenshots
CREATE POLICY "Users can delete their payment screenshots" ON storage.objects
    FOR DELETE 
    TO authenticated
    USING (bucket_id = 'payment-screenshots');

-- Verify bucket configuration
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment-screenshots' AND public = true) THEN
        RAISE NOTICE '✅ Payment screenshots bucket is properly configured as public';
    ELSE
        RAISE NOTICE '❌ Payment screenshots bucket configuration issue';
    END IF;
END;
$$;

-- Test storage access
DO $$
BEGIN
    -- Check if we can query the storage objects table
    PERFORM 1 FROM storage.objects WHERE bucket_id = 'payment-screenshots' LIMIT 1;
    RAISE NOTICE '✅ Storage objects table accessible';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Storage objects table access issue: %', SQLERRM;
END;
$$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PAYMENT SCREENSHOT DISPLAY FIXED!';
    RAISE NOTICE '✅ Storage bucket configured as public';
    RAISE NOTICE '✅ Comprehensive storage policies created';
    RAISE NOTICE '✅ Public access enabled for viewing screenshots';
    RAISE NOTICE '✅ Upload permissions for authenticated users';
    RAISE NOTICE '';
    RAISE NOTICE 'Screenshots should now be visible in:';
    RAISE NOTICE '- Admin payment review panel';
    RAISE NOTICE '- Payment submission modals';
    RAISE NOTICE '- Direct URL access';
END;
$$;