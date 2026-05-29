import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // HANCR Twilight palette
        navy: '#22223B',
        purple: '#4A4E69',
        muted: '#9A8C98',
        cream: '#F2E9E4',
        rose: '#C9ADA7',
        // Action colors
        violet: '#B048FF',
        'violet-deep': '#8B2EE6',
        'violet-light': '#E9D5FF',
        cyan: '#00F5FF',
      },
      fontFamily: {
        ar: ['Cairo', 'sans-serif'],
        en: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
