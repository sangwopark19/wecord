import { vi } from 'vitest';
import type { ReactNode } from 'react';

// Vitest mock for @expo/react-native-action-sheet.
// Returns a jest.fn() showActionSheetWithOptions so call sites can be asserted,
// and a no-op pass-through ActionSheetProvider for component tests.

export const useActionSheet = () => ({
  showActionSheetWithOptions: vi.fn(),
});

export const ActionSheetProvider = ({ children }: { children: ReactNode }) => children;

export const connectActionSheet = <P extends object>(Component: P) => Component;
