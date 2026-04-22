import { useActionSheet } from '@expo/react-native-action-sheet';
import { useTranslation } from '@wecord/shared/i18n';

interface Options {
  hasCustomAvatar: boolean;
  onCamera: () => void;
  onLibrary: () => void;
  onUseDefault: () => void;
  onRemove?: () => void;
}

export function useAvatarActionSheet({
  hasCustomAvatar,
  onCamera,
  onLibrary,
  onUseDefault,
  onRemove,
}: Options) {
  const { showActionSheetWithOptions } = useActionSheet();
  const { t } = useTranslation('more');

  return {
    show: () => {
      const baseOptions = [
        t('profileEdit.avatarActions.camera'),
        t('profileEdit.avatarActions.library'),
        t('profileEdit.avatarActions.useDefault'),
      ];
      const removeOption = hasCustomAvatar
        ? [t('profileEdit.avatarActions.remove')]
        : [];
      const cancelOption = [t('profileEdit.avatarActions.cancel')];
      const options = [...baseOptions, ...removeOption, ...cancelOption];
      const destructiveButtonIndex = hasCustomAvatar ? 3 : undefined;
      const cancelButtonIndex = options.length - 1;

      showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
          title: t('profileEdit.avatarActions.title'),
        },
        (selectedIndex) => {
          if (selectedIndex === 0) onCamera();
          else if (selectedIndex === 1) onLibrary();
          else if (selectedIndex === 2) onUseDefault();
          else if (hasCustomAvatar && selectedIndex === 3 && onRemove) onRemove();
        }
      );
    },
  };
}
