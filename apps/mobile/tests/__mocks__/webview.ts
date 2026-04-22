import { vi } from 'vitest';
import React from 'react';

// Vitest mock for `react-native-webview`. The runtime package is unavailable in
// the worktree (pnpm refuses to install while node_modules is symlinked from the
// main repo), so we alias the import in vitest.config.ts and provide a typed
// component stub here. Production typing comes from the ambient declaration in
// apps/mobile/types/react-native-webview.d.ts.

export type WebViewNavigation = {
  canGoBack: boolean;
  canGoForward: boolean;
  url: string;
};

export interface WebViewHttpErrorEvent {
  nativeEvent: { statusCode: number; url: string; description?: string };
}

export interface ShouldStartLoadRequest {
  url: string;
  isTopFrame?: boolean;
  navigationType?: string;
}

export interface WebViewMockProps {
  source: { uri: string };
  sharedCookiesEnabled?: boolean;
  allowsBackForwardNavigationGestures?: boolean;
  startInLoadingState?: boolean;
  onShouldStartLoadWithRequest?: (req: ShouldStartLoadRequest) => boolean;
  onNavigationStateChange?: (nav: WebViewNavigation) => void;
  onError?: () => void;
  onHttpError?: (event: WebViewHttpErrorEvent) => void;
}

// Typed capture slot — tests read `WebView.lastProps`. A module-level singleton
// is enough; tests reset via beforeEach when needed.
interface CapturedSlot {
  lastProps: WebViewMockProps | null;
}
const capture: CapturedSlot = { lastProps: null };

const WebViewComponent: React.FC<WebViewMockProps> = (props) => {
  capture.lastProps = props;
  return React.createElement('View', { testID: 'webview' });
};

export const WebView = Object.assign(
  vi.fn(WebViewComponent) as unknown as React.FC<WebViewMockProps>,
  {
    get lastProps(): WebViewMockProps | null {
      return capture.lastProps;
    },
    set lastProps(v: WebViewMockProps | null) {
      capture.lastProps = v;
    },
  }
);
