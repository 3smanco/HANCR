import { redirect } from 'next/navigation';

export default function SystemPlaceholder() {
  // not used yet — keep the route consistent with sidebar
  redirect('/settings');
}
