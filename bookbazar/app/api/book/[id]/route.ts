import { decrypt } from "@/app/lib/session";
import prisma from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { cookies } from "next/headers";
import { z } from "zod";

const updateBookSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  author: z.string().optional(),
  isbn: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
  stockQty: z.number().int().min(0, "Stock cannot be negative"),
  categoryId: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

const categoryLabels: Record<string, string> = {
  fiction: "Fiction",
  "non-fiction": "Non-Fiction",
  "self-improvement": "Self Improvement",
  business: "Business",
  technology: "Technology",
  academic: "Academic",
  others: "Others",
};

async function getCategoryId(categoryId?: string) {
  if (!categoryId) return null;

  const slug = categoryId.trim().toLowerCase();
  const name = categoryLabels[slug] || categoryId;

  const category = await prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });

  return category.id;
}

async function getSellerStore() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return { error: Response.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const payload = await decrypt(sessionCookie);

  if (!payload) {
    return { error: Response.json({ message: "Invalid session" }, { status: 401 }) };
  }

  const store = await prisma.store.findUnique({
    where: { sellerId: payload.id as string },
  });

  if (!store) {
    return { error: Response.json({ message: "Store not found" }, { status: 404 }) };
  }

  return { store };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { store, error } = await getSellerStore();

  if (error) return error;

  const book = await prisma.book.findFirst({
    where: { id, storeId: store.id },
    include: { category: true },
  });

  if (!book) {
    return Response.json({ message: "Book not found" }, { status: 404 });
  }

  return Response.json({
    book: {
      ...book,
      categoryId: book.category?.slug || book.categoryId,
    },
  });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  const result = updateBookSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ errors: result.error }, { status: 400 });
  }

  const { store, error } = await getSellerStore();

  if (error) return error;

  const existingBook = await prisma.book.findFirst({
    where: { id, storeId: store.id },
  });

  if (!existingBook) {
    return Response.json({ message: "Book not found" }, { status: 404 });
  }

  const data = result.data;
  const categoryId = await getCategoryId(data.categoryId);
  const slug = await generateUniqueSlug(data.title, id);

  const book = await prisma.book.update({
    where: { id },
    data: {
      slug,
      title: data.title,
      description: data.description,
      author: data.author,
      isbn: data.isbn,
      categoryId,
      price: data.price,
      stockQty: data.stockQty,
      imageUrl: data.imageUrl,
    },
  });

  return Response.json({ message: "Book updated successfully", book });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { store, error } = await getSellerStore();

  if (error) return error;

  const existingBook = await prisma.book.findFirst({
    where: { id, storeId: store.id },
  });

  if (!existingBook) {
    return Response.json({ message: "Book not found" }, { status: 404 });
  }

await prisma.book.update({
  where: { id },
  data: { isActive: false },
});

return Response.json({ message: "Book deleted successfully" });
}