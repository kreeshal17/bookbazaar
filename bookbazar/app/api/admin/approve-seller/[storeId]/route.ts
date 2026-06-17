import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/app/lib/session'
import { resend } from '@/lib/resend/resend'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
){
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const payload = await decrypt(sessionCookie)
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

 const { storeId } = await params;

const store = await prisma.store.update({
  where: {
    id: storeId,
  },
  data: {
    isApproved: true,
    isActive: true,
  },
  include: {
    seller: true,
  },
});

  await resend.emails.send({
    from: 'BookMandu <noreply@krishalkarna.com.np>',
    to: store.seller.email,
    subject: 'Your BookMandu store is approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations, ${store.seller.full_name}!</h2>
        <p>Your store <strong>${store.name}</strong> has been approved by BookMandu admin.</p>
        <p>You can now list books and start selling.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">
          Go to Dashboard
        </a>
      </div>
    `
  })

  return NextResponse.json({ message: 'Seller approved and email sent.' })
}

