import { AdminShell } from '@/components/layout/AdminShell';

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
