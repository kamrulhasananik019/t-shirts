import Link from 'next/link';

export default function Banner() {
  return (
    <section className="border-b border-[#F0D542]/20 bg-[#F8F8F8]">
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0a72b2]">
              London Same Day T-Shirt Printing
            </p>

            <h1 className="max-w-3xl font-serif text-3xl font-black leading-tight text-[#0a72b2] sm:text-4xl lg:text-5xl">
              Same Day T-Shirt Printing in London With Fast UK Delivery
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#0a72b2] sm:text-base">
              Built for urgent deadlines across London: event tees, staff uniforms, branded merchandise, and urgent
              reprints. Send your artwork and we will prepare, print, and dispatch fast.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/contact?intent=order"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-lg bg-[#0a72b2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a72b2]"
              >
                Start Same Day Order
              </Link>
              <Link
                href="/contact"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-lg border border-[#0a72b2]/35 bg-white px-5 py-3 text-sm font-semibold text-[#0a72b2] transition hover:border-[#0a72b2]"
              >
                Request Quote
              </Link>
            </div>

            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#F8F8F8] bg-white px-4 py-3 text-sm text-[#0a72b2]">
                Same Day Production
              </div>
              <div className="rounded-lg border border-[#F8F8F8] bg-white px-4 py-3 text-sm text-[#0a72b2]">
                London Priority Dispatch
              </div>
              <div className="rounded-lg border border-[#F8F8F8] bg-white px-4 py-3 text-sm text-[#0a72b2]">
                Bulk & Single Runs
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#F0D542]/30 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-[#0a72b2]">Today&apos;s Fast-Track Workflow</h2>
            <p className="mt-1 text-sm text-[#0a72b2]">Designed for urgent orders that need clear turnaround.</p>

            <div className="mt-5 space-y-3">
              <div className="rounded-lg bg-[#F8F8F8] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0a72b2]">Step 1</p>
                <p className="mt-1 text-sm font-medium text-[#0a72b2]">Send artwork and quantity</p>
              </div>
              <div className="rounded-lg bg-[#F8F8F8] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0a72b2]">Step 2</p>
                <p className="mt-1 text-sm font-medium text-[#0a72b2]">Approve print setup quickly</p>
              </div>
              <div className="rounded-lg bg-[#F8F8F8] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0a72b2]">Step 3</p>
                <p className="mt-1 text-sm font-medium text-[#0a72b2]">Production and dispatch</p>
              </div>
            </div>

            <p className="mt-5 rounded-lg border border-[#F0D542]/35 bg-[#F0D542]/12 px-4 py-3 text-sm text-[#0a72b2]">
              Need it today? Use the same day order option and include your required delivery time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
