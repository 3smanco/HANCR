import { AdminShell } from '@/components/layout/AdminShell';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
