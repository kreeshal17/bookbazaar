import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: record.userId },
    data: { password_hash },
  })

  await prisma.passwordResetToken.delete({ where: { token } })

  return NextResponse.json({ message: 'Password reset successful. You can now login.' })
}