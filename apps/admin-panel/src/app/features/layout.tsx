import { AdminShell } from '@/components/layout/AdminShell';

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
