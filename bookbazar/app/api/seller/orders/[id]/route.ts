import { decrypt } from "@/app/lib/session";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"]),
  deliveryCode: z.string().optional(),
});

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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  const result = statusSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ message: "Invalid status" }, { status: 400 });
  }

  const { store, error } = await getSellerStore();
  if (error) return error;

  const order = await prisma.order.findFirst({
    where: {
      id,
      items: { some: { storeId: store!.id } },
    },
    include: { items: true }
  });

  if (!order) {
    return Response.json({ message: "Order not found" }, { status: 404 });
  }

  const deliveryCode = (order as typeof order & { deliveryCode?: string | null }).deliveryCode;

  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    return Response.json({ message: "This order can no longer be changed" }, { status: 400 });
  }

  if (result.data.status === "DELIVERED") {
    if (!result.data.deliveryCode || result.data.deliveryCode !== deliveryCode) {
      return Response.json({ message: "Invalid delivery code" }, { status: 400 });
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status: result.data.status },
  });

  return Response.json({
    message: "Order status updated",
    order: updatedOrder,
  });
}