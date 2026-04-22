import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from '@wecord/shared/i18n';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: 'wecord', path: 'auth/callback' });

/**
 * Extract and exchange OAuth code/tokens from a callback URL string.
 * Returns true if auth was completed, false otherwise.
 */
async function handleOAuthCallbackUrl(urlString: string): Promise<boolean> {
  try {
    const url = new URL(urlString);
    // PKCE flow: code in query params
    const code = url.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[OAuth] exchangeCodeForSession failed:', error.message);
        return false;
      }
      return true;
    }
    // Implicit flow fallback: tokens in URL fragment
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
        // On Android the WebBrowser polyfill races AppState vs Linking.
        // AppState becomes active before the Linking URL event fires, so
        // result.type is often 'dismiss' even when OAuth succeeded.
        // We listen to Linking directly to catch the callback URL regardless.
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
          // Timeout after 5 minutes — user may cancel
          setTimeout(() => resolve(null), 5 * 60 * 1000);
        });

        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
          { preferEphemeralSession: true },
        );

        console.log('[OAuth] Browser result:', result.type);

        if (result.type === 'success') {
          // iOS path (native ASWebAuthenticationSession returns URL directly)
          subscription.current?.remove();
          const handled = await handleOAuthCallbackUrl(result.url);
          if (!handled) {
            console.error('[OAuth] No code or tokens in callback URL:', result.url);
          }
          return;
        }

        if (Platform.OS === 'android') {
          // Android path: AppState won the race. Check if Linking has the URL.
          // Give it a short window to arrive before giving up.
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

          // Also check if the URL was delivered as the initial URL
          // (app cold-started by the deep link intent)
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
      // Skip error if user cancelled
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
      <View className="flex-1 items-center px-4">
        {/* Wordmark — 48px from top (2xl spacing) */}
        <View className="mt-12">
          <Text className="text-display font-semibold text-foreground">Wecord</Text>
        </View>

        {/* Spacer — push buttons toward center */}
        <View className="flex-1" />

        {/* OAuth Buttons — Apple FIRST (T-7-07 / Apple Guideline 4.8) */}
        <View className="w-full gap-y-3 mb-4">
          {/* Apple OAuth button — must render at or above Google */}
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              testID="apple-signin-button"
              accessibilityLabel={t('login.apple_cta')}
              onPress={signInWithApple}
              disabled={isLoading}
              className="w-full flex-row items-center justify-center bg-black border border-white rounded-[28px] h-[52px] px-4"
              activeOpacity={0.8}
            >
              {loadingApple ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text className="text-white font-semibold text-[16px] mr-2"></Text>
                  <Text className="text-white font-semibold text-[16px]">
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
              className="w-full flex-row items-center justify-center bg-black border border-white rounded-[28px] h-[52px] px-4"
              activeOpacity={0.8}
            >
              {loadingApple ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text className="text-white font-semibold text-[16px] mr-2"></Text>
                  <Text className="text-white font-semibold text-[16px]">
                    {t('login.apple_cta')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Google OAuth button */}
          <TouchableOpacity
            testID="google-signin-button"
            accessibilityLabel={t('login.google_cta')}
            onPress={signInWithGoogle}
            disabled={isLoading}
            className="w-full flex-row items-center justify-center bg-white border border-[#1A1A1A] rounded-[28px] h-[52px] px-4"
            activeOpacity={0.8}
          >
            {loadingGoogle ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <>
                <Text className="text-black font-semibold text-[16px] mr-2">G</Text>
                <Text className="text-[#8B5CF6] font-semibold text-[16px]">
                  {t('login.google_cta')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Error message */}
        {error && (
          <Text className="text-destructive text-[12px] text-center mb-2">{error}</Text>
        )}

        {/* Legal note */}
        <Text className="text-label font-regular text-muted-foreground text-center mt-4 mb-8 px-4">
          {t('login.legal_note')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
