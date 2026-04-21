/** Canonical site origin (no trailing slash). Override with NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://primeprint.uk'
).replace(/\/$/, '');
