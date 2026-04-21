import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

import { hasRichTextContent, requireAdminSession, toStoredRichText } from '@/lib/admin-api';
import { createAdminProduct, getAdminProducts, resolveCategoryIds } from '@/services/product.service';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdminSession();
    const rows = await getAdminProducts();
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
      imageUrls?: string[];
      badges?: string[];
      categoryIds?: string[];
      description?: string;
      shortDescription?: string;
      seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
        image?: string;
      };
    };

    const name = String(body.name || '').trim();
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map((item) => String(item).trim()).filter(Boolean) : [];
    const badges = Array.isArray(body.badges) ? body.badges.map((item) => String(item).trim()).filter(Boolean) : [];
    const categoryInputs = Array.isArray(body.categoryIds) ? body.categoryIds.map((item) => String(item).trim()).filter(Boolean) : [];
    const categoryIds = await resolveCategoryIds(categoryInputs);
    const description = toStoredRichText(body.description);
    const shortDescription = toStoredRichText(body.shortDescription);
    const seo = {
      title: String(body.seo?.title || '').trim(),
      description: String(body.seo?.description || '').trim(),
      keywords: Array.isArray(body.seo?.keywords) ? body.seo!.keywords.map((item) => String(item).trim()).filter(Boolean) : [],
      image: String(body.seo?.image || '').trim(),
    };

    if (!name || !hasRichTextContent(body.description) || !hasRichTextContent(body.shortDescription)) {
      return NextResponse.json({ ok: false, error: 'name, description, and shortDescription are required.' }, { status: 400 });
    }

    await createAdminProduct({ name, imageUrls, badges, categoryIds, description, shortDescription, seo });
    revalidateTag('catalog', 'max');

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }
}
