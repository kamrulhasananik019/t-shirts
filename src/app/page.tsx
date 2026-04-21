import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import DiscountsAndPackages from "@/components/Home/discountsandpackages";
import Banner from "@/components/Home/banner";
import HomeDeferredFallback from "@/components/Home/home-deferred-fallback";
import Faq from "@/components/Home/faq";
import LocationMap from "@/components/Home/locationmap";
import PromoBar from "@/components/Home/promobar";
import Reviews from "@/components/Home/reviews";
import InfiniteMarquee from "@/components/shared/infinite-marquee";
import { getCategories } from "@/services/category.service";
import { getProductCategoryTitleMap, getSameDayPrinting } from "@/services/product.service";

const CategorySlider = nextDynamic(() => import("@/components/Home/categoryslider"), {
  loading: () => <HomeDeferredFallback minHeight="min-h-[420px]" />,
});

const SameDayPrinting = nextDynamic(() => import("@/components/Home/samedaydelivery"), {
  loading: () => <HomeDeferredFallback minHeight="min-h-[420px]" />,
});

/** Cache home page for 1 week; invalidated only by admin product/category changes */
export const revalidate = 604800;

export const metadata: Metadata = {
  title: "Same Day Delivery in London & UK | Prime Prints",
  description:
    "Prime Prints offers same day delivery in London and across the UK with 24-hour delivery for business cards, flyers, posters, banners, and custom print products.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Prime Prints | Same Day Delivery in London & UK",
    description:
      "Fast, premium printing with same day delivery in London and 24-hour UK delivery options.",
    url: "/",
    type: "website",
    siteName: "Prime Prints",
    images: [
      {
        url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1600&q=80",
        width: 1600,
        height: 900,
        alt: "Prime Prints same day printing and delivery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Prints | Same Day Delivery in London & UK",
    description:
      "Fast, premium printing with same day delivery in London and 24-hour UK delivery options.",
    images: ["https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1600&q=80"],
  },
};


export default async function Home() {
  const categories = await getCategories();
  const sameDayPrinting = await getSameDayPrinting();
  const sameDayCategoryTitles = getProductCategoryTitleMap(sameDayPrinting, categories);
  const categoryTitles = categories.map((cat) => cat.name);

  return (
    <main className="overflow-hidden bg-stone-50 font-sans">
      <Banner />

      <div className="">
        <InfiniteMarquee bottomItems={categoryTitles} />
      </div>

      <PromoBar />
      <CategorySlider categories={categories} />
      <SameDayPrinting products={sameDayPrinting} productCategoryTitles={sameDayCategoryTitles} />
      <DiscountsAndPackages />
      <section className="bg-stone-50 py-14 md:py-18">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="bg-linear-to-r from-[#2E4210] via-[#F0D542] to-[#55692F] p-8 text-white md:p-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">Need Printing Fast?</p>
              <h2 className="max-w-3xl font-serif text-3xl font-black leading-tight md:text-4xl">
                Choose a quick quote or fast delivery path in seconds.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cyan-50 md:text-base">
                From business cards to large format prints, we help you choose the right product, finish, and turnaround for your deadline.
              </p>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-stone-200 bg-stone-50 p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2E4210]">Quote</p>
                  <h3 className="mt-3 text-2xl font-black text-stone-900">Request a fast print quote</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">
                    Tell us what you need and get practical guidance on pricing, materials, and production timing.
                  </p>
                </div>
                <Link
                  href="/contact"
                  prefetch={false}
                  className="mt-6 inline-flex w-fit items-center justify-center rounded-xl bg-[#2E4210] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#F0D542]"
                >
                  Get a Quote
                </Link>
              </div>

              <div className="flex h-full flex-col justify-between rounded-2xl border border-[#F8F8F8] bg-[#F8F8F8] p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2E4210]">Delivery</p>
                  <h3 className="mt-3 text-2xl font-black text-stone-900">Arrange same day delivery</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">
                    Perfect for urgent jobs that need fast turnaround and dependable delivery across London and the UK.
                  </p>
                </div>
                <Link
                  href="/contact?intent=order"
                  prefetch={false}
                  className="mt-6 inline-flex w-fit items-center justify-center rounded-xl border border-[#2E4210] px-6 py-3 text-sm font-bold text-[#2E4210] transition hover:bg-[#2E4210] hover:text-white"
                >
                  Delivery Help
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Faq />
      <Reviews />
      <LocationMap />
    </main>
  );
}
