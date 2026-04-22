import { describe, it } from 'vitest';

describe('Shop navigation state', () => {
  it.todo('canGoBack is false on initial render');
  it.todo('canGoBack becomes true after onNavigationStateChange { canGoBack: true }');
  it.todo('tapping disabled back does not call webview.goBack');
  it.todo('tapping refresh calls webview.reload');
});
