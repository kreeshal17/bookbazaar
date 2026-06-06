'use client'


import axios from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"



interface Book {
  id: string
  title: string
  author: string | null
  description: string | null
  price: number
  stockQty: number
}


export default function Feature()
{
   const [books,setBooks]=useState<Book[]>([])

useEffect(()=>{

   async function handleFetch(){

      const response=await axios.get("/api/book/all")
      console.log(response.data)
      if(!response.data)
      {
         alert("no data found")
      }
      setBooks(response.data)


   }

   handleFetch()


},[])






return (
  <section className="w-full bg-white py-20">
    <div className="mx-auto max-w-7xl px-6">

      {/* Heading */}
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold text-slate-900">
          Featured Books
        </h2>

        <p className="mt-3 text-lg text-slate-600">
          Discover books from trusted sellers across Nepal
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {books.map((b) => (
          <div
            key={b.id}
            className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Book Cover */}
            <div className="flex h-72 items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200">
              <div className="flex h-52 w-36 flex-col items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xl">
                <span className="text-5xl">📚</span>

                <span className="mt-4 text-sm font-bold">
                  BookMandu
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col h-full p-6">

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium">(48)</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {b.title}
              </h3>

              <p className="mt-1 text-sm text-slate-500 font-medium">
                By {b.author || "Unknown Author"}
              </p>

              <p className="mt-3 text-sm text-slate-600 line-clamp-2 flex-grow">
                {b.description || "No description available."}
              </p>

              <div className="mt-5 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-indigo-600">
                    ₹ {b.price}
                  </span>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {b.stockQty} left
                  </span>
                </div>

                <Link
                  href={`/books/${b.id}`}
                  className="block w-full text-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                >
                  View Details
                </Link>
              </div>

            </div>  
          </div>
        ))}

      </div>

    </div>
  </section>
)
}


