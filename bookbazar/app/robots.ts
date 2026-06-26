import type { MetadataRoute } from "next";

const SITE_URL = "https://www.bookmandu.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/admin", "/buyer", "/cart", "/checkout", "/seller", "/api"],
      },
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}