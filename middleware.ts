import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_SESSION_COOKIE = 'primeprints_admin_session';
const API_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';

function parseOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(): Set<string> {
  const siteOrigin = parseOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  const extraOrigins = (process.env.API_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => parseOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));

  const origins = new Set<string>([
    'https://www.primeprint.uk',
    'https://primeprint.uk',
    ...(siteOrigin ? [siteOrigin] : []),
    ...extraOrigins,
  ]);

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
    origins.add('http://localhost:3001');
    origins.add('http://127.0.0.1:3001');
  }

  return origins;
}

const ALLOWED_ORIGINS = getAllowedOrigins();

function getRequestOrigin(request: NextRequest): string | null {
  const originHeader = parseOrigin(request.headers.get('origin'));
  if (originHeader) return originHeader;

  // Fallback for clients that only send Referer.
  return parseOrigin(request.headers.get('referer'));
}

function applyCorsHeaders(response: NextResponse, origin: string | null, request: NextRequest) {
  if (!origin) return;

  response.headers.set('Vary', 'Origin');
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', API_METHODS);

  const requestedHeaders = request.headers.get('access-control-request-headers');
  response.headers.set('Access-Control-Allow-Headers', requestedHeaders || 'Content-Type, Authorization');
}

function handleApiOriginGuard(request: NextRequest): NextResponse {
  const requestOrigin = getRequestOrigin(request);

  if (requestOrigin && !ALLOWED_ORIGINS.has(requestOrigin)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden origin',
      },
      { status: 403 }
    );
  }

  if (request.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 204 });
    applyCorsHeaders(preflightResponse, requestOrigin, request);
    return preflightResponse;
  }

  const response = NextResponse.next();
  applyCorsHeaders(response, requestOrigin, request);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    return handleApiOriginGuard(request);
  }

  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionCookie && pathname.startsWith('/admin')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};