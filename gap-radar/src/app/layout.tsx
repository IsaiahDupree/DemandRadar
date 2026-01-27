import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TrackingProvider } from "@/components/tracking-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DemandRadar - Find Market Gaps Before Your Competitors",
  description: "Analyze thousands of Meta ads, Google ads, and Reddit discussions to discover what customers really want—and what competitors are missing. Get ranked gap opportunities in minutes.",
  keywords: [
    "market research",
    "market gap analysis",
    "competitor analysis",
    "market intelligence",
    "product validation",
    "niche research",
    "Reddit sentiment analysis",
    "ad analysis",
    "market opportunities",
    "startup validation"
  ],
  authors: [{ name: "DemandRadar" }],
  creator: "DemandRadar",
  publisher: "DemandRadar",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://demandradar.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "DemandRadar - Find Market Gaps Before Your Competitors",
    description: "Analyze thousands of Meta ads, Google ads, and Reddit discussions to discover what customers really want—and what competitors are missing.",
    siteName: "DemandRadar",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DemandRadar - AI-Powered Market Gap Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DemandRadar - Find Market Gaps Before Your Competitors",
    description: "Analyze thousands of Meta ads, Google ads, and Reddit discussions to discover what customers really want—and what competitors are missing.",
    images: ["/og-image.png"],
    creator: "@demandradar",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://demandradar.app";

  // Product/SoftwareApplication Schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "DemandRadar",
    "applicationCategory": "BusinessApplication",
    "description": "AI-powered market gap analysis platform that helps entrepreneurs and marketers discover what customers really want by analyzing Meta ads, Google ads, Reddit discussions, and more.",
    "url": baseUrl,
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "29.00",
      "priceCurrency": "USD",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "url": `${baseUrl}/signup`,
      "description": "Starter plan with 2 market analyses per month"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Meta Ads Library Analysis",
      "Reddit Sentiment Analysis",
      "Google Ads Intelligence",
      "Market Gap Detection",
      "Competitor Analysis",
      "AI-Powered Insights"
    ]
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DemandRadar",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Market intelligence platform for entrepreneurs and growth marketers",
    "sameAs": [
      "https://twitter.com/demandradar",
      "https://www.linkedin.com/company/demandradar"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@demandradar.app"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TrackingProvider>
          <ThemeProvider
            defaultTheme="system"
            storageKey="demandradar-theme"
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </TrackingProvider>
      </body>
    </html>
  );
}
