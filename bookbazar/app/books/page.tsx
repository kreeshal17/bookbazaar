import type { Metadata } from "next";
import BooksContent from "./books-client";
import { getCanonicalUrl, SITE_NAME } from "@/lib/site";

type BooksPageProps = {
  searchParams?: Promise<{
    search?: string;
    category?: string;
  }>;
};

export async function generateMetadata({ searchParams }: BooksPageProps): Promise<Metadata> {
  const params = (await searchParams) || {};
  const search = params.search?.trim() || "";
  const category = params.category?.trim() || "";

  if (search) {
    return {
      title: `Search results for "${search}"`,
      description: `Search results for ${search} on ${SITE_NAME}.`,
      alternates: { canonical: getCanonicalUrl("/books") },
      robots: { index: false, follow: true },
    };
  }

  const canonicalPath = category ? `/books?category=${encodeURIComponent(category)}` : "/books";
  const title = category ? `${formatCategory(category)} Books` : "All Books";
  const description = category
    ? `Browse ${formatCategory(category).toLowerCase()} books on ${SITE_NAME}.`
    : "Browse all books from trusted sellers on BookMandu.";

  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(canonicalPath) },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: getCanonicalUrl(canonicalPath),
      type: "website",
      images: ["/title.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: ["/title.png"],
    },
  };
}

export default function BooksPage() {
  return <BooksContent />;
}

function formatCategory(category: string) {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
