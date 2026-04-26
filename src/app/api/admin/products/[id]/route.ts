import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

import { hasRichTextContent, requireAdminSession, toStoredRichText } from '@/lib/admin-api';
import { deleteR2Object, getR2KeyFromMediaUrl } from '@/lib/r2';
import { deleteAdminProduct, getProductById, resolveCategoryIds, updateAdminProduct } from '@/services/product.service';
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

async function cleanupR2Keys(keys: string[], context: { productId: string; reason: string }) {
  for (const key of keys) {
    try {
      await deleteR2Object(key);
    } catch (cleanupError) {
      console.error('Failed to cleanup product R2 object', {
        productId: context.productId,
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
    let previousImageUrls: string[] = [];
    let previousSeoImageUrl: string | null = null;
    try {
      const previousProduct = await getProductById(id);
      previousImageUrls = previousProduct?.images?.map((item) => item.url).filter(Boolean) || [];
      previousSeoImageUrl = previousProduct?.seo?.image || null;
    } catch (previousLookupError) {
      console.error('Failed to load previous product before image cleanup', {
        productId: id,
        error: previousLookupError instanceof Error ? previousLookupError.message : previousLookupError,
      });
    }
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

    await updateAdminProduct(id, { name, imageUrls, badges, categoryIds, description, shortDescription, seo });

    const previousKeys = collectR2KeysFromUrls([...previousImageUrls, previousSeoImageUrl || ''], request.url);
    const nextKeys = new Set(collectR2KeysFromUrls([...imageUrls, seo.image], request.url));
    const removedKeys = previousKeys.filter((key) => !nextKeys.has(key));
    await cleanupR2Keys(removedKeys, { productId: id, reason: 'product-update' });

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
      const previousProduct = await getProductById(id);
      const previousImageUrls = previousProduct?.images?.map((item) => item.url).filter(Boolean) || [];
      keysToCleanup = collectR2KeysFromUrls([...previousImageUrls, previousProduct?.seo?.image || ''], _request.url);
    } catch (previousLookupError) {
      console.error('Failed to load previous product before delete cleanup', {
        productId: id,
        error: previousLookupError instanceof Error ? previousLookupError.message : previousLookupError,
      });
    }

    await deleteAdminProduct(id);
    await cleanupR2Keys(keysToCleanup, { productId: id, reason: 'product-delete' });
    revalidateTag('catalog', 'max');
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
