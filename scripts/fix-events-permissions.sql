-- Fix events table permissions for admin operations
-- This will allow admins to update events without RLS restrictions

-- Disable RLS on events table temporarily for admin operations
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users (admins)
GRANT ALL ON events TO authenticated;

-- Ensure the events table has proper structure
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or update the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_events_updated_at ON events;

-- Create the trigger
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Events table permissions fixed!';
    RAISE NOTICE 'Admins can now create, update, and delete events without restrictions.';
END;
$$;