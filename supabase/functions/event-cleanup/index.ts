// Event Cleanup Edge Function
// Runs daily to delete events 4+ days old after archiving data
// Deno Deploy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting event cleanup process...')

    // Call the delete_old_events function
    const { data, error } = await supabaseClient.rpc('delete_old_events')

    if (error) {
      console.error('Error during event cleanup:', error)
      throw error
    }

    console.log('Event cleanup completed successfully')

    // Get count of remaining events
    const { count: remainingEvents } = await supabaseClient
      .from('events')
      .select('*', { count: 'exact', head: true })

    // Get count of archived events
    const { count: archivedEvents } = await supabaseClient
      .from('archived_events')
      .select('*', { count: 'exact', head: true })

    const response = {
      success: true,
      message: 'Event cleanup completed successfully',
      timestamp: new Date().toISOString(),
      stats: {
        remainingEvents: remainingEvents || 0,
        archivedEvents: archivedEvents || 0
      }
    }

    console.log('Cleanup stats:', response.stats)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Fatal error in event cleanup:', error)
    
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
