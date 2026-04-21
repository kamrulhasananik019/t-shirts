import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import AppQueryProvider from "@/components/providers/query-provider";
import { getNavCategories } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  adjustFontFallback: true,
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  adjustFontFallback: true,
});

/** Cache layout and navbar categories for 1 week; invalidated only by admin category operations */
export const revalidate = 604800;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f8f8",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Prime Prints",
  icons: {
    icon: [
      { url: "/icon/favicon.ico" },
      { url: "/icon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon/favicon-180x180-apple.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon/favicon.ico"],
  },
  title: {
    default: "Prime Prints | Same day printing service in UK",
    template: "%s | Prime Prints",
  },
  description:
    "Prime Prints delivers premium same-day printing in London for business, events, and custom orders.",
  keywords: [
    "same day printing",
    "printing london",
    "business cards",
    "posters",
    "banner printing",
    "custom printing",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Prime Prints | Same day printing service in UK",
    description:
      "Premium print quality, fast turnaround, and reliable delivery windows for every project.",
    url: "/",
    siteName: "Prime Prints",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1600&q=80",
        width: 1600,
        height: 900,
        alt: "Prime Prints same day printing hero image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Prints | Same day printing service in UK",
    description:
      "Premium print quality with fast turnaround for business and personal projects.",
    images: ["https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1600&q=80"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "PrintShop",
  name: "Prime Prints",
  url: siteUrl,
  description:
    "Same-day and premium printing in London for business cards, flyers, posters, banners, and custom orders.",
  areaServed: { "@type": "City", name: "London" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "London",
    addressCountry: "GB",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getNavCategories();

  return (
    <html
      lang="en-GB"
      className={`${playfairDisplay.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AppQueryProvider>
          <Navbar categories={categories} />
          {children}
          <Footer />
        </AppQueryProvider>
      </body>
    </html>
  );
}
