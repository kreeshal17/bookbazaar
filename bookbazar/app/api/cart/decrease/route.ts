import prisma from "@/lib/prisma";
import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  const session = (await cookies()).get("session")?.value;

  if (!session) {
    return Response.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const payload = await decrypt(session);

  if (!payload) {
    return Response.json(
      {
        message: "Invalid Session",
      },
      {
        status: 401,
      }
    );
  }

  const { cartItemId } = await req.json();

  const cartItem = await prisma.cartItem.findUnique({
    where: {
      id: cartItemId,
    },
  });

  if (!cartItem) {
    return Response.json(
      {
        message: "Cart Item Not Found",
      },
      {
        status: 404,
      }
    );
  }

  if (cartItem.quantity > 1) {
    await prisma.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: {
        quantity: {
          decrement: 1,
        },
      },
    });
  } else {
    await prisma.cartItem.delete({
      where: {
        id: cartItemId,
      },
    });
  }

  return Response.json({
    message: "Cart Updated Successfully",
  });
}