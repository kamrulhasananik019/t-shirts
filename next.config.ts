import type { NextConfig } from 'next';

function getSiteHostname(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return null;

  try {
    return new URL(siteUrl).hostname;
  } catch {
    return null;
  }
}

function getExtraImageHosts(): string[] {
  const raw = process.env.NEXT_PUBLIC_IMAGE_HOSTS;
  if (!raw) return [];

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

const imageHostnames = Array.from(
  new Set([
    'images.unsplash.com',
    'plus.unsplash.com',
    'lh3.googleusercontent.com',
    // Hostinger-hosted assets are often served from these domains.
    'cdn.hstgr.io',
    '**.hostinger.com',
    '**.hostinger.io',
    getSiteHostname(),
    ...getExtraImageHosts(),
  ].filter((value): value is string => Boolean(value)))
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    // Avoid AVIF/cache edge cases that can produce zero-byte optimized buffers.
    formats: ['image/webp'],
    // Keep runtime stable when upstream image responses are inconsistent.
    unoptimized: true,
    /** Fewer repeat optimizations / origin fetches for Unsplash URLs at runtime. */
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: imageHostnames.map((hostname) => ({
      protocol: 'https',
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: '/:path*.(avif|webp|png|jpg|jpeg|gif|svg|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
