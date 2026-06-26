import prisma from '@/lib/prisma'
import { decrypt } from '@/app/lib/session'
import { cookies } from 'next/headers'

export async function requireActiveUser() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) {
    return { error: Response.json({ message: 'Unauthorized' }, { status: 401 }) }
  }

  const payload = await decrypt(session)

  if (!payload) {
    return { error: Response.json({ message: 'Invalid session' }, { status: 401 }) }
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id as string },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      isBlocked: true,
      isVerified: true,
    },
  })

  if (!user) {
    return { error: Response.json({ message: 'User not found' }, { status: 404 }) }
  }

  if (user.isBlocked) {
    return { error: Response.json({ message: 'Your account is blocked. Contact support.' }, { status: 403 }) }
  }

  return { payload, user }
}