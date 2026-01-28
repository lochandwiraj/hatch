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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting subscription expiration check...')

    // Call the database function to reset expired subscriptions
    const { data: expiredCount, error: resetError } = await supabase
      .rpc('reset_expired_subscriptions')

    if (resetError) {
      console.error('Error resetting expired subscriptions:', resetError)
      throw resetError
    }

    console.log(`Successfully processed ${expiredCount} expired subscriptions`)

    // Get current subscription status for monitoring
    const { data: statusData, error: statusError } = await supabase
      .rpc('check_subscription_expiration')

    if (statusError) {
      console.error('Error checking subscription status:', statusError)
      throw statusError
    }

    // Log current status
    console.log('Current subscription status:')
    console.log(`Total active subscriptions: ${statusData?.length || 0}`)
    
    if (statusData && statusData.length > 0) {
      const expiringSoon = statusData.filter((sub: any) => 
        sub.days_remaining !== null && sub.days_remaining <= 7 && sub.days_remaining > 0
      )
      const expired = statusData.filter((sub: any) => sub.is_expired)
      
      console.log(`Expiring within 7 days: ${expiringSoon.length}`)
      console.log(`Currently expired: ${expired.length}`)
      
      // Log details of expiring subscriptions
      if (expiringSoon.length > 0) {
        console.log('Subscriptions expiring soon:')
        expiringSoon.forEach((sub: any) => {
          console.log(`- ${sub.username} (${sub.email}): ${sub.days_remaining} days remaining`)
        })
      }
    }

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Subscription expiration check completed successfully',
      expired_count: expiredCount,
      total_active_subscriptions: statusData?.length || 0,
      expiring_soon: statusData?.filter((sub: any) => 
        sub.days_remaining !== null && sub.days_remaining <= 7 && sub.days_remaining > 0
      ).length || 0,
      processed_at: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in subscription expiration checker:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        processed_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

/* 
To set up automatic daily execution:

1. Deploy this function to Supabase
2. Set up a cron job or use a service like GitHub Actions to call this function daily
3. Or use Supabase's built-in cron functionality (if available)

Example cron setup:
- Call this function every day at 00:00 UTC
- URL: https://your-project.supabase.co/functions/v1/subscription-expiration-checker
- Method: POST
- Headers: Authorization: Bearer YOUR_ANON_KEY

GitHub Actions example (.github/workflows/subscription-check.yml):

name: Daily Subscription Check
on:
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  check-subscriptions:
    runs-on: ubuntu-latest
    steps:
      - name: Call Subscription Checker
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            https://your-project.supabase.co/functions/v1/subscription-expiration-checker
*/