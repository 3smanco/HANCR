import { AdminShell } from '@/components/layout/AdminShell';

export default function OrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
