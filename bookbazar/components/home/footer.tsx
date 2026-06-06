import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-indigo-400">
              📚 BookMandu
            </h2>

            <p className="mt-4 text-slate-400">
              Discover books from trusted sellers. Learn, grow,
              and explore new ideas through reading.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Quick Links
            </h3>

            <ul className="space-y-3 text-slate-400">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>

              <li>
                <Link href="/books" className="hover:text-white">
                  Books
                </Link>
              </li>

              <li>
                <Link href="/categories" className="hover:text-white">
                  Categories
                </Link>
              </li>

              <li>
                <Link href="/seller" className="hover:text-white">
                  Become Seller
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Categories
            </h3>

            <ul className="space-y-3 text-slate-400">
              <li>Programming</li>
              <li>Database</li>
              <li>AI & ML</li>
              <li>Business</li>
              <li>Academic</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Contact
            </h3>

            <ul className="space-y-3 text-slate-400">
              <li>📧 support@bookmandu.com</li>
              <li>📍 Kathmandu, Nepal</li>
              <li>📞 +977 9827897983</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-slate-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-500">
              © 2026 BookMandu. All rights reserved.
            </p>

            <div className="flex gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>

              <Link href="/terms" className="hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}