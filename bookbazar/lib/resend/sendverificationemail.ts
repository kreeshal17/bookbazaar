import { resend } from './resend'

export async function sendVerificationEmail(email: string, token: string, firstName: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`

  const { data, error } = await resend.emails.send({
 from: 'BookMandu <noreply@krishalkarna.com.np>',
    to: email,
    subject: 'Verify your BookMandu account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to BookMandu, ${firstName}!</h2>
        <p>Thanks for signing up. Click the button below to verify your email address.</p>
        <p>If you do not see the email, please check your Spam or Promotions folder.</p>
        <a href="${verifyUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">
          Verify Email
        </a>
        <p style="color:#666;font-size:14px;">This link expires in 24 hours.</p>
        <p style="color:#666;font-size:14px;">If you didn't create an account, ignore this email.</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`)
  }

  return data
}