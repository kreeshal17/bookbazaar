import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireActiveUser } from "@/app/lib/active-user"
import { z } from "zod"

const reviewSchema = z.object({
  bookId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

export async function POST(req: NextRequest) {
  const { error, user } = await requireActiveUser()

  if (error) return error

  const body = await req.json()
  const result = reviewSchema.safeParse(body)

  if (!result.success) return NextResponse.json({ message: "Invalid data" }, { status: 400 })

  const { bookId, rating, comment } = result.data

  // check if user already reviewed
  const existing = await prisma.review.findUnique({
    where: { bookId_userId: { bookId, userId: user.id } }
  })

  if (existing) {
    return NextResponse.json({ message: "You have already reviewed this book" }, { status: 409 })
  }

  // check if user has a delivered order with this book
  const deliveredOrder = await prisma.orderItem.findFirst({
    where: {
      bookId,
      order: { 
        buyerId: user.id,
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
      userId: user.id,
      rating,
      comment
    }
  })

  return NextResponse.json({ message: "Review submitted", review }, { status: 201 })
}