import { AdminShell } from '@/components/layout/AdminShell';

export default function CrossCityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
