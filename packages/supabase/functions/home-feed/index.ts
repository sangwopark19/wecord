import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Cursor {
  createdAt: string;
  id: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse POST body: { cursor?, limit? }
    const body = await req.json();
    const cursor: Cursor | undefined = body?.cursor;
    const limit: number = body?.limit ?? 15;

    // Create user-context Supabase client using Authorization header so RLS is enforced
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Get caller's community_ids
    const { data: memberships, error: membershipsError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id);

    if (membershipsError) throw membershipsError;

    const communityIds = (memberships ?? []).map((m: { community_id: string }) => m.community_id);

    // If no communities, return empty
    if (communityIds.length === 0) {
      return new Response(
        JSON.stringify({ posts: [], nextCursor: null, isEmpty: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Single merged query across all communities
    let query = supabase
      .from('posts_with_nickname')
      .select('*')
      .in('community_id', communityIds)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    // Apply compound cursor for pagination
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
      );
    }

    const { data: posts, error: postsError } = await query;
    if (postsError) throw postsError;

    const postList = posts ?? [];
    const lastPost = postList[postList.length - 1];

    return new Response(
      JSON.stringify({
        posts: postList,
        nextCursor: lastPost ? { createdAt: lastPost.created_at, id: lastPost.id } : null,
        isEmpty: false,
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
