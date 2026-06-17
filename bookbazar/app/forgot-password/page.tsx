'use client'
import axios from 'axios'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: any) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await axios.post('/api/auth/forgot-password', { email })
      setMessage(res.data.message)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Something went wrong. Try again.')
      } else {
        setError('Something went wrong. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="w-full lg:w-[71%] flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900">Forgot Password</h1>
            <p className="mt-2 text-slate-500">Enter your email and we'll send you a reset link.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

            {error && (
              <p className="mt-4 text-center text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            {message && (
              <p className="mt-4 text-center text-sm font-medium text-green-600">
                {message}
              </p>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              Remember your password?{' '}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Login
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
