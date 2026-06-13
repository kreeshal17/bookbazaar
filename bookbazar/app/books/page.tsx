"use client";

import Footer from "@/components/home/footer";
import Navbar from "@/components/Navbar";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  price: number;
  stockQty: number;
}

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <section className="w-full bg-white py-12 md:py-20">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
              <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </section>
          <Footer />
        </>
      }
    >
      <BooksContent />
    </Suspense>
  );
}

function BooksContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim() || "";
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError("");

      try {
        const url = search
          ? `/api/book/all?search=${encodeURIComponent(search)}`
          : "/api/book/all";
        const response = await axios.get<Book[]>(url);
        setBooks(response.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Unable to load books");
        } else {
          setError("Unable to load books");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, [search]);

  return (
    <>
      <Navbar />
      <section className="w-full bg-white py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 text-center md:mb-12">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              {search ? `Search results for "${search}"` : "All Books"}
            </h2>

            <p className="mt-3 text-base text-slate-600 md:text-lg">
              {search
                ? "Showing approved seller books that match your search."
                : "Discover books from trusted sellers across Nepal."}
            </p>
          </div>

          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-96 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center font-medium text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && books.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-2xl font-bold text-slate-900">
                No books found
              </h3>
              <p className="mt-2 text-slate-500">
                Try searching by book title, author, ISBN, or description.
              </p>
              <Link
                href="/books"
                className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                View All Books
              </Link>
            </div>
          )}

          {!loading && !error && books.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex h-64 items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200 md:h-72">
                    <div className="flex h-48 w-32 flex-col items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xl md:h-52 md:w-36">
                      <span className="text-5xl">📚</span>
                      <span className="mt-4 text-sm font-bold">BookMandu</span>
                    </div>
                  </div>

                  <div className="flex h-full flex-col p-5 md:p-6">
                    <h3 className="line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                      {book.title}
                    </h3>

                    <p className="mt-1 text-sm font-medium text-slate-500">
                      By {book.author || "Unknown Author"}
                    </p>

                    <p className="mt-3 line-clamp-2 flex-grow text-sm text-slate-600">
                      {book.description || "No description available."}
                    </p>

                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className="text-2xl font-bold text-indigo-600">
                          Rs. {book.price}
                        </span>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {book.stockQty} left
                        </span>
                      </div>

                      <Link
                        href={`/books/${book.id}`}
                        className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
