-- Add events_attended column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS events_attended INTEGER DEFAULT 0;

-- Create attendance confirmations table
CREATE TABLE IF NOT EXISTS attendance_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'attended', 'not_attended')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_confirmations_user_id ON attendance_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_confirmations_status ON attendance_confirmations(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_attendance_confirmations_created_at ON attendance_confirmations(created_at);

-- Enable RLS
ALTER TABLE attendance_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS policy for attendance confirmations
CREATE POLICY "Users can manage own attendance confirmations" ON attendance_confirmations
  FOR ALL USING (auth.uid() = user_id);

-- Function to create attendance confirmation after event ends
CREATE OR REPLACE FUNCTION create_attendance_confirmation()
RETURNS void AS $$
DECLARE
  event_record RECORD;
  user_record RECORD;
BEGIN
  -- Find events that ended yesterday and don't have confirmations yet
  FOR event_record IN 
    SELECT id, title, event_date, required_tier
    FROM events 
    WHERE status = 'published' 
    AND event_date::date = CURRENT_DATE - INTERVAL '1 day'
    AND id NOT IN (SELECT DISTINCT event_id FROM attendance_confirmations)
  LOOP
    -- Create attendance confirmations for users who have access to this event tier
    FOR user_record IN
      SELECT id, subscription_tier
      FROM user_profiles
      WHERE (
        (event_record.required_tier = 'free') OR
        (event_record.required_tier = 'basic_99' AND subscription_tier IN ('basic_99', 'premium_149')) OR
        (event_record.required_tier = 'premium_149' AND subscription_tier = 'premium_149')
      )
    LOOP
      INSERT INTO attendance_confirmations (user_id, event_id, event_title, event_date)
      VALUES (user_record.id, event_record.id, event_record.title, event_record.event_date)
      ON CONFLICT (user_id, event_id) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update events_attended count
CREATE OR REPLACE FUNCTION update_events_attended_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_status = 'attended' AND OLD.confirmation_status != 'attended' THEN
    UPDATE user_profiles 
    SET events_attended = events_attended + 1 
    WHERE id = NEW.user_id;
  ELSIF OLD.confirmation_status = 'attended' AND NEW.confirmation_status != 'attended' THEN
    UPDATE user_profiles 
    SET events_attended = GREATEST(events_attended - 1, 0) 
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating events_attended count
CREATE TRIGGER update_events_attended_trigger
  AFTER UPDATE ON attendance_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_events_attended_count();