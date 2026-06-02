import { AdminShell } from '@/components/layout/AdminShell';

export default function BannersLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
