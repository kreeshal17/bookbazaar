'use client'
import axios from "axios"
import { useEffect, useState } from "react";


interface Book {
  id: string
  storeId: string
  categoryId: string | null
  title: string
  description: string | null
  author: string | null
  isbn: string | null
  price: number
  stockQty: number
}
export default function Page(){

const [books, setBooks] = useState<Book[]>([])
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");


useEffect(() => {
  async function getBooks() {
    try {
      const response = await axios.get("/api/book/get");

      setBooks(response.data.books);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  getBooks();
}, []);





if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading Books...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-3xl font-bold mb-8">
        My Books
      </h1>

      {/* Stats */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        <div className="bg-white rounded-xl p-5 shadow">
          <h2 className="text-gray-500">
            Total Books
          </h2>

          <p className="text-3xl font-bold">
            {books.length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow">
          <h2 className="text-gray-500">
            Total Stock
          </h2>

          <p className="text-3xl font-bold">
            {books.reduce((acc, book) => acc + book.stockQty, 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow">
          <h2 className="text-gray-500">
            Inventory Value
          </h2>

          <p className="text-3xl font-bold">
            ₹{
              books.reduce(
                (acc, book) =>
                  acc + Number(book.price) * book.stockQty,
                0
              )
            }
          </p>
        </div>

      </div>

      {/* Books */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {books.map((book) => (

          <div
            key={book.id}
            className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition"
          >

            <h2 className="text-xl font-bold mb-2">
              {book.title}
            </h2>

            <p className="text-gray-500 mb-4">
              {book.author || "Unknown Author"}
            </p>

            <div className="space-y-2">

              <p>
                <span className="font-semibold">
                  ISBN:
                </span>{" "}
                {book.isbn || "N/A"}
              </p>

              <p>
                <span className="font-semibold">
                  Price:
                </span>{" "}
                ₹{book.price}
              </p>

              <p>
                <span className="font-semibold">
                  Stock:
                </span>{" "}
                {book.stockQty}
              </p>

              <p className="line-clamp-3 text-gray-600">
                {book.description || "No description available"}
              </p>

            </div>

            <div className="mt-5 flex gap-3">

              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                Edit
              </button>

              <button className="bg-red-600 text-white px-4 py-2 rounded-lg">
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}