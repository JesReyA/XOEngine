/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        xo: {
          'deep-bg': '#090B14',
          surface: '#14182A',
          elevated: '#1C2238',
          electric: '#6038F5',
          violet: '#8B6CFF',
          'text-primary': '#F5F6FC',
          'text-secondary': '#8B9ABF',
          'text-muted': '#4A5578',
          border: '#232A42',
          'field-green': '#2D5A27',
          'fan-accent': '#F59E0B',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#D50A0A',
          scrimmage: '#FFD700',
          'first-down': '#00BFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        chip: '8px',
        pill: '9999px',
        token: '50%',
      },
    },
  },
  plugins: [],
}
