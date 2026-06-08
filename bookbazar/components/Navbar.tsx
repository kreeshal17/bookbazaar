'use client'

import axios from 'axios'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [user, setUser] = useState<{ email: string } | null>(null)

  async function handleLogout() {
    await axios.post('/api/auth/logout')
    setUser(null)
  }

  useEffect(() => {
    async function getUser() {
      try {
        const res = await axios.get('/api/auth/me')
        setUser(res.data)
      } catch {
        setUser(null)
      }
    }
    getUser()
  }, [])

  const avatarLabel = user?.email?.split('@')[0]?.slice(0, 4).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-[62px] max-w-7xl items-center justify-between gap-6 px-6">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[17px] font-semibold text-indigo-700 tracking-tight">
          📚 BookMandu
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <Link href="/" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            Home
          </Link>
          <Link href="/books" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            Books
          </Link>
          <Link href="/categories" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            Categories
          </Link>
          {!user && (
            <Link href="/signup" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              Become a seller
            </Link>
          )}
        </nav>

        {/* Guest Actions */}
        {!user ? (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="rounded-md border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Sign up
            </Link>
          </div>
        ) : (

          /* Logged-in Actions */
          <div className="flex items-center gap-1 shrink-0">

            {/* Utility links */}
            <Link href="/orders" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              My orders
            </Link>
            <Link href="/cart-items" className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              History
            </Link>

            {/* Divider */}
            <div className="mx-2 h-5 w-px bg-slate-200" />

            {/* Cart */}
            <Link
              href="/cart"
              className="flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              🛒 Cart
            </Link>

            {/* Divider */}
            <div className="mx-2 h-5 w-px bg-slate-200" />

            {/* Avatar */}
            <div
              title={user.email}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white uppercase select-none cursor-default"
            >
              {avatarLabel}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}