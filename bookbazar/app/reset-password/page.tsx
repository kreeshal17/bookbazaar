'use client'
import axios from 'axios'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  async function handleSubmit(e: any) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    try {
      const res = await axios.post('/api/auth/reset-password', { token, password })
      setMessage(res.data.message)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="w-full lg:w-[71%] flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900">Reset Password</h1>
            <p className="mt-2 text-slate-500">Enter your new password below.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            {message ? (
              <p className="text-green-600 text-center font-medium">{message}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
                >
                  Reset Password
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900">
        <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-20 text-white">
          <h1 className="text-5xl font-black">📚 BookMandu</h1>
          <p className="mt-3 max-w-xl text-lg text-slate-200">
            Discover books from trusted sellers and build your knowledge one page at a time.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}