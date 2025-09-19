import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Customer token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get job by customer token
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('customer_token', token)
      .single()

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Invalid customer token or job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get job parts
    const { data: parts = [] } = await supabase
      .from('job_parts')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })

    // Get job notes
    const { data: notes = [] } = await supabase
      .from('job_notes')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })

    return new Response(
      JSON.stringify({ job, parts, notes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})