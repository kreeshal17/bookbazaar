import prisma from "@/lib/prisma";
import { randomInt } from "crypto";
import { requireActiveUser } from "@/app/lib/active-user";
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
  const { error, user } = await requireActiveUser()

  if (error) {
    return error
  }

  const body = await req.json()
  const schema = orderSchema.safeParse(body)

  if (!schema.success) {
    return Response.json({ message: schema.error.flatten() }, { status: 400 })
  }

  const { fullName, phone, shippingAddr, city, state, postalCode, notes } = schema.data

  const cartItems = await prisma.cartItem.findMany({
    where: {
      userId: user.id,
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

  const deliveryCode = String(randomInt(100000, 1000000))

  const order = await prisma.order.create({
    data: {
      buyerId: user.id,
      fullName,
      totalAmount: total,
      deliveryCode,
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
    where: { userId: user.id }
  })

  return Response.json({
    message: "Order created successfully",
    order: {
      ...order,
      deliveryCode,
    },
    deliveryCode,
  }, { status: 201 })
}