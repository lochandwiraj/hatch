# Database Setup Instructions

## Scripts to Run in Supabase SQL Editor

Run these scripts in order to complete the calendar and cascade deletion setup:

### 1. Add Event Time Field
```sql
-- Run: scripts/add-event-time-field.sql
-- This adds time support to events (date + time)
```

### 2. Add User Registrations Table
```sql
-- Run: scripts/add-user-registrations-table.sql
-- This creates the table to track user event registrations for calendar
```

### 3. Fix Event Cascade Deletion
```sql
-- Run: scripts/fix-event-cascade-deletion.sql
-- This ensures when events are deleted, all related data is cleaned up
```

## What Each Script Does:

### Event Time Field (`add-event-time-field.sql`)
- Adds `event_time` column to events table
- Creates `events_with_datetime` view combining date and time
- Allows admins to set specific times for events

### User Registrations (`add-user-registrations-table.sql`)
- Creates `user_registrations` table with RLS policies
- Creates `user_registered_events` view for calendar display
- Enables registration confirmation system

### Cascade Deletion (`fix-event-cascade-deletion.sql`)
- Updates foreign key constraints with `ON DELETE CASCADE`
- Creates cleanup trigger for logging deletions
- Creates `event_deletion_impact` view to preview deletion impact
- Automatically cleans up:
  - User registrations
  - Event attendance records
  - Any other related data

## After Running Scripts:

1. **Calendar will work** - Users can see registered events in calendar view
2. **Registration tracking** - When users click "Register Now" and return, they get confirmation popup
3. **Clean event deletion** - Admins can delete events without orphaned data
4. **Impact preview** - Admins can check `event_deletion_impact` view before deleting

## Testing:

After running scripts, test:
1. Create a test event
2. Register for it (should appear in calendar)
3. Delete the event from admin panel
4. Verify registration was automatically deleted

## Current Admin Event Deletion:

The current `deleteEvent` function in `app/admin/events/page.tsx` is simple:
```typescript
const deleteEvent = async (eventId: string) => {
  if (!confirm('Are you sure you want to delete this event?')) return
  
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    
  // After running cascade script, this will automatically clean up all related data
}
```

Once the cascade deletion script is run, this simple deletion will automatically clean up all related registrations, attendance records, and other connected data.