import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { createPublicReview, getApprovedReviews } from '@/services/review.service';

export const runtime = 'nodejs';

function isValidGmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
}

export async function GET() {
  try {
    const rows = await getApprovedReviews(100);
    return NextResponse.json(
      { ok: true, rows },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      rating?: number;
      text?: string;
    };

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const rating = Number(body.rating || 0);
    const text = String(body.text || '').trim();

    if (!name || !email || !text || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: 'name, gmail, rating (1-5), and text are required.' }, { status: 400 });
    }

    if (!isValidGmail(email)) {
      return NextResponse.json({ ok: false, error: 'Only Gmail addresses are allowed.' }, { status: 400 });
    }

    await createPublicReview({ name, email, rating, text });
    revalidateTag('reviews', 'max');

    return NextResponse.json(
      { ok: true, message: 'Review submitted and pending admin approval.' },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
