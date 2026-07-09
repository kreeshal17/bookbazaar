import type { Metadata } from "next";
import Script from "next/script";
import Footer from '@/components/home/footer';
import Hero from '@/components/home/hero';
import Feature from '@/components/home/featuresbook';
import Navbar from '@/components/Navbar';
import ChatBot from './chat/page';
import { getCanonicalUrl, SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Buy & Sell Books Online in Nepal`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: getCanonicalUrl("/"),
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

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/title.png`,
  sameAs: [],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/books?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function Page() {
  return (
    <>
      <Script id="home-jsonld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify([organizationSchema, websiteSchema])}
      </Script>
      <Navbar />
      <Hero />
      <ChatBot />
      <Feature />
      <Footer />
    </>
  );
}