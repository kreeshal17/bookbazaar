import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          
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

            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
              Explore thousands of books from independent sellers.
              Programming, Fiction, AI, Business, Academic books
              and much more all in one place.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
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

            <div className="mt-10 flex justify-center gap-8">
              <div>
                <h3 className="text-3xl font-bold text-slate-900">
                  1k+
                </h3>
                <p className="text-slate-500">
                  Books
                </p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-slate-900">
                  50+
                </h3>
                <p className="text-slate-500">
                  Sellers
                </p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-slate-900">
                       200+ 
                </h3>
                <p className="text-slate-500">
                  Readers
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
