import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import prisma from '@/lib/prisma'
import { resend } from '@/lib/resend/resend'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json(
      { error: 'No account found with this email' },
      { status: 404 }
    )
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  const token = randomBytes(32).toString('hex')
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    },
  })

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: 'BookMandu <noreply@krishalkarna.com.np>',
    to: email,
    subject: 'Reset your BookMandu password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Hi ${user.full_name},</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#666;font-size:14px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })

  return NextResponse.json({ message: 'If this email exists, a reset link has been sent.' })
}
