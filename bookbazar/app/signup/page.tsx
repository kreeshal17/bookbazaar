'use client'

import axios from 'axios'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleForm(e: React.FormEvent) {
    e.preventDefault()

    setMessage('')

    if (!name.trim()) {
      setIsError(true)
      setMessage('Please enter your full name')
      return
    }

    if (!email.trim()) {
      setIsError(true)
      setMessage('Please enter your email')
      return
    }

    if (!role) {
      setIsError(true)
      setMessage('Please select a role')
      return
    }

    if (password.length < 8) {
      setIsError(true)
      setMessage('Password must be at least 8 characters')
      return
    }

    if (password !== confirm) {
      setIsError(true)
      setMessage('Passwords do not match')
      return
    }

    try {
      setLoading(true)

      const response = await axios.post('/api/auth/signup', {
        name,
        email,
        password,
        role,
      })

      setIsError(false)
      setMessage(response.data.message)

      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error: any) {
      setIsError(true)

      setMessage(
        error.response?.data?.message || 'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#030712] flex items-center justify-center overflow-hidden px-4">

      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 text-white text-2xl font-bold">
              B
            </div>

            <h1 className="text-3xl font-bold text-white">
              Create Account
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Join Book Bazaar today
            </p>
          </div>

          <form onSubmit={handleForm} className="space-y-4">

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none transition focus:border-fuchsia-500"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none transition focus:border-fuchsia-500"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-fuchsia-500"
            >
              <option value="" className="text-black">
                Select Role
              </option>

              <option value="BUYER" className="text-black">
                Buyer
              </option>

              <option value="SELLER" className="text-black">
                Seller
              </option>
            </select>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none transition focus:border-cyan-500"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none transition focus:border-cyan-500"
            />

            {message && (
              <div
                className={`rounded-xl p-3 text-sm ${
                  isError
                    ? 'bg-red-500/15 text-red-300 border border-red-500/20'
                    : 'bg-green-500/15 text-green-300 border border-green-500/20'
                }`}
              >
                {message}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="rounded-xl border border-white/10 bg-white/5 py-3 text-white hover:bg-white/10">
              Google
            </button>

            <button className="rounded-xl border border-white/10 bg-white/5 py-3 text-white hover:bg-white/10">
              GitHub
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-fuchsia-400 hover:text-fuchsia-300"
            >
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}