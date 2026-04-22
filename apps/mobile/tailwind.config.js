/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0F',
        surface: '#15151B',
        'surface-2': '#1E1E26',
        card: '#15151B',
        input: '#15151B',
        border: 'rgba(255,255,255,0.08)',
        accent: '#8B5CF6',
        'accent-pink': '#F472B6',
        'accent-dark': '#7C3AED',
        live: '#E11D48',
        foreground: '#FFFFFF',
        'muted-foreground': 'rgba(235,235,245,0.62)',
        dim: 'rgba(235,235,245,0.38)',
        subtle: '#666666',
        destructive: '#FF4444',
        badge: '#FF3B30',
      },
      fontFamily: {
        sans: ['Pretendard', 'System'],
        display: ['Pretendard', 'System'],
      },
      fontWeight: {
        regular: '400',
        semibold: '600',
        bold: '700',
        black: '900',
      },
      fontSize: {
        mono: ['10px', { lineHeight: '1.2', letterSpacing: '1.2px' }],
        label: ['12px', { lineHeight: '1.4' }],
        body: ['14px', { lineHeight: '1.55' }],
        heading: ['18px', { lineHeight: '1.3', letterSpacing: '-0.3px' }],
        display: ['22px', { lineHeight: '1.15', letterSpacing: '-0.4px' }],
        hero: ['44px', { lineHeight: '0.95', letterSpacing: '-1.5px' }],
      },
    },
  },
  plugins: [],
};
