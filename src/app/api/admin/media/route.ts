import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api';
import {
  buildPublicMediaUrl,
  buildR2ImageKey,
  deleteR2Object,
  getR2KeyFromMediaUrl,
  uploadR2Object,
} from '@/lib/r2';

export const runtime = 'nodejs';

function parseKind(value: FormDataEntryValue | null): 'categories' | 'products' | 'seo' | 'shared' {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (raw === 'products' || raw === 'seo' || raw === 'shared') return raw;
  return 'categories';
}

function parseTitle(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'file is required.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ ok: false, error: 'Only image uploads are supported.' }, { status: 400 });
    }

    const kind = parseKind(formData.get('kind'));
    const title = parseTitle(formData.get('title'));
    const key = buildR2ImageKey(kind, file.name || 'image', file.type, title);
    const buffer = await file.arrayBuffer();

    await uploadR2Object({
      key,
      body: buffer,
      contentType: file.type,
    });

    return NextResponse.json({
      ok: true,
      key,
      url: buildPublicMediaUrl({ key }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminSession();

    const body = (await request.json().catch(() => ({}))) as { key?: string; url?: string };
    const key = String(body.key || '').trim() || (typeof body.url === 'string' ? getR2KeyFromMediaUrl(body.url) : null);

    if (!key) {
      return NextResponse.json({ ok: false, error: 'key or url is required.' }, { status: 400 });
    }

    await deleteR2Object(key);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }
}
