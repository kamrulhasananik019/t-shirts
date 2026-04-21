import { unstable_cache } from 'next/cache';

import { CATALOG_TAGGED_DATA_REVALIDATE } from '@/lib/catalog-cache-policy';
import {
  createAdminProduct,
  deleteAdminProduct,
  getProductNavEntries as getProductNavEntriesRaw,
  getAdminProducts,
  getProductById as getProductByIdRaw,
  getProducts as getProductsRaw,
  getProductsByCategoryId as getProductsByCategoryIdRaw,
  resolveCategoryIds,
  updateAdminProduct,
} from '@/lib/mongo-catalog';
import {
  getLatestProducts,
  getProductCategoryTitleMap,
  getRelatedProducts as getRelatedProductsRaw,
  getSameDayPrinting as getSameDayPrintingRaw,
} from '@/lib/catalog';

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

export const getProducts = unstable_cache(async (limit = 100) => {
  try {
    return await getProductsRaw(limit);
  } catch (error) {
    if (isCatalogUnavailableError(error)) {
      return [];
    }
    throw error;
  }
}, ['products'], {
  revalidate: CATALOG_TAGGED_DATA_REVALIDATE,
  tags: ['catalog'],
});

export const getProductById = unstable_cache(
  async (id: string) => {
    try {
      return await getProductByIdRaw(id);
    } catch (error) {
      if (isCatalogUnavailableError(error)) {
        return null;
      }
      throw error;
    }
  },
  ['product-by-id'],
  {
    revalidate: CATALOG_TAGGED_DATA_REVALIDATE,
    tags: ['catalog'],
  }
);

export const getProductsByCategoryId = unstable_cache(
  async (categoryId: string, limit = 100) => {
    try {
      return await getProductsByCategoryIdRaw(categoryId, limit);
    } catch (error) {
      if (isCatalogUnavailableError(error)) {
        return [];
      }
      throw error;
    }
  },
  ['products-by-category'],
  { revalidate: CATALOG_TAGGED_DATA_REVALIDATE, tags: ['catalog'] }
);

export const getRelatedProducts = unstable_cache(
  async (productId: string, limit = 3) => {
    try {
      return await getRelatedProductsRaw(productId, limit);
    } catch (error) {
      if (isCatalogUnavailableError(error)) {
        return [];
      }
      throw error;
    }
  },
  ['related-products'],
  { revalidate: CATALOG_TAGGED_DATA_REVALIDATE, tags: ['catalog'] }
);

export const getProductNavEntries = unstable_cache(
  async (limit = 200) => {
    try {
      return await getProductNavEntriesRaw(limit);
    } catch (error) {
      if (isCatalogUnavailableError(error)) {
        return [];
      }
      throw error;
    }
  },
  ['product-nav-entries'],
  { revalidate: CATALOG_TAGGED_DATA_REVALIDATE, tags: ['catalog'] }
);

export const getSameDayPrinting = unstable_cache(
  async () => {
    try {
      return await getSameDayPrintingRaw();
    } catch (error) {
      if (isCatalogUnavailableError(error)) {
        return [];
      }
      throw error;
    }
  },
  ['same-day-printing'],
  {
    revalidate: CATALOG_TAGGED_DATA_REVALIDATE,
    tags: ['catalog'],
  }
);

export {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  getLatestProducts,
  getProductCategoryTitleMap,
  resolveCategoryIds,
  updateAdminProduct,
};
