import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate a unique User#XXXX nickname
    let nickname: string | null = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generate random 4-digit number between 1000 and 9999
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const candidate = `User#${randomNum}`;

      // Check uniqueness
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('global_nickname', candidate)
        .single();

      if (error && error.code === 'PGRST116') {
        // PGRST116 = no rows found — nickname is unique
        nickname = candidate;
        break;
      }

      if (data) {
        // Nickname taken, try again
        attempts++;
        continue;
      }

      // Unexpected error
      if (error) {
        throw error;
      }

      attempts++;
    }

    if (!nickname) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique nickname after max attempts' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ nickname }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
