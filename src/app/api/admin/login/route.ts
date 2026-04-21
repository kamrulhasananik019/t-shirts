import { NextResponse } from 'next/server';

import { createAdminSession, getAdminSessionCookieName, verifyPasswordAgainstHash } from '@/lib/admin-auth';
import { getAdminByEmail } from '@/services/admin.service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const admin = await getAdminByEmail(email);
  if (!admin || !verifyPasswordAgainstHash(password, String(admin.password_hash || ''))) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const token = createAdminSession(admin.email);
  const response = NextResponse.json({ ok: true, email: admin.email }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  response.cookies.set(getAdminSessionCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return response;
}
