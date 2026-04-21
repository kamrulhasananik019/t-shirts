'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CatalogProduct } from '@/lib/catalog';
import { getSafeImageSrc } from '@/lib/image-url';
import { getPrimaryImage } from '@/lib/product-media';
import { getProductPath } from '@/lib/slug';

type DeliveryMarketingProps = {
  products: CatalogProduct[];
  productCategoryTitles: Record<string, string>;
};

export default function DeliveryMarketing({
  products,
  productCategoryTitles,
}: DeliveryMarketingProps) {
  const canLoop = products.length >= 5;

  return (
    <section className="relative overflow-hidden bg-stone-50 py-16 lg:py-20">
      <div className="absolute -left-40 -bottom-20 h-105 w-105 rounded-full bg-linear-to-br from-emerald-200/40 to-transparent blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
              Delivery Growth
            </span>

            <h2 className="font-serif text-3xl font-bold leading-tight text-stone-900 sm:text-4xl lg:text-5xl">
              Delivery Marketing Services in London & Across the UK
            </h2>

            <p className="mt-2 text-base text-stone-600">
              Targeted print products for leaflet drops, direct mail campaigns, and local promotion delivery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Previous"
              className="delivery-prev flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-900 transition-all duration-300 hover:bg-stone-900 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              aria-label="Next"
              className="delivery-next flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-900 transition-all duration-300 hover:bg-stone-900 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            prevEl: '.delivery-prev',
            nextEl: '.delivery-next',
          }}
          autoplay={{
            delay: 3200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={canLoop}
          spaceBetween={20}
          breakpoints={{
            0: {
              slidesPerView: 1.1,
            },
            480: {
              slidesPerView: 1.5,
            },
            640: {
              slidesPerView: 2,
            },
            768: {
              slidesPerView: 2.4,
            },
            1024: {
              slidesPerView: 3,
            },
            1280: {
              slidesPerView: 4,
            },
          }}
          className="overflow-visible!"
        >
          {products.map((product) => (
            <SwiperSlide
              key={product.id}
              className="flex! h-auto justify-center"
            >
              <Link
                href={getProductPath(product.id, product.name, product.slug)}
                className="block w-full max-w-87.5"
              >
                <div className="group flex h-full flex-col">
                  <div className="relative mb-4 h-90 overflow-hidden rounded-3xl bg-stone-200 sm:h-95 lg:h-100">
                    {getSafeImageSrc(getPrimaryImage(product)) ? (
                      <Image
                        src={getSafeImageSrc(getPrimaryImage(product))!}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">
                        No image
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
                      Marketing
                    </div>

                    <div className="absolute inset-0 flex items-end bg-linear-to-t from-stone-900/60 via-stone-900/10 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-white">
                        View Details
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col">
                    <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-snug text-stone-900">
                      {product.name}
                    </h3>

                    {productCategoryTitles[product.id] && (
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-500">
                        {productCategoryTitles[product.id]}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}