import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAdminSessionCookieName } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getAdminSessionCookieName());
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
}
