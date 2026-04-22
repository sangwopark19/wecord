import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { WebView, type WebViewNavigation, type WebViewHttpErrorEvent } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from '@wecord/shared/i18n';
import { ShopHeader } from './ShopHeader';
import { ShopErrorFallback } from './ShopErrorFallback';
import { isAllowedHost, SHOP_ALLOWED_HOST } from './isAllowedHost';

// Re-export so call sites that already import { isAllowedHost } from
// '../../components/shop/ShopWebView' keep working. Tests should prefer the
// dependency-free import from './isAllowedHost' to avoid pulling in vector
// icons (which fail to resolve inside the worktree's symlinked node_modules).
export { isAllowedHost };

export function ShopWebView() {
  const ref = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState(false);
  const { t } = useTranslation();

  const handleShouldStart = (req: { url: string }): boolean => {
    if (!isAllowedHost(req.url)) {
      // Hand off to system browser so the user keeps a clear app/web boundary
      void WebBrowser.openBrowserAsync(req.url);
      Alert.alert('', t('shop:externalLinkToast'));
      return false;
    }
    return true;
  };

  const handleHttpError = (event: WebViewHttpErrorEvent): void => {
    if (event.nativeEvent.statusCode >= 500) setError(true);
  };

  const handleBack = () => ref.current?.goBack();
  const handleRefresh = () => {
    setError(false);
    ref.current?.reload();
  };
  const handleRetry = () => {
    setError(false);
    ref.current?.reload();
  };

  return (
    <>
      <ShopHeader canGoBack={canGoBack} onBack={handleBack} onRefresh={handleRefresh} />
      {error ? (
        <ShopErrorFallback onRetry={handleRetry} />
      ) : (
        <WebView
          ref={ref}
          source={{ uri: `https://${SHOP_ALLOWED_HOST}` }}
          sharedCookiesEnabled={false}
          allowsBackForwardNavigationGestures
          startInLoadingState
          onShouldStartLoadWithRequest={handleShouldStart}
          onNavigationStateChange={(nav: WebViewNavigation) => setCanGoBack(nav.canGoBack)}
          onError={() => setError(true)}
          onHttpError={handleHttpError}
        />
      )}
    </>
  );
}
