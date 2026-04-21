import { unstable_cache } from 'next/cache';

import { REVIEW_TAGGED_DATA_REVALIDATE } from '@/lib/catalog-cache-policy';
import {
  createAdminReview,
  createPublicReview,
  deleteAdminReview,
  getAdminReviews,
  getApprovedReviews as getApprovedReviewsRaw,
  setAdminReviewStatus,
  updateAdminReview,
  type ReviewStatus,
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

export const getApprovedReviews = unstable_cache(
  async (limit = 50) => {
    try {
      return await getApprovedReviewsRaw(limit);
    } catch (error) {
      if (isCatalogUnavailableError(error)) {
        return [];
      }
      throw error;
    }
  },
  ['approved-reviews'],
  {
    revalidate: REVIEW_TAGGED_DATA_REVALIDATE,
    tags: ['reviews'],
  }
);

export {
  createAdminReview,
  createPublicReview,
  deleteAdminReview,
  getAdminReviews,
  setAdminReviewStatus,
  updateAdminReview,
  type ReviewStatus,
};
