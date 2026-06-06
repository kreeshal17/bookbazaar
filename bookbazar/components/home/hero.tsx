import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          
          {/* Left */}
          <div>
            <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
               Nepal's Online Book Marketplace
            </span>

            <h1 className="mt-6 text-5xl font-extrabold leading-tight text-slate-900 md:text-6xl">
              Discover Books
              <span className="text-indigo-600">
                {" "}You'll Love
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Explore thousands of books from independent sellers.
              Programming, Fiction, AI, Business, Academic books
              and much more all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/books"
                className="rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-indigo-700"
              >
                Browse Books
              </Link>

              <Link
                href="/signup"
                className="rounded-xl border border-slate-300 px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Become a Seller
              </Link>
            </div>

            <div className="mt-10 flex gap-8">
              <div>
                <h3 className="text-3xl font-bold text-slate-900">
                  10K+
                </h3>
                <p className="text-slate-500">
                  Books
                </p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-slate-900">
                  500+
                </h3>
                <p className="text-slate-500">
                  Sellers
                </p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-slate-900">
                  15K+
                </h3>
                <p className="text-slate-500">
                  Readers
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white p-6 shadow-xl">
                <div className="text-6xl">📘</div>
                <h3 className="mt-4 font-bold text-green-300">
                  Programming
                </h3>
                <p className="text-sm text-slate-500">
                  Learn coding & development
                </p>
              </div>

              <div className="mt-10 rounded-3xl bg-white p-6 shadow-xl">
                <div className="text-6xl">🤖</div>
                <h3 className="mt-4 font-bold  text-green-300">
                  AI & ML
                </h3>
                <p className="text-sm text-slate-500">
                  Modern AI resources
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-xl">
                <div className="text-6xl">📚</div>
                <h3 className="mt-4 font-bold  text-green-300">
                  Academic
                </h3>
                <p className="text-sm text-slate-500  text-green-300">
                  College & university books
                </p>
              </div>

              <div className="mt-10 rounded-3xl bg-white p-6 shadow-xl">
                <div className="text-6xl">💼</div>
                <h3 className="mt-4 font-bold  text-green-300">
                  Business
                </h3>
                <p className="text-sm text-slate-500">
                  Growth & entrepreneurship
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}