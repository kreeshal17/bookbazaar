"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await axios.post("/api/auth/logout");
    router.push("/login");
    router.refresh();
  }

  const menuItems = [
    {
      name: "Dashboard",
      href: "/seller/dashboard",
      icon: "🏠",
    },
    {
      name: "My Books",
      href: "/seller/dashboard/mybook",
      icon: "📚",
    },
    {
      name: "Add Book",
      href: "/seller/dashboard/add_book",
      icon: "➕",
    },
    {
      name: "Orders",
      href: "/seller/dashboard/orders",
      icon: "📦",
    },
  ];

  return (
    <aside className="bg-slate-900 text-white md:sticky md:top-0 md:flex md:min-h-screen md:w-64 md:flex-col">
      <div className="border-b border-slate-700 p-4 md:p-6">
        <h1 className="text-xl font-bold tracking-wide md:text-2xl">
          📖 BookSeller
        </h1>
        <p className="mt-1 text-sm text-slate-400">Seller Dashboard</p>
      </div>

      <nav className="flex-1 p-3 md:p-4">
        <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {menuItems.map((item) => {
            const active = pathname === item.href;

            return (
              <li key={item.href} className="shrink-0 md:shrink">
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm transition-all duration-200 md:text-base ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-700 p-3 md:p-4">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-red-500 px-4 py-3 font-medium transition hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
