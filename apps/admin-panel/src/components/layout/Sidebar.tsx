'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Car,
  ShoppingBag,
  MapPin,
  Zap,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  ShieldAlert,
  Ticket,
  Image as ImageIcon,
  Package,
  Building2,
  Wallet,
  AlertOctagon,
  MessageSquare,
  Users2,
  Megaphone,
  Banknote,
  Activity,
  Bus,
  DollarSign,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useT, useLocale } from '@/i18n/LocaleProvider';
import toast from 'react-hot-toast';

// أقسام غرفة العمليات — تجميع العناصر منطقياً (يطابق رؤية الـ16 قسماً).
const NAV_GROUPS = [
  {
    label: { ar: 'العمليات', en: 'Operations' },
    items: [
      { key: 'nav.live', icon: Activity, href: '/live' },
      { key: 'nav.orders', icon: ShoppingBag, href: '/orders' },
      { key: 'nav.crossCity', icon: MapPin, href: '/cross-city' },
      { key: 'nav.sos', icon: ShieldAlert, href: '/sos' },
      { key: 'nav.complaints', icon: AlertOctagon, href: '/complaints' },
      { key: 'nav.support', icon: MessageSquare, href: '/support' },
    ],
  },
  {
    label: { ar: 'الذكاء التجاري', en: 'Intelligence' },
    items: [
      { key: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { key: 'nav.analytics', icon: BarChart2, href: '/analytics' },
    ],
  },
  {
    label: { ar: 'الأشخاص', en: 'People' },
    items: [
      { key: 'nav.drivers', icon: Car, href: '/users/drivers' },
      { key: 'nav.riders', icon: Users, href: '/users/riders' },
      { key: 'nav.applications', icon: Users2, href: '/applications' },
      { key: 'nav.operators', icon: Users2, href: '/operators' },
    ],
  },
  {
    label: { ar: 'الأسطول والخدمات', en: 'Fleet & Services' },
    items: [
      { key: 'nav.fleets', icon: Bus, href: '/fleets' },
      { key: 'nav.services', icon: Settings, href: '/services' },
      { key: 'nav.regions', icon: MapPin, href: '/regions' },
      { key: 'nav.pricingZones', icon: DollarSign, href: '/pricing-zones' },
    ],
  },
  {
    label: { ar: 'المالية', en: 'Finance' },
    items: [
      { key: 'nav.wallets', icon: Wallet, href: '/wallets/riders' },
      { key: 'nav.payouts', icon: Banknote, href: '/payouts' },
      { key: 'nav.companies', icon: Building2, href: '/companies' },
    ],
  },
  {
    label: { ar: 'النمو والتسويق', en: 'Growth' },
    items: [
      { key: 'nav.coupons', icon: Ticket, href: '/coupons' },
      { key: 'nav.bundles', icon: Package, href: '/bundles' },
      { key: 'nav.banners', icon: ImageIcon, href: '/banners' },
      { key: 'nav.marketing', icon: Megaphone, href: '/marketing/announcements' },
      { key: 'nav.leads', icon: Inbox, href: '/leads' },
    ],
  },
  {
    label: { ar: 'النظام', en: 'System' },
    items: [
      { key: 'nav.features', icon: Zap, href: '/features' },
      { key: 'nav.notifications', icon: Bell, href: '/settings' },
    ],
  },
] as const;

export function Sidebar() {
  const t = useT();
  const { locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.success(t('auth.signedOut'));
    router.push('/login');
  };

  return (
    <aside className="flex flex-col w-60 h-screen bg-hancr-navy border-e border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-hancr-violet to-hancr-violet-deep shadow-violet">
          <span className="text-lg font-extrabold text-white">H</span>
        </div>
        <div>
          <p className="text-white font-extrabold text-sm leading-tight">
            {t('brand.name')}
          </p>
          <p className="text-sidebar-muted text-xs">{t('brand.tagline')}</p>
        </div>
      </div>

      {/* Navigation — grouped sections */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label.en} className="px-3 mb-2">
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-muted/60">
              {locale === 'ar' ? group.label.ar : group.label.en}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150',
                      isActive
                        ? 'sidebar-item-active'
                        : 'text-sidebar-muted hover:text-white hover:bg-white/5',
                    )}
                  >
                    <item.icon
                      className="w-4.5 h-4.5 shrink-0"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className="flex-1">{t(item.key)}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-hancr-violet opacity-80 rtl:rotate-180" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom — logout */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-bold
            text-sidebar-muted hover:text-white hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          <span>{t('auth.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
