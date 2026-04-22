import { describe, it, expect, vi, beforeEach } from 'vitest';

const getPermissionsAsync = vi.fn();
const requestPermissionsAsync = vi.fn();

vi.mock('expo-notifications', () => ({
  getPermissionsAsync,
  requestPermissionsAsync,
}));

const openSettings = vi.fn();
vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  return {
    ...actual,
    Linking: { openSettings },
    Alert: { alert: vi.fn() },
  };
});

const COPY = {
  rowLabel: 'Push notifications',
  helperOff: 'Turn on notifications in system settings.',
  openSettingsCta: 'Open Settings',
  openSettingsCancel: 'Cancel',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reconcilePushToggle', () => {
  it('calls requestPermissionsAsync when desired=true and canAskAgain=true', async () => {
    getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined', canAskAgain: true });
    requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

    const setEnabled = vi.fn();
    const { reconcilePushToggle } = await import('../../hooks/settings/usePushPermission');
    await reconcilePushToggle({ desired: true, setEnabled, copy: COPY });

    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(setEnabled).toHaveBeenCalledWith(true);
  });

  it('shows Alert with Open Settings when desired=true and canAskAgain=false', async () => {
    getPermissionsAsync.mockResolvedValueOnce({ status: 'denied', canAskAgain: false });
    const alertFn = vi.fn();
    const setEnabled = vi.fn();
    const { reconcilePushToggle } = await import('../../hooks/settings/usePushPermission');
    await reconcilePushToggle({
      desired: true,
      setEnabled,
      copy: COPY,
      apis: { alert: alertFn, openSettings },
    });

    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    expect(alertFn).toHaveBeenCalledTimes(1);
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('ON→OFF press shows Alert and does NOT optimistically flip switch (LOW Codex review)', async () => {
    const alertFn = vi.fn();
    const setEnabled = vi.fn();
    const { reconcilePushToggle } = await import('../../hooks/settings/usePushPermission');
    await reconcilePushToggle({
      desired: false,
      setEnabled,
      copy: COPY,
      apis: { alert: alertFn, openSettings },
    });
    expect(alertFn).toHaveBeenCalledTimes(1);
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('readPushPermission reflects OS state on focus', async () => {
    getPermissionsAsync.mockResolvedValueOnce({ status: 'granted', canAskAgain: false });
    const { readPushPermission } = await import('../../hooks/settings/usePushPermission');
    const result = await readPushPermission();
    expect(result.enabled).toBe(true);
  });
});
