import { unstable_cache } from 'next/cache';

import { FAQ_TAGGED_DATA_REVALIDATE } from '@/lib/catalog-cache-policy';
import {
  createAdminFaq,
  deleteAdminFaq,
  getAdminFaqs,
  getFaqs as getFaqsRaw,
  updateAdminFaq,
} from '@/lib/mongo-catalog';

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

export const getFaqs = unstable_cache(
  async (limit = 50) => {
    try {
      return await getFaqsRaw(limit);
    } catch (error) {
      if (isCatalogUnavailableError(error)) {
        return [];
      }
      throw error;
    }
  },
  ['faqs'],
  {
    revalidate: FAQ_TAGGED_DATA_REVALIDATE,
    tags: ['faqs'],
  }
);

export {
  createAdminFaq,
  deleteAdminFaq,
  getAdminFaqs,
  updateAdminFaq,
};
