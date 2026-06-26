import type { MetadataRoute } from "next";

const SITE_URL = "https://www.bookmandu.vercel.app";

const staticRoutes = [
  "",
  "/books",
  "/categories",
  "/category",
  "/help",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}