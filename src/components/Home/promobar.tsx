import { MapPin, Star, ThumbsUp, Truck } from 'lucide-react';

const items = [
  {
    key: 'reviews',
    icon: Star,
    textPrefix: '',
    highlight: 'Five star reviews',
    textSuffix: '',
  },
  {
    key: 'trade',
    icon: ThumbsUp,
    textPrefix: '',
    highlight: 'Trade Discounts',
    textSuffix: 'on all products',
  },
  {
    key: 'collect',
    icon: MapPin,
    textPrefix: 'Free ',
    highlight: 'Collect in Store',
    textSuffix: '',
  },
  {
    key: 'delivery',
    icon: Truck,
    textPrefix: 'Free delivery over £99 ',
    highlight: '',
    textSuffix: 'exc. VAT',
  },
] as const;

export default function PromoBar() {
  return (
    <section className="border-t-4 border-[#0a72b2] bg-[#eef2f4]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 lg:gap-8">
          {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-center gap-2.5 text-[#1f2730]"
            >
              <div className="flex shrink-0 items-center justify-center">
                {item.key === 'reviews' ? (
                  <div className="flex items-center gap-0.5 text-[#0a72b2]">
                    <Icon className="h-4 w-4 fill-current" strokeWidth={2.1} />
                    <Icon className="h-4 w-4 fill-current" strokeWidth={2.1} />
                    <Icon className="h-4 w-4 fill-current" strokeWidth={2.1} />
                    <Icon className="h-4 w-4 fill-current" strokeWidth={2.1} />
                    <Icon className="h-4 w-4 fill-current" strokeWidth={2.1} />
                  </div>
                ) : (
                  <Icon className="h-4.5 w-4.5 text-[#0a72b2]" strokeWidth={2.3} />
                )}
              </div>

              <div className="text-base leading-none tracking-tight">
                {item.textPrefix ? <span>{item.textPrefix}</span> : null}
                {item.highlight ? (
                  <span
                    className={
                      item.key === 'reviews' || item.key === 'trade'
                        ? 'font-semibold text-[#0a72b2] underline decoration-[#0a72b2]/35 underline-offset-3'
                        : 'font-semibold text-[#101418]'
                    }
                  >
                    {item.highlight}
                  </span>
                ) : null}
                {item.textSuffix ? <span> {item.textSuffix}</span> : null}
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </section>
  );
}
