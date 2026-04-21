import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import AdminDashboard from '@/components/admin/admin-dashboard';
import { getAdminSessionCookieName, verifyAdminSession } from '@/lib/admin-auth';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(getAdminSessionCookieName())?.value);

  if (!session) {
    redirect('/admin/login');
  }

  return <AdminDashboard adminEmail={session.email} />;
}
