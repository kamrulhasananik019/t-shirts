import { randomUUID } from 'crypto';

import { AwsClient } from 'aws4fetch';

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

type UploadR2ObjectInput = {
  key: string;
  body: ArrayBuffer | Uint8Array | Blob | string;
  contentType: string;
};

type PublicMediaUrlOptions = {
  key: string;
};

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
};

function readR2Config(): R2Config {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();

  if (!accountId) throw new Error('MISSING_CLOUDFLARE_R2_ACCOUNT_ID');
  if (!accessKeyId) throw new Error('MISSING_CLOUDFLARE_R2_ACCESS_KEY_ID');
  if (!secretAccessKey) throw new Error('MISSING_CLOUDFLARE_R2_SECRET_ACCESS_KEY');
  if (!bucketName) throw new Error('MISSING_CLOUDFLARE_R2_BUCKET_NAME');

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

function getR2Client(): AwsClient {
  const config = readR2Config();
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  });
}

function getR2ObjectUrl(key: string): string {
  const config = readR2Config();
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${encodedKey}`;
}

function sanitizeFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^.]+$/, '');
  const cleaned = withoutExtension
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleaned || 'image';
}

function sanitizePathSegment(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleaned || 'untitled';
}

export function buildR2ImageKey(
  kind: 'categories' | 'products' | 'seo' | 'shared',
  filename: string,
  contentType: string,
  entityTitle?: string
): string {
  const titleFolder = sanitizePathSegment(entityTitle || 'untitled');
  const extension = MIME_EXTENSION_MAP[contentType] || filename.match(/\.[^.]+$/)?.[0] || '.bin';
  const stem = sanitizeFilename(filename);
  return `${kind}/${titleFolder}/${stem}-${randomUUID()}${extension}`;
}

export function buildPublicMediaUrl({ key }: PublicMediaUrlOptions): string {
  return `/api/media/${key.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;
}

export async function uploadR2Object({ key, body, contentType }: UploadR2ObjectInput): Promise<void> {
  const client = getR2Client();
  const requestBody =
    typeof body === 'string' || body instanceof Blob || body instanceof ArrayBuffer ? body : new Uint8Array(body).slice().buffer;
  const contentLength =
    typeof requestBody === 'string'
      ? Buffer.byteLength(requestBody).toString()
      : requestBody instanceof Blob
        ? requestBody.size.toString()
        : requestBody.byteLength.toString();
  const response = await client.fetch(getR2ObjectUrl(key), {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': contentLength,
    },
    body: requestBody,
  });

  if (!response.ok) {
    throw new Error(`R2_UPLOAD_FAILED_${response.status}`);
  }
}

export async function deleteR2Object(key: string): Promise<void> {
  const client = getR2Client();
  const response = await client.fetch(getR2ObjectUrl(key), { method: 'DELETE' });

  if (!response.ok && response.status !== 404) {
    throw new Error(`R2_DELETE_FAILED_${response.status}`);
  }
}

export async function readR2Object(key: string): Promise<Response> {
  const client = getR2Client();
  return client.fetch(getR2ObjectUrl(key), { method: 'GET' });
}

export function getR2KeyFromMediaUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const apiIndex = segments.indexOf('api');
    if (apiIndex === -1 || segments[apiIndex + 1] !== 'media') return null;

    const keySegments = segments.slice(apiIndex + 2);
    if (keySegments.length === 0) return null;

    return keySegments.map((segment) => decodeURIComponent(segment)).join('/');
  } catch {
    return null;
  }
}
