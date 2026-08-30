import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0A1628', 800: '#0F2040', 700: '#1A3050' },
        electric: { 600: '#2563EB', 500: '#3B82F6', 400: '#60A5FA' },
        gold: { 500: '#F59E0B', 400: '#FBBF24' },
        paper: '#f3f6f5',
        'paper-2': '#e4eeeb',
        ink: '#102428',
        'ink-2': '#1d3c42',
        'ink-muted': '#5a7176',
        pine: '#0e6b66',
        'pine-2': '#0b5551',
        cream: '#ffffff',
        line: '#1024281a',
        warn: '#9a3d32',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'Times New Roman', 'serif'],
        outfit: ['var(--font-outfit-face)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: ['clamp(2.75rem, 8.2vw, 7.25rem)', { lineHeight: '0.9', letterSpacing: '-0.045em' }],
        display: ['clamp(2.15rem, 5.6vw, 5.35rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        title: ['clamp(1.6rem, 3.2vw, 2.85rem)', { lineHeight: '1.15' }],
        lede: ['clamp(1.05rem, 1.4vw, 1.35rem)', { lineHeight: '1.6' }],
      },
      lineHeight: {
        hero: '0.9',
        display: '0.95',
      },
      letterSpacing: {
        hero: '-0.045em',
        display: '-0.03em',
      },
      boxShadow: {
        border: '0 0 0 1px #10242814, 0 1px 2px -1px #10242810, 0 10px 28px -16px #10242822',
      },
    },
  },
  plugins: [],
}
export default config
