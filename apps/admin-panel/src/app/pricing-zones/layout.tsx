import { AdminShell } from '@/components/layout/AdminShell';

export default function PricingZonesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
