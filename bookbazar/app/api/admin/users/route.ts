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

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { full_name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      isBlocked: true,
      isVerified: true,
      created_at: true,
      store: {
        select: {
          id: true,
          name: true,
          isApproved: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  return Response.json({ users })
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin()

  if (error) {
    return error
  }

  const body = await req.json()
  const userId = body?.userId as string | undefined
  const isBlocked = body?.isBlocked as boolean | undefined

  if (!userId || typeof isBlocked !== 'boolean') {
    return Response.json({ message: 'Invalid user payload' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      isBlocked: true,
      isVerified: true,
      created_at: true,
    },
  })

  return Response.json({
    message: isBlocked ? 'User blocked' : 'User unblocked',
    user,
  })
}