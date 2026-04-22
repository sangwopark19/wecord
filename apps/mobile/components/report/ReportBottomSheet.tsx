import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from '@wecord/shared/i18n';
import { useReport, type ReportReason } from '../../hooks/report/useReport';

const REASONS: ReportReason[] = ['hate', 'spam', 'violence', 'copyright', 'other'];

interface ReportBottomSheetProps {
  visible: boolean;
  targetType: 'post' | 'comment';
  targetId: string;
  onClose: () => void;
}

export function ReportBottomSheet({
  visible,
  targetType,
  targetId,
  onClose,
}: ReportBottomSheetProps) {
  const { t } = useTranslation('report');
  const report = useReport();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [otherText, setOtherText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  const handleClose = () => {
    setSelectedReason(null);
    setOtherText('');
    setShowOtherInput(false);
    onClose();
  };

  const handleSubmit = (reason: ReportReason, reasonText?: string) => {
    setSelectedReason(reason);
    report.mutate(
      {
        targetType,
        targetId,
        reason,
        reasonText,
      },
      {
        onSuccess: () => {
          handleClose();
          Alert.alert('', t('submitted'));
        },
        onError: (error) => {
          handleClose();
          if (error.message === 'DUPLICATE_REPORT') {
            Alert.alert('', t('duplicate'));
          } else {
            Alert.alert('', t('error'));
          }
        },
      }
    );
  };

  const handleReasonPress = (reason: ReportReason) => {
    if (reason === 'other') {
      setSelectedReason('other');
      setShowOtherInput(true);
      return;
    }
    handleSubmit(reason);
  };

  const handleOtherSubmit = () => {
    if (otherText.trim().length === 0) return;
    handleSubmit('other', otherText.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
        onPress={handleClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: '#1A1A1A',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
          }}
        >
          {/* Title */}
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {t('selectReason')}
          </Text>

          {/* Reason list */}
          {REASONS.map((reason) => (
            <Pressable
              key={reason}
              onPress={() => handleReasonPress(reason)}
              disabled={report.isPending}
              style={{
                minHeight: 44,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#333333',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: report.isPending ? 0.5 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel={t(`reason.${reason}`)}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                {t(`reason.${reason}`)}
              </Text>
              {report.isPending && selectedReason === reason && (
                <ActivityIndicator size="small" color="#8B5CF6" />
              )}
            </Pressable>
          ))}

          {/* Other text input */}
          {showOtherInput && (
            <View style={{ marginTop: 12 }}>
              <TextInput
                style={{
                  backgroundColor: '#333333',
                  color: '#FFFFFF',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder={t('otherPlaceholder')}
                placeholderTextColor="#999999"
                value={otherText}
                onChangeText={setOtherText}
                multiline
                maxLength={500}
                autoFocus
              />
              <Pressable
                onPress={handleOtherSubmit}
                disabled={otherText.trim().length === 0 || report.isPending}
                style={{
                  backgroundColor:
                    otherText.trim().length > 0 && !report.isPending
                      ? '#8B5CF6'
                      : '#333333',
                  borderRadius: 8,
                  paddingVertical: 12,
                  marginTop: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
                accessibilityRole="button"
                accessibilityLabel={t('submit')}
              >
                {report.isPending && selectedReason === 'other' && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                <Text
                  style={{
                    color:
                      otherText.trim().length > 0 && !report.isPending
                        ? '#000000'
                        : '#666666',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  {t('submit')}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
