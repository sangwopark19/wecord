import { SafeAreaView } from 'react-native-safe-area-context';
import { DmPlaceholder } from '../../components/dm/DmPlaceholder';

// Phase 7 / DMPL-01 / DMPL-02 — DM tab (Coming Soon + Notify Me).
// Replaces the 07-01 placeholder. Real messaging ships in v1.1.
export default function DmScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <DmPlaceholder />
    </SafeAreaView>
  );
}
