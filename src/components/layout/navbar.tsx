'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Menu,
  Phone,
  Search,
  X,
} from 'lucide-react';
import type { NavCategory } from '@/lib/catalog';
import { richContentToPlainText } from '@/lib/rich-content';
import { getCategoryPath, getProductPath } from '@/lib/slug';
import { getSafeImageSrc } from '@/lib/image-url';

type NavbarProps = {
  categories: NavCategory[];
};

function chunkProducts<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  if (!items?.length) return chunks;
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function scoreSearchField(value: string | undefined, query: string, weight: number) {
  const normalizedValue = normalizeSearchText(value || '');
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedValue || !normalizedQuery) return 0;
  if (normalizedValue === normalizedQuery) return weight * 4;
  if (normalizedValue.startsWith(normalizedQuery)) return weight * 3;
  if (normalizedValue.includes(normalizedQuery)) return weight * 2;

  let score = 0;
  for (const term of normalizedQuery.split(' ')) {
    if (term && normalizedValue.includes(term)) {
      score += weight * 0.35;
    }
  }

  return score;
}

export default function Navbar({ categories }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [mobileActiveSlug, setMobileActiveSlug] = useState<string | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLUListElement | null>(null);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 20);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const scrollCategories = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -260 : 260;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const openMegaMenu = (slug: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveSlug(slug);
  };

  const closeMegaMenu = () => {
    closeTimerRef.current = setTimeout(() => {
      setActiveSlug(null);
    }, 160);
  };

  const activeCategory = useMemo(
    () => categories.find((cat) => cat.id === activeSlug) ?? null,
    [activeSlug, categories]
  );

  const activeCategoryDescription = activeCategory
    ? activeCategory.seo?.description?.trim() || richContentToPlainText(activeCategory.description)
    : '';

  const searchResults = useMemo(() => {
    const text = query.trim();
    if (!text) return [];

    const results: Array<{ label: string; href: string; type: 'category' | 'product'; score: number }> = [];

    const scoreCategory = (category: NavCategory) => {
      const statusText = category.isActive ? 'active' : 'hidden';
      return (
        scoreSearchField(category.name, text, 100) +
        scoreSearchField(category.seo?.title, text, 70) +
        scoreSearchField(category.shortDescription ? richContentToPlainText(category.shortDescription) : '', text, 60) +
        scoreSearchField(richContentToPlainText(category.description), text, 45) +
        scoreSearchField(category.seo?.description, text, 30) +
        scoreSearchField(statusText, text, 25)
      );
    };

    const scoreProduct = (product: NavCategory['products'][number]) => {
      const statusText = product.isActive ? 'active' : 'hidden';
      const badgeText = product.badges.join(' ');
      const featuredText = product.isFeatured ? 'featured' : '';

      return (
        scoreSearchField(product.name, text, 100) +
        scoreSearchField(product.seo?.title, text, 70) +
        scoreSearchField(product.shortDescription ? richContentToPlainText(product.shortDescription) : '', text, 60) +
        scoreSearchField(product.seo?.description, text, 30) +
        scoreSearchField(badgeText, text, 35) +
        scoreSearchField(statusText, text, 25) +
        scoreSearchField(featuredText, text, 15)
      );
    };

    for (const category of categories) {
      const categoryScore = scoreCategory(category);
      if (categoryScore > 0) {
        results.push({
          label: category.name,
          href: getCategoryPath(category.id, category.name),
          type: 'category',
          score: categoryScore,
        });
      }
      for (const product of category.products) {
        const productScore = scoreProduct(product);
        if (productScore > 0) {
          results.push({
            label: product.name,
            href: getProductPath(product.id, product.name, product.slug),
            type: 'product',
            score: productScore,
          });
        }
      }
    }

    return results.sort((left, right) => right.score - left.score).slice(0, 8);
  }, [query, categories]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const first = searchResults[0];
    if (!first) return;
    router.push(first.href);
    setQuery('');
    setSearchFocused(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="sticky top-0 z-50 bg-[#F8F8F8]">
      <div className="hidden border-b border-[#F0D542]/30 bg-[#2E4210] py-2 lg:block">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 text-[11px] font-medium uppercase tracking-wider text-[#F8F8F8] sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-6">
            <a href="mailto:order@primeprint.uk" className="inline-flex items-center gap-1.5 transition hover:text-[#F0D542]">
              <Mail className="h-3.5 w-3.5" /> order@primeprint.uk
            </a>
            <a href="tel:+44205550147" className="inline-flex items-center gap-1.5 transition hover:text-[#F0D542]">
              <Phone className="h-3.5 w-3.5" /> +44 (20) 555-0147
            </a>
          </div>
          <div className="font-bold text-[#F0D542]">● Same Day Printing Available</div>
        </div>
      </div>

      <header className="relative border-b border-[#F0D542]/25 bg-[#F8F8F8] shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:gap-8 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="p-2 text-stone-700 lg:hidden" onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" prefetch={false} className="flex items-center ps-3">
              <Image
                src="/logo.png"
                alt="PrimePrint"
                width={400}
                height={120}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>

          <div className={`relative hidden max-w-2xl flex-1 transition-all duration-300 md:flex ${searchFocused ? 'z-110' : 'z-10'}`}>
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search 1,000+ products..."
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  className="w-full rounded-xl border border-[#F8F8F8] bg-white py-3 pl-12 pr-6 text-sm transition-all focus:border-[#F0D542] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#F0D542]/15"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#55692F]" />
              </div>
            </form>

            {searchFocused && query.trim() && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-150 overflow-hidden rounded-xl border border-stone-200 bg-white p-1 shadow-2xl ring-1 ring-black/5">
                {searchResults.length > 0 ? (
                  <div className="flex flex-col">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.href}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          router.push(result.href);
                          setQuery('');
                          setSearchFocused(false);
                        }}
                        className="group flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition-colors hover:bg-[#F8F8F8]/40"
                      >
                        <span className="font-semibold text-[#2E4210] group-hover:text-[#2E4210]">{result.label}</span>
                        <span className="rounded bg-[#F8F8F8] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#55692F] group-hover:bg-[#F8F8F8] group-hover:text-[#F0D542]">
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm italic text-stone-500">No matches for &quot;{query}&quot;</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-stone-800 sm:gap-2">
            <Link
              href="/"
              prefetch={false}
              className={`hidden rounded-lg px-3 py-2 text-sm font-bold transition sm:block hover:bg-stone-100 ${
                pathname === '/' ? 'text-[#2E4210]' : 'text-stone-800'
              }`}
            >
              Home
            </Link>
            <Link href="/contact" prefetch={false} className="rounded-full bg-[#2E4210] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#55692F]">
              Contact Us
            </Link>
          </div>
        </div>

        <nav className="relative hidden border-t border-[#F0D542]/25 lg:block" onMouseLeave={closeMegaMenu}>
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            {showLeftArrow && (
              <div className="pointer-events-none absolute bottom-0 left-6 top-0 z-10 flex items-center pr-10 bg-linear-to-r from-white via-white to-transparent">
                <button
                  onClick={() => scrollCategories('left')}
                  className="pointer-events-auto rounded-full border border-[#F8F8F8] bg-white p-1 shadow-sm hover:bg-[#F8F8F8]/40 hover:text-[#F0D542]"
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}
            {showRightArrow && (
              <div className="pointer-events-none absolute bottom-0 right-6 top-0 z-10 flex items-center pl-10 bg-linear-to-l from-white via-white to-transparent">
                <button
                  onClick={() => scrollCategories('right')}
                  className="pointer-events-auto rounded-full border border-[#F8F8F8] bg-white p-1 shadow-sm hover:bg-[#F8F8F8]/40 hover:text-[#F0D542]"
                  aria-label="Scroll categories right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <ul
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1 scroll-smooth"
              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {categories.map((cat) => (
                <li key={cat.id} className="relative shrink-0" onMouseEnter={() => openMegaMenu(cat.id)}>
                  <Link
                    href={getCategoryPath(cat.id, cat.name)}
                    prefetch={false}
                    className={`inline-block whitespace-nowrap rounded-md px-4 py-3 text-[13px] font-bold transition-all ${
                      activeSlug === cat.id || pathname === getCategoryPath(cat.id, cat.name)
                        ? 'bg-[#F0D542] text-[#2E4210]'
                        : 'text-[#55692F] hover:bg-[#F8F8F8] hover:text-[#2E4210]'
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`absolute left-0 right-0 top-full z-40 border-t border-[#F0D542]/25 bg-white shadow-2xl transition-all duration-300 origin-top ${
              activeCategory ? 'visible scale-y-100 opacity-100' : 'invisible scale-y-95 opacity-0'
            }`}
            onMouseEnter={() => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            }}
          >
            <div className="container mx-auto grid grid-cols-12 gap-8 px-4 py-12 sm:px-6 lg:px-8">
              <div className="col-span-9 grid grid-cols-3 gap-10">
                {chunkProducts(activeCategory?.products ?? [], 7).map((section, idx) => (
                  <div key={`${activeCategory?.id ?? 'category'}-${idx}`} className="space-y-5">
                    <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#55692F]">
                      <span className="h-1 w-1 rounded-full bg-[#F0D542]"></span>
                      {idx === 0 ? 'Top Choices' : 'Extended Range'}
                    </h3>
                    <ul className="space-y-3">
                      {section.map((product) => (
                        <li key={product.id}>
                          <Link
                            href={getProductPath(product.id, product.name, product.slug)}
                            prefetch={false}
                            className="group/item flex items-center justify-between py-0.5 text-[14px] font-medium text-[#55692F] transition hover:text-[#F0D542]"
                          >
                            <span>{product.name}</span>
                            <ArrowRight className="h-3 w-3 -translate-x-2 opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="col-span-3 border-l border-stone-100 pl-10">
                <Link href={activeCategory ? getCategoryPath(activeCategory.id, activeCategory.name) : '/'} prefetch={false} className="group block">
                  <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-stone-100 shadow-inner">
                    {activeCategory ? (
                      getSafeImageSrc(activeCategory.imageUrl) ? (
                        <Image
                          src={getSafeImageSrc(activeCategory.imageUrl)!}
                          alt={activeCategory.name}
                          fill
                          sizes="20vw"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">
                          No image
                        </div>
                      )
                    ) : null}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
                  </div>
                  <div className="mt-6">
                    <h4 className="text-lg font-black text-stone-900">{activeCategory?.name}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-stone-500">{activeCategoryDescription}</p>
                    <div className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F0D542] py-3 text-sm font-bold text-[#2E4210] transition group-hover:bg-[#55692F] group-hover:text-white">
                      Explore All <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-200 bg-[#1D0000]/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`absolute bottom-0 left-0 top-0 w-[85%] max-w-sm transform bg-[#F8F8F8] shadow-2xl transition-transform duration-500 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[#F0D542]/30 p-5">
             <Link href="/" prefetch={false} className="flex items-center">
              <Image
                src="/logo.png"
                alt="PrimePrint"
                width={400}
                height={120}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="rounded-full p-2 hover:bg-[#F8F8F8]" aria-label="Close menu">
              <X className="h-6 w-6 text-[#55692F]" />
            </button>
          </div>

          <div className="p-4">
            <div className="relative">
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-xl bg-white py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F0D542]/20"
                />
              </form>
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#55692F]" />
            </div>
          </div>

          <nav className="no-scrollbar h-[calc(100vh-160px)] overflow-y-auto px-2">
            <ul className="space-y-1 pb-10">
              {categories.map((cat) => (
                <li key={cat.id} className="overflow-hidden rounded-xl">
                  <button
                    className={`flex w-full items-center justify-between px-4 py-4 font-bold text-[#2E4210] transition ${
                      mobileActiveSlug === cat.id ? 'bg-[#F0D542]/20 text-[#2E4210]' : 'hover:bg-[#F8F8F8]'
                    }`}
                    onClick={() => setMobileActiveSlug((prev) => (prev === cat.id ? null : cat.id))}
                  >
                    <span>{cat.name}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${mobileActiveSlug === cat.id ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      mobileActiveSlug === cat.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden bg-[#F8F8F8]/50">
                      <div className="grid grid-cols-1 gap-2 p-4">
                        {cat.products.map((product) => (
                          <Link
                            key={product.id}
                            href={getProductPath(product.id, product.name, product.slug)}
                            prefetch={false}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#55692F] transition hover:bg-white hover:text-[#F0D542]"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F0D542]"></span>
                            {product.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              <li className="mt-4 border-t border-[#F8F8F8] px-4 pt-4">
                <Link href="/" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="mb-3 block rounded-xl border border-[#F8F8F8] p-3 text-center font-bold text-[#2E4210]">
                  Home
                </Link>
                <Link
                  href="/contact"
                  prefetch={false}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#2E4210] p-4 text-center font-bold text-white shadow-lg"
                >
                  Contact Us <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}