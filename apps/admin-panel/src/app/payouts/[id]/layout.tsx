import { AdminShell } from '@/components/layout/AdminShell';

export default function PayoutDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
