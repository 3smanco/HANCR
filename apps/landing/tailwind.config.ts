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
        navy: '#0A0807',          // كان twilight navy → obsidian
        purple: '#A89B96',        // → muted text
        cream: '#FFF5EE',         // → pearl
        violet: '#FF7A1A',        // ← أهم: violet → ember
        'violet-deep': '#E55F00',
        'violet-light': '#6B3920',
        cyan: '#FF9D4D',          // cyan → ember-light (warm)
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
