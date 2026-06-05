import { AdminShell } from '@/components/layout/AdminShell';

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
