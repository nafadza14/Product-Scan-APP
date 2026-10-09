/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './App.tsx', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#E9EEEC',
        sage: { DEFAULT: '#C3D3D1', soft: '#DCE6E4', deep: '#9DB5B2' },
        ink: { DEFAULT: '#0E2B2E', soft: '#3F5A5C', muted: '#6E8283', faint: '#A7B6B6' },
        coral: { DEFAULT: '#EE5F3B', light: '#F6A04D' },
        safe: '#2E8C68',
        caution: '#DB8F1F',
        avoid: '#D2432F',
      },
      fontFamily: {
        sans: ['Onest', 'IBM Plex Sans Arabic', 'PingFang SC', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.5rem' },
      boxShadow: {
        soft: '0 1px 2px rgba(14,43,46,0.04), 0 8px 24px rgba(14,43,46,0.06)',
        lift: '0 2px 6px rgba(14,43,46,0.06), 0 18px 40px rgba(14,43,46,0.12)',
        sheet: '0 -12px 40px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
};
