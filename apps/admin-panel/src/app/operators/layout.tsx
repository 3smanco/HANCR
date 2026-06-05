import { AdminShell } from '@/components/layout/AdminShell';

export default function OperatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
