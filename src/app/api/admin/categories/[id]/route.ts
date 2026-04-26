import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

import { hasRichTextContent, requireAdminSession, toStoredRichText } from '@/lib/admin-api';
import { deleteR2Object, getR2KeyFromMediaUrl } from '@/lib/r2';
import { deleteAdminCategory, getCategoryById, updateAdminCategory } from '@/services/category.service';
export const runtime = 'nodejs';

function toR2KeyFromAnyUrl(url: string, requestUrl: string): string | null {
  const normalizedUrl = new URL(url, requestUrl).toString();
  return getR2KeyFromMediaUrl(normalizedUrl);
}

function collectR2KeysFromUrls(urls: string[], requestUrl: string): string[] {
  return Array.from(
    new Set(
      urls
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => toR2KeyFromAnyUrl(url, requestUrl))
        .filter((key): key is string => Boolean(key))
    )
  );
}

async function cleanupR2Keys(keys: string[], context: { categoryId: string; reason: string }) {
  for (const key of keys) {
    try {
      await deleteR2Object(key);
    } catch (cleanupError) {
      console.error('Failed to cleanup category R2 object', {
        categoryId: context.categoryId,
        reason: context.reason,
        key,
        error: cleanupError instanceof Error ? cleanupError.message : cleanupError,
      });
    }
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    let previousCategoryImageUrl: string | null = null;
    let previousCategorySeoImageUrl: string | null = null;
    try {
      const previousCategory = await getCategoryById(id);
      previousCategoryImageUrl = previousCategory?.imageUrl || null;
      previousCategorySeoImageUrl = previousCategory?.seo?.image || null;
    } catch (previousLookupError) {
      console.error('Failed to load previous category before image cleanup', {
        categoryId: id,
        error: previousLookupError instanceof Error ? previousLookupError.message : previousLookupError,
      });
    }
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

    if (!name || !imageUrl || !hasRichTextContent(body.description)) {
      return NextResponse.json({ ok: false, error: 'name, imageUrl, and description are required.' }, { status: 400 });
    }

    await updateAdminCategory(id, { name, imageUrl, parentId, shortDescription, description, seo });

    const previousKeys = collectR2KeysFromUrls(
      [previousCategoryImageUrl || '', previousCategorySeoImageUrl || ''],
      request.url
    );
    const nextKeys = new Set(collectR2KeysFromUrls([imageUrl, seo.image], request.url));
    const removedKeys = previousKeys.filter((key) => !nextKeys.has(key));
    await cleanupR2Keys(removedKeys, { categoryId: id, reason: 'category-update' });

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
    let keysToCleanup: string[] = [];

    try {
      const previousCategory = await getCategoryById(id);
      keysToCleanup = collectR2KeysFromUrls(
        [previousCategory?.imageUrl || '', previousCategory?.seo?.image || ''],
        _request.url
      );
    } catch (previousLookupError) {
      console.error('Failed to load previous category before delete cleanup', {
        categoryId: id,
        error: previousLookupError instanceof Error ? previousLookupError.message : previousLookupError,
      });
    }

    await deleteAdminCategory(id);
    await cleanupR2Keys(keysToCleanup, { categoryId: id, reason: 'category-delete' });
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
