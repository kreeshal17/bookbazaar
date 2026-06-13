import { decrypt } from "@/app/lib/session";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return { error: Response.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const payload = await decrypt(sessionCookie);

  if (!payload || payload.role !== "ADMIN") {
    return { error: Response.json({ message: "Admin access only" }, { status: 403 }) };
  }

  return { payload };
}

export async function GET() {
  const { error } = await requireAdmin();

  if (error) {
    return error;
  }

  const stores = await prisma.store.findMany({
    include: {
      seller: {
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          created_at: true,
        },
      },
      books: {
        include: {
          orderItems: {
            include: {
              order: {
                select: {
                  id: true,
                  status: true,
                  createdAt: true,
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      orderItems: {
        include: {
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              fullName: true,
              phone: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const data = stores.map((store) => {
    const totalSold = store.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const revenue = store.orderItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );
    const orderIds = new Set(store.orderItems.map((item) => item.orderId));

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      isActive: store.isActive,
      isVerified: store.isVerified,
      createdAt: store.createdAt,
      seller: store.seller,
      stats: {
        productCount: store.books.length,
        orderCount: orderIds.size,
        totalSold,
        revenue,
      },
      books: store.books.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        price: Number(book.price),
        stockQty: book.stockQty,
        isActive: book.isActive,
        createdAt: book.createdAt,
        soldQty: book.orderItems.reduce((sum, item) => sum + item.quantity, 0),
        salesAmount: book.orderItems.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0
        ),
      })),
      sales: store.orderItems.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        bookTitle: item.book.title,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        orderStatus: item.order.status,
        customerName: item.order.fullName,
        customerPhone: item.order.phone,
        createdAt: item.order.createdAt,
      })),
    };
  });

  return Response.json({ stores: data });
}
