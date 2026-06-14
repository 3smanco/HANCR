'use client';

import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getInitials } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CountryCitySwitcher } from '@/components/global/CountryCitySwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const admin = useAuthStore((s) => s.admin);

  return (
    <header className="flex items-center justify-between gap-4 border-b cmd-border cmd-surface px-6 py-3">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-extrabold cmd-text">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 truncate text-sm cmd-muted">{subtitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {/* الفلتر العالمي — دولة/مدينة (يقود كل البيانات) */}
        <CountryCitySwitcher />

        {/* مبدّل اللغة (RTL/LTR) */}
        <LanguageSwitcher />

        {/* مبدّل الثيم (داكن/فاتح) */}
        <ThemeToggle />

        {/* جرس الإنذار (SOS لاحقاً) */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border cmd-border cmd-muted transition hover:cmd-ember">
          <Bell className="h-5 w-5" />
          <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--cmd-ember)]" />
        </button>

        {/* المشغّل */}
        <div className="flex items-center gap-2 border-s cmd-border ps-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--cmd-ember)]">
            <span className="text-xs font-extrabold text-white">
              {admin ? getInitials(admin.email) : 'A'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="max-w-[140px] truncate text-sm font-bold leading-tight cmd-text">
              {admin?.email ?? 'Admin'}
            </p>
            <p className="text-xs capitalize cmd-muted">{admin?.role ?? 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
