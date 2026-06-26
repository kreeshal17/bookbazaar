import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/app/lib/session'
import { sendAdminSellerMessage } from '@/lib/resend/seller-emails'

const messageSchema = z.object({
  recipientMode: z.enum(['all', 'single']),
  storeId: z.string().uuid().optional(),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(3000),
})

async function requireAdmin() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (!sessionCookie) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) }
  }

  const payload = await decrypt(sessionCookie)

  if (!payload || payload.role !== 'ADMIN') {
    return { error: NextResponse.json({ message: 'Admin access only' }, { status: 403 }) }
  }

  return { payload }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()

  if (error) {
    return error
  }

  const body = await req.json()
  const result = messageSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ message: 'Invalid message payload' }, { status: 400 })
  }

  const { recipientMode, storeId, subject, message } = result.data

  let recipients: { sellerName: string; email: string }[] = []

  if (recipientMode === 'single') {
    if (!storeId) {
      return NextResponse.json({ message: 'Store id is required' }, { status: 400 })
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        seller: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
    })

    if (!store) {
      return NextResponse.json({ message: 'Store not found' }, { status: 404 })
    }

    recipients = [
      {
        sellerName: store.seller.full_name,
        email: store.seller.email,
      },
    ]
  } else {
    const stores = await prisma.store.findMany({
      select: {
        seller: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
    })

    const uniqueRecipients = new Map<string, { sellerName: string; email: string }>()

    for (const store of stores) {
      uniqueRecipients.set(store.seller.email, {
        sellerName: store.seller.full_name,
        email: store.seller.email,
      })
    }

    recipients = [...uniqueRecipients.values()]
  }

  const results = await Promise.all(
    recipients.map((recipient) =>
      sendAdminSellerMessage({
        email: recipient.email,
        sellerName: recipient.sellerName,
        subject,
        message,
      })
    )
  )

  return NextResponse.json({
    message: `Message sent to ${results.length} seller${results.length === 1 ? '' : 's'}.`,
    count: results.length,
  })
}