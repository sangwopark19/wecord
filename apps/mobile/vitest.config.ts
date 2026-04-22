import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    alias: {
      'react-native': 'react-native-web',
      '@expo/react-native-action-sheet': new URL('./tests/__mocks__/action-sheet.ts', import.meta.url).pathname,
      'react-native-webview': new URL('./tests/__mocks__/webview.ts', import.meta.url).pathname,
      'expo-web-browser': new URL('./tests/__mocks__/web-browser.ts', import.meta.url).pathname,
    },
  },
});
