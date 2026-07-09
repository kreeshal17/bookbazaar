import type { MetadataRoute } from "next";

const SITE_URL = "https://www.bookmandu.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/books", "/categories", "/category", "/help"],
        disallow: ["/admin", "/buyer", "/cart", "/checkout", "/seller", "/orders", "/login", "/signup", "/forgot-password", "/reset-password", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}