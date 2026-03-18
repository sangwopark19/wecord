import { create } from 'zustand';
import { type Session, type User } from '@supabase/supabase-js';
import { getLocales } from 'expo-localization';
import { supabase } from '../lib/supabase';

type SupportedLanguage = 'ko' | 'en' | 'th' | 'zh' | 'ja';

export interface Profile {
  userId: string;
  globalNickname: string;
  avatarUrl: string | null;
  language: SupportedLanguage;
  onboardingCompleted: boolean;
  dateOfBirth: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['ko', 'en', 'th', 'zh', 'ja'];

function getDeviceLanguage(): SupportedLanguage {
  const locales = getLocales();
  const code = locales[0]?.languageCode ?? 'en';
  return SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)
    ? (code as SupportedLanguage)
    : 'en';
}

async function fetchOrCreateProfile(userId: string): Promise<Profile | null> {
  // Try fetching existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('user_id, global_nickname, avatar_url, language, onboarding_completed, date_of_birth')
    .eq('user_id', userId)
    .single();

  if (existingProfile && !fetchError) {
    return {
      userId: existingProfile.user_id,
      globalNickname: existingProfile.global_nickname,
      avatarUrl: existingProfile.avatar_url,
      language: existingProfile.language as SupportedLanguage,
      onboardingCompleted: existingProfile.onboarding_completed,
      dateOfBirth: existingProfile.date_of_birth,
    };
  }

  // New user: generate nickname and upsert profile
  const { data: nicknameData, error: nicknameError } = await supabase.functions.invoke(
    'generate-nickname'
  );

  if (nicknameError || !nicknameData?.nickname) {
    console.error('Failed to generate nickname:', nicknameError);
    return null;
  }

  const language = getDeviceLanguage();

  const { data: newProfile, error: upsertError } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      global_nickname: nicknameData.nickname,
      language,
      onboarding_completed: false,
    })
    .select('user_id, global_nickname, avatar_url, language, onboarding_completed, date_of_birth')
    .single();

  if (upsertError || !newProfile) {
    console.error('Failed to upsert profile:', upsertError);
    return null;
  }

  return {
    userId: newProfile.user_id,
    globalNickname: newProfile.global_nickname,
    avatarUrl: newProfile.avatar_url,
    language: newProfile.language as SupportedLanguage,
    onboardingCompleted: newProfile.onboarding_completed,
    dateOfBirth: newProfile.date_of_birth,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  setProfile: (profile) => {
    set({ profile });
  },

  initialize: async () => {
    set({ loading: true });

    // Restore session from SecureStore
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });

    if (session?.user) {
      const profile = await fetchOrCreateProfile(session.user.id);
      set({ profile, loading: false });
    } else {
      set({ loading: false });
    }

    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null });

      if (event === 'SIGNED_IN' && session?.user) {
        set({ loading: true });
        const profile = await fetchOrCreateProfile(session.user.id);
        set({ profile, loading: false });
      } else if (event === 'SIGNED_OUT') {
        set({ profile: null, loading: false });
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
