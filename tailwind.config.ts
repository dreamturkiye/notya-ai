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
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
