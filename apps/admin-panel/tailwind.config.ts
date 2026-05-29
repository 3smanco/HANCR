import type { Config } from 'tailwindcss';

/**
 * HANCR Design System v2 — Tailwind config
 *
 * Aligned 1:1 with Flutter HancrColors tokens
 * (see apps/rider-app/lib/core/theme/app_theme.dart)
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
          // ── Brand Primary ──
          navy:        '#22223B',
          violet:      '#B048FF',
          'violet-deep':  '#8B2EE6',
          'violet-light': '#E9D5FF',
          purple:      '#4A4E69',
          cream:       '#F2E9E4',
          blush:       '#C9ADA7',

          // ── Functional ──
          success:     '#10B981',
          'success-bg': '#D1FAE5',
          warning:     '#F59E0B',
          'warning-bg': '#FEF3C7',
          error:       '#EF4444',
          'error-bg':  '#FEE2E2',
          info:        '#3B82F6',
          'info-bg':   '#DBEAFE',

          // ── Status ──
          online:      '#10B981',
          offline:     '#9CA3AF',
          'in-ride':   '#B048FF',
          pending:     '#F59E0B',
          banned:      '#EF4444',

          // ── Loyalty Tiers ──
          'tier-bronze':   '#CD7F32',
          'tier-silver':   '#C0C0C0',
          'tier-gold':     '#D4AF37',
          'tier-platinum': '#8E9DAB',
          'tier-diamond':  '#B048FF',

          // ── Legacy neon accents (kept for backward compat) ──
          cyan:        '#00F5FF',
          rose:        '#FF3D8B',
          lime:        '#39FF14',
        },
        // ── Sidebar (navy theme) ──
        sidebar: {
          bg:          '#22223B',
          hover:       '#2d2d4e',
          active:      '#4A4E69',
          text:        '#F2E9E4',
          muted:       '#9A8C98',
          border:      'rgba(249,232,220,0.1)',
          'accent':    '#B048FF',
        },
      },
      fontFamily: {
        sans:   ['Inter', 'Cairo', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
        display: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 3px rgba(34,34,59,0.05), 0 1px 2px rgba(34,34,59,0.04)',
        'card-lg':  '0 4px 16px rgba(34,34,59,0.08)',
        'card-xl':  '0 8px 24px rgba(34,34,59,0.12)',
        violet:     '0 4px 16px rgba(176,72,255,0.25)',
        'violet-lg':'0 8px 24px rgba(176,72,255,0.35)',
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
        'pulse-violet': 'pulseViolet 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up':     'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':      'fadeIn 0.2s ease-out',
      },
      keyframes: {
        pulseViolet: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(176,72,255,0.6)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(176,72,255,0)' },
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
