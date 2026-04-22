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

export default function EmailSignupScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmailSent, setCheckEmailSent] = useState(false);

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }

  async function onSubmit() {
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) {
        // Supabase error messages we branch on:
        //   - 'User already registered' / 'already been registered' -> email_in_use
        //   - 'Password should be at least' -> weak_password (defensive — regex should catch)
        //   - default -> auth_failed
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already') || msg.includes('registered')) {
          showError(t('error.email_in_use'));
        } else if (msg.includes('password')) {
          showError(t('error.weak_password'));
        } else {
          showError(t('error.auth_failed'));
        }
        return;
      }
      if (!data.session) {
        // Email confirmation is ON — user must click the link in email.
        // Show 'check your email' state; AuthGuard will pick up the session
        // once the user returns to the app after confirming.
        setCheckEmailSent(true);
        return;
      }
      // Email confirmation OFF — session is live.
      // onAuthStateChange -> fetchOrCreateProfile UPSERTs (onboarding_completed=false)
      // -> AuthGuard routes to /(onboarding)/tos. No manual navigation.
    } catch {
      showError(t('error.auth_failed'));
    } finally {
      setLoading(false);
    }
  }

  if (checkEmailSent) {
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
        <LinearGradient
          colors={['rgba(124,58,237,0.45)', 'rgba(139,92,246,0.18)', 'rgba(11,11,15,0)']}
          locations={[0, 0.38, 0.82]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View className="flex-1 px-6 items-center justify-center">
          <Text className="text-display font-bold text-foreground text-center">
            {t('email_signup.check_email_title')}
          </Text>
          <Text className="text-body text-muted-foreground text-center mt-4">
            {t('email_signup.check_email_body', { email: email.trim() })}
          </Text>
          <TouchableOpacity
            testID="back-to-login"
            onPress={() => router.replace('/(auth)/email-login')}
            className="mt-8"
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold text-[14px]">
              {t('email_signup.login_cta')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
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
            {t('email_signup.title')}
          </Text>

          <TextInput
            testID="email-input"
            value={email}
            onChangeText={setEmail}
            placeholder={t('email_signup.email_placeholder')}
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
            placeholder={t('email_signup.password_placeholder')}
            placeholderTextColor="#8A8A93"
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            editable={!loading}
            className="w-full bg-surface/60 border border-border rounded-[14px] h-[52px] px-4 text-foreground text-[16px] mt-3"
          />

          {error && (
            <Text className="text-destructive text-[12px] mt-2">{error}</Text>
          )}

          <TouchableOpacity
            testID="email-signup-submit"
            onPress={onSubmit}
            disabled={loading}
            className="w-full bg-foreground rounded-[28px] h-[54px] items-center justify-center mt-6"
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text className="text-black font-semibold text-[16px]">
                {t('email_signup.submit')}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-1" />

          <View className="flex-row items-center justify-center mb-6">
            <Text className="text-muted-foreground text-[14px]">
              {t('email_signup.login_prompt')}{' '}
            </Text>
            <TouchableOpacity
              testID="email-login-link"
              onPress={() => router.replace('/(auth)/email-login')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-foreground font-semibold text-[14px]">
                {t('email_signup.login_cta')}
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
