import prisma from "@/lib/prisma";
import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";
import { z } from "zod";

export const orderSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  shippingAddr: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(4, "Postal code is required"),
  notes: z.string().optional()
});

export async function POST(req: Request) {
  const sessionCookie = await cookies()
  const session = sessionCookie.get("session")?.value

  if (!session) {
    return Response.json({ message: "Unauthorized access" }, { status: 401 })
  }

  const payload = await decrypt(session)

  if (!payload) {
    return Response.json({ message: "Invalid session" }, { status: 401 })
  }

  const body = await req.json()
  const schema = orderSchema.safeParse(body)

  if (!schema.success) {
    return Response.json({ message: schema.error.flatten() }, { status: 400 })
  }

  const { id } = payload
  const { fullName, phone, shippingAddr, city, state, postalCode, notes } = schema.data

  const cartItems = await prisma.cartItem.findMany({
    where: {
      userId: id as string,
      book: {
        isActive: true,
        store: { isActive: true }
      }
    },
    include: { book: true }
  })

  if (cartItems.length === 0) {
    return Response.json({ message: "Cart is empty" }, { status: 400 })
  }

  // check stock for all items
  for (const item of cartItems) {
    if (item.book.stockQty < item.quantity) {
      return Response.json({
        message: `Insufficient stock for "${item.book.title}". Only ${item.book.stockQty} left.`
      }, { status: 400 })
    }
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * Number(item.book.price), 0
  )

  const order = await prisma.order.create({
    data: {
      buyerId: id as string,
      fullName,
      totalAmount: total,
      phone,
      shippingAddr,
      city,
      state,
      postalCode,
      notes
    }
  })

  await prisma.orderItem.createMany({
    data: cartItems.map((item) => ({
      orderId: order.id,
      bookId: item.bookId,
      storeId: item.book.storeId,
      quantity: item.quantity,
      unitPrice: item.book.price,
      totalPrice: Number(item.book.price) * item.quantity
    }))
  })

  // decrease stock for each book
  for (const item of cartItems) {
    await prisma.book.update({
      where: { id: item.bookId },
      data: { stockQty: { decrement: item.quantity } }
    })
  }

  await prisma.cartItem.deleteMany({
    where: { userId: id as string }
  })

  return Response.json({
    message: "Order created successfully",
    order
  }, { status: 201 })
}