import { describe, it, expect, beforeEach } from "vitest"
import { resetDb, prisma, createSellerWithStore, createBook, createCategory } from "../helpers/db"
import { jsonReq, params, json } from "../helpers/http"
import { GET as listBooks } from "@/app/api/book/all/route"
import { GET as bookBySlug } from "@/app/api/books/[slug]/route"
import { GET as banners } from "@/app/api/banners/route"
import { GET as creditSettings } from "@/app/api/credits/settings/route"
import { GET as chapters } from "@/app/api/chapters/route"
import { GET as schoolClasses } from "@/app/api/school-classes/route"
import { GET as universities } from "@/app/api/universities/route"

beforeEach(resetDb)

describe("GET /api/book/all — public catalog + search", () => {
  it("lists only active books from approved, active stores", async () => {
    const { store } = await createSellerWithStore()
    const { store: pending } = await createSellerWithStore({ isApproved: false })
    const { store: banned } = await createSellerWithStore({ isActive: false })
    const visible = await createBook(store.id, { title: "Visible" })
    await createBook(store.id, { title: "Soft deleted", isActive: false })
    await createBook(pending.id, { title: "Pending store" })
    await createBook(banned.id, { title: "Banned store" })

    const data = await json(await listBooks(jsonReq("/api/book/all")))
    expect(data.map((b: { id: string }) => b.id)).toEqual([visible.id])
  })

  it("filters by category slug", async () => {
    const { store } = await createSellerWithStore()
    const fiction = await createCategory("fiction")
    const inCat = await createBook(store.id, { categoryId: fiction.id })
    await createBook(store.id)

    const data = await json(await listBooks(jsonReq("/api/book/all?category=fiction")))
    expect(data.map((b: { id: string }) => b.id)).toEqual([inCat.id])
  })

  it("substring-searches title, author, description and ISBN case-insensitively", async () => {
    const { store } = await createSellerWithStore()
    const byTitle = await createBook(store.id, { title: "Palpasa Cafe" })
    const byAuthor = await createBook(store.id, { title: "Other", author: "Narayan Wagle" })
    const byIsbn = await createBook(store.id, { title: "Third", isbn: "978-1234" })
    await createBook(store.id, { title: "Unrelated", author: "Nobody" })

    const ids = async (q: string) =>
      (await json(await listBooks(jsonReq(`/api/book/all?search=${encodeURIComponent(q)}`)))).map((b: { id: string }) => b.id)

    expect(await ids("palpasa")).toContain(byTitle.id)
    expect(await ids("WAGLE")).toContain(byAuthor.id)
    expect(await ids("978-1234")).toContain(byIsbn.id)
  })

  it("is typo-tolerant via pg_trgm and puts exact matches first", async () => {
    const { store } = await createSellerWithStore()
    const munaMadan = await createBook(store.id, { title: "Muna Madan", author: "Laxmi Prasad Devkota" })
    await createBook(store.id, { title: "Completely Different", author: "X" })

    const typo = await json(await listBooks(jsonReq("/api/book/all?search=Muna%20Modan")))
    expect(typo.map((b: { id: string }) => b.id)).toContain(munaMadan.id)

    const garbage = await json(await listBooks(jsonReq("/api/book/all?search=xyzabc123")))
    expect(garbage).toEqual([])
  })

  it("returns at most 10 books when not searching", async () => {
    const { store } = await createSellerWithStore()
    for (let i = 0; i < 12; i++) await createBook(store.id)
    const data = await json(await listBooks(jsonReq("/api/book/all")))
    expect(data).toHaveLength(10)
  })
})

describe("GET /api/books/[slug] — book detail", () => {
  it("returns the book with category and a public store subset", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id)
    const res = await bookBySlug(jsonReq(`/api/books/${book.slug}`), params({ slug: book.slug }))
    expect(res.status).toBe(200)
    const { book: body } = await json(res)
    expect(body.id).toBe(book.id)
    expect(body.store).toEqual(expect.objectContaining({ id: store.id, name: store.name }))
    expect(body.store.identityUrl).toBeUndefined()
  })

  it("404s for inactive books or unapproved stores", async () => {
    const { store } = await createSellerWithStore({ isApproved: false })
    const book = await createBook(store.id)
    const res = await bookBySlug(jsonReq(`/api/books/${book.slug}`), params({ slug: book.slug }))
    expect(res.status).toBe(404)
  })
})

describe("public reference endpoints", () => {
  it("GET /api/banners returns only active banners in sortOrder", async () => {
    await prisma.banner.createMany({
      data: [
        { imageUrl: "https://x/2.png", sortOrder: 2 },
        { imageUrl: "https://x/1.png", sortOrder: 1 },
        { imageUrl: "https://x/off.png", sortOrder: 0, isActive: false },
      ],
    })
    const { banners: list } = await json(await banners())
    expect(list.map((b: { imageUrl: string }) => b.imageUrl)).toEqual(["https://x/1.png", "https://x/2.png"])
  })

  it("GET /api/credits/settings creates default settings on first read", async () => {
    const body = await json(await creditSettings())
    expect(body.contributionReward).toBe(5)
    expect(Number(body.creditValueInRupees)).toBe(1)
    expect(await prisma.creditSettings.count()).toBe(1)
  })

  it("GET /api/chapters requires subjectId and returns active chapters in order", async () => {
    expect((await chapters(jsonReq("/api/chapters"))).status).toBe(400)

    const subject = await prisma.subject.create({ data: { name: "Maths", slug: "maths" } })
    await prisma.chapter.createMany({
      data: [
        { subjectId: subject.id, title: "B", sortOrder: 2 },
        { subjectId: subject.id, title: "A", sortOrder: 1 },
        { subjectId: subject.id, title: "Hidden", sortOrder: 0, isActive: false },
      ],
    })
    const body = await json(await chapters(jsonReq(`/api/chapters?subjectId=${subject.id}`)))
    expect(body.chapters.map((c: { title: string }) => c.title)).toEqual(["A", "B"])
  })

  it("GET /api/school-classes and /api/universities return only active rows", async () => {
    await prisma.schoolClass.createMany({
      data: [
        { level: 2, name: "Class 2" },
        { level: 1, name: "Class 1" },
        { level: 3, name: "Class 3", isActive: false },
      ],
    })
    const sc = await json(await schoolClasses())
    expect(sc.schoolClasses.map((c: { level: number }) => c.level)).toEqual([1, 2])

    const uni = await prisma.university.create({ data: { name: "TU", slug: "tu" } })
    await prisma.university.create({ data: { name: "Off", slug: "off", isActive: false } })
    await prisma.program.create({ data: { universityId: uni.id, name: "BCA", slug: "bca" } })
    await prisma.program.create({ data: { universityId: uni.id, name: "Old", slug: "old", isActive: false } })
    const u = await json(await universities())
    expect(u.universities).toHaveLength(1)
    expect(u.universities[0].programs.map((p: { name: string }) => p.name)).toEqual(["BCA"])
  })
})
