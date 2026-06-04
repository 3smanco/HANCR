import { AdminShell } from '@/components/layout/AdminShell';

export default function ComplaintsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
