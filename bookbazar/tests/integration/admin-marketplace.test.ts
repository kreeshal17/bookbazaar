import { describe, it, expect, beforeEach, vi } from "vitest"
import { resetDb, prisma, createUser, createSellerWithStore, createBook, addToCart, SHIPPING } from "../helpers/db"
import { loginAs } from "../helpers/auth"
import { jsonReq, params, json } from "../helpers/http"
import { resend } from "@/lib/resend/resend"
import { GET as listUsers, PATCH as blockUser } from "@/app/api/admin/users/route"
import { GET as pendingSellers } from "@/app/api/admin/pending-sellers/route"
import { PATCH as approveSeller } from "@/app/api/admin/approve-seller/[storeId]/route"
import { GET as listStores } from "@/app/api/admin/stores/route"
import { PATCH as patchStore, DELETE as deleteStore } from "@/app/api/admin/stores/[storeId]/route"
import { GET as listBanners, POST as createBanner } from "@/app/api/admin/banners/route"
import { PATCH as patchBanner, DELETE as deleteBanner } from "@/app/api/admin/banners/[id]/route"
import { GET as listReviews, DELETE as deleteReview } from "@/app/api/admin/reviews/route"
import { POST as sendMessage } from "@/app/api/admin/send-message/route"
import { GET as listCoupons, POST as createCoupon } from "@/app/api/admin/coupons/route"
import { PATCH as patchCoupon, DELETE as deleteCoupon } from "@/app/api/admin/coupons/[id]/route"
import { GET as getCreditSettings, PATCH as patchCreditSettings } from "@/app/api/admin/credit-settings/route"
import { GET as creditUsers } from "@/app/api/admin/credits/route"
import { GET as creditUser } from "@/app/api/admin/credits/[userId]/route"
import { POST as adjustCredits } from "@/app/api/admin/credits/adjust/route"
import { GET as listPayouts } from "@/app/api/admin/seller-payouts/route"
import { PATCH as markPaid } from "@/app/api/admin/seller-payouts/[id]/route"
import { GET as cartGet } from "@/app/api/cart/get/route"

beforeEach(resetDb)

async function asAdmin() {
  const admin = await createUser({ role: "ADMIN" })
  await loginAs(admin)
  return admin
}

describe("admin API is admin-only", () => {
  const endpoints: [string, () => Promise<Response>][] = [
    ["users", () => listUsers(jsonReq("/x"))],
    ["pending-sellers", () => pendingSellers(jsonReq("/x"))],
    ["approve-seller", () => approveSeller(jsonReq("/x", {}, "PATCH"), params({ storeId: "x" }))],
    ["stores", () => listStores()],
    ["banners", () => listBanners()],
    ["reviews", () => listReviews(jsonReq("/x"))],
    ["send-message", () => sendMessage(jsonReq("/x", {}))],
    ["coupons", () => listCoupons()],
    ["credit-settings", () => getCreditSettings()],
    ["credits", () => creditUsers(jsonReq("/x"))],
    ["credits/adjust", () => adjustCredits(jsonReq("/x", {}))],
    ["seller-payouts", () => listPayouts(jsonReq("/x"))],
  ]

  it.each(endpoints)("%s → 401 logged out, 403 for non-admins", async (_name, call) => {
    expect((await call()).status).toBe(401)
    await loginAs(await createUser({ role: "SELLER" }))
    expect((await call()).status).toBe(403)
  })
})

describe("users", () => {
  it("search and block/unblock — blocked users lose API access immediately", async () => {
    const victim = await createUser({ full_name: "Shyam Blocked" })
    await asAdmin()
    const { users } = await json(await listUsers(jsonReq("/x?search=shyam")))
    expect(users.map((u: { id: string }) => u.id)).toEqual([victim.id])

    expect((await blockUser(jsonReq("/x", { userId: victim.id }, "PATCH"))).status).toBe(400)
    await blockUser(jsonReq("/x", { userId: victim.id, isBlocked: true }, "PATCH"))

    await loginAs(victim)
    expect((await cartGet()).status).toBe(403)
  })
})

describe("seller approval and store moderation", () => {
  it("pending list → approve activates the store and emails the seller", async () => {
    const { seller, store } = await createSellerWithStore({ isApproved: false, isActive: false })
    await asAdmin()
    expect((await json(await pendingSellers(jsonReq("/x")))).stores.map((s: { id: string }) => s.id)).toEqual([store.id])

    await approveSeller(jsonReq("/x", {}, "PATCH"), params({ storeId: store.id }))
    expect(await prisma.store.findUniqueOrThrow({ where: { id: store.id } })).toMatchObject({ isApproved: true, isActive: true })
    expect(vi.mocked(resend.emails.send)).toHaveBeenCalledWith(expect.objectContaining({ to: seller.email }))
  })

  it("lists stores with sales stats", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id, { price: 50 })
    const buyer = await createUser()
    await prisma.order.create({
      data: {
        buyerId: buyer.id,
        totalAmount: 100,
        ...SHIPPING,
        items: { create: { bookId: book.id, storeId: store.id, quantity: 2, unitPrice: 50, totalPrice: 100 } },
      },
    })
    await asAdmin()
    const { stores } = await json(await listStores())
    expect(stores[0].stats).toEqual({ productCount: 1, orderCount: 1, totalSold: 2, revenue: 100 })
  })

  it("ban/unban and verify via PATCH", async () => {
    const { store } = await createSellerWithStore()
    await asAdmin()
    const patch = (body: object) => patchStore(jsonReq("/x", body, "PATCH"), params({ storeId: store.id }))
    expect((await json(await patch({ isActive: false }))).message).toBe("Seller banned")
    expect((await json(await patch({ isVerified: true }))).message).toBe("Seller verified")
    expect((await patch({})).status).toBe(400)
  })

  it("DELETE removes the seller, their books, carts and now-empty orders", async () => {
    const { seller, store } = await createSellerWithStore()
    const { store: other } = await createSellerWithStore()
    const book = await createBook(store.id)
    const otherBook = await createBook(other.id)
    const buyer = await createUser()
    await addToCart(buyer.id, book.id)
    const soloOrder = await prisma.order.create({
      data: { buyerId: buyer.id, totalAmount: 100, ...SHIPPING, items: { create: { bookId: book.id, storeId: store.id, quantity: 1, unitPrice: 100, totalPrice: 100 } } },
    })
    const mixedOrder = await prisma.order.create({
      data: {
        buyerId: buyer.id,
        totalAmount: 200,
        ...SHIPPING,
        items: {
          create: [
            { bookId: book.id, storeId: store.id, quantity: 1, unitPrice: 100, totalPrice: 100 },
            { bookId: otherBook.id, storeId: other.id, quantity: 1, unitPrice: 100, totalPrice: 100 },
          ],
        },
      },
    })
    await asAdmin()

    expect((await deleteStore(jsonReq("/x"), params({ storeId: store.id }))).status).toBe(200)
    expect(await prisma.user.findUnique({ where: { id: seller.id } })).toBeNull()
    expect(await prisma.book.count({ where: { storeId: store.id } })).toBe(0)
    expect(await prisma.cartItem.count()).toBe(0)
    expect(await prisma.order.findUnique({ where: { id: soloOrder.id } })).toBeNull()
    expect(await prisma.orderItem.count({ where: { orderId: mixedOrder.id } })).toBe(1)

    expect((await deleteStore(jsonReq("/x"), params({ storeId: store.id }))).status).toBe(404)
  })
})

describe("homepage banners", () => {
  it("create appends to the end; patch and delete work", async () => {
    await asAdmin()
    const b1 = (await json(await createBanner(jsonReq("/x", { imageUrl: "https://x/1.png" })))).banner
    const b2 = (await json(await createBanner(jsonReq("/x", { imageUrl: "https://x/2.png", linkUrl: "" })))).banner
    expect([b1.sortOrder, b2.sortOrder]).toEqual([0, 1])
    expect(b2.linkUrl).toBeNull()
    expect((await createBanner(jsonReq("/x", { imageUrl: "not a url" }))).status).toBe(400)

    const patched = (await json(await patchBanner(jsonReq("/x", { isActive: false, title: "Sale" }, "PATCH"), params({ id: b1.id })))).banner
    expect(patched).toMatchObject({ isActive: false, title: "Sale" })

    await deleteBanner(jsonReq("/x"), params({ id: b2.id }))
    expect((await json(await listBanners())).banners).toHaveLength(1)
  })
})

describe("review moderation", () => {
  it("searches and deletes reviews", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id, { title: "Seto Bagh" })
    const user = await createUser({ full_name: "Reviewer" })
    const review = await prisma.review.create({ data: { bookId: book.id, userId: user.id, rating: 1, comment: "spam" } })
    await asAdmin()

    expect((await json(await listReviews(jsonReq("/x?search=seto")))).reviews).toHaveLength(1)
    expect((await json(await listReviews(jsonReq("/x?search=nothing")))).reviews).toHaveLength(0)
    expect((await deleteReview(jsonReq("/x", undefined, "DELETE"))).status).toBe(400)
    await deleteReview(jsonReq(`/x?reviewId=${review.id}`, undefined, "DELETE"))
    expect(await prisma.review.count()).toBe(0)
  })
})

describe("seller messaging", () => {
  it("sends to one store or every seller", async () => {
    const { seller, store } = await createSellerWithStore()
    await createSellerWithStore()
    await asAdmin()
    const msg = { subject: "Hello", message: "Important update for sellers" }

    const single = await json(await sendMessage(jsonReq("/x", { ...msg, recipientMode: "single", storeId: store.id })))
    expect(single.count).toBe(1)
    expect(vi.mocked(resend.emails.send)).toHaveBeenLastCalledWith(expect.objectContaining({ to: seller.email }))

    expect((await json(await sendMessage(jsonReq("/x", { ...msg, recipientMode: "all" })))).count).toBe(2)
    expect((await sendMessage(jsonReq("/x", { ...msg, recipientMode: "single" }))).status).toBe(400)
  })
})

describe("coupons", () => {
  it("creates uppercase codes, rejects >100% and duplicates", async () => {
    await asAdmin()
    const res = await createCoupon(jsonReq("/x", { code: "welcome10", type: "PERCENTAGE", value: 10 }))
    expect(res.status).toBe(201)
    expect((await json(res)).coupon.code).toBe("WELCOME10")
    expect((await createCoupon(jsonReq("/x", { code: "WELCOME10", type: "FIXED", value: 5 }))).status).toBe(409)
    expect((await createCoupon(jsonReq("/x", { code: "HUGE", type: "PERCENTAGE", value: 150 }))).status).toBe(400)
    expect((await json(await listCoupons())).coupons).toHaveLength(1)
  })

  it("patches (incl. clearing expiry) and only deletes unused coupons", async () => {
    await asAdmin()
    const unused = await prisma.coupon.create({ data: { code: "A", value: 5, expiresAt: new Date() } })
    const used = await prisma.coupon.create({ data: { code: "B", value: 5, redeemedCount: 1 } })

    const patched = (await json(await patchCoupon(jsonReq("/x", { isActive: false, expiresAt: null }, "PATCH"), params({ id: unused.id })))).coupon
    expect(patched).toMatchObject({ isActive: false, expiresAt: null })

    expect((await deleteCoupon(jsonReq("/x"), params({ id: used.id }))).status).toBe(409)
    expect((await deleteCoupon(jsonReq("/x"), params({ id: unused.id }))).status).toBe(200)
  })
})

describe("credits administration", () => {
  it("credit settings: read defaults, update, reject empty patch", async () => {
    await asAdmin()
    expect((await json(await getCreditSettings())).settings.contributionReward).toBe(5)
    const updated = await json(await patchCreditSettings(jsonReq("/x", { contributionReward: 10, creditValueInRupees: 2 }, "PATCH")))
    expect(updated.settings.contributionReward).toBe(10)
    expect((await patchCreditSettings(jsonReq("/x", {}, "PATCH"))).status).toBe(400)
  })

  it("manual adjustments are ledger-backed and can't overdraw", async () => {
    const user = await createUser({ email: "rich@test.local" })
    const admin = await asAdmin()
    const adjust = (amount: number) => adjustCredits(jsonReq("/x", { userId: user.id, amount, reason: "Goodwill" }))

    expect((await adjust(10)).status).toBe(200)
    expect((await adjust(-11)).status).toBe(409)
    expect((await adjust(0)).status).toBe(400)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance).toBe(10)

    const tx = await prisma.creditTransaction.findFirstOrThrow()
    expect(tx).toMatchObject({ type: "ADMIN_ADJUSTMENT", amount: 10, createdById: admin.id })

    expect((await json(await creditUsers(jsonReq("/x?q=rich")))).users).toHaveLength(1)
    const detail = await json(await creditUser(jsonReq("/x"), params({ userId: user.id })))
    expect(detail.user.creditBalance).toBe(10)
    expect(detail.transactions).toHaveLength(1)
    expect((await creditUser(jsonReq("/x"), params({ userId: "missing" }))).status).toBe(404)
  })
})

describe("seller payouts", () => {
  it("filters by status and marks an adjustment paid once", async () => {
    const { store } = await createSellerWithStore()
    const buyer = await createUser()
    const order = await prisma.order.create({ data: { buyerId: buyer.id, totalAmount: 100, ...SHIPPING } })
    const adj = await prisma.sellerPayoutAdjustment.create({ data: { storeId: store.id, orderId: order.id, amount: 10, reason: "x" } })
    const admin = await asAdmin()

    expect((await json(await listPayouts(jsonReq("/x?status=PENDING")))).adjustments).toHaveLength(1)
    const paid = (await json(await markPaid(jsonReq("/x", {}, "PATCH"), params({ id: adj.id })))).adjustment
    expect(paid).toMatchObject({ status: "PAID", paidById: admin.id })
    expect((await markPaid(jsonReq("/x", {}, "PATCH"), params({ id: adj.id }))).status).toBe(409)
    expect((await json(await listPayouts(jsonReq("/x?status=PENDING")))).adjustments).toHaveLength(0)
  })
})
