import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ProductHero from '@/components/product/product-hero';
import InfiniteMarquee from '@/components/shared/infinite-marquee';
import { siteUrl } from '@/lib/site';
import { getSafeImageSrc } from '@/lib/image-url';
import { getPrimaryImage } from '@/lib/product-media';
import { richContentToPlainText } from '@/lib/rich-content';
import RichContent from '@/components/shared/rich-content';
import { getCategoryPath, getProductPath } from '@/lib/slug';
import { getCategories, getCategoryById } from '@/services/category.service';
import { getProductById, getProducts, getProductsByCategoryId } from '@/services/product.service';

/** On-demand static generation: first visit builds and caches; no build-time enumeration of all SKUs. Must be a literal for Next segment config (see `CATALOG_PAGE_REVALIDATE_SECONDS`). */
export const revalidate = 604800;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductById(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }

  const category = await getCategoryById(product.categoryIds[0] ?? '');
  const productImage = getPrimaryImage(product) || category?.image.url || '';
  const productDescription = richContentToPlainText(product.shortDescription) || richContentToPlainText(product.description);
  const canonicalPath = getProductPath(product.id, product.name, product.slug);
  const seoTitle = product.seo?.title || `${product.name} T-Shirt Printing UK`;
  const seoDescription =
    product.seo?.description || `${productDescription} Request a quote for ${product.name.toLowerCase()} t-shirt printing in the UK with same day delivery options.`;
  const seoKeywords = product.seo?.keywords?.length
    ? product.seo.keywords
    : [product.name.toLowerCase(), `${product.name.toLowerCase()} t-shirt printing`, 't-shirt printing uk', 'same day t-shirt printing'];
  const seoImage = product.seo?.image || productImage;

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
      images: [{ url: seoImage, alt: product.name }],
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

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await getProductById(slug);
  if (!product) {
    notFound();
  }

  const canonicalPath = getProductPath(product.id, product.name, product.slug);
  if (slug !== canonicalPath.split('/').pop()) {
    redirect(canonicalPath);
  }

  const category = await getCategoryById(product.categoryIds[0] ?? '');
  if (!category) {
    notFound();
  }

  const [allCategories, categoryProducts, allProducts] = await Promise.all([
    getCategories(),
    getProductsByCategoryId(category.id, 4),
    getProducts(240),
  ]);
  const related = categoryProducts.filter((item) => item.id !== product.id).slice(0, 3);
  const safeCategoryImage = getSafeImageSrc(category.image.url);

  const categoryNameById = new Map(allCategories.map((cat) => [cat.id, cat.name]));
  const otherCategoryProducts = allProducts
    .filter((item) => item.id !== product.id)
    .map((item) => {
      const fallbackCategoryId = item.categoryIds?.find((id) => id !== category.id) ?? item.categoryIds?.[0];
      const categoryName = fallbackCategoryId ? categoryNameById.get(fallbackCategoryId) : undefined;
      return categoryName && fallbackCategoryId !== category.id ? { ...item, categoryName } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 6);

  const primaryImage = getPrimaryImage(product) || category.image.url;
  const safePrimaryImage = primaryImage || null;
  const galleryImages = Array.from(new Set([primaryImage, ...product.images.map((item) => item.url)])).filter(Boolean).slice(0, 6);
  const categoryNames = allCategories.map((cat) => cat.name);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: richContentToPlainText(product.shortDescription) || richContentToPlainText(product.description),
    category: category.name,
    image: galleryImages.length > 0 ? galleryImages : [primaryImage],
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Prime Prints',
    },
    url: `${siteUrl}${canonicalPath}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: `${siteUrl}${getCategoryPath(category.id, category.name)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${siteUrl}${getProductPath(product.id, product.name, product.slug)}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <div className="sticky top-0 z-20 border-b border-[#F0D542]/25 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href={getCategoryPath(category.id, category.name)} prefetch={false} className="sans flex items-center gap-2 text-sm font-500 text-[#0a72b2] transition-colors hover:text-[#0a72b2]">
            Back to {category.name}
          </Link>
          <span className="rounded-lg bg-[#F8F8F8] px-3 py-1 text-xs font-600 uppercase tracking-wider text-[#0a72b2]">{category.name}</span>
        </div>
      </div>

      <div>
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <ProductHero
            product={product}
            category={{ id: category.id, name: category.name, imageUrl: safeCategoryImage || '' }}
            primaryImage={safePrimaryImage}
            productTitle={product.name}
            productShortDescription={product.shortDescription || product.description}
          />
        </div>

        <div className="mt-10">
          <InfiniteMarquee bottomItems={categoryNames} />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="mt-10 rounded-2xl border border-[#F8F8F8] bg-white p-6 md:p-8">
            <h2 className="serif mb-4 text-2xl font-black text-[#0a72b2]">More Details</h2>
            <RichContent content={product.description} textClassName="sans text-base leading-relaxed text-[#0a72b2]" />
          </div>

          {related.length > 0 && (
            <div className="mt-16 border-t border-[#F8F8F8] pt-12">
              <div className="mb-10 flex items-center gap-4">
                <h2 className="serif text-3xl font-black text-[#0a72b2]">You Might Also Like</h2>
                <div className="h-px flex-1 bg-linear-to-r from-[#F0D542]/45 to-transparent" />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {related.map((rel) => (
                  <Link key={rel.id} href={getProductPath(rel.id, rel.name, rel.slug)} prefetch={false} className="group block">
                    <div className="group cursor-pointer rounded-2xl border border-[#F8F8F8] bg-white p-3 transition hover:border-[#F0D542]/40 hover:shadow-sm">
                      <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-stone-200">
                        {getSafeImageSrc(getPrimaryImage(rel) || category.image.url) ? (
                          <Image
                            src={getSafeImageSrc(getPrimaryImage(rel) || category.image.url)!}
                            alt={rel.name}
                            width={800}
                            height={800}
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">No image</div>
                        )}
                      </div>
                      <h3 className="serif text-xl font-bold leading-tight text-[#0a72b2] transition-colors group-hover:text-[#0a72b2]">{rel.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {otherCategoryProducts.length > 0 && (
            <div className="mt-16 border-t border-[#F8F8F8] pt-12">
              <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="sans mb-2 text-xs font-700 uppercase tracking-[0.2em] text-[#0a72b2]">Discover More</p>
                  <h2 className="serif text-3xl font-black text-[#0a72b2]">Explore Products From Other Categories</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {otherCategoryProducts.map((item) => (
                  <Link key={item.id} href={getProductPath(item.id, item.name, item.slug)} prefetch={false} className="group block">
                    <div className="group cursor-pointer rounded-2xl border border-[#F8F8F8] bg-white p-3 transition hover:border-[#F0D542]/40 hover:shadow-sm">
                      <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-stone-200">
                        {getSafeImageSrc(getPrimaryImage(item) || category.image.url) ? (
                          <Image
                            src={getSafeImageSrc(getPrimaryImage(item) || category.image.url)!}
                            alt={item.name}
                            width={800}
                            height={800}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">No image</div>
                        )}
                        <span className="sans absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#0a72b2] backdrop-blur">
                          {item.categoryName}
                        </span>
                      </div>
                      <h3 className="serif text-xl font-bold leading-tight text-[#0a72b2] transition-colors group-hover:text-[#0a72b2]">{item.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
