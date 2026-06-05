import { AdminShell } from '@/components/layout/AdminShell';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
