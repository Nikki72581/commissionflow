// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUserWithOrg } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await getCurrentUserWithOrg();

  // Redirect based on role
  if (user.role === 'ADMIN') {
    redirect('/dashboard/admin');
  } else {
    redirect('/dashboard/salesperson');
  }
}