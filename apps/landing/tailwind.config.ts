import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ═══ HANCR Aurora — Cinematic dark + ember glow ═══
        // Backgrounds (deepest → lighter)
        obsidian: '#0A0807',
        coal: '#13100E',
        ash: '#1F1A17',
        smoke: '#2A2421',
        stone: '#3D3530',

        // Ember accent (orange glow)
        ember: '#FF7A1A',
        'ember-light': '#FF9D4D',
        'ember-deep': '#E55F00',
        'ember-mute': '#6B3920',

        // Gold (premium)
        gold: '#FFB547',
        'gold-glow': '#FFC97A',

        // Text
        pearl: '#FFF5EE',
        muted: '#A89B96',
        hint: '#6F635E',

        // Status
        success: '#10B981',
        danger: '#FF4D4D',

        // ── Aliases for old class names (map to Aurora) ──
        navy: '#0A0807',
        purple: '#A89B96',
        cream: '#FFF5EE',
        violet: '#FF7A1A',
        'violet-deep': '#E55F00',
        'violet-light': '#6B3920',
        cyan: '#FF9D4D',
      },
      fontFamily: {
        ar: ['Cairo', 'sans-serif'],
        en: ['Inter', 'sans-serif'],
        sans: ['Inter', 'Cairo', 'system-ui', 'sans-serif'],
        display: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-lg': '0 4px 16px rgba(0,0,0,0.5)',
        'card-xl': '0 8px 24px rgba(0,0,0,0.6)',
        ember: '0 0 24px -2px rgba(255,122,26,0.4)',
        'ember-lg': '0 0 40px 2px rgba(255,122,26,0.35)',
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        glow: 'glow 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
