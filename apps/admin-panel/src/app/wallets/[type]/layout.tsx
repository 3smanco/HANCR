import { AdminShell } from '@/components/layout/AdminShell';

export default function WalletsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
