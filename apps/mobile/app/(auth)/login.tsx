import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from '@wecord/shared/i18n';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: 'wecord', path: 'auth/callback' });

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
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success') {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
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
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success') {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
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

        {/* OAuth Buttons */}
        <View className="w-full gap-y-3 mb-4">
          {/* Google OAuth button */}
          <TouchableOpacity
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
                <Text className="text-[#00E5C3] font-semibold text-[16px]">
                  {t('login.google_cta')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple OAuth button */}
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
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
