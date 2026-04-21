'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

import { getSafeImageSrc } from '@/lib/image-url';
import { getProductPath } from '@/lib/slug';

type DealsDiscountItem = {
  id: string;
  slug: string;
  name: string;
  label: string;
  description: string;
  imageUrl?: string | null;
};

type DiscountsAndPackagesSliderProps = {
  items: DealsDiscountItem[];
};

export default function DiscountsAndPackagesSlider({ items }: DiscountsAndPackagesSliderProps) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
        No deals available right now.
      </div>
    );
  }

  const canLoop = items.length > 1;

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          aria-label="Previous"
          className="deals-prev flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 text-stone-900 transition hover:bg-stone-900 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          aria-label="Next"
          className="deals-next flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 text-stone-900 transition hover:bg-stone-900 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <Swiper
        modules={[Navigation, Autoplay, Pagination]}
        navigation={{
          prevEl: '.deals-prev',
          nextEl: '.deals-next',
        }}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 4200,
          disableOnInteraction: false,
        }}
        loop={canLoop}
        centeredSlides={false}
        spaceBetween={18}
        slidesPerGroup={1}
        breakpoints={{
          0: { slidesPerView: 1, slidesPerGroup: 1 },
          768: { slidesPerView: 2, slidesPerGroup: 1 },
          1024: { slidesPerView: 3, slidesPerGroup: 1 },
        }}
        className="overflow-hidden! pb-4"
      >
        {items.map((card) => {
          const imageSrc = getSafeImageSrc(card.imageUrl);
          return (
            <SwiperSlide key={card.id} className="h-auto w-full">
              <Link
                href={getProductPath(card.id, card.name, card.slug)}
                prefetch={false}
                className="group relative isolate block h-full w-full min-h-60 overflow-hidden rounded-sm border border-[#d9d9d9] bg-[#f2f2f2] text-left text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:min-h-64"
              >
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={card.name}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-[#0a72b2] to-[#2d92d1]" />
                )}

                <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/25 to-transparent" />

                <div className="relative flex h-full flex-col justify-end p-6 sm:p-7">
                  <div>
                    <p className="text-2xl font-black leading-none tracking-tight text-white sm:text-5xl">SAVE ON</p>
                    <p className="mt-1 font-serif text-3xl font-bold italic leading-none text-[#F0D542] sm:text-4xl">
                      {card.name}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

