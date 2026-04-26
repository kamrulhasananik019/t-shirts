import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api';
import { deleteR2Object, getR2KeyFromMediaUrl } from '@/lib/r2';

export const runtime = 'nodejs';

type CleanupBody = {
  urls?: unknown;
  keys?: unknown;
};

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function toR2Key(value: string, requestUrl: string): string | null {
  const normalizedUrl = new URL(value, requestUrl).toString();
  return getR2KeyFromMediaUrl(normalizedUrl);
}

function collectKeys(body: CleanupBody, requestUrl: string): string[] {
  const directKeys = normalizeStringArray(body.keys);
  const urlKeys = normalizeStringArray(body.urls)
    .map((url) => toR2Key(url, requestUrl))
    .filter((key): key is string => Boolean(key));

  return Array.from(new Set([...directKeys, ...urlKeys]));
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    const body = (await request.json().catch(() => ({}))) as CleanupBody;
    const keys = collectKeys(body, request.url);

    if (keys.length === 0) {
      return NextResponse.json({ ok: false, error: 'urls or keys are required.' }, { status: 400 });
    }

    for (const key of keys) {
      await deleteR2Object(key);
    }

    return NextResponse.json({ ok: true, deleted: keys.length }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  }
}