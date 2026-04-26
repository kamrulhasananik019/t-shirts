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
  applicationName: "Same Day T-Shirt Printing London",
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
    default: "Same Day T-Shirt Printing London",
    template: "%s | Same Day T-Shirt Printing London",
  },
  description:
    "Same day t-shirt printing in London with fast UK delivery for urgent custom orders, branded tees, and event clothing.",
  keywords: [
    "same day t-shirt printing london",
    "t-shirt printing london",
    "custom t-shirt printing london",
    "same day printing london",
    "same day delivery london",
    "urgent t-shirt printing uk",
    "branded t shirt printing",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Same Day T-Shirt Printing London",
    description:
      "Same day t-shirt printing in London with fast turnaround, custom branding, and reliable UK delivery.",
    url: "/",
    siteName: "Same Day T-Shirt Printing London",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1600&q=80",
        width: 1600,
        height: 900,
        alt: "Same day t-shirt printing UK and London delivery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Same Day T-Shirt Printing London",
    description:
      "Same day t-shirt printing in London with fast delivery across the UK.",
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
  name: "Same Day T-Shirt Printing London",
  url: siteUrl,
  description:
    "Same day t-shirt printing in London with fast UK delivery for urgent custom orders.",
  areaServed: [
    { "@type": "City", name: "London" },
    { "@type": "Country", name: "United Kingdom" },
  ],
  serviceType: "Same day t-shirt printing",
  priceRange: "$$",
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
