import { AdminShell } from '@/components/layout/AdminShell';

export default function DriverDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
