import { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryCTAButton } from '../../components/PrimaryCTAButton';
import { useAuthStore } from '../../stores/authStore';

const DEFAULT_DATE = new Date(2000, 0, 1);
const MIN_DATE = new Date(1900, 0, 1);
const MAX_DATE = new Date();

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DobScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const { setOnboardingData } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const age = selectedDate ? calculateAge(selectedDate) : null;
  const isUnderAge = age !== null && age < 14;
  const isValid = selectedDate !== null && !isUnderAge;

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleContinue = () => {
    if (!isValid || !selectedDate) return;
    setOnboardingData({ dateOfBirth: formatDate(selectedDate) });
    router.push('/(onboarding)/language');
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      <View className="flex-1 px-4">
        <Text className="text-heading font-semibold text-foreground mt-6">
          {t('dob.title')}
        </Text>
        <Text className="text-body font-regular text-muted-foreground mt-2">
          {t('dob.body')}
        </Text>

        <Pressable
          onPress={() => {
            if (Platform.OS === 'android') {
              setShowPicker(true);
            }
          }}
          className="bg-input rounded-xl h-[52px] justify-center px-4 mt-4"
        >
          <Text className="text-body font-regular text-foreground">
            {selectedDate ? formatDate(selectedDate) : 'YYYY-MM-DD'}
          </Text>
        </Pressable>

        {Platform.OS === 'ios' && (
          <DateTimePicker
            value={selectedDate ?? DEFAULT_DATE}
            mode="date"
            display="spinner"
            themeVariant="dark"
            onChange={handleDateChange}
            minimumDate={MIN_DATE}
            maximumDate={MAX_DATE}
          />
        )}

        {Platform.OS === 'android' && showPicker && (
          <DateTimePicker
            value={selectedDate ?? DEFAULT_DATE}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={MIN_DATE}
            maximumDate={MAX_DATE}
          />
        )}

        {isUnderAge && (
          <Text className="text-label font-regular text-destructive mt-2">
            {t('dob.age_error')}
          </Text>
        )}
      </View>

      <View className="pb-6">
        <PrimaryCTAButton
          label={t('dob.cta')}
          onPress={handleContinue}
          disabled={!isValid}
        />
      </View>
    </SafeAreaView>
  );
}
