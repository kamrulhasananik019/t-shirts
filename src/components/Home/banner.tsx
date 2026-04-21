'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';

interface Slide {
  image: string;
  tag: string;
  headline: [string, string, string];
  sub: string;
  cta: string;
  accent: string;
}

const slides: Slide[] = [
  {
    image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1600&q=80',
    tag: 'Premium Quality',
    headline: ['Print That', 'Speaks', 'Louder.'],
    sub: 'Business cards, banners & brochures — crafted to impress.',
    cta: 'Get a Free Quote',
    accent: '#FF5733',
  },
  {
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1600&q=80',
    tag: 'Fast Turnaround',
    headline: ['Same Day.', 'Any Print.', 'Every Time.'],
    sub: 'Same day delivery within London and across the UK, with 24-hour print support for urgent orders.',
    cta: 'Order Now',
    accent: '#0066FF',
  },
  {
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
    tag: 'Big Ideas',
    headline: ['Big Ideas', 'Deserve', 'Big Prints.'],
    sub: 'Banners, posters & signage printed at any scale with razor-sharp precision.',
    cta: 'Explore Products',
    accent: '#00C896',
  },
];

const animStyles = `
  .swiper-pagination {
    display: flex !important;
    gap: 8px;
    left: 6vw !important;
    bottom: 28px !important;
    width: auto !important;
    justify-content: flex-start;
  }
  .swiper-pagination-bullet {
    width: 28px !important;
    height: 3px !important;
    border-radius: 2px !important;
    background: rgba(255,255,255,0.35) !important;
    opacity: 1 !important;
    margin: 0 !important;
    transition: width 0.3s, background 0.3s;
  }
  .swiper-pagination-bullet-active {
    width: 52px !important;
    background: #fff !important;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .anim-tag { animation: fadeUp 0.5s ease 0.1s both; }
  .anim-h1  { animation: slideInLeft 0.55s ease 0.2s both; }
  .anim-h2  { animation: slideInLeft 0.55s ease 0.32s both; }
  .anim-h3  { animation: slideInLeft 0.55s ease 0.44s both; }
  .anim-sub { animation: fadeUp 0.5s ease 0.55s both; }
  .anim-cta { animation: fadeUp 0.5s ease 0.68s both; }
`;

interface SlideContentProps {
  slide: Slide;
  index: number;
  isActive: boolean;
}

function SlideContent({ slide, index, isActive }: SlideContentProps) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <Image
        src={slide.image}
        alt={slide.headline.join(' ')}
        fill
        priority={index === 0}
        fetchPriority={index === 0 ? 'high' : 'low'}
        sizes="100vw"
        className={`absolute inset-0 object-cover object-center transition-transform duration-6000 ease-out ${
          isActive ? 'scale-100' : 'scale-[1.07]'
        }`}
      />


      <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/50 to-black/10" />

    
      {isActive && (
        <div className="relative z-10 flex h-full items-center justify-center md:justify-start px-4 sm:px-8 md:px-12 lg:px-20 xl:px-28">
          <div className="max-w-full sm:max-w-2xl lg:max-w-4xl text-center md:text-left mt-5">
            <div>
              <span
              className="anim-tag mb-3 inline-block w-fit rounded-sm border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] sm:mb-5 sm:px-3 sm:text-xs md:px-4 md:text-sm lg:text-base"
              style={{
                color: slide.accent,
                borderColor: slide.accent,
              }}
            >
              {slide.tag}
            </span>

          
            <h1 className="mb-4 font-black font-serif uppercase leading-[0.88] tracking-tight text-white sm:mb-6">
              <span className="anim-h1 block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                {slide.headline[0]}
              </span>
              <span className="anim-h2 block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                {slide.headline[1]}
              </span>
              <span
                className="anim-h3 block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                style={{ color: slide.accent }}
              >
                {slide.headline[2]}
              </span>
            </h1>

         
            <p className="anim-sub mb-6 max-w-70 text-sm font-light leading-relaxed text-white/75 sm:mb-8 sm:max-w-md sm:text-base md:max-w-lg md:text-lg lg:max-w-xl lg:text-xl">
              {slide.sub}
            </p>

            
            <a
              href="/contact"
              className="anim-cta group inline-flex w-fit items-center gap-2 rounded-sm border border-white/10 bg-white/10 px-5 py-3 text-xs font-semibold tracking-wide text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:border-white/20 hover:bg-white/20 sm:gap-3 sm:px-6 sm:py-3.5 sm:text-sm md:px-8 md:py-4 md:text-base lg:text-lg"
              style={{ background: slide.accent }}
            >
              {slide.cta}
              <ArrowIcon />
            </a>
            </div>
          </div>
        </div>
      )}

    
      <div className="absolute bottom-4 sm:bottom-7 right-[3vw] sm:right-[5vw] z-10 flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs tracking-widest font-medium">
        <span className="text-white/60">{String(index + 1).padStart(2, '0')}</span>
        <span className="block w-4 sm:w-6 h-px bg-white/30" />
        <span className="text-white/30">{String(slides.length).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function Banner() {
  const canLoop = slides.length > 1;

  return (
    <>
      <style>{animStyles}</style>

      <div className="relative w-full h-[70vh] md:h-[88vh] min-h-100 md:min-h-130 max-h-150 md:max-h-200">
        <Swiper
          pagination={{ clickable: true }}
          modules={[Pagination, Autoplay, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          speed={900}
          loop={canLoop}
          className="w-full h-full"
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={i}>
              {({ isActive }: { isActive: boolean }) => (
                <SlideContent slide={slide} index={i} isActive={isActive} />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}