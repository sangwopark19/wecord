import { vi } from 'vitest';

// Vitest mock for expo-web-browser. Tests assert call args via the spy.
export const openBrowserAsync = vi.fn(async () => ({ type: 'opened' }));
