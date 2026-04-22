import { Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

interface ToggleApis {
  alert?: (title: string, body?: string, buttons?: Parameters<typeof Alert.alert>[2]) => void;
  openSettings?: () => void;
}

interface ToggleArgs {
  desired: boolean;
  setEnabled: (next: boolean) => void;
  copy: {
    rowLabel: string;
    helperOff: string;
    openSettingsCta: string;
    openSettingsCancel: string;
  };
  apis?: ToggleApis;
}

/**
 * Reconcile a desired push-toggle state with the OS permission gate.
 *
 * Behavior:
 *   - Already granted → no-op, mark enabled.
 *   - desired=true & canAskAgain=true → request, set state from result.
 *   - desired=true & canAskAgain=false → Alert with Open Settings CTA.
 *   - desired=false → ALWAYS show Alert with Open Settings (cannot revoke
 *     from app; OS truth is reconciled on focus by the caller).
 */
export async function reconcilePushToggle(args: ToggleArgs): Promise<void> {
  const { desired, setEnabled, copy, apis } = args;
  const alertFn = apis?.alert ?? Alert.alert;
  const openSettings = apis?.openSettings ?? (() => Linking.openSettings());

  if (desired) {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      setEnabled(true);
      return;
    }
    if (canAskAgain) {
      const { status: next } = await Notifications.requestPermissionsAsync();
      setEnabled(next === 'granted');
      return;
    }
    alertFn(copy.rowLabel, copy.helperOff, [
      { text: copy.openSettingsCancel, style: 'cancel' },
      { text: copy.openSettingsCta, onPress: openSettings },
    ]);
    return;
  }

  // ON → OFF: cannot revoke from app. Switch state stays unchanged; useFocusEffect
  // re-reads OS state on return to settings screen.
  alertFn(copy.rowLabel, copy.helperOff, [
    { text: copy.openSettingsCancel, style: 'cancel' },
    { text: copy.openSettingsCta, onPress: openSettings },
  ]);
}

export async function readPushPermission(): Promise<{ enabled: boolean; canAskAgain: boolean }> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return { enabled: status === 'granted', canAskAgain };
}
