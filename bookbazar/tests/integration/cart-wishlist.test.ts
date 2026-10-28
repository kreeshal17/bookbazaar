import { describe, it, expect, beforeEach } from "vitest"
import { resetDb, prisma, createUser, createSellerWithStore, createBook, addToCart } from "../helpers/db"
import { loginAs } from "../helpers/auth"
import { jsonReq, params, json } from "../helpers/http"
import { POST as addCart } from "@/app/api/cart/add/route"
import { GET as getCart } from "@/app/api/cart/get/route"
import { PATCH as decreaseCart } from "@/app/api/cart/decrease/route"
import { PATCH as patchCartItem, DELETE as deleteCartItem } from "@/app/api/cart/[id]/route"
import { POST as toggleWishlist } from "@/app/api/wishlist/toggle/route"
import { GET as getWishlist } from "@/app/api/wishlist/get/route"
import { POST as trackView } from "@/app/api/recently-viewed/route"
import { POST as trackSearch } from "@/app/api/search-history/route"

beforeEach(resetDb)

async function buyerAndBook(stockQty = 10) {
  const { store } = await createSellerWithStore()
  const book = await createBook(store.id, { stockQty })
  const buyer = await createUser()
  await loginAs(buyer)
  return { buyer, book, store }
}

describe("cart", () => {
  it("requires login", async () => {
    expect((await addCart(jsonReq("/api/cart/add", { bookID: "x" }))).status).toBe(401)
    expect((await getCart()).status).toBe(401)
  })

  it("adding the same book twice bumps quantity instead of duplicating", async () => {
    const { buyer, book } = await buyerAndBook()
    expect((await addCart(jsonReq("/api/cart/add", { bookID: book.id }))).status).toBe(201)
    expect((await addCart(jsonReq("/api/cart/add", { bookID: book.id }))).status).toBe(200)
    const items = await prisma.cartItem.findMany({ where: { userId: buyer.id } })
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it("refuses unavailable books (inactive book or unapproved store)", async () => {
    const { store } = await createSellerWithStore({ isApproved: false })
    const book = await createBook(store.id)
    await loginAs(await createUser())
    expect((await addCart(jsonReq("/api/cart/add", { bookID: book.id }))).status).toBe(404)
  })

  it("GET hides items whose book was delisted or store was banned", async () => {
    const { buyer, book, store } = await buyerAndBook()
    const hidden = await createBook(store.id, { isActive: false })
    await addToCart(buyer.id, book.id)
    await addToCart(buyer.id, hidden.id)
    const items = await json(await getCart())
    expect(items.map((i: { bookId: string }) => i.bookId)).toEqual([book.id])
  })

  it("PATCH increment respects stock; decrement at 1 removes the row", async () => {
    const { buyer, book } = await buyerAndBook(2)
    const item = await addToCart(buyer.id, book.id, 1)
    const patch = (action: string) => patchCartItem(jsonReq("/x", { action }, "PATCH"), params({ id: item.id }))

    expect((await json(await patch("increment"))).cartItem.quantity).toBe(2)
    expect((await patch("increment")).status).toBe(400)
    await patch("decrement")
    expect((await json(await patch("decrement"))).cartItem).toBeNull()
    expect(await prisma.cartItem.count()).toBe(0)
    expect((await patch("bogus")).status).toBe(400)
  })

  it("users cannot modify someone else's cart item", async () => {
    const { book } = await buyerAndBook()
    const other = await createUser()
    const item = await addToCart(other.id, book.id)
    expect((await deleteCartItem(jsonReq("/x"), params({ id: item.id }))).status).toBe(404)
    expect((await patchCartItem(jsonReq("/x", { action: "increment" }, "PATCH"), params({ id: item.id }))).status).toBe(404)
  })

  it("DELETE removes; /api/cart/decrease decrements then removes", async () => {
    const { buyer, book } = await buyerAndBook()
    const item = await addToCart(buyer.id, book.id, 2)
    await decreaseCart(jsonReq("/x", { cartItemId: item.id }, "PATCH"))
    expect((await prisma.cartItem.findUniqueOrThrow({ where: { id: item.id } })).quantity).toBe(1)
    await decreaseCart(jsonReq("/x", { cartItemId: item.id }, "PATCH"))
    expect(await prisma.cartItem.count()).toBe(0)

    const again = await addToCart(buyer.id, book.id)
    expect((await deleteCartItem(jsonReq("/x"), params({ id: again.id }))).status).toBe(200)
    expect(await prisma.cartItem.count()).toBe(0)
  })

  it("blocked users are refused", async () => {
    const { book } = await createSellerWithStore().then(async ({ store }) => ({ book: await createBook(store.id) }))
    await loginAs(await createUser({ isBlocked: true }))
    expect((await addCart(jsonReq("/api/cart/add", { bookID: book.id }))).status).toBe(403)
  })
})

describe("wishlist", () => {
  it("toggle adds then removes", async () => {
    const { book } = await buyerAndBook()
    const add = await toggleWishlist(jsonReq("/x", { bookId: book.id }))
    expect(add.status).toBe(201)
    expect((await json(add)).wishlisted).toBe(true)
    expect((await json(await getWishlist())).map((w: { bookId: string }) => w.bookId)).toEqual([book.id])

    expect((await json(await toggleWishlist(jsonReq("/x", { bookId: book.id })))).wishlisted).toBe(false)
    expect(await json(await getWishlist())).toEqual([])
  })

  it("validates bookId and availability", async () => {
    await buyerAndBook()
    expect((await toggleWishlist(jsonReq("/x", {}))).status).toBe(400)
    expect((await toggleWishlist(jsonReq("/x", { bookId: "missing" }))).status).toBe(404)
  })
})

describe("personalization signals", () => {
  it("recently-viewed upserts one row per (user, book) and bumps viewedAt", async () => {
    const { buyer, book } = await buyerAndBook()
    await trackView(jsonReq("/x", { bookId: book.id }))
    const first = await prisma.recentlyViewedBook.findFirstOrThrow({ where: { userId: buyer.id } })
    await new Promise((r) => setTimeout(r, 10))
    await trackView(jsonReq("/x", { bookId: book.id }))
    const rows = await prisma.recentlyViewedBook.findMany({ where: { userId: buyer.id } })
    expect(rows).toHaveLength(1)
    expect(rows[0].viewedAt.getTime()).toBeGreaterThan(first.viewedAt.getTime())
    expect((await trackView(jsonReq("/x", { bookId: "missing" }))).status).toBe(404)
  })

  it("search-history stores trimmed queries and rejects empty/oversized ones", async () => {
    const buyer = await createUser()
    await loginAs(buyer)
    expect((await trackSearch(jsonReq("/x", { query: "  muna madan " }))).status).toBe(201)
    expect((await prisma.searchHistoryEntry.findFirstOrThrow()).query).toBe("muna madan")
    expect((await trackSearch(jsonReq("/x", { query: "   " }))).status).toBe(400)
    expect((await trackSearch(jsonReq("/x", { query: "x".repeat(121) }))).status).toBe(400)
  })
})
