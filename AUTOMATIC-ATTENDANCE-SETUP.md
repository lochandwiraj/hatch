# Automatic Attendance System Setup

## Overview

The automatic attendance system tracks when users register for events and automatically marks them as "attended" when the event time passes. This eliminates manual check-ins and provides accurate attendance statistics.

## How It Works

1. **User Registration**: When users click "Register Now" and confirm registration, it's stored in `user_registrations` table
2. **Automatic Marking**: Every minute, the system checks for events that have passed their scheduled time
3. **Attendance Creation**: All registered users for past events automatically get marked as "attended"
4. **Statistics**: Users can view their attendance stats on their profile page

## Database Setup

Run these scripts in your Supabase SQL editor **in order**:

### 1. Event Time Field
```bash
# Run: scripts/add-event-time-field.sql
```
- Adds `event_time` column to events table
- Creates `events_with_datetime` view
- Allows precise event scheduling

### 2. User Registrations Table
```bash
# Run: scripts/add-user-registrations-table.sql
```
- Creates `user_registrations` table with RLS policies
- Creates `user_registered_events` view
- Enables registration tracking for calendar

### 3. Automatic Attendance System
```bash
# Run: scripts/automatic-attendance-system.sql
```
- Creates `event_attendance` table
- Creates `auto_mark_attendance()` function
- Creates `get_user_attendance_stats()` function
- Sets up automatic attendance marking

### 4. Cascade Deletion (Optional but Recommended)
```bash
# Run: scripts/fix-event-cascade-deletion.sql
```
- Ensures clean deletion of events and related data
- Prevents orphaned records

## Edge Function Setup

### 1. Deploy the Auto-Attendance Function
```bash
supabase functions deploy auto-attendance
```

### 2. Set Up Cron Job
In your Supabase Dashboard:
1. Go to **Edge Functions**
2. Find the `auto-attendance` function
3. Set up a **Cron Trigger**:
   - **Schedule**: `* * * * *` (every minute)
   - **URL**: `https://your-project.supabase.co/functions/v1/auto-attendance`

### 3. Test the Function
```bash
curl -X POST https://your-project.supabase.co/functions/v1/auto-attendance \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Features Included

### ✅ **Calendar System**
- Monthly calendar view with today highlighted (blue)
- Registered events highlighted (green)
- List of registered events with details

### ✅ **Registration Confirmation**
- Modal popup asking "Did you register for this event?"
- Automatic addition to calendar upon confirmation
- Prevents duplicate registrations

### ✅ **Automatic Attendance**
- Runs every minute via cron job
- Marks all registered users as "attended" when event time passes
- Only processes each event once (no duplicates)

### ✅ **Attendance Statistics**
- Total events registered
- Total events attended
- Attendance rate percentage
- Displayed on user profile page

### ✅ **Admin Features**
- View attendance statistics for all events
- Clean event deletion with cascade cleanup
- Event impact preview before deletion

## Database Functions

### `auto_mark_attendance()`
```sql
SELECT auto_mark_attendance();
```
- Finds events that have passed their scheduled time
- Marks all registered users as "attended"
- Returns count of users processed

### `get_user_attendance_stats(user_uuid)`
```sql
SELECT * FROM get_user_attendance_stats('user-uuid-here');
```
- Returns attendance statistics for a specific user
- Used by profile page to display stats

## Views Created

### `user_registered_events`
- Shows user's registered events with full event details
- Used by calendar page

### `user_attendance_with_events`
- Shows user's attendance records with event details
- Includes auto-marked flag for tracking

### `event_deletion_impact`
- Shows what data will be deleted when an event is removed
- Helps admins understand deletion impact

## Testing the System

### 1. Create Test Event
1. Go to Admin Events page
2. Create an event with date/time in the past
3. Set status to "Published"

### 2. Register for Event
1. Go to Events page as regular user
2. Click "Register Now" on the test event
3. Confirm registration in popup
4. Check Calendar page - event should appear

### 3. Test Auto-Attendance
1. Run the auto-attendance function manually:
   ```sql
   SELECT auto_mark_attendance();
   ```
2. Check user profile - attendance stats should update
3. Verify in `event_attendance` table

### 4. Verify Cascade Deletion
1. Delete the test event from admin panel
2. Check that registration and attendance records are gone
3. Verify no orphaned data remains

## Monitoring & Logs

### Edge Function Logs
- Check Supabase Dashboard > Edge Functions > auto-attendance
- View execution logs and any errors
- Monitor cron job execution

### Database Logs
- The `auto_mark_attendance()` function logs all activity
- Check PostgreSQL logs for attendance marking events

### Manual Execution
```sql
-- Check pending events (past events without auto-marked attendance)
SELECT e.title, e.event_date, e.event_time,
       COUNT(ur.id) as registered_users
FROM events e
LEFT JOIN user_registrations ur ON e.id = ur.event_id
WHERE e.status = 'published'
AND (e.event_date::DATE + COALESCE(e.event_time, '00:00:00')::TIME) < NOW()
AND NOT EXISTS (
    SELECT 1 FROM event_attendance ea 
    WHERE ea.event_id = e.id AND ea.auto_marked = TRUE
)
GROUP BY e.id, e.title, e.event_date, e.event_time;

-- Manually run attendance marking
SELECT auto_mark_attendance();
```

## Troubleshooting

### Common Issues

1. **Cron Job Not Running**
   - Check Edge Function deployment
   - Verify cron schedule syntax
   - Check function logs for errors

2. **Attendance Not Marking**
   - Verify event has passed scheduled time
   - Check if users are properly registered
   - Run function manually to test

3. **Statistics Not Updating**
   - Check RLS policies on tables
   - Verify user permissions
   - Test function calls manually

### Reset Test Data
```sql
-- Clear test attendance data
DELETE FROM event_attendance WHERE auto_marked = TRUE;

-- Clear test registrations
DELETE FROM user_registrations WHERE event_id IN (
    SELECT id FROM events WHERE title LIKE '%Test%'
);

-- Delete test events
DELETE FROM events WHERE title LIKE '%Test%';
```

## Benefits

- **Zero Manual Work**: Attendance is automatically tracked
- **Accurate Statistics**: Real attendance data for users and admins
- **Better UX**: Users don't need to remember to check-in
- **Data Integrity**: Cascade deletion prevents orphaned records
- **Scalable**: Works for any number of events and users
- **Reliable**: Database-level constraints ensure consistency

## Next Steps

After setup:
1. Test with a few events to verify functionality
2. Monitor Edge Function execution for first few days
3. Check user feedback on calendar and attendance features
4. Consider adding email notifications for registered events
5. Optionally add attendance certificates or badges