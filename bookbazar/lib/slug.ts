import "server-only";

import slugify from "slugify";
import prisma from "@/lib/prisma";

export function generateSlug(title: string) {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  }) || "book";
}

export async function generateUniqueSlug(title: string, excludeBookId?: string) {
  const baseSlug = generateSlug(title);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existingBook = await prisma.book.findFirst({
      where: {
        slug: candidate,
        ...(excludeBookId ? { id: { not: excludeBookId } } : {}),
      },
      select: { id: true },
    });

    if (!existingBook) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}