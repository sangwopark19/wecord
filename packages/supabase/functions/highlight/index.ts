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
    // Parse community_id from POST body
    const body = await req.json();
    const communityId = body?.community_id;

    if (!communityId) {
      return new Response(JSON.stringify({ error: 'community_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user-context Supabase client using Authorization header so RLS is enforced
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    // Run 4 parallel queries
    const [noticesResult, creatorPostsResult, fanPostsResult, artistMembersResult] =
      await Promise.all([
        supabase
          .from('notices')
          .select('id, title, is_pinned, published_at')
          .eq('community_id', communityId)
          .not('published_at', 'is', null)
          .order('is_pinned', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(4),

        supabase
          .from('posts_with_nickname')
          .select('id, content, media_urls, author_nickname, author_role, created_at')
          .eq('community_id', communityId)
          .eq('author_role', 'creator')
          .order('created_at', { ascending: false })
          .limit(4),

        supabase
          .from('posts_with_nickname')
          .select('id, content, media_urls, author_nickname, author_role, created_at')
          .eq('community_id', communityId)
          .eq('author_role', 'fan')
          .order('created_at', { ascending: false })
          .limit(4),

        supabase
          .from('artist_members')
          .select('id, display_name, profile_image_url')
          .eq('community_id', communityId)
          .order('sort_order', { ascending: true })
          .limit(8),
      ]);

    if (noticesResult.error) throw noticesResult.error;
    if (creatorPostsResult.error) throw creatorPostsResult.error;
    if (fanPostsResult.error) throw fanPostsResult.error;
    if (artistMembersResult.error) throw artistMembersResult.error;

    return new Response(
      JSON.stringify({
        notices: noticesResult.data ?? [],
        creatorPosts: creatorPostsResult.data ?? [],
        fanPosts: fanPostsResult.data ?? [],
        artistMembers: artistMembersResult.data ?? [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
