import { Truck, MessageCircle, BadgeHelp } from 'lucide-react';

const items = [
  {
    icon: Truck,
    title: 'Free delivery',
    description: 'On orders £40+',
  },
  {
    icon: MessageCircle,
    title: 'Flexible help when you need it',
    description: `We're here by phone, email & live chat`,
  },
  {
    icon: BadgeHelp,
    title: 'Create with confidence',
    description: 'Design it yourself, or with help',
  },
] as const;

export default function PromoBar() {
  return (
    <section className="bg-[#f5f5f5]">
      <div className="container mx-auto grid grid-cols-1 divide-y divide-gray-200 border-b border-gray-200 px-4  md:grid-cols-3 md:divide-x md:divide-y-0 md:border-0">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-4 py-5 md:justify-center md:py-6"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f8f8f8] md:h-16 md:w-16">
                <Icon className="h-6 w-6 text-gray-800 md:h-7 md:w-7" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold leading-tight text-gray-900 md:text-[22px]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-snug text-gray-600 md:text-[18px]">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
