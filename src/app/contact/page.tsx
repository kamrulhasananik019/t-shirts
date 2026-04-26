import type { Metadata } from "next";
import { Suspense } from "react";
import ContactPageContent from "@/components/contact/contact-page";
import { getCategoriesWithProducts } from "@/lib/catalog";

/** Cache contact page for 1 week; invalidated only by admin category/product changes */
export const revalidate = 604800;

export const metadata: Metadata = {
  title: "Contact | Same Day T-Shirt Printing London",
  description:
    "Talk with our team about custom quotes, turnaround times, pickup windows, and large-format print support.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Same Day T-Shirt Printing London",
    description:
      "Request a quote, discuss turnaround times, and get expert support for your print projects.",
    url: "/contact",
    type: "website",
    siteName: "Same Day T-Shirt Printing London",
    images: [
      {
        url: "https://images.unsplash.com/photo-1527844097890-83b05e6f24ab?w=1600&q=80",
        width: 1600,
        height: 900,
        alt: "Contact and quote request for same day t-shirt printing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Same Day T-Shirt Printing London",
    description:
      "Request a quote and get support for custom, same-day, and large-format printing.",
    images: ["https://images.unsplash.com/photo-1527844097890-83b05e6f24ab?w=1600&q=80"],
  },
};

export default async function ContactPage() {
  const categories = await getCategoriesWithProducts();

  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <ContactPageContent categories={categories} />
    </Suspense>
  );
}
