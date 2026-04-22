import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import { supabase } from '../../lib/supabase';

export default function EmailLoginScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }

  async function onSubmit() {
    // Simple regex — Supabase server-side validation is the source of truth
    if (!/.+@.+\..+/.test(email.trim())) {
      showError(t('error.invalid_email'));
      return;
    }
    if (password.length < 8) {
      showError(t('error.weak_password'));
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        // Supabase returns 'Invalid login credentials' for both wrong email
        // and wrong password (by design — avoids user enumeration).
        showError(t('error.invalid_credentials'));
        return;
      }
      // Success: onAuthStateChange fires -> AuthGuard routes to onboarding or tabs.
      // No manual navigation needed.
    } catch (err) {
      showError(t('error.auth_failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: '',
          headerTransparent: true,
          headerTintColor: '#FFFFFF',
        }}
      />

      {/* Top purple radial glow — matches login.tsx aesthetic */}
      <LinearGradient
        colors={['rgba(124,58,237,0.45)', 'rgba(139,92,246,0.18)', 'rgba(11,11,15,0)']}
        locations={[0, 0.38, 0.82]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
      >
        <View className="flex-1 px-6">
          <Text className="text-display font-bold text-foreground mt-12">
            {t('email_login.title')}
          </Text>

          <TextInput
            testID="email-input"
            value={email}
            onChangeText={setEmail}
            placeholder={t('email_login.email_placeholder')}
            placeholderTextColor="#8A8A93"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!loading}
            className="w-full bg-surface/60 border border-border rounded-[14px] h-[52px] px-4 text-foreground text-[16px] mt-6"
          />

          <TextInput
            testID="password-input"
            value={password}
            onChangeText={setPassword}
            placeholder={t('email_login.password_placeholder')}
            placeholderTextColor="#8A8A93"
            autoCapitalize="none"
            autoComplete="password"
            secureTextEntry
            editable={!loading}
            className="w-full bg-surface/60 border border-border rounded-[14px] h-[52px] px-4 text-foreground text-[16px] mt-3"
          />

          {error && (
            <Text className="text-destructive text-[12px] mt-2">{error}</Text>
          )}

          <TouchableOpacity
            testID="email-login-submit"
            onPress={onSubmit}
            disabled={loading}
            className="w-full bg-foreground rounded-[28px] h-[54px] items-center justify-center mt-6"
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text className="text-black font-semibold text-[16px]">
                {t('email_login.submit')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="forgot-password-link"
            onPress={() => router.push('/(auth)/forgot-password')}
            disabled={loading}
            className="mt-4 items-center"
            activeOpacity={0.7}
          >
            <Text className="text-muted-foreground text-[14px]">
              {t('email_login.forgot_password')}
            </Text>
          </TouchableOpacity>

          <View className="flex-1" />

          <View className="flex-row items-center justify-center mb-6">
            <Text className="text-muted-foreground text-[14px]">
              {t('email_login.signup_prompt')}{' '}
            </Text>
            <TouchableOpacity
              testID="email-signup-link"
              onPress={() => router.replace('/(auth)/email-signup')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-foreground font-semibold text-[14px]">
                {t('email_login.signup_cta')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});
