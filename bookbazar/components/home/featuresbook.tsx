'use client'

import axios from "axios"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

interface Book {
  id: string
  slug: string
  title: string
  author: string | null
  description: string | null
  price: number
  originalPrice: number | null
  stockQty: number
  imageUrl: string | null
  condition: string
}

const conditionColors: Record<string, string> = {
  NEW: "bg-green-100 text-green-700",
  LIKE_NEW: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-blue-100 text-blue-700",
  ACCEPTABLE: "bg-yellow-100 text-yellow-700",
  OLD: "bg-red-100 text-red-700",
}

const conditionLabels: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  ACCEPTABLE: "Acceptable",
  OLD: "Old",
}

export default function Feature() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function handleFetch() {
      try {
        const response = await axios.get("/api/book/all")
        setBooks(response.data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    handleFetch()
  }, [])

  return (
    <section className="w-full bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-slate-900">Featured Books</h2>
          <p className="mt-3 text-lg text-slate-600">Discover books from trusted sellers across Nepal</p>
        </div>

        {loading && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((b) => {
              const discount = b.originalPrice && b.originalPrice > b.price
                ? Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100)
                : null

              return (
                <div
                  key={b.id}
                  className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Book Cover */}
                  <div className="relative h-72 w-full overflow-hidden bg-linear-to-br from-indigo-100 to-indigo-200">
                    {b.imageUrl ? (
                      <Image
                        src={b.imageUrl}
                        alt={b.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-7xl">📚</span>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {discount && (
                      <div className="absolute top-3 left-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        {discount}% OFF
                      </div>
                    )}

                    {/* Condition Badge */}
                    <div className={`absolute top-3 right-3 rounded-full px-2 py-1 text-xs font-semibold ${conditionColors[b.condition] || conditionColors.NEW}`}>
                      {conditionLabels[b.condition] || "New"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col h-full p-6">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {b.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 font-medium">
                      By {b.author || "Unknown Author"}
                    </p>

                    <p className="mt-3 text-sm text-slate-600 line-clamp-2 grow">
                      {b.description || "No description available."}
                    </p>

                    <div className="mt-5 pt-5 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-indigo-600">
                            Rs. {b.price}
                          </span>
                          {b.originalPrice && b.originalPrice > b.price && (
                            <span className="ml-2 text-sm text-slate-400 line-through">
                              Rs. {b.originalPrice}
                            </span>
                          )}
                        </div>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {b.stockQty} left
                        </span>
                      </div>

                      <Link
                        href={`/books/${b.slug}`}
                        className="block w-full text-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </section>
  )
}