import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/app/lib/session'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const payload = await decrypt(sessionCookie)
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const stores = await prisma.store.findMany({
    where: { isApproved: false },
    include: {
      seller: { select: { full_name: true, email: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json({ stores })
}