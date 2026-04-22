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

export default function ForgotPasswordScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }

  async function onSubmit() {
    if (!/.+@.+\..+/.test(email.trim())) {
      showError(t('error.invalid_email'));
      return;
    }
    setLoading(true);
    try {
      // NOTE: redirectTo is intentionally NOT passed — we rely on the Supabase
      // project's default reset URL (hosted reset page). A native deep-link
      // resume screen is deferred (documented in SUMMARY.md).
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetError) {
        showError(t('error.reset_failed'));
        return;
      }
      setSent(true);
    } catch {
      showError(t('error.reset_failed'));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
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
            {t('forgot_password.sent_title')}
          </Text>
          <Text className="text-body text-muted-foreground text-center mt-4">
            {t('forgot_password.sent_body', { email: email.trim() })}
          </Text>
          <TouchableOpacity
            testID="back-to-login"
            onPress={() => router.replace('/(auth)/email-login')}
            className="mt-8"
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold text-[14px]">
              {t('forgot_password.back_to_login')}
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
            {t('forgot_password.title')}
          </Text>
          <Text className="text-body text-muted-foreground mt-3 leading-[22px]">
            {t('forgot_password.body')}
          </Text>

          <TextInput
            testID="email-input"
            value={email}
            onChangeText={setEmail}
            placeholder={t('forgot_password.email_placeholder')}
            placeholderTextColor="#8A8A93"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!loading}
            className="w-full bg-surface/60 border border-border rounded-[14px] h-[52px] px-4 text-foreground text-[16px] mt-6"
          />

          {error && (
            <Text className="text-destructive text-[12px] mt-2">{error}</Text>
          )}

          <TouchableOpacity
            testID="forgot-password-submit"
            onPress={onSubmit}
            disabled={loading}
            className="w-full bg-foreground rounded-[28px] h-[54px] items-center justify-center mt-6"
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text className="text-black font-semibold text-[16px]">
                {t('forgot_password.submit')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="back-to-login-link"
            onPress={() => router.replace('/(auth)/email-login')}
            disabled={loading}
            className="mt-4 items-center"
            activeOpacity={0.7}
          >
            <Text className="text-muted-foreground text-[14px]">
              {t('forgot_password.back_to_login')}
            </Text>
          </TouchableOpacity>

          <View className="flex-1" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});
