import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api';
import { createAdminReview, getAdminReviews } from '@/services/review.service';
import type { ReviewStatus } from '@/services/review.service';

export const runtime = 'nodejs';

function isValidGmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
}

function isValidStatus(status: string): status is ReviewStatus {
  return status === 'pending' || status === 'approved' || status === 'declined' || status === 'deleted';
}

export async function GET() {
  try {
    await requireAdminSession();
    const rows = await getAdminReviews();
    return NextResponse.json({ ok: true, rows }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      rating?: number;
      text?: string;
      status?: string;
    };

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const rating = Number(body.rating || 0);
    const text = String(body.text || '').trim();
    const status = String(body.status || 'approved');

    if (!name || !email || !text || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: 'name, gmail, rating (1-5), and text are required.' }, { status: 400 });
    }

    if (!isValidGmail(email)) {
      return NextResponse.json({ ok: false, error: 'Only Gmail addresses are allowed.' }, { status: 400 });
    }

    if (!isValidStatus(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid review status.' }, { status: 400 });
    }

    await createAdminReview({ name, email, rating, text, status });
    revalidateTag('reviews', 'max');

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }
}
