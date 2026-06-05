
'use client'
import { useState } from "react";
import axios from "axios";


export default function AddBookPage() {
  const [title, setTitle] = useState("");
const [author, setAuthor] = useState("");
const [isbn, setIsbn] = useState("");
const [categoryId, setCategoryId] = useState("");
const [price, setPrice] = useState("");
const [stockQty, setStockQty] = useState("");
const [description, setDescription] = useState("");


async function handlesubmit(e:any)
{
e.preventDefault()
try{
const result=await axios.post("/api/book/create",{
    title,
    author,
    isbn,
    categoryId,
    price:Number(price),
    stockQty:Number(stockQty),
    description
    


    }
)
console.log(result)
}
catch(e)
{
     console.error(e);
}


}

 return (
  <div className="min-h-screen bg-slate-50 p-10">
    <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">
          Add New Book
        </h1>

        <p className="mt-2 text-slate-500">
          Add a new book to your store inventory
        </p>
      </div>

      <form onSubmit={handlesubmit}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Form Section */}
          <div className="space-y-6 lg:col-span-2">
            <div>
              <label className="mb-2 block font-medium text-slate-700">
                Book Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-slate-700">
                Author
              </label>

              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-slate-700">
                ISBN
              </label>

              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="Enter ISBN number"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block font-medium text-slate-700">
                  Price
                </label>

                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="299"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-700">
                  Stock Quantity
                </label>

                <input
                  type="number"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  placeholder="10"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium text-slate-700">
                Category
              </label>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Select Category</option>
                <option value="programming">Programming</option>
                <option value="dcurriculum">Curriculum</option>
                <option value="history">history</option>
                <option value="others">others</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium text-slate-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Write book description..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-10 py-4 font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-indigo-700"
              >
                Add Book
              </button>
            </div>
          </div>

          {/* Preview Card */}
          <div>
            <div className="sticky top-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="aspect-[3/4] rounded-2xl bg-slate-200 flex items-center justify-center text-7xl">
                📚
              </div>

              <div className="mt-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {title || "Book Title"}
                </h2>

                <p className="mt-1 text-slate-500">
                  {author || "Author Name"}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    ₹ {price || "0"}
                  </span>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    Stock {stockQty || "0"}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="mb-2 font-semibold text-slate-700">
                    Category
                  </h3>

                  <p className="text-slate-500">
                    {categoryId || "No category selected"}
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="mb-2 font-semibold text-slate-700">
                    Description
                  </h3>

                  <p className="line-clamp-6 text-sm text-slate-500">
                    {description ||
                      "Your book description will appear here as you type."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
);
}