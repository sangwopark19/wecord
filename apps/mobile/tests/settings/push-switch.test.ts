import { describe, it } from 'vitest';

describe('push notifications switch', () => {
  it.todo('calls Notifications.requestPermissionsAsync when canAskAgain is true');
  it.todo('calls Linking.openSettings when permission denied and canAskAgain is false');
  it.todo('reconciles local state on screen focus via getPermissionsAsync');
});
