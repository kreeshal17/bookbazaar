'use client'

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type BookViewTrackerProps = {
  bookId: string;
  title: string;
  price: number;
  author?: string | null;
  slug: string;
};

export default function BookViewTracker({ bookId, title, price, author, slug }: BookViewTrackerProps) {
  useEffect(() => {
    trackEvent("view_item", {
      currency: "NPR",
      value: price,
      items: [
        {
          item_id: bookId,
          item_name: title,
          item_category: author || "Unknown Author",
          item_variant: slug,
          price,
          quantity: 1,
        },
      ],
    });
  }, [bookId, title, price, author, slug]);

  return null;
}
