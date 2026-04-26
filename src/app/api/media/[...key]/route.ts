import { NextResponse } from 'next/server';

import { readR2Object } from '@/lib/r2';

export const runtime = 'nodejs';

function decodeObjectKey(params: { key?: string[] }): string | null {
  if (!Array.isArray(params.key) || params.key.length === 0) return null;

  const key = params.key.map((segment) => decodeURIComponent(segment)).join('/');
  if (!key || key.includes('..')) return null;
  return key;
}

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await params;
    const objectKey = decodeObjectKey({ key });

    if (!objectKey) {
      return NextResponse.json({ ok: false, error: 'Invalid media path.' }, { status: 400 });
    }

    const upstream = await readR2Object(objectKey);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ ok: false, error: 'Media not found.' }, { status: upstream.status === 404 ? 404 : 502 });
    }

    const headers = new Headers(upstream.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
