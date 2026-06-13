import { decrypt } from "@/app/lib/session";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { z } from "zod";

const cartActionSchema = z.object({
  action: z.enum(["increment", "decrement"]),
});

async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    return { error: Response.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const payload = await decrypt(session);

  if (!payload) {
    return { error: Response.json({ message: "Invalid session" }, { status: 401 }) };
  }

  return { userId: payload.id as string };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await getUserId();

  if (error) {
    return error;
  }

  const { id } = await context.params;
  const body = await req.json();
  const result = cartActionSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ message: "Invalid cart action" }, { status: 400 });
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!cartItem) {
    return Response.json({ message: "Cart item not found" }, { status: 404 });
  }

  if (result.data.action === "decrement" && cartItem.quantity <= 1) {
    await prisma.cartItem.delete({
      where: {
        id,
      },
    });

    return Response.json({ message: "Cart item removed", cartItem: null });
  }

  const updatedCartItem = await prisma.cartItem.update({
    where: {
      id,
    },
    data: {
      quantity: {
        [result.data.action]: 1,
      },
    },
    include: {
      book: true,
    },
  });

  return Response.json({
    message: "Cart item updated",
    cartItem: updatedCartItem,
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await getUserId();

  if (error) {
    return error;
  }

  const { id } = await context.params;
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!cartItem) {
    return Response.json({ message: "Cart item not found" }, { status: 404 });
  }

  await prisma.cartItem.delete({
    where: {
      id,
    },
  });

  return Response.json({ message: "Cart item removed" });
}
