import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System reporter UUID for automated reports
const SYSTEM_REPORTER_ID = '00000000-0000-0000-0000-000000000000';

interface ModeratePayload {
  target_id: string;
  target_type: 'post' | 'comment';
  content: string;
  author_id: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const { target_id, target_type, content, author_id }: ModeratePayload = await req.json();

    // 1. Banned word check (D-20)
    const { data: hasBanned } = await supabaseAdmin.rpc('contains_banned_word', { p_content: content });
    if (hasBanned) {
      // Soft-delete the content
      const table = target_type === 'post' ? 'posts' : 'comments';
      await supabaseAdmin.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', target_id);
      // Create auto-report
      await supabaseAdmin.from('reports').insert({
        reporter_id: SYSTEM_REPORTER_ID,
        target_type,
        target_id,
        reason: 'hate',
        status: 'actioned',
        action_taken: 'auto_deleted_banned_word',
      });
      return new Response(JSON.stringify({ action: 'blocked', reason: 'banned_word' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Spam rate limit check (D-22) — only for posts
    if (target_type === 'post') {
      const { data: withinLimit } = await supabaseAdmin.rpc('check_post_rate_limit', { p_user_id: author_id });
      if (!withinLimit) {
        // Create 1-hour temp block sanction
        await supabaseAdmin.from('user_sanctions').insert({
          user_id: author_id,
          type: 'warning',
          reason: 'Spam rate limit exceeded (5+ posts/min)',
          issued_by: SYSTEM_REPORTER_ID,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });
        // Soft-delete the excess post
        await supabaseAdmin.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', target_id);
        return new Response(JSON.stringify({ action: 'rate_limited' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. OpenAI Moderation API (D-21)
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (openaiKey) {
      const modResponse = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'omni-moderation-latest', input: content }),
      });

      if (modResponse.ok) {
        const modData = await modResponse.json();
        const result = modData.results?.[0];
        if (result?.flagged) {
          // Map OpenAI categories to report reason
          const reason = mapCategoriesToReason(result.categories);
          // Auto-create report for admin review (don't auto-delete — let admin decide)
          await supabaseAdmin.from('reports').upsert({
            reporter_id: SYSTEM_REPORTER_ID,
            target_type,
            target_id,
            reason,
            status: 'pending',
          }, { onConflict: 'reporter_id,target_type,target_id' });

          return new Response(JSON.stringify({ action: 'flagged', reason }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(JSON.stringify({ action: 'allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function mapCategoriesToReason(categories: Record<string, boolean>): 'hate' | 'violence' | 'spam' {
  if (categories.hate || categories['hate/threatening']) return 'hate';
  if (categories.violence || categories['violence/graphic']) return 'violence';
  if (categories.sexual || categories['sexual/minors']) return 'hate'; // map sexual to hate for report
  return 'spam'; // default fallback
}
