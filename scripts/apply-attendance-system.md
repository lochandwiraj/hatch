# Apply Event Attendance System

To enable the event attendance tracking system, you need to run the attendance system SQL schema in your Supabase database.

## Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Attendance System Schema**
   - Copy the contents of `scripts/event-attendance-system.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the schema

3. **Verify Installation**
   - Check that the following tables were created:
     - `event_attendance`
     - `attendance_prompts`
     - `user_attendance_stats` (view)
   
   - Check that the following functions were created:
     - `get_attendance_limit()`
     - `can_attend_event()`
     - `register_for_event()`
     - `confirm_attendance()`
     - `reset_monthly_attendance()`
     - `get_pending_attendance_prompts()`

## Features Enabled:

✅ **Event Registration with Tier Limits**
- Free users: 5 events per month
- Explorer users: 10 events per month  
- Professional users: Unlimited events

✅ **Attendance Confirmation System**
- Users get prompted to confirm attendance day after events
- Attendance tracking builds user event portfolio

✅ **Monthly Reset System**
- Attendance limits reset on the 1st of each month
- Automatic tier expiration after 30 days

✅ **Tier Limit Enforcement**
- Users see upgrade prompts when limits are reached
- Hierarchical access to events based on subscription tier

## Usage:

After applying the schema, users will be able to:
1. Register for events (with tier-based limits)
2. Get attendance confirmation prompts after events
3. Track their event participation history
4. See upgrade prompts when monthly limits are reached

The system automatically handles monthly resets and tier expiration.