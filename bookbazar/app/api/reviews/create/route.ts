import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/app/lib/session"
import { z } from "zod"

const reviewSchema = z.object({
  bookId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")?.value

  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const payload = await decrypt(session)
  if (!payload) return NextResponse.json({ message: "Invalid session" }, { status: 401 })

  const body = await req.json()
  const result = reviewSchema.safeParse(body)

  if (!result.success) return NextResponse.json({ message: "Invalid data" }, { status: 400 })

  const { bookId, rating, comment } = result.data

  // check if user already reviewed
  const existing = await prisma.review.findUnique({
    where: { bookId_userId: { bookId, userId: payload.id as string } }
  })

  if (existing) {
    return NextResponse.json({ message: "You have already reviewed this book" }, { status: 409 })
  }

  // check if user has a delivered order with this book
  const deliveredOrder = await prisma.orderItem.findFirst({
    where: {
      bookId,
      order: {
        buyerId: payload.id as string,
        status: "DELIVERED"
      }
    }
  })

  if (!deliveredOrder) {
    return NextResponse.json({ message: "You can only review books you have purchased and received" }, { status: 403 })
  }

  const review = await prisma.review.create({
    data: {
      bookId,
      userId: payload.id as string,
      rating,
      comment
    }
  })

  return NextResponse.json({ message: "Review submitted", review }, { status: 201 })
}