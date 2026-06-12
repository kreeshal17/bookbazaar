"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Book {
  id: string;
  storeId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  author: string | null;
  isbn: string | null;
  price: number;
  stockQty: number;
}

export default function Page() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getBooks() {
      try {
        const response = await axios.get("/api/book/get");
        setBooks(response.data.books);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Something went wrong");
        } else {
          setError("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    }

    getBooks();
  }, []);

  const totalStock = useMemo(
    () => books.reduce((acc, book) => acc + book.stockQty, 0),
    [books]
  );

  const inventoryValue = useMemo(
    () =>
      books.reduce(
        (acc, book) => acc + Number(book.price) * book.stockQty,
        0
      ),
    [books]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Could not load books
          </h1>
          <p className="mt-3 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Seller inventory
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                My Books
              </h1>
              <p className="mt-2 max-w-2xl text-slate-500">
                Manage pricing, stock, and listing details for your store.
              </p>
            </div>

            <Link
              href="/seller/dashboard/add_book"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Add Book
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Books</p>
            <p className="mt-2 text-3xl font-bold">{books.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Stock</p>
            <p className="mt-2 text-3xl font-bold">{totalStock}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Inventory Value
            </p>
            <p className="mt-2 text-3xl font-bold">
              Rs. {inventoryValue.toLocaleString()}
            </p>
          </div>
        </div>

        {books.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No books yet</h2>
            <p className="mt-2 text-slate-500">
              Add your first book to start building your inventory.
            </p>
            <Link
              href="/seller/dashboard/add_book"
              className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Add Book
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <div
                key={book.id}
                className="flex min-h-72 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-3xl">
                    📚
                  </div>

                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-xl font-bold">
                      {book.title}
                    </h2>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {book.author || "Unknown Author"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">Price</p>
                    <p className="mt-1 font-bold">Rs. {book.price}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">Stock</p>
                    <p className="mt-1 font-bold">{book.stockQty}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-slate-500">
                    <span className="font-semibold text-slate-700">ISBN:</span>{" "}
                    {book.isbn || "N/A"}
                  </p>
                  <p className="line-clamp-3 text-slate-600">
                    {book.description || "No description available."}
                  </p>
                </div>

                <div className="mt-auto flex gap-3 pt-5">
                  <Link
                    href={`/seller/dashboard/add_book?id=${book.id}`}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-blue-700"
                  >
                    Edit
                  </Link>

                  <button className="flex-1 rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-600 transition hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
