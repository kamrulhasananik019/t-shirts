import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

import { requireAdminSession, toStoredRichText } from '@/lib/admin-api';
import { deleteAdminCategory, updateAdminCategory } from '@/services/category.service';
export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
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

    await updateAdminCategory(id, { name, imageUrl, parentId, shortDescription, description, seo });
    revalidateTag('catalog', 'max');

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await deleteAdminCategory(id);
    revalidateTag('catalog', 'max');
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'CATEGORY_IN_USE') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Cannot delete this category because one or more products are linked to it. Reassign or remove those products first.',
        },
        { status: 409 }
      );
    }

    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
