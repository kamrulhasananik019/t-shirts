import React from 'react';
import styles from './infinite-marquee.module.css';

type InfiniteMarqueeProps = {
  topText?: string;
  bottomItems?: string[];
  className?: string;
};

export default function InfiniteMarquee({
  topText = 'SAME DAY PRINT AVAILABLE',
  bottomItems = [],
  className = '',
}: InfiniteMarqueeProps) {
  void bottomItems;
  const topBaseItems = Array.from({ length: 10 }, () => topText);
  const topTickerItems = [...topBaseItems, ...topBaseItems];

  return (
    <section className={`${styles.surface} ${className}`}>
      <div className="flex flex-col gap-6 md:gap-10">
        <div className={`${styles.strip} bg-gradient-to-r from-[#0a72b2] via-[#F0D542] to-[#0a72b2] shadow-[0_0_40px_rgba(240,213,66,0.35)]`}>
          <div className={`${styles.marqueeTrack} ${styles.marqueeLeft} py-4 md:py-4 text-2xl sm:text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-[#F8F8F8]`}>
            {topTickerItems.map((item, idx) => (
              <span
                key={`top-${idx}`}
                className="px-6 md:px-12 flex items-center gap-4"
                aria-hidden={idx >= topBaseItems.length}
              >
                {item}
                <span className="text-[#F8F8F8]/45 text-base md:text-2xl">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}