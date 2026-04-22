import { create } from 'zustand';
import { type Session, type User } from '@supabase/supabase-js';
import { getLocales } from 'expo-localization';
import { supabase } from '../lib/supabase';

type SupportedLanguage = 'ko' | 'en' | 'th' | 'zh' | 'ja';

export interface Profile {
  userId: string;
  globalNickname: string;
  avatarUrl: string | null;
  bio: string | null;
  language: SupportedLanguage;
  onboardingCompleted: boolean;
  dateOfBirth: string | null;
  dmLaunchNotify: boolean;
}

interface OnboardingData {
  dateOfBirth: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  onboardingData: OnboardingData | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setOnboardingData: (data: OnboardingData) => void;
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
  console.log('[Profile] Fetching profile for:', userId);

  // Try fetching existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('user_id, global_nickname, avatar_url, bio, language, onboarding_completed, date_of_birth, dm_launch_notify')
    .eq('user_id', userId)
    .single();

  console.log('[Profile] Fetch result:', { found: !!existingProfile, error: fetchError?.message });

  if (existingProfile && !fetchError) {
    return {
      userId: existingProfile.user_id,
      globalNickname: existingProfile.global_nickname,
      avatarUrl: existingProfile.avatar_url,
      bio: existingProfile.bio ?? null,
      language: existingProfile.language as SupportedLanguage,
      onboardingCompleted: existingProfile.onboarding_completed,
      dateOfBirth: existingProfile.date_of_birth,
      dmLaunchNotify: existingProfile.dm_launch_notify ?? false,
    };
  }

  // New user: generate nickname locally (skip Edge Function for reliability)
  console.log('[Profile] Creating new profile...');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const nickname = `User#${randomNum}`;
  const language = getDeviceLanguage();

  const { data: newProfile, error: upsertError } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      global_nickname: nickname,
      language,
      onboarding_completed: false,
    })
    .select('user_id, global_nickname, avatar_url, bio, language, onboarding_completed, date_of_birth, dm_launch_notify')
    .single();

  if (upsertError || !newProfile) {
    console.error('[Profile] Failed to upsert:', upsertError);
    return null;
  }

  console.log('[Profile] Created:', newProfile.global_nickname);
  return {
    userId: newProfile.user_id,
    globalNickname: newProfile.global_nickname,
    avatarUrl: newProfile.avatar_url,
    bio: newProfile.bio ?? null,
    language: newProfile.language as SupportedLanguage,
    onboardingCompleted: newProfile.onboarding_completed,
    dateOfBirth: newProfile.date_of_birth,
    dmLaunchNotify: newProfile.dm_launch_notify ?? false,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  onboardingData: null,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  setProfile: (profile) => {
    set({ profile });
  },

  setOnboardingData: (data) => {
    set({ onboardingData: data });
  },

  initialize: async () => {
    set({ loading: true });

    try {
      // Restore session from storage
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Auth] Session restored:', !!session);
      set({ session, user: session?.user ?? null });

      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user.id);
        set({ profile, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('[Auth] initialize failed:', err);
      set({ loading: false });
    }

    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null });

      if (event === 'SIGNED_IN' && session?.user) {
        set({ loading: true });
        try {
          const profile = await fetchOrCreateProfile(session.user.id);
          set({ profile, loading: false });
        } catch (err) {
          console.error('[Auth] fetchOrCreateProfile failed:', err);
          set({ loading: false });
        }
      } else if (event === 'SIGNED_OUT') {
        set({ profile: null, loading: false });
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, onboardingData: null });
  },
}));
