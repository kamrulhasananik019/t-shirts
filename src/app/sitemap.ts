import type { MetadataRoute } from 'next';
import { getCatalogCategories } from '@/lib/catalog';
import { getProductSummaries } from '@/lib/mongo-catalog';
import { siteUrl } from '@/lib/site';
import { getCategoryPath, getProductPath } from '@/lib/slug';

export const revalidate = 604800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl;

  const [categories, allProducts] = await Promise.all([
    getCatalogCategories(),
    getProductSummaries(1000).catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}${getCategoryPath(category.id, category.name)}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = allProducts.map((product) => ({
    url: `${baseUrl}${getProductPath(product.id, product.name, product.slug)}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
