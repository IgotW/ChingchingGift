import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl } from "@/lib/supabase/config";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ChingChingGift — Secret Santa, sorted",
    template: "%s · ChingChingGift",
  },
  description:
    "Create a Christmas gift exchange, draw names fairly, and share wishlists privately. No spreadsheets, no peeking.",
  applicationName: "ChingChingGift",
  keywords: [
    "secret santa",
    "secret santa generator",
    "gift exchange",
    "christmas gift exchange",
    "white elephant",
    "secret santa online",
    "gift exchange organizer",
    "wishlist",
    "name draw",
    "christmas party",
  ],
  authors: [{ name: "ChingChingGift" }],
  creator: "ChingChingGift",
  publisher: "ChingChingGift",
  category: "shopping",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ChingChingGift",
    title: "ChingChingGift — Secret Santa, sorted",
    description:
      "Create a Christmas gift exchange, draw names fairly, and share wishlists privately. No spreadsheets, no peeking.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChingChingGift — Secret Santa, sorted",
    description:
      "Create a Christmas gift exchange, draw names fairly, and share wishlists privately. No spreadsheets, no peeking.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0d3527",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
