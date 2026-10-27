import { describe, it, expect, beforeEach } from "vitest"
import { resetDb, prisma, createUser, createSellerWithStore, createBook, createDeliveredOrder, SHIPPING } from "../helpers/db"
import { loginAs } from "../helpers/auth"
import { jsonReq, params, json } from "../helpers/http"
import { POST as createReview } from "@/app/api/reviews/create/route"
import { GET as bookReviews } from "@/app/api/reviews/[bookId]/route"

beforeEach(resetDb)

describe("book reviews", () => {
  it("only buyers with a DELIVERED order containing the book can review", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id)
    const buyer = await createUser()
    await loginAs(buyer)

    expect((await createReview(jsonReq("/x", { bookId: book.id, rating: 5 }))).status).toBe(403)

    // a non-delivered order still doesn't count
    await prisma.order.create({
      data: {
        buyerId: buyer.id,
        totalAmount: 100,
        status: "SHIPPED",
        ...SHIPPING,
        items: { create: { bookId: book.id, storeId: store.id, quantity: 1, unitPrice: 100, totalPrice: 100 } },
      },
    })
    expect((await createReview(jsonReq("/x", { bookId: book.id, rating: 5 }))).status).toBe(403)

    await createDeliveredOrder(buyer.id, book.id, store.id)
    expect((await createReview(jsonReq("/x", { bookId: book.id, rating: 5, comment: "Great" }))).status).toBe(201)
  })

  it("one review per user per book, rating 1-5", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id)
    const buyer = await createUser()
    await createDeliveredOrder(buyer.id, book.id, store.id)
    await loginAs(buyer)

    expect((await createReview(jsonReq("/x", { bookId: book.id, rating: 6 }))).status).toBe(400)
    expect((await createReview(jsonReq("/x", { bookId: book.id, rating: 0 }))).status).toBe(400)
    await createReview(jsonReq("/x", { bookId: book.id, rating: 4 }))
    expect((await createReview(jsonReq("/x", { bookId: book.id, rating: 3 }))).status).toBe(409)
  })

  it("GET returns reviews with author names and a 1-decimal average", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id)
    const [a, b, c] = await Promise.all([createUser({ full_name: "A" }), createUser({ full_name: "B" }), createUser({ full_name: "C" })])
    await prisma.review.createMany({
      data: [
        { bookId: book.id, userId: a.id, rating: 5 },
        { bookId: book.id, userId: b.id, rating: 4 },
        { bookId: book.id, userId: c.id, rating: 4 },
      ],
    })
    const body = await json(await bookReviews(jsonReq("/x"), params({ bookId: book.id })))
    expect(body.total).toBe(3)
    expect(body.average).toBe(4.3)
    expect(body.reviews[0].user.full_name).toBeDefined()
  })

  it("GET with no reviews returns average 0", async () => {
    const body = await json(await bookReviews(jsonReq("/x"), params({ bookId: "none" })))
    expect(body).toEqual({ reviews: [], average: 0, total: 0 })
  })
})
