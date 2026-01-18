# HATCH Database Setup

## Quick Setup Instructions

1. **Go to your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Open your project: `upeuxourusaoviaymmbu`

2. **Run Database Setup**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `scripts/complete-database-setup.sql`
   - Click "Run" to execute the script

3. **Verify Setup**
   - Go to Table Editor
   - You should see these tables:
     - `user_profiles` (with unique constraints on email and username)
     - `events`
     - `attendance_confirmations`
     - `payment_requests`
     - `referrals`
     - `organizer_listings`
     - `community_posts`
     - `community_comments`
     - `email_sends`

4. **Test the Application**
   - Visit `http://localhost:3001`
   - Click "Get Started Free"
   - Try creating an account with a unique username
   - The system will now validate username uniqueness in real-time!

## Key Features Added

### ✅ Username Uniqueness
- **Database constraint**: UNIQUE constraint on `username` column
- **Real-time validation**: Username availability checked as you type
- **Visual feedback**: Green checkmark for available, red X for taken
- **Debounced checking**: Waits 500ms after typing stops before checking

### ✅ Complete Database Schema
- All tables created with proper relationships
- Row Level Security (RLS) policies configured
- Indexes for performance
- Triggers for automatic referral code generation
- Functions for payment processing

### ✅ Sample Data
- Sample events for testing
- Admin user created automatically

## Username Validation Flow

1. User types username (minimum 3 characters)
2. System waits 500ms after typing stops
3. Checks database for existing username
4. Shows real-time feedback:
   - 🕐 Checking availability...
   - ✅ Username is available!
   - ❌ Username is already taken
5. Submit button disabled if username taken

## Error Handling

- Duplicate username attempts show clear error messages
- Database constraint prevents duplicate usernames at DB level
- Frontend validation prevents submission with invalid usernames
- Graceful fallback if validation service is unavailable

## Next Steps

After running the database setup:
1. Test user registration with unique usernames
2. Test the complete payment flow
3. Deploy to production
4. Set up monitoring and analytics

## Troubleshooting

**If you see "email column not found" error:**
- Make sure you ran the complete database setup script
- Check that all tables were created successfully
- Verify RLS policies are enabled

**If username validation doesn't work:**
- Check browser console for errors
- Verify Supabase connection
- Ensure RLS policies allow reading user_profiles table