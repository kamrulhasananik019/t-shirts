import type { Metadata } from 'next';
import Link from 'next/link';
import ReviewsPanel from '@/components/reviews/reviews-panel';
import { siteUrl } from '@/lib/site';
import { getApprovedReviews } from '@/services/review.service';

/** Cache reviews page for 1 week; invalidated only by admin review changes via revalidateTag('reviews') */
export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'Customer Reviews | Prime Prints',
  description:
    'Read what our customers say about Prime Prints printing services, quality, delivery, and customer support.',
  alternates: {
    canonical: '/reviews',
  },
  openGraph: {
    title: 'Customer Reviews | Prime Prints',
    description:
      'Discover customer testimonials and ratings for Prime Prints printing services.',
    url: '/reviews',
    type: 'website',
    siteName: 'Prime Prints',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Reviews | Prime Prints',
    description:
      'See what customers say about our printing quality and service.',
  },
};

export default async function ReviewsPage() {
  const reviews = await getApprovedReviews(100);

  const aggregateRating =
    reviews.length > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
          reviewCount: reviews.length,
        }
      : null;

  const reviewsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Prime Prints',
    url: siteUrl,
    ...(aggregateRating && { aggregateRating }),
    review: reviews.slice(0, 10).map((review) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
      },
      reviewBody: review.text,
      author: {
        '@type': 'Person',
        name: review.name,
      },
    })),
  };

  const averageRating =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-stone-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsJsonLd) }} />

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-12 max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900 mb-6"
          >
            <span>←</span> Back to Home
          </Link>
          <h1 className="font-serif text-4xl font-bold leading-tight text-stone-900 sm:text-5xl">
            Customer Reviews
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Read what our customers say about Prime Prints printing quality, delivery, and service.
          </p>
          {reviews.length > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">
                    {i < Math.round(parseFloat(averageRating)) ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
              <span className="text-sm font-medium text-stone-600">
                {averageRating} out of 5 based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div>
          {reviews.length > 0 ? (
            <ReviewsPanel initialReviews={reviews} />
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-stone-600">No reviews have been published yet.</p>
            </div>
          )}
        </div>

        <div className="mt-16 rounded-2xl border border-stone-200 bg-white p-8 text-center md:p-10">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Share your experience</h2>
          <p className="mt-3 text-sm text-stone-600">
            Have you used Prime Prints? We&apos;d love to hear about your experience.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
