import { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '@wecord/shared/i18n';
import { useAuthStore } from '../../stores/authStore';
import { useDirtyState } from '../../hooks/profile/useDirtyState';
import { useUpdateProfile } from '../../hooks/profile/useUpdateProfile';
import { useUploadAvatar } from '../../hooks/profile/useUploadAvatar';
import { useAvatarActionSheet } from '../../components/more/AvatarActionSheet';

type FormState = {
  globalNickname: string;
  bio: string;
  avatarUrl: string | null;
  localAvatarUri: string | null;
} & Record<string, unknown>;

export default function ProfileEditScreen() {
  const router = useRouter();
  const { t } = useTranslation('more');
  const profile = useAuthStore((s) => s.profile);

  // Hooks must be called unconditionally — initialize with safe defaults if no profile.
  const initial: FormState = {
    globalNickname: profile?.globalNickname ?? '',
    bio: profile?.bio ?? '',
    avatarUrl: profile?.avatarUrl ?? null,
    localAvatarUri: null,
  };
  const { current, setCurrent, isDirty, reset } = useDirtyState<FormState>(initial);
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const { show: showAvatarSheet } = useAvatarActionSheet({
    hasCustomAvatar: current.avatarUrl != null,
    onCamera: async () => {
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled) setCurrent({ ...current, localAvatarUri: res.assets[0].uri });
    },
    onLibrary: async () => {
      const res = await ImagePicker.launchImageLibraryAsync({
        // ImagePicker.MediaTypeOptions is the SDK 55-supported enum even with the
        // SDK 56 string-array deprecation; we keep the enum to avoid platform forking.
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled) setCurrent({ ...current, localAvatarUri: res.assets[0].uri });
    },
    onUseDefault: () => setCurrent({ ...current, avatarUrl: null, localAvatarUri: null }),
    onRemove: () => setCurrent({ ...current, avatarUrl: null, localAvatarUri: null }),
  });

  // Bail if no profile (e.g. logged out mid-screen).
  useEffect(() => {
    if (!profile) router.back();
  }, [profile, router]);
  if (!profile) return null;

  const nicknameTrimmed = current.globalNickname.trim();
  const nicknameValid = nicknameTrimmed.length >= 2 && nicknameTrimmed.length <= 20;
  const isPending = updateProfile.isPending || uploadAvatar.isPending;
  const canSave = isDirty && nicknameValid && !isPending;

  const handleSave = async () => {
    try {
      let avatarUrl: string | null = current.avatarUrl;
      if (current.localAvatarUri) {
        avatarUrl = await uploadAvatar.mutateAsync(current.localAvatarUri);
      }
      await updateProfile.mutateAsync({
        globalNickname: nicknameTrimmed,
        bio: current.bio.trim() || null,
        avatarUrl,
      });
      reset();
      Alert.alert(t('profileEdit.toasts.saveSuccess'));
      router.back();
    } catch {
      Alert.alert(t('profileEdit.toasts.saveError'));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <SafeAreaView className="flex-1">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
          }}
          className="border-border"
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="back"
            style={{ minHeight: 44, justifyContent: 'center', minWidth: 44 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-heading font-semibold text-foreground">
            {t('profileEdit.screenTitle')}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel={t('profileEdit.saveCta')}
            style={{ minHeight: 44, justifyContent: 'center', minWidth: 44, alignItems: 'flex-end' }}
          >
            <Text
              className={`text-heading font-semibold ${
                canSave ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              {isPending ? t('profileEdit.saveCtaSaving') : t('profileEdit.saveCta')}
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4">
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Pressable
              onPress={showAvatarSheet}
              accessibilityRole="button"
              accessibilityLabel={t('profileEdit.avatarActions.title')}
              style={{ width: 96, height: 96, borderRadius: 48, overflow: 'hidden' }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: '#1A1A1A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {current.localAvatarUri ? (
                  <Image
                    source={{ uri: current.localAvatarUri }}
                    style={{ width: 96, height: 96 }}
                  />
                ) : current.avatarUrl ? (
                  <Image
                    source={{ uri: current.avatarUrl }}
                    style={{ width: 96, height: 96 }}
                  />
                ) : (
                  <Ionicons name="camera-outline" size={32} color="#999999" />
                )}
              </View>
            </Pressable>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text className="text-label text-muted-foreground mb-2">
              {t('profileEdit.nicknameLabel')}
            </Text>
            <TextInput
              value={current.globalNickname}
              onChangeText={(v) => setCurrent({ ...current, globalNickname: v })}
              maxLength={20}
              accessibilityLabel={t('profileEdit.nicknameLabel')}
              className="bg-card rounded-xl px-4 text-body text-foreground"
              style={{ height: 48 }}
              placeholderTextColor="#666666"
            />
            <Text
              className={`text-label mt-1 ${
                nicknameValid ? 'text-muted-foreground' : 'text-destructive'
              }`}
            >
              {nicknameValid
                ? t('profileEdit.nicknameHelper')
                : t('profileEdit.nicknameErrorLength')}
            </Text>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text className="text-label text-muted-foreground mb-2">
              {t('profileEdit.bioLabel')}
            </Text>
            <TextInput
              value={current.bio}
              onChangeText={(v) => setCurrent({ ...current, bio: v })}
              maxLength={150}
              multiline
              accessibilityLabel={t('profileEdit.bioLabel')}
              className="bg-card rounded-xl px-4 py-3 text-body text-foreground"
              style={{ minHeight: 96, textAlignVertical: 'top' }}
              placeholderTextColor="#666666"
            />
            <Text className="text-label text-muted-foreground mt-1 text-right">
              {t('profileEdit.bioHelper', { count: current.bio.length })}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
