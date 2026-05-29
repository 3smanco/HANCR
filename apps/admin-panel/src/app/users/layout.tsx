import { AdminShell } from '@/components/layout/AdminShell';

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
