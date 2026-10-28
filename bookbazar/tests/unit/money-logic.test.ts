import { describe, it, expect, vi } from "vitest"
import { allocatePayoutAdjustments } from "@/lib/seller-payouts"
import { evaluateCoupon, CouponError } from "@/lib/coupons"
import { applyCreditTransaction, InsufficientCreditsError } from "@/lib/credits"

// These exercise the pure arithmetic/branching in lib/ against a fake
// transaction client. The integration suite covers the same code against
// real Postgres.

function fakePayoutTx() {
  const created: { storeId: string; amount: number }[] = []
  const tx = {
    sellerPayoutAdjustment: {
      create: vi.fn(async ({ data }: { data: { storeId: string; amount: number } }) => {
        created.push({ storeId: data.storeId, amount: data.amount })
      }),
    },
  }
  return { tx: tx as never, created }
}

describe("allocatePayoutAdjustments", () => {
  it("does nothing for a zero discount", async () => {
    const { tx, created } = fakePayoutTx()
    await allocatePayoutAdjustments(tx, { orderId: "o", items: [{ storeId: "a", totalPrice: 100 }], totalDiscount: 0 })
    expect(created).toEqual([])
  })

  it("splits proportionally to each store's subtotal", async () => {
    const { tx, created } = fakePayoutTx()
    await allocatePayoutAdjustments(tx, {
      orderId: "o",
      items: [
        { storeId: "a", totalPrice: 300 },
        { storeId: "b", totalPrice: 100 },
      ],
      totalDiscount: 40,
    })
    expect(created).toEqual([
      { storeId: "a", amount: 30 },
      { storeId: "b", amount: 10 },
    ])
  })

  it("groups multiple items per store and lets the last store absorb rounding", async () => {
    const { tx, created } = fakePayoutTx()
    await allocatePayoutAdjustments(tx, {
      orderId: "o",
      items: [
        { storeId: "a", totalPrice: 50 },
        { storeId: "b", totalPrice: 100 },
        { storeId: "a", totalPrice: 50 },
        { storeId: "c", totalPrice: 100 },
      ],
      totalDiscount: 10,
    })
    expect(created.map((c) => c.storeId)).toEqual(["a", "b", "c"])
    expect(created.reduce((s, c) => s + c.amount, 0)).toBeCloseTo(10, 10)
    expect(created[0].amount).toBe(3.33)
    expect(created[2].amount).toBe(3.34)
  })
})

type FakeCoupon = {
  id: string
  code: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  isActive: boolean
  firstOrderOnly: boolean
  minOrderAmount: number | null
  maxDiscount: number | null
  maxRedemptions: number | null
  redeemedCount: number
  expiresAt: Date | null
}

function couponTx(coupon: Partial<FakeCoupon> | null, opts: { priorOrders?: number; alreadyUsed?: boolean } = {}) {
  const full: FakeCoupon | null = coupon && {
    id: "c1",
    code: "SAVE",
    type: "PERCENTAGE",
    value: 10,
    isActive: true,
    firstOrderOnly: false,
    minOrderAmount: null,
    maxDiscount: null,
    maxRedemptions: null,
    redeemedCount: 0,
    expiresAt: null,
    ...coupon,
  }
  const findUnique = vi.fn(async () => full)
  return {
    findUnique,
    tx: {
      coupon: { findUnique },
      order: { count: async () => opts.priorOrders ?? 0 },
      couponRedemption: { findFirst: async () => (opts.alreadyUsed ? { id: "r" } : null) },
    } as never,
  }
}

describe("evaluateCoupon", () => {
  const evalWith = (c: Partial<FakeCoupon> | null, total = 1000, opts = {}) =>
    evaluateCoupon(couponTx(c, opts).tx, { code: " save ", userId: "u", orderTotal: total })

  it("normalizes the code to trimmed uppercase", async () => {
    const { tx, findUnique } = couponTx({})
    await evaluateCoupon(tx, { code: " save ", userId: "u", orderTotal: 100 })
    expect(findUnique).toHaveBeenCalledWith({ where: { code: "SAVE" } })
  })

  it("computes percentage and fixed discounts", async () => {
    expect((await evalWith({ type: "PERCENTAGE", value: 15 }, 200)).discount).toBe(30)
    expect((await evalWith({ type: "FIXED", value: 50 }, 200)).discount).toBe(50)
  })

  it("caps by maxDiscount and by the order total", async () => {
    expect((await evalWith({ type: "PERCENTAGE", value: 50, maxDiscount: 100 }, 1000)).discount).toBe(100)
    expect((await evalWith({ type: "FIXED", value: 500 }, 120)).discount).toBe(120)
  })

  it.each([
    ["missing", null, {}, "isn't valid"],
    ["inactive", { isActive: false }, {}, "isn't valid"],
    ["expired", { expiresAt: new Date(Date.now() - 1000) }, {}, "expired"],
    ["exhausted", { maxRedemptions: 1, redeemedCount: 1 }, {}, "usage limit"],
    ["below minimum", { minOrderAmount: 5000 }, {}, "minimum order"],
    ["first-order only", { firstOrderOnly: true }, { priorOrders: 1 }, "first order"],
    ["already used", {}, { alreadyUsed: true }, "already used"],
  ])("rejects a %s coupon", async (_l, coupon, opts, msg) => {
    await expect(evalWith(coupon as Partial<FakeCoupon> | null, 1000, opts)).rejects.toThrow(CouponError)
    await expect(evalWith(coupon as Partial<FakeCoupon> | null, 1000, opts)).rejects.toThrow(msg)
  })
})

describe("applyCreditTransaction", () => {
  function creditTx(updateManyCount = 1) {
    return {
      user: { updateMany: vi.fn(async () => ({ count: updateManyCount })), update: vi.fn(async () => ({})) },
      creditTransaction: { create: vi.fn(async () => ({})) },
    }
  }

  it("rejects zero or fractional amounts", async () => {
    const tx = creditTx()
    await expect(applyCreditTransaction(tx as never, { userId: "u", amount: 0, type: "REFUND", reason: "x" })).rejects.toThrow()
    await expect(applyCreditTransaction(tx as never, { userId: "u", amount: 1.5, type: "REFUND", reason: "x" })).rejects.toThrow()
  })

  it("credits with a plain increment and writes a ledger row", async () => {
    const tx = creditTx()
    await applyCreditTransaction(tx as never, { userId: "u", amount: 5, type: "CONTRIBUTION_REWARD", reason: "x" })
    expect(tx.user.update).toHaveBeenCalled()
    expect(tx.user.updateMany).not.toHaveBeenCalled()
    expect(tx.creditTransaction.create).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 5 }) })
  })

  it("debits with a balance-guarded conditional update", async () => {
    const tx = creditTx(1)
    await applyCreditTransaction(tx as never, { userId: "u", amount: -3, type: "BOOK_REDEMPTION", reason: "x" })
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u", creditBalance: { gte: 3 } },
      data: { creditBalance: { increment: -3 } },
    })
  })

  it("throws InsufficientCreditsError and writes no ledger row when the guard fails", async () => {
    const tx = creditTx(0)
    await expect(
      applyCreditTransaction(tx as never, { userId: "u", amount: -3, type: "BOOK_REDEMPTION", reason: "x" })
    ).rejects.toThrow(InsufficientCreditsError)
    expect(tx.creditTransaction.create).not.toHaveBeenCalled()
  })
})
