import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params

  const reviews = await prisma.review.findMany({
    where: { bookId },
    include: {
      user: { select: { full_name: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return NextResponse.json({ reviews, average: Math.round(average * 10) / 10, total: reviews.length })
}