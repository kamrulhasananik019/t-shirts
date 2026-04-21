import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'primeprints_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'change-me-admin-session-secret';
}

type AdminSessionData = {
  email: string;
  exp: number;
};

function toBase64Url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createAdminSession(email: string): string {
  const sessionData: AdminSessionData = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = toBase64Url(JSON.stringify(sessionData));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyAdminSession(token: string | undefined | null): AdminSessionData | null {
  if (!token || !token.includes('.')) {
    return null;
  }
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) {
    return null;
  }

  const expectedSignature = sign(encoded);
  const valid =
    expectedSignature.length === signature.length &&
    timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  if (!valid) {
    return null;
  }

  try {
    const sessionData = JSON.parse(fromBase64Url(encoded)) as AdminSessionData;
    if (!sessionData.email || !sessionData.exp || sessionData.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return sessionData;
  } catch {
    return null;
  }
}

export function getAdminSessionCookieName() {
  return COOKIE_NAME;
}

function safeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

function verifyScryptColon(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = parts[1];
  const hashHex = parts[2];
  if (!salt || !hashHex) return false;
  const derived = scryptSync(password, salt, hashHex.length / 2).toString('hex');
  return safeEqualString(derived, hashHex);
}

function verifyScryptDollar(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length < 3 || parts[0] !== 'scrypt') return false;
  const salt = parts[1];
  const hash = parts[2];
  if (!salt || !hash) return false;

  const isHex = /^[a-f0-9]+$/i.test(hash);
  if (isHex) {
    const derivedHex = scryptSync(password, salt, hash.length / 2).toString('hex');
    return safeEqualString(derivedHex, hash);
  }

  const derivedB64 = scryptSync(password, salt, 64).toString('base64');
  return safeEqualString(derivedB64, hash);
}

export function verifyPasswordAgainstHash(password: string, storedHash: string): boolean {
  const normalized = storedHash.trim();
  if (!normalized) return false;

  if (normalized.startsWith('scrypt:')) {
    return verifyScryptColon(password, normalized);
  }

  if (normalized.startsWith('scrypt$')) {
    return verifyScryptDollar(password, normalized);
  }

  // Fallback for plain-text passwords in older/local setups.
  return safeEqualString(password, normalized);
}
