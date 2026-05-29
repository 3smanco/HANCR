'use client';

import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getInitials } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const admin = useAuthStore((s) => s.admin);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="min-w-0">
        <h1 className="text-lg font-extrabold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Notification bell */}
        <button className="relative p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-hancr-violet rounded-full ring-2 ring-white" />
        </button>

        {/* Admin avatar */}
        <div className="flex items-center gap-2 ps-3 border-s border-gray-200">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-hancr-violet to-hancr-violet-deep shadow-violet">
            <span className="text-xs font-extrabold text-white">
              {admin ? getInitials(admin.email) : 'A'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-tight max-w-[140px] truncate">
              {admin?.email ?? 'Admin'}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {admin?.role ?? 'admin'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
