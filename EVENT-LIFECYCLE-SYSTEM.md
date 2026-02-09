# Event Lifecycle Management System

## Overview
Comprehensive system to manage event lifecycle from registration to automatic cleanup, while preserving attendance data for PDF generation.

## Event Lifecycle Flow

### 1. Event Registration
- User registers for an event
- Registration stored in `user_registrations` table
- User receives confirmation

### 2. Event Occurs
- Event date passes
- Event card shows **"EVENT COMPLETED"** badge in top corner
- Users can still view event details

### 3. Day After Event (+1 day)
- Attendance confirmation modal appears
- User confirms if they attended
- Attendance recorded in `event_attendance` table
- Data immediately available for PDF generation

### 4. Event Archival (+4 days)
- **Automatic process runs daily**
- Events 4+ days old are archived:
  - Event details copied to `archived_events` table
  - Attendance records copied to `archived_attendance` table
- Original event deleted from `events` table
- Event disappears from frontend (Events page, Calendar, etc.)
- **Archived data preserved for PDF generation**

## Database Schema

### New Tables

#### `archived_events`
```sql
- id (UUID, Primary Key)
- original_event_id (UUID) - Reference to original event
- event_name (TEXT)
- event_date (DATE)
- event_time (TEXT)
- location (TEXT)
- description (TEXT)
- organizer (TEXT)
- max_participants (INTEGER)
- tier_requirement (TEXT)
- created_at (TIMESTAMPTZ)
- archived_at (TIMESTAMPTZ)
```

#### `archived_attendance`
```sql
- id (UUID, Primary Key)
- user_id (UUID) - References auth.users
- archived_event_id (UUID) - References archived_events
- original_event_id (UUID)
- event_name (TEXT)
- event_date (DATE)
- attended (BOOLEAN)
- confirmed_at (TIMESTAMPTZ)
- archived_at (TIMESTAMPTZ)
```

### Views

#### `user_complete_attendance`
Combines current and archived attendance for comprehensive PDF generation:
- Current events from `event_attendance` + `events`
- Archived events from `archived_attendance` + `archived_events`
- Includes `is_archived` flag to distinguish sources

## Functions

### `archive_event_data(event_id UUID)`
Archives event and attendance data before deletion:
1. Copies event details to `archived_events`
2. Copies attendance records to `archived_attendance`
3. Only archives records where `attended = TRUE`

### `delete_old_events()`
Deletes events 4+ days old:
1. Finds events where `date < CURRENT_DATE - 4 days`
2. Calls `archive_event_data()` for each event
3. Deletes event from `events` table
4. Cascade deletion handles related records

### `get_user_archived_attendance(user_uuid UUID)`
Retrieves archived attendance for a specific user:
- Returns event details from archived tables
- Used for PDF generation
- Only returns attended events

## Supabase Edge Function

### `event-cleanup`
**Schedule:** Daily at 2:00 AM UTC

**Process:**
1. Connects to Supabase with service role key
2. Calls `delete_old_events()` function
3. Logs cleanup statistics
4. Returns success/failure status

**Setup:**
```bash
# Deploy function
supabase functions deploy event-cleanup

# Set up cron job (in Supabase Dashboard)
# Go to Database > Cron Jobs
# Create new job:
# - Name: Daily Event Cleanup
# - Schedule: 0 2 * * * (2 AM daily)
# - Command: SELECT net.http_post(
#     url:='https://your-project.supabase.co/functions/v1/event-cleanup',
#     headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
#   );
```

## Frontend Implementation

### Event Card Badge
Show "EVENT COMPLETED" badge when event date has passed:

```typescript
const isCompleted = new Date(event.date) < new Date()

{isCompleted && (
  <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
    EVENT COMPLETED
  </div>
)}
```

### PDF Generation
Updated to include archived events:

```typescript
// Fetch both current and archived attendance
const { data: allAttendance } = await supabase
  .from('user_complete_attendance')
  .select('*')
  .eq('user_id', userId)
  .order('event_date', { ascending: false })

// Generate PDF with complete history
generateAttendanceReport(userProfile, allAttendance, stats)
```

### Events Page Filtering
Filter out events 4+ days old (they're already deleted):

```typescript
const { data: events } = await supabase
  .from('events')
  .select('*')
  .gte('date', new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString())
  .order('date', { ascending: true })
```

## Benefits

### Storage Optimization
- Old events automatically removed from database
- Reduces database size and query performance
- Only essential data preserved in archive tables

### Data Preservation
- All attended events preserved for PDF generation
- Users can download complete attendance history
- No data loss despite event deletion

### User Experience
- Clean events page (no old events cluttering the view)
- "EVENT COMPLETED" badge provides clear status
- PDF always shows complete attendance history

## Migration Steps

1. **Run SQL Migration**
   ```bash
   # In Supabase SQL Editor
   # Run: scripts/event-lifecycle-management.sql
   ```

2. **Deploy Edge Function**
   ```bash
   supabase functions deploy event-cleanup
   ```

3. **Set Up Cron Job**
   - Go to Supabase Dashboard → Database → Cron Jobs
   - Create daily job to call `event-cleanup` function

4. **Update Frontend**
   - Add "EVENT COMPLETED" badge to EventCard component
   - Update PDF generator to use `user_complete_attendance` view
   - Update events page to show completion status

5. **Test**
   - Create test event with past date
   - Verify "EVENT COMPLETED" badge appears
   - Wait 4 days or manually call `delete_old_events()`
   - Verify event deleted but attendance preserved
   - Generate PDF and verify archived events included

## Monitoring

### Check Cleanup Status
```sql
-- View archived events
SELECT COUNT(*) FROM archived_events;

-- View archived attendance
SELECT COUNT(*) FROM archived_attendance;

-- View events pending deletion
SELECT name, date 
FROM events 
WHERE date < (CURRENT_DATE - INTERVAL '4 days');
```

### Manual Cleanup
```sql
-- Run cleanup manually
SELECT delete_old_events();
```

## Security

- RLS enabled on all archive tables
- Users can only view their own archived attendance
- Service role required for cleanup function
- Archive functions use SECURITY DEFINER

## Performance

- Indexes on date columns for fast cleanup queries
- Indexes on user_id for fast PDF generation
- View uses UNION ALL for optimal performance
- Cleanup runs during low-traffic hours (2 AM)
