'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Star } from 'lucide-react';
import type { CatalogProduct } from '@/lib/catalog';
import { getCategoryPath } from '@/lib/slug';
import type { RichDescription } from '@/types/rich-content';
import RichContent from '@/components/shared/rich-content';

type ProductHeroProps = {
  product: CatalogProduct;
  category: {
    id: string;
    name: string;
    imageUrl: string;
  };
  primaryImage: string | null;
  productTitle: string;
  productShortDescription: RichDescription;
};

export default function ProductHero({
  product,
  category,
  primaryImage,
  productTitle,
  productShortDescription,
}: ProductHeroProps) {
  const initialImage = primaryImage || category.imageUrl || null;
  const [selectedImage, setSelectedImage] = useState(initialImage);

  const galleryImages = Array.from(new Set([initialImage, ...product.images.map((item) => item.url)]))
    .filter((value): value is string => Boolean(value))
    .slice(0, 8);
  const activeImage = selectedImage && galleryImages.includes(selectedImage) ? selectedImage : initialImage;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
          <div className="relative aspect-square">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={productTitle}
                fill
                priority
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">No image available</div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/25 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-700 text-slate-800">4.9</span>
            </div>
          </div>
        </div>

        {galleryImages.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {galleryImages.map((img, index) => {
              const active = selectedImage === img;
              return (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square overflow-hidden rounded-xl border transition ${
                    active ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  aria-label={`Show image ${index + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${productTitle} thumbnail ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 25vw, 10vw"
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 md:p-6">
        <p className="sans mb-3 text-xs font-700 uppercase tracking-[0.2em] text-cyan-600">{category.name}</p>
        <h1 className="serif mb-5 text-3xl leading-tight font-black text-stone-900 md:text-4xl">{productTitle}</h1>

        <div className="mb-7">
          <RichContent
            content={productShortDescription}
            wrapperClassName="space-y-3"
            textClassName="text-base leading-relaxed text-stone-600"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/contact?category=${encodeURIComponent(category.name)}&product=${encodeURIComponent(product.name)}`}
            className="sans inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-700 text-white transition hover:bg-slate-800"
          >
            Get Quote
          </Link>
          <Link
            href={getCategoryPath(category.id, category.name)}
            className="sans inline-flex items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-700 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            View Category
          </Link>
        </div>
      </div>
    </div>
  );
}
