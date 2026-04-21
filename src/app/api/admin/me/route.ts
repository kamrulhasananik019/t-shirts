import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAdminSessionCookieName, verifyAdminSession } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(getAdminSessionCookieName())?.value);
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }

  return NextResponse.json({ ok: true, email: session.email }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
}
