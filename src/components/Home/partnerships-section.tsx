import Link from 'next/link';
import Image from 'next/image';

const cards = [
  {
    title: 'Partnership with School & College',
    description: 'Uniform printing, event tees, leavers hoodies, and bulk orders with dependable UK turnaround.',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80',
    href: '/contact?intent=order&segment=school-college',
  },
  {
    title: 'Partnership with Sports Team',
    description: 'Custom team kits, training tops, and supporter wear for match days, tournaments, and clubs.',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600&q=80',
    href: '/contact?intent=order&segment=sports-team',
  },
  {
    title: 'Partnership with Sports Club',
    description: 'Long-term print support for club merchandise, coaching uniforms, and promotional apparel.',
    image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=1600&q=80',
    href: '/contact?intent=order&segment=sports-club',
  },
] as const;

export default function PartnershipsSection() {
  return (
    <section className="bg-stone-50 py-14 md:py-18">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0a72b2]">Partnership Programs</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-stone-900 md:text-4xl">Built for Schools, Colleges and Sports Groups</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
            Dedicated t-shirt printing support for institutions and teams with practical pricing, consistent quality, and reliable delivery schedules.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              prefetch={false}
              className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-6">
                <h3 className="font-serif text-2xl font-bold leading-tight text-stone-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{card.description}</p>
                <span className="mt-5 inline-flex items-center text-sm font-semibold text-[#0a72b2] transition group-hover:text-[#085d93]">
                  Discuss Partnership
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
