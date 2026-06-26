import { decrypt } from '@/app/lib/session'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (!sessionCookie) {
    return { error: Response.json({ message: 'Unauthorized' }, { status: 401 }) }
  }

  const payload = await decrypt(sessionCookie)

  if (!payload || payload.role !== 'ADMIN') {
    return { error: Response.json({ message: 'Admin access only' }, { status: 403 }) }
  }

  return { payload }
}

export async function GET(req: Request) {
  const { error } = await requireAdmin()

  if (error) {
    return error
  }

  const url = new URL(req.url)
  const search = url.searchParams.get('search')?.trim() || ''

  const reviews = await prisma.review.findMany({
    where: search
      ? {
          OR: [
            { comment: { contains: search, mode: 'insensitive' } },
            { user: { full_name: { contains: search, mode: 'insensitive' } } },
            { book: { title: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : undefined,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      },
      book: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 40,
  })

  return Response.json({ reviews })
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin()

  if (error) {
    return error
  }

  const url = new URL(req.url)
  const reviewId = url.searchParams.get('reviewId')

  if (!reviewId) {
    return Response.json({ message: 'Review id is required' }, { status: 400 })
  }

  await prisma.review.delete({
    where: { id: reviewId },
  })

  return Response.json({ message: 'Review deleted successfully' })
}