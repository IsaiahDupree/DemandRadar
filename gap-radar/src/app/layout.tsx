import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
