import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-12 border-t-4 border-[#F0D542] bg-linear-to-br from-[#2E4210] via-[#55692F] to-[#1D0000] text-[#F8F8F8]">
      <div className="h-1 w-full bg-[#F0D542]" />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-2xl bg-white/6 p-4 backdrop-blur-sm">
              <Link href="/" prefetch={false} className="my-2 flex items-center">
                <Image
                  src="/logo.png"
                  alt="PrimePrint"
                  width={400}
                  height={120}
                  className="h-10 w-auto object-contain"
                />
            </Link>
            {/* <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[#F8F8F8]/70">Prime Prints</p> */}
            <h3 className="mb-3 text-2xl font-black text-[#F8F8F8] [font-family:var(--font-playfair-display)]">
              Bring your ideas to print
            </h3>
            <p className="text-sm leading-relaxed text-[#F8F8F8]/85 [font-family:var(--font-dm-sans)]">
              Professional quality printing with fast turnaround for business, events, and personal projects.
            </p>
          </div>

          <div className="rounded-2xl bg-white/6 p-4 backdrop-blur-sm">
            <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[#F0D542]">Quick Links</p>
            <div className="flex flex-col gap-2 [font-family:var(--font-dm-sans)]">
              <Link href="/" prefetch={false} className="text-sm text-[#F8F8F8] transition-colors hover:text-[#F0D542]">
                Home
              </Link>
              <Link href="/contact" prefetch={false} className="text-sm text-[#F8F8F8] transition-colors hover:text-[#F0D542]">
                Contact
              </Link>
              <Link href="/faqs" prefetch={false} className="text-sm text-[#F8F8F8] transition-colors hover:text-[#F0D542]">
                FAQs
              </Link>
              <Link href="/reviews" prefetch={false} className="text-sm text-[#F8F8F8] transition-colors hover:text-[#F0D542]">
                Reviews
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white/6 p-4 backdrop-blur-sm">
            <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[#F0D542]">Need Help?</p>
            <p className="mb-4 text-sm leading-relaxed text-[#F8F8F8]/90 [font-family:var(--font-dm-sans)]">
              Need a custom quote or design support? Our team is ready to help with the right print option.
            </p>
            <Link
              href="/#contact"
              prefetch={false}
              className="inline-flex items-center justify-center rounded-lg bg-[#F0D542] px-5 py-2.5 text-sm font-bold text-[#2E4210] transition-colors hover:bg-white [font-family:var(--font-dm-sans)]"
            >
              Contact Us
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[#F0D542]/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#F8F8F8]/80 [font-family:var(--font-dm-sans)]">
            {new Date().getFullYear()} Prime Prints. All rights reserved.
          </p>
          <p className="text-xs text-[#F8F8F8]/80 [font-family:var(--font-dm-sans)]">
            Crafted for premium printing experiences.
          </p>
        </div>
      </div>
    </footer>
  );
}
