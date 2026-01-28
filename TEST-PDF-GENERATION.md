# Testing PDF Generation Feature

## Quick Test Steps

### 1. Database Setup
First, run this in Supabase SQL Editor:
```sql
-- Copy contents from scripts/update-attendance-view-with-tier.sql
-- This adds required_tier field to the view
```

### 2. Test PDF Download
1. Log in to HATCH
2. Go to Profile page (`/profile`)
3. Scroll to "Account Actions" section
4. Click "Download Data" button
5. PDF should download automatically

### 3. Verify PDF Content
The PDF should contain:
- **Header**: HATCH branding with generation date
- **User Info**: Name, username, email, college, graduation year, plan, member since
- **Statistics**: Color-coded boxes showing events attended, registered, access level, attendance rate
- **Events Table**: Only events accessible by user's subscription tier
- **Footer**: HATCH tagline and page numbers

### 4. Test Tier Filtering
Create test users with different tiers and verify:

**Free User PDF**:
- Should only show events with `required_tier = 'free'`
- Statistics should reflect only free events

**Explorer User PDF**:
- Should show events with `required_tier IN ('free', 'basic_99')`
- Statistics should include free + explorer events

**Professional User PDF**:
- Should show all events regardless of `required_tier`
- Statistics should include all attended events

### 5. Test Edge Cases
- **No events attended**: PDF should show "No events attended in your tier yet" with tier access info
- **Large number of events**: PDF should handle multiple pages correctly
- **Missing event data**: PDF should handle null values gracefully

## Expected Behavior

### PDF Generation Process
1. User clicks "Download Data"
2. Loading toast appears: "Generating your attendance report..."
3. System fetches user's attended events from `user_attendance_with_events` view
4. Events are filtered by user's subscription tier
5. PDF is generated with HATCH branding
6. File downloads with name: `HATCH_Attendance_Report_{username}_{date}.pdf`
7. Success toast: "📄 Your attendance report has been downloaded!"

### Error Handling
- If database query fails → Error toast: "Failed to generate attendance report"
- If user not logged in → Error toast: "Please log in to download your data"
- If PDF generation fails → Error toast with specific error message

## Troubleshooting

### Common Issues
1. **"RLS policy error"** → Database view needs to be updated (run the SQL script)
2. **"PDF generation failed"** → Check browser console for jsPDF errors
3. **"Empty PDF"** → User might not have attended any events in their tier
4. **"Download not starting"** → Check if browser is blocking downloads

### Debug Steps
1. Open browser developer tools
2. Go to Network tab
3. Click "Download Data"
4. Check for any failed requests
5. Look at Console tab for JavaScript errors

## Success Criteria
✅ PDF downloads without errors
✅ PDF contains correct user information
✅ Events are filtered by subscription tier
✅ Statistics match user's actual data
✅ PDF has professional appearance
✅ File naming follows convention
✅ Toast notifications work correctly