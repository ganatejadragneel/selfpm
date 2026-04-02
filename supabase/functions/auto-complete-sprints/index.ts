// Supabase Edge Function: auto-complete-sprints
// Purpose: Called by cron job to complete expired sprints and create new ones
// Schedule: Monday 12:00am EST
//
// Deployment:
// 1. supabase functions deploy auto-complete-sprints
// 2. Set up cron in Supabase Dashboard > Edge Functions > auto-complete-sprints > Schedule
//    Cron expression: 0 5 * * 1 (5am UTC = 12am EST on Mondays)
//
// Manual trigger for testing:
// curl -X POST 'https://<project-ref>.supabase.co/functions/v1/auto-complete-sprints' \
//   -H 'Authorization: Bearer <service-role-key>'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Call the auto-complete RPC function
    const { data, error } = await supabase.rpc('auto_complete_expired_sprints');

    if (error) {
      console.error('Error calling auto_complete_expired_sprints:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const completedCount = data ?? 0;

    console.log(`Auto-complete sprints: ${completedCount} sprint(s) processed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${completedCount} expired sprint(s)`,
        completed_count: completedCount,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
