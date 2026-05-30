import type { Config } from 'tailwindcss';

/**
 * HANCR Aurora — Tailwind config
 * Cinematic dark + ember glow (matches Flutter AuroraColors)
 *
 * نُبقي نفس class names القديمة (hancr.*, sidebar.*) لكن بقيم Aurora
 * → كل الـ components تتحوّل تلقائياً بدون تعديل.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hancr: {
          // ── Brand Primary (Aurora) ──
          navy:        '#0A0807',   // obsidian (كانت navy)
          violet:      '#FF7A1A',   // ember (كانت violet) ← الأهم
          'violet-deep':  '#E55F00', // ember-deep
          'violet-light': '#6B3920', // ember-mute
          purple:      '#A89B96',   // muted text
          cream:       '#FFF5EE',   // pearl
          blush:       '#C9ADA7',

          // surfaces الجديدة
          obsidian:    '#0A0807',
          coal:        '#13100E',
          ash:         '#1F1A17',
          smoke:       '#2A2421',
          stone:       '#3D3530',
          ember:       '#FF7A1A',
          'ember-light': '#FF9D4D',
          'ember-deep':  '#E55F00',
          pearl:       '#FFF5EE',
          muted:       '#A89B96',
          hint:        '#6F635E',

          // ── Functional ──
          success:     '#10B981',
          'success-bg': 'rgba(16,185,129,0.15)',
          warning:     '#FFB547',
          'warning-bg': 'rgba(255,181,71,0.15)',
          error:       '#FF4D4D',
          'error-bg':  'rgba(255,77,77,0.15)',
          info:        '#3B82F6',
          'info-bg':   'rgba(59,130,246,0.15)',

          // ── Status ──
          online:      '#10B981',
          offline:     '#6F635E',
          'in-ride':   '#FF7A1A',
          pending:     '#FFB547',
          banned:      '#FF4D4D',

          // ── Loyalty Tiers ──
          'tier-bronze':   '#CD7F32',
          'tier-silver':   '#C0C0C0',
          'tier-gold':     '#FFB547',
          'tier-platinum': '#8E9DAB',
          'tier-diamond':  '#FF9D4D',

          // ── Accents (mapped to warm) ──
          cyan:        '#FF9D4D',
          rose:        '#FF4D4D',
          lime:        '#FFB547',
        },
        // ── Sidebar (Aurora dark) ──
        sidebar: {
          bg:          '#13100E',   // coal
          hover:       '#1F1A17',   // ash
          active:      '#2A2421',   // smoke
          text:        '#FFF5EE',   // pearl
          muted:       '#A89B96',
          border:      'rgba(255,255,255,0.1)',
          accent:      '#FF7A1A',   // ember
        },
      },
      fontFamily: {
        sans:   ['Inter', 'Cairo', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
        display: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-lg':  '0 4px 16px rgba(0,0,0,0.5)',
        'card-xl':  '0 8px 24px rgba(0,0,0,0.6)',
        violet:     '0 0 24px -2px rgba(255,122,26,0.4)',   // ember glow
        'violet-lg':'0 0 40px 2px rgba(255,122,26,0.35)',
        ember:      '0 0 24px -2px rgba(255,122,26,0.4)',
        'ember-lg': '0 0 40px 2px rgba(255,122,26,0.35)',
      },
      borderRadius: {
        DEFAULT: '12px',
        sm:  '8px',
        md:  '12px',
        lg:  '16px',
        xl:  '20px',
        '2xl': '24px',
      },
      animation: {
        'pulse-violet': 'pulseEmber 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ember':  'pulseEmber 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up':     'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':      'fadeIn 0.2s ease-out',
      },
      keyframes: {
        pulseEmber: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,122,26,0.6)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(255,122,26,0)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
