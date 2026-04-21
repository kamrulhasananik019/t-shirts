import type { Metadata } from 'next';
import Link from 'next/link';
import FaqAccordion from '@/components/shared/faq-accordion';
import { getFaqs } from '@/services/faq.service';

/** Cache FAQ page for 1 week; invalidated only by admin FAQ changes via revalidateTag('faqs') */
export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'FAQs | Prime Prints',
  description:
    'Find answers to frequently asked questions about Prime Prints services, turnaround times, delivery, and custom printing options.',
  alternates: {
    canonical: '/faqs',
  },
  openGraph: {
    title: 'Frequently Asked Questions | Prime Prints',
    description:
      'Get answers about printing services, delivery options, and custom orders at Prime Prints.',
    url: '/faqs',
    type: 'website',
    siteName: 'Prime Prints',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQs | Prime Prints',
    description:
      'Find answers to common questions about Prime Prints printing services.',
  },
};

export default async function FaqsPage() {
  const faqs = await getFaqs(50);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-12 max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0a72b2] transition hover:text-[#0a72b2] mb-6"
          >
            <span>←</span> Back to Home
          </Link>
          <h1 className="font-serif text-4xl font-bold leading-tight text-[#0a72b2] sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#0a72b2]">
            Find answers to common questions about our printing services, delivery options, and custom orders.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          {faqs.length > 0 ? (
            <FaqAccordion
              title=""
              items={faqs.map((item) => ({ id: item.id, question: item.question, answer: item.answer }))}
              emptyMessage="No FAQs available"
            />
          ) : (
            <div className="rounded-xl border border-[#F8F8F8] bg-white p-8 text-center">
              <p className="text-sm font-medium text-[#0a72b2]">No FAQ entries have been published yet.</p>
            </div>
          )}
        </div>

        <div className="mt-16 rounded-2xl border border-[#F8F8F8] bg-white p-8 text-center md:p-10">
          <h2 className="font-serif text-2xl font-bold text-[#0a72b2]">Still have questions?</h2>
          <p className="mt-3 text-sm text-[#0a72b2]">
            Get in touch with our team for personalized support.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0a72b2] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#F0D542]"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
