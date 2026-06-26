import type { Metadata } from "next";
import Footer from '@/components/home/footer';
import Hero from '@/components/home/hero';
import Feature from '@/components/home/featuresbook';
import Navbar from '@/components/Navbar';
import ChatBot from './chat/page';

const SITE_URL = "https://www.bookmandu.vercel.app";
const SITE_NAME = "BookMandu";
const SITE_DESCRIPTION =
  "BookMandu is Nepal's online book marketplace to buy and sell new or used books. Discover textbooks, novels, comics, self-help books, and more with trusted sellers.";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Buy & Sell Books Online in Nepal`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: `${SITE_NAME} | Buy & Sell Books Online in Nepal`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/title.png",
        width: 1200,
        height: 630,
        alt: "BookMandu marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Buy & Sell Books Online in Nepal`,
    description: SITE_DESCRIPTION,
    images: ["/title.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/title.png`,
  sameAs: [],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <Hero />
      <ChatBot />
      <Feature />
      <Footer />
    </>
  );
}