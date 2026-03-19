import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// SSR-safe storage adapter: defers AsyncStorage import to avoid
// "window is not defined" during server-side rendering
const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web' && typeof window === 'undefined') return null;
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.removeItem(key);
  },
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage,
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
