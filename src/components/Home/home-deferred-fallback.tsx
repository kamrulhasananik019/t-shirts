/** Lightweight placeholder while below-the-fold Swiper sections stream in. */
export default function HomeDeferredFallback({ minHeight = 'min-h-[380px]' }: { minHeight?: string }) {
  return (
    <div
      className={`w-full animate-pulse rounded-3xl bg-stone-100/90 ${minHeight}`}
      aria-hidden
    />
  );
}
