'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const PUBLIC_PATHS = ['/login', '/'];

/**
 * AuthBootstrap — initializes auth state from cookies on app mount
 * and enforces redirect rules:
 *   - Unauthenticated user → /login
 *   - Authenticated user on /login → /dashboard
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { initialize, hydrated, isAuthenticated } = useAuthStore();

  // Restore session on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Enforce redirect rules after hydration
  useEffect(() => {
    if (!hydrated) return;
    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname?.startsWith(`${p}?`),
    );

    if (!isAuthenticated && !isPublic) {
      router.replace('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.replace('/dashboard');
    } else if (isAuthenticated && pathname === '/') {
      router.replace('/dashboard');
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  return <>{children}</>;
}
