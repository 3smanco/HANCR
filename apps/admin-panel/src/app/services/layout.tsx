import { AdminShell } from '@/components/layout/AdminShell';

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
