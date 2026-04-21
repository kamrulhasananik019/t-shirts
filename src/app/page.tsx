import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import DiscountsAndPackages from "@/components/Home/discountsandpackages";
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
  title: "Same Day T-Shirt Printing UK | Prime Prints",
  description:
    "Prime Prints provides custom t-shirt printing in the UK with same day printing and fast delivery for urgent orders.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Prime Prints | Same Day T-Shirt Printing UK",
    description:
      "Custom UK t-shirt printing with same day print turnaround and reliable delivery.",
    url: "/",
    type: "website",
    siteName: "Prime Prints",
    images: [
      {
        url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1600&q=80",
        width: 1600,
        height: 900,
        alt: "Prime Prints same day t-shirt printing UK",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Prints | Same Day T-Shirt Printing UK",
    description:
      "UK custom t-shirt printing with same day service and fast delivery.",
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
       <PromoBar />
      <CategorySlider categories={categories} />
      {/* <Banner /> */}

      <div className="">
        <InfiniteMarquee bottomItems={categoryTitles} />
      </div>

      <SameDayPrinting products={sameDayPrinting} productCategoryTitles={sameDayCategoryTitles} />
      <DiscountsAndPackages />
     
      <Faq />
      <Reviews />
       <section className="bg-stone-50 py-14 md:py-18">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="bg-linear-to-r from-[#0a72b2] via-[#F0D542] to-[#0a72b2] p-8 text-white md:p-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">Need Printing Fast?</p>
              <h2 className="max-w-3xl font-serif text-3xl font-black leading-tight md:text-4xl">
                Choose a quick quote or fast delivery path in seconds.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cyan-50 md:text-base">
                From one-off custom tees to bulk branded orders, we help you choose the right t-shirt style, print finish, and same-day turnaround.
              </p>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-stone-200 bg-stone-50 p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a72b2]">Quote</p>
                  <h3 className="mt-3 text-2xl font-black text-stone-900">Request a fast print quote</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">
                    Tell us what you need and get practical guidance on pricing, materials, and production timing.
                  </p>
                </div>
                <Link
                  href="/contact"
                  prefetch={false}
                  className="mt-6 inline-flex w-fit items-center justify-center rounded-xl bg-[#0a72b2] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#F0D542]"
                >
                  Get a Quote
                </Link>
              </div>

              <div className="flex h-full flex-col justify-between rounded-2xl border border-[#F8F8F8] bg-[#F8F8F8] p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a72b2]">Delivery</p>
                  <h3 className="mt-3 text-2xl font-black text-stone-900">Arrange same day delivery</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">
                    Perfect for urgent jobs that need fast turnaround and dependable delivery across London and the UK.
                  </p>
                </div>
                <Link
                  href="/contact?intent=order"
                  prefetch={false}
                  className="mt-6 inline-flex w-fit items-center justify-center rounded-xl border border-[#0a72b2] px-6 py-3 text-sm font-bold text-[#0a72b2] transition hover:bg-[#0a72b2] hover:text-white"
                >
                  Delivery Help
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <LocationMap />
    </main>
  );
}
