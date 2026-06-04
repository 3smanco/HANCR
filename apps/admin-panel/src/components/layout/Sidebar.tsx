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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useT } from '@/i18n/LocaleProvider';
import toast from 'react-hot-toast';

export function Sidebar() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const NAV_ITEMS = [
    { key: 'nav.dashboard',     icon: LayoutDashboard, href: '/dashboard' },
    { key: 'nav.drivers',       icon: Car,             href: '/users/drivers' },
    { key: 'nav.riders',        icon: Users,           href: '/users/riders' },
    { key: 'nav.orders',        icon: ShoppingBag,     href: '/orders' },
    { key: 'nav.sos',           icon: ShieldAlert,     href: '/sos' },
    { key: 'nav.complaints',    icon: AlertOctagon,    href: '/complaints' },
    { key: 'nav.services',      icon: Settings,        href: '/services' },
    { key: 'nav.coupons',       icon: Ticket,          href: '/coupons' },
    { key: 'nav.bundles',       icon: Package,         href: '/bundles' },
    { key: 'nav.companies',     icon: Building2,       href: '/companies' },
    { key: 'nav.wallets',       icon: Wallet,          href: '/wallets/riders' },
    { key: 'nav.banners',       icon: ImageIcon,       href: '/banners' },
    { key: 'nav.regions',       icon: MapPin,          href: '/regions' },
    { key: 'nav.features',      icon: Zap,             href: '/features' },
    { key: 'nav.analytics',     icon: BarChart2,       href: '/analytics' },
    { key: 'nav.notifications', icon: Bell,            href: '/settings' },
  ] as const;

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

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-150',
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
