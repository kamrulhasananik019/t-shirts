import DiscountsAndPackagesSlider from '@/components/Home/discountsandpackages-slider';
import { richContentToPlainText } from '@/lib/rich-content';
import { toSlug } from '@/lib/slug';
import { getCategories } from '@/services/category.service';
import { getProductsByCategoryId } from '@/services/product.service';

export default async function DiscountsAndPackages() {
  const categories = await getCategories();
  const dealsCategory = categories.find((category) => {
    const normalizedName = category.name.trim().toLowerCase();
    const normalizedSlug = category.slug.trim().toLowerCase();
    const desired = 'deals and discounts';
    return normalizedName === desired || normalizedSlug === toSlug(desired);
  });

  const products = dealsCategory ? await getProductsByCategoryId(dealsCategory.id, 24) : [];
  const sliderItems = products.map((product) => {
    const description = richContentToPlainText(product.shortDescription) || richContentToPlainText(product.description) || '';
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      label: 'Deals & Discounts',
      description,
      imageUrl: product.images[0]?.url || dealsCategory?.image.url || null,
    };
  });

  return (
    <section className="bg-stone-50 py-16 font-sans lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
              Special Offers
            </span>

            <h2 className="font-serif text-3xl font-bold leading-tight text-stone-900 sm:text-4xl lg:text-5xl">
              Discounts & Packages
            </h2>
          </div>
        </div>

        <DiscountsAndPackagesSlider items={sliderItems} />
      </div>
    </section>
  );
}