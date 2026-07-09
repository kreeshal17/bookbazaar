import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">404</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-600">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">
            Go home
          </Link>
          <Link href="/books" className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700">
            Browse books
          </Link>
        </div>
      </div>
    </main>
  );
}
