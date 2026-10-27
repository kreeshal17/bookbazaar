import { describe, it, expect, beforeEach, vi } from "vitest"
import { resetDb, prisma, createUser, createSellerWithStore, createBook, SHIPPING } from "../helpers/db"
import { loginAs } from "../helpers/auth"
import { jsonReq, formReq, params, json } from "../helpers/http"
import { resend } from "@/lib/resend/resend"
import { POST as createStore } from "@/app/api/store/create/route"
import { GET as myStore, PATCH as patchMyStore } from "@/app/api/store/mine/route"
import { GET as myPayouts } from "@/app/api/store/payouts/route"
import { POST as createBookRoute } from "@/app/api/book/create/route"
import { GET as myBooks } from "@/app/api/book/get/route"
import { GET as getBook, PATCH as patchBook, DELETE as deleteBook } from "@/app/api/book/[id]/route"
import { GET as sellerOrders } from "@/app/api/seller/orders/route"
import { PATCH as patchSellerOrder } from "@/app/api/seller/orders/[id]/route"
import { POST as upload } from "@/app/api/upload/route"

beforeEach(resetDb)

const storeBody = {
  storename: "Ram Books",
  description: "Second-hand textbooks in Kathmandu",
  phone: "9800000000",
  identityUrl: "https://res.cloudinary.com/test/id.png",
}

describe("seller onboarding — POST /api/store/create", () => {
  it("creates an unapproved, inactive store with a unique slug", async () => {
    const seller = await createUser({ role: "SELLER" })
    await loginAs(seller)
    const res = await createStore(jsonReq("/api/store/create", storeBody))
    expect(res.status).toBe(201)
    const { store } = await json(res)
    expect(store).toMatchObject({ slug: "ram-books", isApproved: false, isActive: false })
  })

  it("emails ADMIN_EMAIL when set", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@test.local")
    await loginAs(await createUser({ role: "SELLER" }))
    await createStore(jsonReq("/api/store/create", storeBody))
    expect(vi.mocked(resend.emails.send)).toHaveBeenCalledWith(expect.objectContaining({ to: "admin@test.local" }))
    vi.unstubAllEnvs()
  })

  it("rejects buyers (403), a second store (409), and bad input (400)", async () => {
    await loginAs(await createUser())
    expect((await createStore(jsonReq("/api/store/create", storeBody))).status).toBe(403)

    const { seller } = await createSellerWithStore()
    await loginAs(seller)
    expect((await createStore(jsonReq("/api/store/create", storeBody))).status).toBe(409)
    expect((await createStore(jsonReq("/api/store/create", { ...storeBody, phone: "x" }))).status).toBe(400)
  })

  it("dedupes store slugs with a numeric suffix", async () => {
    await createSellerWithStore()
    await prisma.store.updateMany({ data: { slug: "ram-books" } })
    await loginAs(await createUser({ role: "SELLER" }))
    const { store } = await json(await createStore(jsonReq("/api/store/create", storeBody)))
    expect(store.slug).toBe("ram-books-2")
  })
})

describe("my store — /api/store/mine and /api/store/payouts", () => {
  it("returns the seller's store and lets them edit only the description", async () => {
    const { seller, store } = await createSellerWithStore()
    await loginAs(seller)
    expect((await json(await myStore())).store.slug).toBe(store.slug)

    const res = await patchMyStore(jsonReq("/api/store/mine", { description: "Updated description!" }, "PATCH"))
    expect((await json(res)).store.description).toBe("Updated description!")
    expect((await patchMyStore(jsonReq("/api/store/mine", { description: "short" }, "PATCH"))).status).toBe(400)
  })

  it("PATCH 404s without a store", async () => {
    await loginAs(await createUser({ role: "SELLER" }))
    expect((await patchMyStore(jsonReq("/api/store/mine", { description: "Valid description" }, "PATCH"))).status).toBe(404)
  })

  it("payouts sums only PENDING adjustments", async () => {
    const { seller, store } = await createSellerWithStore()
    const buyer = await createUser()
    const order = await prisma.order.create({ data: { buyerId: buyer.id, totalAmount: 100, ...SHIPPING } })
    await prisma.sellerPayoutAdjustment.createMany({
      data: [
        { storeId: store.id, orderId: order.id, amount: 10, reason: "x" },
        { storeId: store.id, orderId: order.id, amount: 5, reason: "x", status: "PAID" },
      ],
    })
    await loginAs(seller)
    const body = await json(await myPayouts())
    expect(body.adjustments).toHaveLength(2)
    expect(body.totalOwed).toBe(10)
  })

  it("payouts is empty for a user without a store", async () => {
    await loginAs(await createUser())
    expect(await json(await myPayouts())).toEqual({ adjustments: [], totalOwed: 0 })
  })
})

describe("book listings", () => {
  const bookBody = {
    title: "Muna Madan",
    description: "A classic Nepali epic poem by Devkota.",
    author: "Laxmi Prasad Devkota",
    price: 250,
    stockQty: 3,
    categoryId: "fiction",
  }

  it("approved sellers can list a book; category is upserted by slug", async () => {
    const { seller, store } = await createSellerWithStore()
    await loginAs(seller)
    const res = await createBookRoute(jsonReq("/api/book/create", bookBody))
    expect(res.status).toBe(201)
    const { book } = await json(res)
    expect(book).toMatchObject({ storeId: store.id, slug: "muna-madan" })
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: "fiction" } })
    expect(category.name).toBe("Fiction")
    expect(book.categoryId).toBe(category.id)

    const second = await json(await createBookRoute(jsonReq("/api/book/create", bookBody)))
    expect(second.book.slug).toBe("muna-madan-2")
  })

  it("unapproved stores cannot list (403); bad payloads 400; no store 404", async () => {
    const { seller } = await createSellerWithStore({ isApproved: false })
    await loginAs(seller)
    expect((await createBookRoute(jsonReq("/api/book/create", bookBody))).status).toBe(403)
    expect((await createBookRoute(jsonReq("/api/book/create", { ...bookBody, price: -1 }))).status).toBe(400)

    await loginAs(await createUser({ role: "SELLER" }))
    expect((await createBookRoute(jsonReq("/api/book/create", bookBody))).status).toBe(404)
  })

  it("GET /api/book/get lists only the seller's active books", async () => {
    const { seller, store } = await createSellerWithStore()
    const { store: other } = await createSellerWithStore()
    const mine = await createBook(store.id)
    await createBook(store.id, { isActive: false })
    await createBook(other.id)
    await loginAs(seller)
    const { books } = await json(await myBooks())
    expect(books.map((b: { id: string }) => b.id)).toEqual([mine.id])
  })

  it("sellers can read/edit/soft-delete only their own books", async () => {
    const { seller, store } = await createSellerWithStore()
    const { store: other } = await createSellerWithStore()
    const mine = await createBook(store.id)
    const theirs = await createBook(other.id)
    await loginAs(seller)

    expect((await getBook(jsonReq("/x"), params({ id: theirs.id }))).status).toBe(404)
    expect((await getBook(jsonReq("/x"), params({ id: mine.id }))).status).toBe(200)

    const edit = { title: "Renamed Book", price: 120, stockQty: 5, categoryId: "academic" }
    expect((await patchBook(jsonReq("/x", edit, "PATCH"), params({ id: theirs.id }))).status).toBe(404)
    const { book } = await json(await patchBook(jsonReq("/x", edit, "PATCH"), params({ id: mine.id })))
    expect(book).toMatchObject({ title: "Renamed Book", slug: "renamed-book", stockQty: 5 })

    expect((await deleteBook(jsonReq("/x"), params({ id: theirs.id }))).status).toBe(404)
    await deleteBook(jsonReq("/x"), params({ id: mine.id }))
    expect((await prisma.book.findUniqueOrThrow({ where: { id: mine.id } })).isActive).toBe(false)
  })
})

describe("seller order management", () => {
  async function orderWithItemsFrom(buyerId: string, storeIds: string[]) {
    const items = []
    for (const storeId of storeIds) {
      const book = await createBook(storeId)
      items.push({ bookId: book.id, storeId, quantity: 1, unitPrice: 100, totalPrice: 100 })
    }
    return prisma.order.create({
      data: { buyerId, totalAmount: 100 * storeIds.length, deliveryCode: "123456", ...SHIPPING, items: { create: items } },
    })
  }

  it("sellers see only orders (and only the items) from their store", async () => {
    const { seller, store } = await createSellerWithStore()
    const { store: other } = await createSellerWithStore()
    const buyer = await createUser()
    const shared = await orderWithItemsFrom(buyer.id, [store.id, other.id])
    await orderWithItemsFrom(buyer.id, [other.id])

    await loginAs(seller)
    const { orders } = await json(await sellerOrders())
    expect(orders.map((o: { id: string }) => o.id)).toEqual([shared.id])
    expect(orders[0].items).toHaveLength(1)
    expect(orders[0].items[0].storeId).toBe(store.id)
  })

  it("status moves forward; DELIVERED needs the buyer's delivery code; final states are locked", async () => {
    const { seller, store } = await createSellerWithStore()
    const order = await orderWithItemsFrom((await createUser()).id, [store.id])
    await loginAs(seller)
    const patch = (body: object) => patchSellerOrder(jsonReq("/x", body, "PATCH"), params({ id: order.id }))

    expect((await patch({ status: "SHIPPED" })).status).toBe(200)
    expect((await patch({ status: "DELIVERED", deliveryCode: "000000" })).status).toBe(400)
    expect((await patch({ status: "DELIVERED", deliveryCode: "123456" })).status).toBe(200)
    expect((await patch({ status: "SHIPPED" })).status).toBe(400)
    expect((await patch({ status: "CANCELLED" })).status).toBe(400) // not a seller-allowed status
  })

  it("cannot touch another store's order", async () => {
    const { store: other } = await createSellerWithStore()
    const order = await orderWithItemsFrom((await createUser()).id, [other.id])
    const { seller } = await createSellerWithStore()
    await loginAs(seller)
    expect((await patchSellerOrder(jsonReq("/x", { status: "SHIPPED" }, "PATCH"), params({ id: order.id }))).status).toBe(404)
  })
})

describe("POST /api/upload — image upload to Cloudinary", () => {
  const image = (type = "image/png", size = 10) => {
    const fd = new FormData()
    fd.append("file", new File([new Uint8Array(size)], "cover.png", { type }))
    return fd
  }

  it("requires a session", async () => {
    expect((await upload(formReq("/api/upload", image()))).status).toBe(401)
  })

  it("accepts images and returns the Cloudinary URL", async () => {
    await loginAs(await createUser())
    const body = await json(await upload(formReq("/api/upload", image())))
    expect(body.url).toContain("bookmandu/books")
  })

  it("rejects non-images and missing files", async () => {
    await loginAs(await createUser())
    expect((await upload(formReq("/api/upload", image("application/pdf")))).status).toBe(400)
    expect((await upload(formReq("/api/upload", new FormData()))).status).toBe(400)
  })
})
