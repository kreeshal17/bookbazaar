'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-indigo-600"
        >
          📚 BookMandu
        </Link>

        {/* Nav Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="font-medium text-slate-600 hover:text-indigo-600"
          >
            Home
          </Link>

          <Link
            href="/signup"
            className="font-medium text-slate-600 hover:text-indigo-600"
          >
            Books
          </Link>

          <Link
            href="/categories"
            className="font-medium text-slate-600 hover:text-indigo-600"
          >
            Categories
          </Link>

          <Link
            href="/signup"
            className="font-medium text-slate-600 hover:text-indigo-600"
          >
            Become Seller
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white transition hover:bg-indigo-700"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  )
}