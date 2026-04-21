import { NextResponse } from 'next/server';

import { sendContactEmails } from '@/lib/contact-mail';

export const runtime = 'nodejs';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      company?: string;
      email?: string;
      phone?: string;
      category?: string;
      categoryTitle?: string;
      product?: string;
      productTitle?: string;
      deadline?: string;
      details?: string;
    };

    const name = String(body.name || '').trim();
    const company = String(body.company || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const category = String(body.category || '').trim();
    const categoryTitle = String(body.categoryTitle || '').trim();
    const product = String(body.product || '').trim();
    const productTitle = String(body.productTitle || '').trim();
    const deadline = String(body.deadline || '').trim();
    const details = String(body.details || '').trim();

    if (!name || !email || !category || !product || !details) {
      return NextResponse.json(
        { ok: false, error: 'name, email, category, product, and details are required.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    await sendContactEmails({
      name,
      company,
      email,
      phone,
      category,
      categoryTitle,
      product,
      productTitle,
      deadline,
      details,
    });

    return NextResponse.json(
      { ok: true, message: 'Your request has been sent. A confirmation email has also been sent to you.' },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}