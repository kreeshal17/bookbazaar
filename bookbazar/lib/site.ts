export const SITE_NAME = "BookMandu";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bookmandu.vercel.app";
export const SITE_DESCRIPTION =
  "BookMandu is Nepal's trusted online book marketplace to buy and sell new or used books. Discover textbooks, novels, comics, self-help, and more at unbeatable prices.";

export function getCanonicalUrl(pathname = "/") {
  return new URL(pathname, SITE_URL).toString();
}
