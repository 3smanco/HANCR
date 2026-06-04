import { AdminShell } from '@/components/layout/AdminShell';

export default function BundlesLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
