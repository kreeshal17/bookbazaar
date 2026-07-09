import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Analytics from "@/components/Analytics";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "buy books online",
    "sell books online",
    "used books",
    "second hand books",
    "book marketplace",
    "textbooks online",
    "cheap books India",
    "buy sell books",
    "online bookstore",
    "sell old books",
    "buy old books",
    "novels online",
    "academic books",
    "bookmandu",
    "book bazaar",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Books & Literature",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: `${SITE_NAME} | Buy & Sell Books Online`,
    description:
      "Discover thousands of new and used books on BookMandu. Buy cheap textbooks, novels, and more or sell your old books and earn cash instantly.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/title.png",
        width: 1200,
        height: 630,
        alt: "BookMandu - Buy & Sell Books Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Buy & Sell Books Online`,
    description:
      "Buy and sell books easily on BookMandu. Best prices on textbooks, novels, comics, and more.",
    images: ["/title.png"],
    creator: "@bookmandu",
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
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col">
        <Analytics />
        {children}
      </body>
    </html>
  );
}