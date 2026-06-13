
import prisma from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Footer from "@/components/home/footer"
import axios from "axios"


import Addtocart from "@/components/books/addtocart"


export default async function Book({params}:{params:Promise<{id:string}>})
{
    





const {id}= await params
const book= await prisma.book.findFirst({

    where:{
        id:id,
        isActive:true,
        store:{
          isActive:true
        }
    }
})



console.log(book);
  if (!book) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900">Book Not Found</h1>
            <p className="mt-2 text-slate-600">Sorry, the book you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  const store=await prisma.store.findUnique({
    where:{
        id:book.storeId
    }
})

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          
          {/* Breadcrumb */}
          <div className="mb-10 flex items-center gap-2 text-sm text-slate-600">
            <a href="/" className="hover:text-indigo-600 transition">Home</a>
            <span>/</span>
            <a href="/books" className="hover:text-indigo-600 transition">Books</a>
            <span>/</span>
            <span className="text-slate-900 font-medium truncate">{book.title}</span>
          </div>

          {/* Main Content */}
          <div className="grid gap-12 md:grid-cols-5 lg:gap-16">

            {/* Book Cover - Left */}
            <div className="md:col-span-2">
              <div className="sticky top-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 shadow-2xl overflow-hidden">
                <div className="flex h-96 w-full items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-9xl">
                  📚
                </div>
                
                {/* Stock Badge */}
                <div className="mt-6 flex items-center gap-3 rounded-xl bg-white/20 backdrop-blur p-4">
                  <span className={`inline-block h-3 w-3 rounded-full ${book.stockQty > 0 ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  <span className="text-white font-semibold">
                    {book.stockQty > 0 ? `${book.stockQty} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Book Details - Right */}
            <div className="md:col-span-3 flex flex-col">

              {/* Rating */}
              <div className="mb-6 flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-600">(256 reviews)</span>
              </div>

              {/* Title */}
              <h1 className="mb-3 text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                {book.title}
              </h1>

              {/* Author */}
              <p className="mb-6 text-lg text-slate-600">
                ✍️ By <span className="font-semibold text-indigo-600">{book.author || "Unknown Author"}</span>
              </p>

              {/* Divider */}
              <div className="mb-8 h-px bg-slate-200"></div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-bold text-slate-900">About this book</h2>
                <p className="text-base leading-relaxed text-slate-700">
                  {book.description || "No description available for this book."}
                </p>
              </div>

              {/* Price Section */}
              <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border border-indigo-100">
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Current Price</p>
                    <p className="text-5xl font-bold text-indigo-600"> ₹{(book.price).toString()}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500 mb-1">Free Shipping</p>
                    <p className="text-lg font-semibold text-green-600">Save 10%</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
            <Addtocart bookID={book.id}/>

              {/* Seller Info */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                    🏪
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-slate-900">{store?.name}</h3>
                    <p className="text-sm text-slate-600">Verified Seller • (Good reviews)</p>
                  </div>
                  <button className="px-6 py-2 text-indigo-600 font-semibold border border-indigo-200 rounded-lg hover:bg-indigo-50 transition">
                    View Store
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
