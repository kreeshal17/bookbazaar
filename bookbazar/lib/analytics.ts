export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export type GAEventName =
  | "page_view"
  | "search"
  | "view_item"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "login"
  | "sign_up";

type GAEventParams = Record<string, string | number | boolean | undefined | null | Array<Record<string, string | number | boolean | undefined | null>>>;

declare global {
  interface Window {
    dataLayer?: Array<unknown>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: GAEventName, params: GAEventParams = {}) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, params);
}

export function trackPageView(pathname: string) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: pathname,
    page_location: window.location.href,
    page_title: document.title,
  });
}
