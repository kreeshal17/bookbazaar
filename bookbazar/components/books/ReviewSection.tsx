"use client"

import axios from "axios"
import { useState } from "react"

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { full_name: string }
}

interface Props {
  bookId: string
  initialReviews: Review[]
  initialAverage: number
  initialTotal: number
}

export default function ReviewSection({ bookId, initialReviews, initialAverage, initialTotal }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [average, setAverage] = useState(initialAverage)
  const [total, setTotal] = useState(initialTotal)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function submitReview() {
    if (rating === 0) { setError("Please select a rating"); return }
    setLoading(true)
    setError("")
    setMessage("")

    try {
      await axios.post("/api/reviews/create", { bookId, rating, comment })
      setMessage("Review submitted successfully!")
      setRating(0)
      setComment("")

      // refresh reviews
      const res = await axios.get(`/api/reviews/${bookId}`)
      setReviews(res.data.reviews)
      setAverage(res.data.average)
      setTotal(res.data.total)
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">
        Reviews {total > 0 && <span className="text-slate-500 font-normal text-lg">({total})</span>}
      </h2>

      {/* Submit Review */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
        <h3 className="font-bold text-slate-900 mb-4">Write a Review</h3>
        <p className="text-sm text-slate-500 mb-4">Only buyers with a delivered order can leave a review.</p>

        {/* Star Selector */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              <svg
                className={`w-8 h-8 fill-current transition-colors ${
                  star <= (hover || rating) ? "text-yellow-400" : "text-slate-200"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
              </svg>
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this book (optional)..."
          rows={3}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-2 text-sm text-green-600">{message}</p>}

        <button
          onClick={submitReview}
          disabled={loading}
          className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-slate-500">No reviews yet. Be the first to review this book!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{review.user.full_name}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 fill-current ${star <= review.rating ? "text-yellow-400" : "text-slate-200"}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                    </svg>
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="mt-3 text-slate-700">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}