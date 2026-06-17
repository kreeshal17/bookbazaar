import prisma from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Footer from "@/components/home/footer"
import Image from "next/image"
import Addtocart from "@/components/books/addtocart"
import BookQRCode from "@/components/books/BookQRCode"
import ReviewSection from "@/components/books/ReviewSection"

export default async function Book({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const book = await prisma.book.findFirst({
    where: { id, isActive: true, store: { isActive: true } }
  })

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
    )
  }

  const store = await prisma.store.findUnique({ where: { id: book.storeId } })

  const reviews = await prisma.review.findMany({
    where: { bookId: id },
    include: { user: { select: { full_name: true } } },
    orderBy: { createdAt: "desc" }
  })

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

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

            {/* Book Cover */}
            <div className="md:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="relative overflow-hidden rounded-3xl shadow-2xl w-full aspect-[2/3]">
                  {book.imageUrl ? (
                    <>
                      <Image
                        src={book.imageUrl}
                        alt={book.title}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 768px) 100vw, 40vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                      <div className="text-center">
                        <span className="text-8xl">📚</span>
                        <p className="mt-4 text-sm font-semibold text-white/80">No cover available</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-sm ${
                  book.stockQty > 0 ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"
                }`}>
                  <span className={`h-3 w-3 shrink-0 rounded-full ${book.stockQty > 0 ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className={`text-sm font-semibold ${book.stockQty > 0 ? "text-green-700" : "text-red-700"}`}>
                      {book.stockQty > 0 ? "In Stock" : "Out of Stock"}
                    </p>
                    {book.stockQty > 0 && (
                      <p className="text-xs text-green-600">{book.stockQty} copies available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="md:col-span-3 flex flex-col">

              {/* Real Rating */}
              <div className="mb-6 flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 fill-current ${star <= Math.round(average) ? "text-yellow-400" : "text-slate-200"}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-600">
                  {average > 0 ? `${average.toFixed(1)} (${reviews.length} reviews)` : "No reviews yet"}
                </span>
              </div>

              <h1 className="mb-3 text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                {book.title}
              </h1>

              <p className="mb-6 text-lg text-slate-600">
                ✍️ By <span className="font-semibold text-indigo-600">{book.author || "Unknown Author"}</span>
              </p>

              <div className="mb-8 h-px bg-slate-200"></div>

              <div className="mb-8">
                <h2 className="mb-3 text-lg font-bold text-slate-900">About this book</h2>
                <p className="text-base leading-relaxed text-slate-700">
                  {book.description || "No description available for this book."}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border border-indigo-100">
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Current Price</p>
                    <p className="text-5xl font-bold text-indigo-600">Rs. {book.price.toString()}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500 mb-1">Free Shipping</p>
                    <p className="text-lg font-semibold text-green-600">Save 10%</p>
                  </div>
                </div>
              </div>

              <Addtocart bookID={book.id} />
              <BookQRCode path={`/books/${book.id}`} />

              {/* Seller Info */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                    🏪
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-slate-900">{store?.name}</h3>
                    <p className="text-sm text-slate-600">Verified Seller</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Review Section */}
          <ReviewSection bookId={id} initialReviews={reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
            user: { full_name: r.user.full_name }
          }))} initialAverage={average} initialTotal={reviews.length} />

        </div>
      </main>
      <Footer />
    </>
  )
}