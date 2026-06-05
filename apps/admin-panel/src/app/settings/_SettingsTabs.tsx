'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, XCircle, Star } from 'lucide-react';

const TABS = [
  { href: '/settings', label: 'الإشعارات', icon: Bell },
  { href: '/settings/cancel-reasons', label: 'أسباب الإلغاء', icon: XCircle },
  { href: '/settings/review-params', label: 'معايير التقييم', icon: Star },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-2 whitespace-nowrap ${
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
