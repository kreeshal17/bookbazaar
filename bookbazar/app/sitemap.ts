import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const SITE_URL = "https://www.bookmandu.vercel.app";

const staticRoutes = [
  {
    route: "",
    changeFrequency: "daily" as const,
    priority: 1,
  },
  {
    route: "/books",
    changeFrequency: "weekly" as const,
    priority: 0.9,
  },
  {
    route: "/categories",
    changeFrequency: "weekly" as const,
    priority: 0.8,
  },
  {
    route: "/category",
    changeFrequency: "weekly" as const,
    priority: 0.8,
  },
  {
    route: "/help",
    changeFrequency: "monthly" as const,
    priority: 0.5,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    ...staticRoutes.map((item) => ({
      url: `${SITE_URL}${item.route}`,
      lastModified: new Date(),
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    })),

    ...books.map((book) => ({
      url: `${SITE_URL}/books/${book.slug}`,
      lastModified: book.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}