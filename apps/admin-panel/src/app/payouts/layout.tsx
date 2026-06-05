import { AdminShell } from '@/components/layout/AdminShell';

export default function PayoutsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
