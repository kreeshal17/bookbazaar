import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BookMandu",
    template: "%s | BookMandu",
  },
  icons: {
    icon: "/title.png",
    shortcut: "/title.png",
    apple: "/title.png",
  },
  description:
    "BookMandu is Nepal's trusted online book marketplace to buy and sell new or used books. Discover textbooks, novels, comics, self-help, and more at unbeatable prices. List your books and earn today!",
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
  authors: [{ name: "BookMandu", url: "https://www.bookmandu.vercel.app" }],
  creator: "BookMandu",
  publisher: "BookMandu",
  category: "Books & Literature",
  metadataBase: new URL("https://www.bookmandu.vercel.app"),
  alternates: {
    canonical: "https://www.bookmandu.vercel.app",
  },
  openGraph: {
    title: "BookMandu | Buy & Sell Books Online",
    description:
      "Discover thousands of new and used books on BookMandu. Buy cheap textbooks, novels, and more — or sell your old books and earn cash instantly.",
    url: "https://www.bookmandu.vercel.app",
    siteName: "BookMandu",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "",
        width: 1200,
        height: 630,
        alt: "BookMandu - Buy & Sell Books Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BookMandu | Buy & Sell Books Online",
    description:
      "Buy and sell books easily on BookMandu. Best prices on textbooks, novels, comics, and more.",
    images: ["/og-image.png"],
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
  verification: {
    google: "add-your-google-search-console-verification-code-here",
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
        "font-sans",
        inter.variable
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}