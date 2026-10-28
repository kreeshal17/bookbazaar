import { describe, it, expect, beforeEach } from "vitest"
import { resetDb, prisma, createUser, createSellerWithStore, createBook, addToCart, SHIPPING } from "../helpers/db"
import { loginAs } from "../helpers/auth"
import { jsonReq, json } from "../helpers/http"
import { POST as createOrder } from "@/app/api/order/create/route"
import { GET as myOrders } from "@/app/api/order/get/route"
import { POST as validateCoupon } from "@/app/api/coupons/validate/route"
import { GET as wallet } from "@/app/api/credits/wallet/route"

beforeEach(resetDb)

const order = (extra: object = {}) => createOrder(jsonReq("/api/order/create", { ...SHIPPING, ...extra }))

describe("POST /api/order/create — checkout", () => {
  it("rejects an empty cart and invalid shipping data", async () => {
    await loginAs(await createUser())
    expect((await order()).status).toBe(400)
    expect((await createOrder(jsonReq("/api/order/create", { ...SHIPPING, phone: "1" }))).status).toBe(400)
  })

  it("creates the order + items, decrements stock, clears the cart and returns a 6-digit delivery code", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id, { price: 150, stockQty: 5 })
    const buyer = await createUser()
    await addToCart(buyer.id, book.id, 2)
    await loginAs(buyer)

    const res = await order()
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.deliveryCode).toMatch(/^\d{6}$/)
    expect(body.amountDue).toBe(300)

    const saved = await prisma.order.findUniqueOrThrow({ where: { id: body.order.id }, include: { items: true } })
    expect(Number(saved.totalAmount)).toBe(300)
    expect(saved.status).toBe("PENDING")
    expect(saved.items).toEqual([expect.objectContaining({ bookId: book.id, storeId: store.id, quantity: 2 })])
    expect((await prisma.book.findUniqueOrThrow({ where: { id: book.id } })).stockQty).toBe(3)
    expect(await prisma.cartItem.count({ where: { userId: buyer.id } })).toBe(0)
    expect(await prisma.sellerPayoutAdjustment.count()).toBe(0) // no discount → nothing owed
  })

  it("rolls back everything when stock is insufficient", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id, { stockQty: 1 })
    const buyer = await createUser({ creditBalance: 50 })
    await addToCart(buyer.id, book.id, 2)
    await loginAs(buyer)

    const res = await order({ creditsToApply: 10 })
    expect(res.status).toBe(400)
    expect((await json(res)).message).toMatch(/Insufficient stock/)
    expect(await prisma.order.count()).toBe(0)
    expect(await prisma.cartItem.count()).toBe(1)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: buyer.id } })).creditBalance).toBe(50)
  })

  it("applies coupon first, then credits (clamped to balance), and splits the discount across sellers", async () => {
    const { store: a } = await createSellerWithStore()
    const { store: b } = await createSellerWithStore()
    const bookA = await createBook(a.id, { price: 300 })
    const bookB = await createBook(b.id, { price: 100 })
    const buyer = await createUser({ creditBalance: 20 })
    await addToCart(buyer.id, bookA.id)
    await addToCart(buyer.id, bookB.id)
    await prisma.coupon.create({ data: { code: "FLAT40", type: "FIXED", value: 40, maxRedemptions: 10 } })
    await loginAs(buyer)

    const body = await json(await order({ couponCode: "flat40", creditsToApply: 1000 }))
    expect(body).toMatchObject({ couponDiscount: 40, creditsUsed: 20, creditsApplied: 20, amountDue: 340 })

    const saved = await prisma.order.findUniqueOrThrow({ where: { id: body.order.id } })
    expect(saved.couponCode).toBe("FLAT40")
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: "FLAT40" } })).redeemedCount).toBe(1)
    expect(await prisma.couponRedemption.count({ where: { orderId: saved.id } })).toBe(1)

    const buyerAfter = await prisma.user.findUniqueOrThrow({ where: { id: buyer.id } })
    expect(buyerAfter.creditBalance).toBe(0)
    expect(await prisma.creditTransaction.findFirstOrThrow({ where: { userId: buyer.id } })).toMatchObject({
      amount: -20,
      type: "BOOK_REDEMPTION",
      referenceId: saved.id,
    })

    const payouts = await prisma.sellerPayoutAdjustment.findMany({ where: { orderId: saved.id } })
    const byStore = Object.fromEntries(payouts.map((p) => [p.storeId, Number(p.amount)]))
    expect(byStore).toEqual({ [a.id]: 45, [b.id]: 15 })
  })

  it("returns 400 with the coupon's reason when it's invalid at order time", async () => {
    const { store } = await createSellerWithStore()
    const book = await createBook(store.id)
    const buyer = await createUser()
    await addToCart(buyer.id, book.id)
    await prisma.coupon.create({ data: { code: "OLD", type: "FIXED", value: 10, expiresAt: new Date(Date.now() - 1000) } })
    await loginAs(buyer)
    const res = await order({ couponCode: "OLD" })
    expect(res.status).toBe(400)
    expect((await json(res)).message).toMatch(/expired/)
    expect(await prisma.order.count()).toBe(0)
  })
})

describe("GET /api/order/get — buyer order history", () => {
  it("lists the buyer's orders newest first without leaking the seller's KYC document", async () => {
    const { store } = await createSellerWithStore()
    await prisma.store.update({ where: { id: store.id }, data: { identityUrl: "https://secret/id.png" } })
    const book = await createBook(store.id)
    const buyer = await createUser()
    await addToCart(buyer.id, book.id)
    await loginAs(buyer)
    await order()

    const orders = await json(await myOrders())
    expect(orders).toHaveLength(1)
    expect(orders[0].items[0].store).toEqual({ id: store.id, name: store.name, slug: store.slug, phone: store.phone })
    expect(JSON.stringify(orders)).not.toContain("secret/id.png")
  })

  it("requires login and refuses blocked users", async () => {
    expect((await myOrders()).status).toBe(401)
    await loginAs(await createUser({ isBlocked: true }))
    expect((await myOrders()).status).toBe(403)
  })
})

describe("POST /api/coupons/validate — checkout preview", () => {
  it("returns the discount without redeeming", async () => {
    await prisma.coupon.create({ data: { code: "TEN", type: "PERCENTAGE", value: 10, description: "10% off" } })
    await loginAs(await createUser())
    const body = await json(await validateCoupon(jsonReq("/x", { code: "ten", orderTotal: 500 })))
    expect(body).toMatchObject({ valid: true, discount: 50, description: "10% off" })
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: "TEN" } })).redeemedCount).toBe(0)
  })

  it("enforces first-order-only and one use per user", async () => {
    const buyer = await createUser()
    const coupon = await prisma.coupon.create({ data: { code: "FIRST", type: "FIXED", value: 10, firstOrderOnly: true } })
    const past = await prisma.order.create({ data: { buyerId: buyer.id, totalAmount: 10, ...SHIPPING } })
    await loginAs(buyer)
    const res = await validateCoupon(jsonReq("/x", { code: "FIRST", orderTotal: 100 }))
    expect(res.status).toBe(400)
    expect((await json(res)).message).toMatch(/first order/)

    await prisma.coupon.update({ where: { id: coupon.id }, data: { firstOrderOnly: false } })
    await prisma.couponRedemption.create({ data: { couponId: coupon.id, userId: buyer.id, orderId: past.id, amount: 10 } })
    expect((await json(await validateCoupon(jsonReq("/x", { code: "FIRST", orderTotal: 100 })))).message).toMatch(/already used/)
  })

  it("400s bad input", async () => {
    await loginAs(await createUser())
    expect((await validateCoupon(jsonReq("/x", { code: "", orderTotal: 0 }))).status).toBe(400)
  })
})

describe("GET /api/credits/wallet", () => {
  it("returns balance, rupee value and the latest ledger rows", async () => {
    const user = await createUser({ creditBalance: 7 })
    await prisma.creditTransaction.create({ data: { userId: user.id, amount: 7, type: "ADMIN_ADJUSTMENT", reason: "gift" } })
    await loginAs(user)
    const body = await json(await wallet())
    expect(body.balance).toBe(7)
    expect(Number(body.creditValueInRupees)).toBe(1)
    expect(body.transactions).toHaveLength(1)
  })
})
