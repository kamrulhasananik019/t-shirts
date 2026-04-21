import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

import { requireAdminSession, toStoredRichText } from '@/lib/admin-api';
import { createAdminCategory, getAdminCategories } from '@/services/category.service';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdminSession();
    const rows = await getAdminCategories();
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
      imageUrl?: string;
      parentId?: string | null;
      shortDescription?: string;
      description?: string;
      seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
        image?: string;
      };
    };

    const name = String(body.name || '').trim();
    const imageUrl = String(body.imageUrl || '').trim();
    const parentId = body.parentId ? String(body.parentId) : null;
    const shortDescription = toStoredRichText(body.shortDescription);
    const description = toStoredRichText(body.description);
    const seo = {
      title: String(body.seo?.title || '').trim(),
      description: String(body.seo?.description || '').trim(),
      keywords: Array.isArray(body.seo?.keywords) ? body.seo!.keywords.map((item) => String(item).trim()).filter(Boolean) : [],
      image: String(body.seo?.image || '').trim(),
    };

    if (!name || !imageUrl || !description) {
      return NextResponse.json({ ok: false, error: 'name, imageUrl, and description are required.' }, { status: 400 });
    }

    await createAdminCategory({ name, imageUrl, parentId, shortDescription, description, seo });
    revalidateTag('catalog', 'max');

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }
}
