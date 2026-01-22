import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Running automatic attendance marking...')

    // Call the auto_mark_attendance function
    const { data, error } = await supabaseClient.rpc('auto_mark_attendance')

    if (error) {
      console.error('❌ Error marking attendance:', error)
      throw error
    }

    const processedCount = data || 0
    console.log(`✅ Auto-marked attendance for ${processedCount} users`)

    // Get current timestamp for logging
    const timestamp = new Date().toISOString()

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-marked attendance for ${processedCount} users`,
        processedCount,
        timestamp
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Auto-attendance function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

/* 
DEPLOYMENT INSTRUCTIONS:

1. Deploy this Edge Function:
   supabase functions deploy auto-attendance

2. Set up a cron job to run every minute:
   - Go to Supabase Dashboard > Edge Functions
   - Create a new cron job with this URL:
   - Schedule: "* * * * *" (every minute)
   - URL: https://your-project.supabase.co/functions/v1/auto-attendance

3. Or call it manually for testing:
   curl -X POST https://your-project.supabase.co/functions/v1/auto-attendance \
   -H "Authorization: Bearer YOUR_ANON_KEY"

HOW IT WORKS:
- Runs every minute via cron job
- Checks for events that have passed their scheduled time
- Automatically marks all registered users as "attended"
- Only processes each event once (prevents duplicates)
- Logs all activity for monitoring

BENEFITS:
- Users don't need to manually check-in
- Attendance is automatically tracked
- Works for all event types (online/offline)
- Provides accurate attendance statistics
- Reduces manual admin work
*/