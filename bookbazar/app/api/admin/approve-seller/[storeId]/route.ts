import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/app/lib/session'
import { sendSellerApprovalEmail } from '@/lib/resend/seller-emails'

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

  await sendSellerApprovalEmail({
    email: store.seller.email,
    sellerName: store.seller.full_name,
  })

  return NextResponse.json({ message: 'Seller approved and email sent.' })
}

