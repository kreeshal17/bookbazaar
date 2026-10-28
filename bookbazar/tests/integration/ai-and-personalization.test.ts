import { describe, it, expect, beforeEach, vi } from "vitest"
import { resetDb, prisma, createUser, createSellerWithStore, createBook, createCategory, SHIPPING } from "../helpers/db"
import { jsonReq } from "../helpers/http"
import { getPersonalizedHomepageData } from "@/lib/recommendations"

// The real Gemini call is replaced — we only check what the route feeds it.
const streamText = vi.fn<(opts: { system: string }) => { toUIMessageStreamResponse: () => Response }>(() => ({
  toUIMessageStreamResponse: () => new Response("stream"),
}))
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  streamText: (opts: { system: string }) => streamText(opts),
}))
vi.mock("@ai-sdk/google", () => ({ google: (model: string) => ({ model }) }))

const { POST: chat } = await import("@/app/api/chat/route")

beforeEach(resetDb)

describe("POST /api/chat — BookMandu AI assistant", () => {
  it("grounds the model in the catalog (title, price, store) and streams the reply", async () => {
    const { store } = await createSellerWithStore({ name: "Pustak Pasal" })
    await createBook(store.id, { title: "Muna Madan", price: 250 })

    const res = await chat(jsonReq("/api/chat", { messages: [] }))
    expect(await res.text()).toBe("stream")

    const { system } = streamText.mock.calls[0][0]
    expect(system).toContain("Title: Muna Madan")
    expect(system).toContain("₹250")
    expect(system).toContain("Store: Pustak Pasal")
    expect(system).toMatch(/ONLY talk about books from the list/)
  })
})

describe("getPersonalizedHomepageData", () => {
  it("falls back to the newest listings for a brand-new user", async () => {
    const { store } = await createSellerWithStore()
    await createBook(store.id)
    await createBook(store.id)
    const user = await createUser()

    const data = await getPersonalizedHomepageData(user.id)
    expect(data.hasPersonalizationSignal).toBe(false)
    expect(data.recommended).toHaveLength(2)
    expect(data.recentlyViewed).toEqual([])
  })

  it("recommends same-category books, excluding what was viewed or bought", async () => {
    const { store } = await createSellerWithStore()
    const fiction = await createCategory("fiction")
    const viewed = await createBook(store.id, { categoryId: fiction.id })
    const bought = await createBook(store.id, { categoryId: fiction.id })
    const fresh = await createBook(store.id, { categoryId: fiction.id })
    const user = await createUser()
    await prisma.recentlyViewedBook.create({ data: { userId: user.id, bookId: viewed.id } })
    await prisma.order.create({
      data: { buyerId: user.id, totalAmount: 100, ...SHIPPING, items: { create: { bookId: bought.id, storeId: store.id, quantity: 1, unitPrice: 100, totalPrice: 100 } } },
    })

    const data = await getPersonalizedHomepageData(user.id)
    expect(data.hasPersonalizationSignal).toBe(true)
    expect(data.recommended[0].id).toBe(fresh.id)
    const ids = data.recommended.map((b) => b.id)
    expect(ids).not.toContain(viewed.id)
    expect(ids).not.toContain(bought.id)
    expect(data.recentlyViewed.map((b) => b.id)).toEqual([viewed.id])
  })

  it("dedupes recent searches case-insensitively, max 5, newest first", async () => {
    const user = await createUser()
    const queries = ["a", "B", "b", "c", "d", "e", "f"]
    for (const [i, query] of queries.entries()) {
      await prisma.searchHistoryEntry.create({ data: { userId: user.id, query, createdAt: new Date(Date.now() - (queries.length - i) * 1000) } })
    }
    const { recentSearches } = await getPersonalizedHomepageData(user.id)
    expect(recentSearches).toEqual(["f", "e", "d", "c", "b"])
  })

  it("computes ratings on book cards and exposes every wishlisted id", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id)
    const user = await createUser()
    const other = await createUser()
    await prisma.review.createMany({
      data: [
        { bookId: book.id, userId: user.id, rating: 4 },
        { bookId: book.id, userId: other.id, rating: 5 },
      ],
    })
    await prisma.wishlistItem.create({ data: { userId: user.id, bookId: book.id } })

    const data = await getPersonalizedHomepageData(user.id)
    expect(data.wishlistPreview[0]).toMatchObject({ id: book.id, averageRating: 4.5, reviewCount: 2 })
    expect(data.wishlistedIds.has(book.id)).toBe(true)
  })
})
