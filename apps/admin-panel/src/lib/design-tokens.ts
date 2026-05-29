/**
 * HANCR Design System v2 — Design Tokens (TypeScript)
 *
 * Mirrors `apps/rider-app/lib/core/theme/app_theme.dart` 1:1.
 * Use these constants in JS-driven styling (charts, dynamic inline styles).
 * For static CSS, prefer Tailwind classes via `tailwind.config.ts`.
 */

export const HancrColors = {
  // ── Brand Primary ──
  navy:        '#22223B',
  violet:      '#B048FF',
  violetDeep:  '#8B2EE6',
  violetLight: '#E9D5FF',
  purple:      '#4A4E69',
  cream:       '#F2E9E4',

  // ── Surfaces ──
  background:     '#FAFAFC',
  surface:        '#FFFFFF',
  surfaceMute:    '#F5F6F8',

  // ── Text ──
  textPrimary:   '#111827',
  textSecondary: '#6B7280',
  textHint:      '#9CA3AF',
  textOnDark:    '#FFFFFF',

  // ── Borders ──
  border:       '#E5E7EB',
  borderStrong: '#D1D5DB',
  divider:      '#EEF0F4',

  // ── Functional ──
  success:    '#10B981',
  successBg:  '#D1FAE5',
  warning:    '#F59E0B',
  warningBg:  '#FEF3C7',
  error:      '#EF4444',
  errorBg:    '#FEE2E2',
  info:       '#3B82F6',
  infoBg:     '#DBEAFE',

  // ── Status ──
  statusOnline:  '#10B981',
  statusOffline: '#9CA3AF',
  statusInRide:  '#B048FF',
  statusPending: '#F59E0B',
  statusBanned:  '#EF4444',

  // ── Loyalty Tiers ──
  tierBronze:   '#CD7F32',
  tierSilver:   '#C0C0C0',
  tierGold:     '#D4AF37',
  tierPlatinum: '#8E9DAB',
  tierDiamond:  '#B048FF',
} as const;

export const HancrSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const HancrRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

/** Tier name → Tailwind badge class */
export function tierBadgeClass(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'bronze':   return 'badge-tier-bronze';
    case 'silver':   return 'badge-tier-silver';
    case 'gold':     return 'badge-tier-gold';
    case 'platinum': return 'badge-tier-platinum';
    case 'diamond':  return 'badge-tier-diamond';
    default:         return 'badge badge-gray';
  }
}

/** Driver status → Tailwind badge class */
export function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'online')           return 'badge badge-green';
  if (s === 'in_ride')          return 'badge badge-violet';
  if (s === 'offline')          return 'badge badge-gray';
  if (s === 'suspended')        return 'badge badge-red';
  if (s === 'pending')          return 'badge badge-yellow';
  return 'badge badge-gray';
}

/** Loyalty miles → next tier threshold */
export function nextTierThreshold(currentTier: string): { next: string; threshold: number } | null {
  switch (currentTier.toLowerCase()) {
    case 'bronze':   return { next: 'Silver',   threshold: 500 };
    case 'silver':   return { next: 'Gold',     threshold: 1500 };
    case 'gold':     return { next: 'Platinum', threshold: 3000 };
    case 'platinum': return { next: 'Diamond',  threshold: 5000 };
    default:         return null;
  }
}
