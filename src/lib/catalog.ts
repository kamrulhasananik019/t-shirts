import { CATALOG_TAGGED_DATA_REVALIDATE } from '@/lib/catalog-cache-policy';
import { getCategories, getProductNavEntries, getProducts } from '@/lib/mongo-catalog';
import { unstable_cache } from 'next/cache';

export type CatalogCategory = Awaited<ReturnType<typeof getCategories>>[number];
export type CatalogProduct = Awaited<ReturnType<typeof getProducts>>[number];

export { getPrimaryImage } from '@/lib/product-media';

export type CategoryWithProducts = CatalogCategory & {
  products: NavProduct[];
};

export type NavProduct = Pick<
  CatalogProduct,
  'id' | 'slug' | 'name' | 'shortDescription' | 'badges' | 'isActive' | 'isFeatured' | 'seo' | 'categoryIds'
>;

export type NavCategory = CatalogCategory & {
  products: NavProduct[];
};

const getCatalogSnapshot = unstable_cache(
  async () => {
    const [categories, products] = await Promise.all([getCategories(), getProductNavEntries(1000)]);
    return { categories, products };
  },
  ['catalog-snapshot'],
  { revalidate: CATALOG_TAGGED_DATA_REVALIDATE, tags: ['catalog'] }
);

function isCatalogUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('missing mongodb_uri') ||
    message.includes('econnrefused') ||
    message.includes('querysrv') ||
    message.includes('server selection timed out')
  );
}

async function getSafeCatalogSnapshot() {
  if (!process.env.MONGODB_URI) {
    return { categories: [], products: [] };
  }

  try {
    return await getCatalogSnapshot();
  } catch (error) {
    if (isCatalogUnavailableError(error)) {
      return { categories: [], products: [] };
    }
    throw error;
  }
}

export async function getCategoriesWithProducts(): Promise<CategoryWithProducts[]> {
  const { categories, products } = await getSafeCatalogSnapshot();

  return categories.map((category) => ({
      ...category,
      products: products.filter((product) => product.categoryIds.includes(category.id)),
    }));
}

export async function getNavCategories(): Promise<NavCategory[]> {
  const { categories, products } = await getSafeCatalogSnapshot();

  return categories.map((category) => {
      const categoryProducts = products.filter((product) => product.categoryIds.includes(category.id));
      return {
        ...category,
        products: categoryProducts.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          shortDescription: product.shortDescription,
          badges: product.badges,
          categoryIds: product.categoryIds,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          seo: product.seo,
        })),
      };
    });
}

export function getProductCategoryTitleMap(
  products: CatalogProduct[],
  categories: CatalogCategory[] = []
): Record<string, string> {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  return Object.fromEntries(
    products.map((product) => [product.id, categoryNameById.get(product.categoryIds[0] ?? '') ?? ''])
  );
}

export async function getLatestProducts(): Promise<CatalogProduct[]> {
  const products = await getProducts(1000);
  return products.filter((product) => product.badges.some((badge) => badge.toLowerCase() === 'latest'));
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const { categories } = await getSafeCatalogSnapshot();
  return categories;
}

export async function getCatalogProducts(limit = 1000): Promise<CatalogProduct[]> {
  return getProducts(limit);
}

export async function getSameDayPrinting(): Promise<CatalogProduct[]> {
  const products = await getProducts(1000);
  const normalizeBadge = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sameDayBadgeKeys = new Set(['samedayprinting', 'sameday', '24hourdelivery']);

  const sameDayProducts = products.filter((product) =>
    product.badges.some((badge) => sameDayBadgeKeys.has(normalizeBadge(badge)))
  );

  if (sameDayProducts.length > 0) {
    return sameDayProducts;
  }

  const featured = products.filter((product) => product.isFeatured);
  if (featured.length > 0) {
    return featured.slice(0, 8);
  }

  return products.slice(0, 8);
}

export async function getSeasonalFavorites(): Promise<CatalogProduct[]> {
  const products = await getProducts(1000);
  return products.filter((product) => product.badges.some((badge) => badge.toLowerCase() === 'seasonal'));
}

export async function getDeliveryMarketing(): Promise<CatalogProduct[]> {
  const products = await getProducts(1000);
  return products.filter((product) => product.badges.some((badge) => badge.toLowerCase() === 'deliverymarketing'));
}

export async function getRelatedProducts(productId: string, limit = 3): Promise<CatalogProduct[]> {
  const products = await getProducts(1000);
  const current = products.find((product) => product.id === productId);
  if (!current) {
    return [];
  }

  return products
    .filter((product) => product.categoryIds.some((id) => current.categoryIds.includes(id)) && product.id !== productId)
    .slice(0, limit);
}
