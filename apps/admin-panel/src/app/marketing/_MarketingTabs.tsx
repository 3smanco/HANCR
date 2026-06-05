'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, Gift, UserPlus } from 'lucide-react';

const TABS = [
  { href: '/marketing/announcements', label: 'الإعلانات', icon: Megaphone },
  { href: '/marketing/gifts', label: 'الهدايا', icon: Gift },
  { href: '/marketing/referrals', label: 'الإحالات', icon: UserPlus },
];

export function MarketingTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-gray-200">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-2 ${
              active
                ? 'border-hancr-violet text-hancr-violet'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
