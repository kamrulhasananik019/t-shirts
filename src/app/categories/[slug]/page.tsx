import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cache } from 'react';
import { getCategories, getCategoryById } from '@/services/category.service';
import { getProductsByCategoryId } from '@/services/product.service';
import InfiniteMarquee from '@/components/shared/infinite-marquee';
import { getSafeImageSrc } from '@/lib/image-url';
import { getPrimaryImage } from '@/lib/product-media';
import RichContent from '@/components/shared/rich-content';
import { richContentToPlainText } from '@/lib/rich-content';
import { getCategoryPath, getProductPath, toSlug } from '@/lib/slug';
import { siteUrl } from '@/lib/site';

/** First visit generates the page; long ISR window limits background regeneration writes. Must be a literal for Next segment config (see `CATALOG_PAGE_REVALIDATE_SECONDS`). */
export const revalidate = 604800;

const getCategoryBySlugCached = cache(async (slug: string) => getCategoryById(slug));
const getCategoriesCached = cache(async () => getCategories());
const getProductsByCategoryCached = cache(async (categoryId: string) => getProductsByCategoryId(categoryId, 200));

/** Category count is small; prebuild avoids cold-start on popular category URLs. */
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: toSlug(category.name) || category.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlugCached(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      robots: { index: false, follow: false },
    };
  }

  const categoryShortDescription = richContentToPlainText(category.shortDescription);
  const categoryDescription = richContentToPlainText(category.description);
  const categorySummary = categoryShortDescription || categoryDescription;
  const canonicalPath = getCategoryPath(category.id, category.name);
  const seoTitle = category.seo?.title || `${category.name} T-Shirt Printing UK`;
  const seoDescription =
    category.seo?.description || `${categorySummary} Explore options and request a quote for ${category.name.toLowerCase()} t-shirt printing in the UK with same day turnaround.`;
  const seoKeywords = category.seo?.keywords?.length
    ? category.seo.keywords
    : [`${category.name.toLowerCase()} t-shirt printing`, 't-shirt printing uk', 'same day t-shirt printing', category.name.toLowerCase()];
  const seoImage = category.seo?.image || category.image.url;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalPath,
    },
    keywords: seoKeywords,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalPath,
      siteName: 'Prime Prints',
      images: [{ url: seoImage, alt: category.image.alt || category.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [seoImage],
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlugCached(slug);

  if (!category) {
    notFound();
  }

  const canonicalPath = getCategoryPath(category.id, category.name);
  if (slug !== canonicalPath.split('/').pop()) {
    redirect(canonicalPath);
  }

  const [products, categories] = await Promise.all([
    getProductsByCategoryCached(category.id),
    getCategoriesCached(),
  ]);

  const categorySummary = category.shortDescription?.content?.length ? category.shortDescription : category.description;
  const categorySummaryText = richContentToPlainText(categorySummary);
  const safeCategoryImage = getSafeImageSrc(category.image.url);

  const categoryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} T-Shirt Printing UK`,
    description: categorySummaryText,
    url: `${siteUrl}${canonicalPath}`,
    about: {
      '@type': 'Thing',
      name: category.name,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}${getProductPath(product.id, product.name, product.slug)}`,
        name: product.name,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
      <div className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#55692F] transition hover:text-[#2E4210]">
            <span>←</span> Back to Home
          </Link>
        </div>
      </div>

      <div className="border-b border-[#F0D542]/25 bg-white">
        <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#2E4210] sm:text-4xl lg:text-5xl">{category.name}</h1>
              <RichContent
                content={categorySummary}
                wrapperClassName="mt-4 max-w-xl"
                textClassName="text-base leading-relaxed text-[#55692F]"
              />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#55692F]">{products.length} products available</p>
              <div className="mt-6">
                <Link
                  href={`/contact?category=${encodeURIComponent(category.name)}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2E4210] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#55692F]"
                >
                  Get Quote
                </Link>
              </div>
            </div>
            <div className="aspect-16/11 overflow-hidden rounded-2xl border border-[#F8F8F8] bg-[#F8F8F8]">
              {safeCategoryImage ? (
                <Image
                  src={safeCategoryImage}
                  alt={category.image.alt || category.name}
                  width={1200}
                  height={825}
                  priority
                  loading="eager"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">
                  No image
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <InfiniteMarquee bottomItems={categories.map((cat) => cat.name)} />
      </div>

      <div className="border-b border-[#F8F8F8] bg-white">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <RichContent
            content={category.description}
            wrapperClassName=""
            textClassName="text-base leading-relaxed text-[#55692F]"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-14 sm:px-6 lg:px-8">
        {products.length > 0 && (
          <div>
            <h2 className="mb-2 font-serif text-3xl font-bold text-[#2E4210] sm:text-4xl">Products in {category.name}</h2>
            <p className="mb-8 text-sm text-[#55692F]">Click any product to view full details and image gallery.</p>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <Link key={product.id} href={getProductPath(product.id, product.name, product.slug)} prefetch={false}>
                  <div className="group cursor-pointer rounded-2xl border border-[#F8F8F8] bg-white p-3 transition hover:border-[#F0D542]/40 hover:shadow-sm">
                    <div className="relative mb-4 aspect-4/5 overflow-hidden rounded-2xl bg-stone-200">
                      {getSafeImageSrc(getPrimaryImage(product) || category.image.url) ? (
                        <Image
                          src={getSafeImageSrc(getPrimaryImage(product) || category.image.url)!}
                          alt={product.name}
                          width={800}
                          height={1000}
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">
                          No image
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/45 via-black/5 to-transparent p-5 opacity-0 transition duration-300 group-hover:opacity-100">
                        <span className="text-sm font-medium text-white">View Details</span>
                      </div>
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-[#2E4210]">{product.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className="rounded-2xl border border-[#F8F8F8] bg-white p-10 text-center">
            <p className="text-lg text-[#55692F]">No products available in this category yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
