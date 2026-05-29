import { AdminShell } from '@/components/layout/AdminShell';

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
