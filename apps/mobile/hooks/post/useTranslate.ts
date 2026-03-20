import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface TranslateResult {
  translated_text: string;
  source_lang: string;
  cached: boolean;
}

export function useTranslate(targetId: string, targetType: 'post' | 'comment') {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);

  // Get user's preferred language from profile
  // Profile.language stores the user's preferred display language
  const profile = useAuthStore((s) => s.profile);
  const targetLang = profile?.language ?? 'en';

  const translate = useCallback(async () => {
    // Toggle off: just hide translation, keep in memory for instant re-show
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    // If we already have translated text in memory, show it without re-fetching
    if (translatedText) {
      setIsTranslated(true);
      return;
    }

    // Fetch translation from Edge Function (which checks DB cache first)
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('translate', {
        body: { target_id: targetId, target_type: targetType, target_lang: targetLang },
      });
      if (invokeError) throw invokeError;
      const result = data as TranslateResult;
      setTranslatedText(result.translated_text);
      setIsTranslated(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, [targetId, targetType, targetLang, isTranslated, translatedText]);

  return { translatedText, isTranslated, isLoading, error, translate };
}
