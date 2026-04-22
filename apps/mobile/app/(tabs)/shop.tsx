import { SafeAreaView } from 'react-native-safe-area-context';
import { ShopWebView } from '../../components/shop/ShopWebView';

// Phase 7 / SHOP-01 / SHOP-02 — Shop tab.
// Replaces the 07-01 placeholder. Renders the embedded x-square.kr WebView
// with custom header (back / title / refresh) and error fallback. T-7-01
// allowlist enforced inside ShopWebView.
export default function ShopScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ShopWebView />
    </SafeAreaView>
  );
}
