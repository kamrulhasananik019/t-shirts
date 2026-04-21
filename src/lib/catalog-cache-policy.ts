/**
 * ISR window for catalog HTML routes (`products/[slug]`, `categories/[slug]`).
 * Next.js requires `export const revalidate` on those pages to be a numeric literal, so keep
 * this value in sync with the `604800` literals there. Admin routes call `revalidateTag('catalog')`
 * so content can refresh before this interval elapses.
 */
export const CATALOG_PAGE_REVALIDATE_SECONDS = 604800;

/**
 * Mongo-backed catalog data cached with `unstable_cache` + `tags: ['catalog']`.
 * `false` disables time-based refresh; only `revalidateTag('catalog', …)` from admin APIs updates it.
 */
export const CATALOG_TAGGED_DATA_REVALIDATE = false;

/**
 * FAQ data cached with `unstable_cache` + `tags: ['faqs']`.
 * Refreshes every 7 days, and can be refreshed sooner via `revalidateTag('faqs', …)` from admin APIs.
 */
export const FAQ_TAGGED_DATA_REVALIDATE = 604800;

/**
 * Review data cached with `unstable_cache` + `tags: ['reviews']`.
 * Refreshes every 7 days, and can be refreshed sooner via `revalidateTag('reviews', …)` from admin APIs.
 */
export const REVIEW_TAGGED_DATA_REVALIDATE = 604800;
