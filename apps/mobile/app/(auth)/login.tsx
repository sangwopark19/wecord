import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Linking,
  StyleSheet,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: 'wecord', path: 'auth/callback' });

async function handleOAuthCallbackUrl(urlString: string): Promise<boolean> {
  try {
    const url = new URL(urlString);
    const code = url.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[OAuth] exchangeCodeForSession failed:', error.message);
        return false;
      }
      return true;
    }
    const hashParams = new URLSearchParams(url.hash.replace('#', ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        console.error('[OAuth] setSession failed:', error.message);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error('[OAuth] handleOAuthCallbackUrl error:', err);
  }
  return false;
}

export default function LoginScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }

  async function signInWithGoogle() {
    setLoadingGoogle(true);
    try {
      if (Platform.OS === 'web') {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        return;
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data.url) {
        const subscription = { current: null as { remove: () => void } | null };

        const androidCallbackPromise = new Promise<string | null>((resolve) => {
          if (Platform.OS !== 'android') {
            resolve(null);
            return;
          }
          subscription.current = Linking.addEventListener('url', ({ url }) => {
            if (url.startsWith(redirectTo)) {
              resolve(url);
            }
          });
          setTimeout(() => resolve(null), 5 * 60 * 1000);
        });

        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
          { preferEphemeralSession: true },
        );

        console.log('[OAuth] Browser result:', result.type);

        if (result.type === 'success') {
          subscription.current?.remove();
          const handled = await handleOAuthCallbackUrl(result.url);
          if (!handled) {
            console.error('[OAuth] No code or tokens in callback URL:', result.url);
          }
          return;
        }

        if (Platform.OS === 'android') {
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
          const callbackUrl = await Promise.race([androidCallbackPromise, timeoutPromise]);
          subscription.current?.remove();

          if (callbackUrl) {
            console.log('[OAuth] Android: got callback URL via Linking');
            const handled = await handleOAuthCallbackUrl(callbackUrl);
            if (!handled) {
              console.error('[OAuth] Android: No code or tokens in Linking URL:', callbackUrl);
            }
            return;
          }

          const initialUrl = await Linking.getInitialURL();
          if (initialUrl && initialUrl.startsWith(redirectTo)) {
            console.log('[OAuth] Android: got callback URL via getInitialURL');
            const handled = await handleOAuthCallbackUrl(initialUrl);
            if (!handled) {
              console.error('[OAuth] Android: No code or tokens in initialUrl:', initialUrl);
            }
            return;
          }

          console.log('[OAuth] Android: no callback URL received, user may have cancelled');
        }
      }
    } catch (err) {
      showError(t('error.auth_failed'));
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function signInWithApple() {
    setLoadingApple(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
      }
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        showError(t('error.auth_failed'));
      }
    } finally {
      setLoadingApple(false);
    }
  }

  async function signInWithAppleWeb() {
    setLoadingApple(true);
    try {
      if (Platform.OS === 'web') {
        await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: window.location.origin },
        });
        return;
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data.url) {
        const subscription = { current: null as { remove: () => void } | null };

        const androidCallbackPromise = new Promise<string | null>((resolve) => {
          if (Platform.OS !== 'android') {
            resolve(null);
            return;
          }
          subscription.current = Linking.addEventListener('url', ({ url }) => {
            if (url.startsWith(redirectTo)) {
              resolve(url);
            }
          });
          setTimeout(() => resolve(null), 5 * 60 * 1000);
        });

        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
          { preferEphemeralSession: true },
        );

        console.log('[OAuth Apple] Browser result:', result.type);

        if (result.type === 'success') {
          subscription.current?.remove();
          const handled = await handleOAuthCallbackUrl(result.url);
          if (!handled) {
            console.error('[OAuth Apple] No code or tokens in callback URL:', result.url);
          }
          return;
        }

        if (Platform.OS === 'android') {
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
          const callbackUrl = await Promise.race([androidCallbackPromise, timeoutPromise]);
          subscription.current?.remove();

          if (callbackUrl) {
            const handled = await handleOAuthCallbackUrl(callbackUrl);
            if (!handled) {
              console.error('[OAuth Apple] Android: No code or tokens in Linking URL:', callbackUrl);
            }
            return;
          }

          const initialUrl = await Linking.getInitialURL();
          if (initialUrl && initialUrl.startsWith(redirectTo)) {
            const handled = await handleOAuthCallbackUrl(initialUrl);
            if (!handled) {
              console.error('[OAuth Apple] Android: No code or tokens in initialUrl:', initialUrl);
            }
            return;
          }
        }
      }
    } catch (err) {
      showError(t('error.auth_failed'));
    } finally {
      setLoadingApple(false);
    }
  }

  const isLoading = loadingGoogle || loadingApple;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top purple radial glow */}
      <LinearGradient
        colors={['rgba(124,58,237,0.45)', 'rgba(139,92,246,0.18)', 'rgba(11,11,15,0)']}
        locations={[0, 0.38, 0.82]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View className="flex-1 px-6">
        {/* Hero block — wordmark + tagline */}
        <View className="mt-12">
          <Text className="text-mono font-semibold text-muted-foreground uppercase">
            {t('login.fandom_label')}
          </Text>

          <View className="mt-5 flex-row items-end">
            <Text
              className="text-foreground font-black"
              style={styles.wordmark}
            >
              wecord
            </Text>
            <Text
              className="font-black"
              style={styles.wordmarkDot}
            >
              .
            </Text>
          </View>

          <Text className="mt-5 text-body text-muted-foreground leading-[22px]">
            {t('login.tagline')}
          </Text>
        </View>

        {/* LIVE activity teaser card */}
        <View className="mt-6 flex-row items-center bg-surface/60 border border-border rounded-[14px] px-3 py-3">
          <View className="flex-row items-center bg-live rounded-[6px] px-2 py-[3px]">
            <View className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
            <Text className="text-white text-[10px] font-bold tracking-[1.2px]">LIVE</Text>
          </View>
          <Text className="ml-3 text-body text-muted-foreground flex-1">
            {t('login.live_teaser')}
          </Text>
        </View>

        {/* Flexible spacer pushes CTA stack toward bottom */}
        <View className="flex-1" />

        {/* OAuth buttons — Apple FIRST (T-7-07 / Apple Guideline 4.8).
            Apple is the white primary CTA; Google is outlined secondary. */}
        <View className="w-full gap-y-3 mb-2">
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              testID="apple-signin-button"
              accessibilityLabel={t('login.apple_cta')}
              onPress={signInWithApple}
              disabled={isLoading}
              className="w-full flex-row items-center justify-center bg-foreground rounded-[28px] h-[54px] px-4"
              activeOpacity={0.85}
            >
              {loadingApple ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <>
                  <Text className="text-black font-semibold text-[16px] mr-2"></Text>
                  <Text className="text-black font-semibold text-[16px]">
                    {t('login.apple_cta')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              testID="apple-signin-button"
              accessibilityLabel={t('login.apple_cta')}
              onPress={signInWithAppleWeb}
              disabled={isLoading}
              className="w-full flex-row items-center justify-center bg-foreground rounded-[28px] h-[54px] px-4"
              activeOpacity={0.85}
            >
              {loadingApple ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <>
                  <Text className="text-black font-semibold text-[16px] mr-2"></Text>
                  <Text className="text-black font-semibold text-[16px]">
                    {t('login.apple_cta')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            testID="google-signin-button"
            accessibilityLabel={t('login.google_cta')}
            onPress={signInWithGoogle}
            disabled={isLoading}
            className="w-full flex-row items-center justify-center bg-surface/60 border border-border rounded-[28px] h-[54px] px-4"
            activeOpacity={0.85}
          >
            {loadingGoogle ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text className="text-foreground font-semibold text-[16px] mr-2">G</Text>
                <Text className="text-foreground font-semibold text-[16px]">
                  {t('login.google_cta')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="email-signin-button"
            accessibilityLabel={t('login.email_cta')}
            onPress={() => router.push('/(auth)/email-login')}
            disabled={isLoading}
            className="w-full flex-row items-center justify-center bg-surface/60 border border-border rounded-[28px] h-[54px] px-4"
            activeOpacity={0.85}
          >
            <Text className="text-foreground font-semibold text-[16px]">
              {t('login.email_cta')}
            </Text>
          </TouchableOpacity>
        </View>

        {error && (
          <Text className="text-destructive text-[12px] text-center mt-2">{error}</Text>
        )}

        <Text className="text-label font-regular text-dim text-center mt-4 mb-4 px-2">
          {t('login.legal_note')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontSize: 68,
    lineHeight: 68,
    letterSpacing: -2.5,
  },
  wordmarkDot: {
    fontSize: 68,
    lineHeight: 68,
    letterSpacing: -2.5,
    color: '#8B5CF6',
    marginLeft: -2,
  },
});
