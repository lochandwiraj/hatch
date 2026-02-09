# Event Lifecycle System - Complete Setup Guide

## What This System Does

1. **Shows "EVENT COMPLETED" badge** on events after their date passes
2. **Automatically deletes events** 4 days after completion
3. **Preserves attendance data** in archive tables for PDF generation
4. **Keeps PDFs complete** even after events are deleted from database

## Step-by-Step Setup

### Step 1: Run Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy and paste contents of `scripts/event-lifecycle-management.sql`
4. Click "Run"
5. Verify success (should see "Success. No rows returned")

**What this does:**
- Creates `archived_events` table
- Creates `archived_attendance` table
- Creates archival and cleanup functions
- Creates combined view for PDF generation
- Sets up proper permissions and indexes

### Step 2: Deploy Edge Function

```bash
# Make sure you're in your project root
cd your-project-directory

# Deploy the event cleanup function
supabase functions deploy event-cleanup

# You should see:
# Deploying function event-cleanup...
# Function deployed successfully!
```

**What this does:**
- Deploys serverless function to run cleanup
- Function will be available at: `https://your-project.supabase.co/functions/v1/event-cleanup`

### Step 3: Set Up Automated Daily Cleanup

#### Option A: Using Supabase Cron (Recommended)

1. Go to Supabase Dashboard → Database → Extensions
2. Enable `pg_cron` extension if not already enabled
3. Go to SQL Editor
4. Run this query:

```sql
-- Schedule daily cleanup at 2 AM UTC
SELECT cron.schedule(
  'daily-event-cleanup',
  '0 2 * * *',  -- 2 AM every day
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/event-cleanup',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Replace:**
- `YOUR_PROJECT_REF` with your actual Supabase project reference
- `YOUR_ANON_KEY` with your anon/public key from Settings → API

#### Option B: Using External Cron Service

If pg_cron is not available, use a service like:
- **Cron-job.org** (free)
- **EasyCron** (free tier available)
- **GitHub Actions** (if your code is on GitHub)

Set up a daily HTTP POST request to:
```
URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/event-cleanup
Method: POST
Headers: 
  Authorization: Bearer YOUR_ANON_KEY
Schedule: Daily at 2:00 AM
```

### Step 4: Verify Setup

#### Test the Cleanup Function Manually

```bash
# Call the function directly
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/event-cleanup' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# You should see a response like:
# {
#   "success": true,
#   "message": "Event cleanup completed successfully",
#   "timestamp": "2026-02-09T...",
#   "stats": {
#     "remainingEvents": 10,
#     "archivedEvents": 5
#   }
# }
```

#### Check Database

```sql
-- View archived events
SELECT * FROM archived_events ORDER BY archived_at DESC LIMIT 10;

-- View archived attendance
SELECT * FROM archived_attendance ORDER BY archived_at DESC LIMIT 10;

-- Check if any events need cleanup
SELECT name, date, 
       CURRENT_DATE - date as days_since_event
FROM events 
WHERE date < (CURRENT_DATE - INTERVAL '4 days')
ORDER BY date DESC;
```

### Step 5: Test the Complete Flow

#### Create a Test Event

1. Go to Admin → Manage Events
2. Create a new event with date = 5 days ago
3. Register for the event
4. Mark attendance as confirmed

#### Run Manual Cleanup

```sql
-- In Supabase SQL Editor
SELECT delete_old_events();
```

#### Verify Results

1. **Event should be deleted** from events table:
```sql
SELECT * FROM events WHERE name = 'Your Test Event';
-- Should return 0 rows
```

2. **Event should be archived**:
```sql
SELECT * FROM archived_events WHERE event_name = 'Your Test Event';
-- Should return 1 row
```

3. **Attendance should be archived**:
```sql
SELECT * FROM archived_attendance WHERE event_name = 'Your Test Event';
-- Should return your attendance record
```

4. **PDF should include archived event**:
- Go to Profile page
- Click "Download Data"
- Open PDF
- Verify test event appears in attendance history

### Step 6: Monitor the System

#### Check Cron Job Status

```sql
-- View scheduled cron jobs
SELECT * FROM cron.job WHERE jobname = 'daily-event-cleanup';

-- View cron job run history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-event-cleanup')
ORDER BY start_time DESC 
LIMIT 10;
```

#### View Cleanup Logs

In Supabase Dashboard:
1. Go to Functions → event-cleanup
2. Click "Logs" tab
3. View execution history and any errors

#### Database Statistics

```sql
-- Count events by status
SELECT 
  'Active Events' as status,
  COUNT(*) as count
FROM events
UNION ALL
SELECT 
  'Archived Events' as status,
  COUNT(*) as count
FROM archived_events
UNION ALL
SELECT 
  'Archived Attendance Records' as status,
  COUNT(*) as count
FROM archived_attendance;
```

## Troubleshooting

### Issue: Events Not Being Deleted

**Check 1:** Verify cron job is running
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-event-cleanup')
ORDER BY start_time DESC LIMIT 1;
```

**Check 2:** Run cleanup manually
```sql
SELECT delete_old_events();
```

**Check 3:** Check for errors in function logs

### Issue: Archived Data Not Appearing in PDF

**Check 1:** Verify data is archived
```sql
SELECT * FROM archived_attendance WHERE user_id = 'YOUR_USER_ID';
```

**Check 2:** Verify view is working
```sql
SELECT * FROM user_complete_attendance WHERE user_id = 'YOUR_USER_ID';
```

**Check 3:** Check PDF generator is using correct query

### Issue: "EVENT COMPLETED" Badge Not Showing

**Check 1:** Verify event date is in the past
**Check 2:** Clear browser cache (Ctrl + Shift + R)
**Check 3:** Check console for JavaScript errors

## Maintenance

### Weekly Checks

1. Review cleanup logs for errors
2. Check archived data growth
3. Verify PDF generation includes archived events

### Monthly Tasks

1. Review database size and performance
2. Check if indexes need optimization
3. Verify cron job is running consistently

### Backup Strategy

Archive tables contain important historical data:

```sql
-- Export archived data (run monthly)
COPY (
  SELECT * FROM archived_events
) TO '/path/to/backup/archived_events_2026_02.csv' CSV HEADER;

COPY (
  SELECT * FROM archived_attendance
) TO '/path/to/backup/archived_attendance_2026_02.csv' CSV HEADER;
```

## Configuration Options

### Change Cleanup Delay

To change from 4 days to a different duration:

```sql
-- Update the delete_old_events function
CREATE OR REPLACE FUNCTION delete_old_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  deleted_count INTEGER := 0;
BEGIN
  -- Change '4 days' to your preferred duration (e.g., '7 days', '14 days')
  FOR event_record IN
    SELECT id, name, date
    FROM events
    WHERE date < (CURRENT_DATE - INTERVAL '7 days')  -- Changed to 7 days
  LOOP
    PERFORM archive_event_data(event_record.id);
    DELETE FROM events WHERE id = event_record.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Total events deleted: %', deleted_count;
END;
$$;
```

### Change Cleanup Schedule

To run cleanup at a different time:

```sql
-- Update cron schedule
SELECT cron.unschedule('daily-event-cleanup');

SELECT cron.schedule(
  'daily-event-cleanup',
  '0 3 * * *',  -- 3 AM instead of 2 AM
  $$ ... $$
);
```

## Success Criteria

✅ "EVENT COMPLETED" badge appears on past events
✅ Events automatically deleted 4 days after completion
✅ Archived data preserved in database
✅ PDF includes both current and archived events
✅ Cron job runs daily without errors
✅ Database size remains manageable
✅ No user-facing errors or data loss

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase function logs
3. Check database error logs
4. Verify all migration steps completed successfully

## Summary

This system provides:
- **Automatic cleanup** of old events (saves storage)
- **Data preservation** for historical records (PDFs)
- **Clear status indicators** ("EVENT COMPLETED" badge)
- **Zero maintenance** once set up (fully automated)
- **No data loss** (everything preserved in archives)

The system runs automatically every day at 2 AM, cleaning up old events while preserving all attendance data for PDF generation.
