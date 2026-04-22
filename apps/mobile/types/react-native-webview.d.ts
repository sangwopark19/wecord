// Ambient module declaration for `react-native-webview`.
//
// The npm package is listed in apps/mobile/package.json but is NOT installed in
// this worktree (pnpm refuses to install while node_modules is symlinked from
// the main repo). After the wave merges back, `pnpm install` on main will
// resolve the actual package and these declarations become a no-op (TS prefers
// real .d.ts files in node_modules over ambient ones from `include`).
//
// Until then, this stub keeps `tsc --noEmit` clean for the production
// components (ShopWebView). Tests use the vitest alias to a runtime mock.

declare module 'react-native-webview' {
  import type * as React from 'react';

  export interface WebViewNavigation {
    canGoBack: boolean;
    canGoForward: boolean;
    url: string;
    title?: string;
    loading?: boolean;
  }

  export interface WebViewHttpErrorEvent {
    nativeEvent: {
      statusCode: number;
      url: string;
      description?: string;
    };
  }

  export interface WebViewErrorEvent {
    nativeEvent: {
      url: string;
      description?: string;
      code?: number;
    };
  }

  export interface WebViewSource {
    uri: string;
    headers?: Record<string, string>;
  }

  export interface WebViewProps {
    source: WebViewSource;
    sharedCookiesEnabled?: boolean;
    allowsBackForwardNavigationGestures?: boolean;
    startInLoadingState?: boolean;
    onShouldStartLoadWithRequest?: (req: { url: string; navigationType?: string; isTopFrame?: boolean }) => boolean;
    onNavigationStateChange?: (nav: WebViewNavigation) => void;
    onError?: (event: WebViewErrorEvent) => void;
    onHttpError?: (event: WebViewHttpErrorEvent) => void;
  }

  // The class shape exposes goBack/reload as instance methods used via ref.
  export class WebView extends React.Component<WebViewProps> {
    goBack(): void;
    goForward(): void;
    reload(): void;
    stopLoading(): void;
  }

  export default WebView;
}

declare module 'react-native-webview/lib/WebViewTypes' {
  export interface ShouldStartLoadRequest {
    url: string;
    isTopFrame?: boolean;
    navigationType?: string;
  }
}
