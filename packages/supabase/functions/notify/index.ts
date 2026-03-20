import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EventType = 'creator_post' | 'comment' | 'like' | 'notice' | 'member_post' | 'system';

interface NotifyPayload {
  event_type: EventType;
  community_id: string;
  data: {
    title: string;
    body: string;
    actor_id?: string;
    deep_link: Record<string, string>;
    member_user_id?: string; // for member_post events
  };
}

// Map event_type to notification_preferences column name
const prefMap: Record<EventType, string> = {
  creator_post: 'creator_posts',
  comment: 'comments',
  like: 'likes',
  notice: 'notices',
  member_post: 'creator_posts',
  system: 'creator_posts', // system notifications use creator_posts pref as fallback
};

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

    const payload: NotifyPayload = await req.json();
    const { event_type, community_id, data } = payload;

    // Get community members
    const { data: members } = await supabaseAdmin
      .from('community_members')
      .select('user_id')
      .eq('community_id', community_id);

    // Get preferences that explicitly disabled this type
    const prefColumn = prefMap[event_type];
    const { data: disabledPrefs } = await supabaseAdmin
      .from('notification_preferences')
      .select('user_id')
      .eq('community_id', community_id)
      .eq(prefColumn, false);

    const disabledUserIds = new Set((disabledPrefs ?? []).map((p: { user_id: string }) => p.user_id));
    const actorId = data.actor_id;

    let targetUserIds = (members ?? [])
      .map((m: { user_id: string }) => m.user_id)
      .filter((uid: string) => uid !== actorId && !disabledUserIds.has(uid));

    // For member_post: additionally filter to only users who follow the specific member
    if (event_type === 'member_post' && data.member_user_id) {
      const { data: followers } = await supabaseAdmin
        .from('community_follows')
        .select('follower_id')
        .eq('following_id', data.member_user_id)
        .eq('community_id', community_id);

      const followerSet = new Set((followers ?? []).map((f: { follower_id: string }) => f.follower_id));
      targetUserIds = targetUserIds.filter((uid: string) => followerSet.has(uid));
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ notified: 0, pushed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bulk insert in-app notifications
    await supabaseAdmin.from('notifications').insert(
      targetUserIds.map((userId: string) => ({
        user_id: userId,
        community_id: community_id,
        type: event_type,
        title: data.title,
        body: data.body,
        data: { ...data.deep_link },
      }))
    );

    // Get push tokens for targets
    const { data: tokens } = await supabaseAdmin
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', targetUserIds);

    const pushTokens = (tokens ?? []).map((t: { user_id: string; token: string }) => t.token).filter(Boolean);

    // Send Expo Push notifications (only for users with tokens)
    if (pushTokens.length > 0) {
      const messages = pushTokens.map((to: string) => ({
        to,
        title: data.title,
        body: data.body,
        data: data.deep_link,
        sound: 'default' as const,
      }));

      // Batch in groups of 100 (Expo Push API limit)
      for (let i = 0; i < messages.length; i += 100) {
        const batch = messages.slice(i, i + 100);
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });
      }
    }

    return new Response(
      JSON.stringify({ notified: targetUserIds.length, pushed: pushTokens.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
