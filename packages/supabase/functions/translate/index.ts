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
    const { target_id, target_type, target_lang } = await req.json();
    // target_type: 'post' | 'comment'
    // target_lang: 'ko' | 'en' | 'ja' | 'th' | 'zh'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Step 1: Check cache (DB-first for instant repeated translations)
    const { data: cached } = await supabase
      .from('post_translations')
      .select('translated_text, source_lang')
      .eq('target_id', target_id)
      .eq('target_type', target_type)
      .eq('target_lang', target_lang)
      .single();

    if (cached) {
      return new Response(
        JSON.stringify({ translated_text: cached.translated_text, source_lang: cached.source_lang, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Fetch original content from posts or comments table
    const table = target_type === 'post' ? 'posts' : 'comments';
    const { data: original, error: fetchError } = await supabase
      .from(table)
      .select('content')
      .eq('id', target_id)
      .single();

    if (fetchError || !original) {
      return new Response(
        JSON.stringify({ error: 'Content not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Call Google Translate API
    const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Translation API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const translateResponse = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: original.content,
          target: target_lang === 'zh' ? 'zh-CN' : target_lang,
          format: 'text',
        }),
      }
    );

    if (!translateResponse.ok) {
      const errText = await translateResponse.text();
      return new Response(
        JSON.stringify({ error: 'Translation API error', detail: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await translateResponse.json();
    const translated_text = result.data.translations[0].translatedText;
    const source_lang = result.data.translations[0].detectedSourceLanguage?.toLowerCase() ?? 'unknown';

    // Step 4: Save to cache (upsert to handle race conditions)
    await supabase.from('post_translations').upsert(
      { target_id, target_type, target_lang, source_lang, translated_text },
      { onConflict: 'target_id,target_type,target_lang' }
    );

    return new Response(
      JSON.stringify({ translated_text, source_lang, cached: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
