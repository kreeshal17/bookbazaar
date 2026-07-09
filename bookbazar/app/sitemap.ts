import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const SITE_URL = "https://www.bookmandu.vercel.app";

const staticRoutes = [
  "",
  "/books",
  "/categories",
  "/category",
  "/help",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const books = await prisma.book.findMany({
    where: {
      isActive: true,
      store: {
        isActive: true,
      },
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  return [
    ...staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
    })),
    ...books.map((book) => ({
      url: `${SITE_URL}/books/${book.slug}`,
      lastModified: book.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}