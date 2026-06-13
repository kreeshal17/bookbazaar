import { decrypt } from "@/app/lib/session";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { z } from "zod";

const updateStoreSchema = z.object({
  isActive: z.boolean(),
});

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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { error } = await requireAdmin();

  if (error) {
    return error;
  }

  const { storeId } = await context.params;
  const body = await req.json();
  const result = updateStoreSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ message: "Invalid store status" }, { status: 400 });
  }

  const store = await prisma.store.update({
    where: {
      id: storeId,
    },
    data: {
      isActive: result.data.isActive,
    },
  });

  return Response.json({
    message: store.isActive ? "Seller unbanned" : "Seller banned",
    store,
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { error } = await requireAdmin();

  if (error) {
    return error;
  }

  const { storeId } = await context.params;
  const store = await prisma.store.findUnique({
    where: {
      id: storeId,
    },
    include: {
      books: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!store) {
    return Response.json({ message: "Store not found" }, { status: 404 });
  }

  const bookIds = store.books.map((book) => book.id);
  const affectedOrderItems = await prisma.orderItem.findMany({
    where: {
      storeId,
    },
    select: {
      orderId: true,
    },
  });
  const affectedOrderIds = [...new Set(affectedOrderItems.map((item) => item.orderId))];

  await prisma.$transaction(async (tx) => {
    if (bookIds.length > 0) {
      await tx.cartItem.deleteMany({
        where: {
          bookId: {
            in: bookIds,
          },
        },
      });
    }

    await tx.orderItem.deleteMany({
      where: {
        storeId,
      },
    });

    await tx.book.deleteMany({
      where: {
        storeId,
      },
    });

    await tx.store.delete({
      where: {
        id: storeId,
      },
    });

    const sellerBuyerOrders = await tx.order.findMany({
      where: {
        buyerId: store.sellerId,
      },
      select: {
        id: true,
      },
    });
    const sellerBuyerOrderIds = sellerBuyerOrders.map((order) => order.id);

    if (sellerBuyerOrderIds.length > 0) {
      await tx.orderItem.deleteMany({
        where: {
          orderId: {
            in: sellerBuyerOrderIds,
          },
        },
      });

      await tx.order.deleteMany({
        where: {
          id: {
            in: sellerBuyerOrderIds,
          },
        },
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        userId: store.sellerId,
      },
    });

    await tx.user.delete({
      where: {
        id: store.sellerId,
      },
    });

    for (const orderId of affectedOrderIds) {
      const remainingItems = await tx.orderItem.count({
        where: {
          orderId,
        },
      });

      if (remainingItems === 0) {
        await tx.order.delete({
          where: {
            id: orderId,
          },
        });
      }
    }
  });

  return Response.json({
    message: "Seller deleted successfully",
  });
}
