import { decrypt } from "@/app/lib/session";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

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
    where: {
      sellerId: payload.id as string,
    },
  });

  if (!store) {
    return { error: Response.json({ message: "Store not found" }, { status: 404 }) };
  }

  return { store };
}

export async function GET() {
  const { store, error } = await getSellerStore();

  if (error) {
    return error;
  }

  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          storeId: store.id,
        },
      },
    },
    include: {
      buyer: {
        select: {
          full_name: true,
          email: true,
        },
      },
      items: {
        where: {
          storeId: store.id,
        },
        include: {
          book: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json({ orders });
}
