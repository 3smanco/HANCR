import { AdminShell } from '@/components/layout/AdminShell';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
