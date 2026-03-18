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
        background: '#000000',
        card: '#1A1A1A',
        input: '#2A2A2A',
        border: '#2A2A2A',
        teal: '#00E5C3',
        'teal-dark': '#00B89A',
        foreground: '#FFFFFF',
        'muted-foreground': '#999999',
        subtle: '#666666',
        destructive: '#FF4444',
        badge: '#FF3B30',
      },
      fontWeight: {
        regular: '400',
        semibold: '600',
      },
      fontSize: {
        label: ['12px', { lineHeight: '1.4' }],
        body: ['14px', { lineHeight: '1.5' }],
        heading: ['16px', { lineHeight: '1.3' }],
        display: ['20px', { lineHeight: '1.2' }],
      },
    },
  },
  plugins: [],
};
