'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/seller/dashboard',
      icon: '🏠',
    },
    {
      name: 'My Books', 
      href: '/seller/dashboard/mybook',
      icon: '📚',
    },
    {
      name: 'Add Book',
      href: '/seller/dashboard/add_book',
      icon: '➕',
    },
    {
      name: 'Orders',
      href: '/seller/dashboard/orders',
      icon: '📦',
    },
    {
      name: 'Settings',
      href: 'seller/dashboard/settings',
      icon: '⚙️',
    },
  ]

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="border-b border-slate-700 p-6">
        <h1 className="text-2xl font-bold tracking-wide">
          📖 BookSeller
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Seller Dashboard
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-700 p-4">
        <button className="w-full rounded-lg bg-red-500 px-4 py-3 font-medium hover:bg-red-600 transition">
          Logout
        </button>
      </div>
    </aside>
  )
}