'use client'


import axios from "axios"
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
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
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
            <div className="p-5">

              <h3 className="text-xl font-bold text-slate-900">
                {b.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                By {b.author || "Unknown Author"}
              </p>

              <p className="mt-3 text-sm text-slate-600 line-clamp-3">
                {b.description || "No description available."}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-2xl font-bold text-indigo-600">
                  ₹ {b.price}
                </span>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {b.stockQty} left
                </span>
              </div>

              <button className="mt-5 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700">
                View Details
              </button>

            </div>
          </div>
        ))}

      </div>

    </div>
  </section>
)
}


