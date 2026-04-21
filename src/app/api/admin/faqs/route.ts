import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api';
import { createAdminFaq, getAdminFaqs } from '@/services/faq.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdminSession();
    const rows = await getAdminFaqs();
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
      question?: string;
      answer?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    const question = String(body.question || '').trim();
    const answer = String(body.answer || '').trim();
    const sortOrder = Number(body.sortOrder || 1);
    const isActive = body.isActive !== false;

    if (!question || !answer) {
      return NextResponse.json({ ok: false, error: 'question and answer are required.' }, { status: 400 });
    }

    await createAdminFaq({ question, answer, sortOrder: Number.isFinite(sortOrder) && sortOrder > 0 ? sortOrder : 1, isActive });
    revalidateTag('faqs', 'max');

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }
}