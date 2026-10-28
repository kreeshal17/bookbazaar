import { describe, it, expect } from "vitest"
import { userSchema } from "@/prisma/schemas/user.schemas"
import { orderSchema } from "@/app/api/order/create/route"

describe("userSchema (signup)", () => {
  const valid = { name: "Ram", email: "ram@test.local", phone: "9800000000", password: "password123" }

  it("accepts a valid buyer and defaults role to BUYER", () => {
    const r = userSchema.safeParse(valid)
    expect(r.success).toBe(true)
    expect(r.data?.role).toBe("BUYER")
  })

  it("allows SELLER but never ADMIN self-signup", () => {
    expect(userSchema.safeParse({ ...valid, role: "SELLER" }).success).toBe(true)
    expect(userSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(false)
  })

  it.each([
    ["short name", { name: "R" }],
    ["bad email", { email: "nope" }],
    ["bad phone", { phone: "12" }],
    ["short password", { password: "short" }],
  ])("rejects %s", (_label, patch) => {
    expect(userSchema.safeParse({ ...valid, ...patch }).success).toBe(false)
  })
})

describe("orderSchema (checkout)", () => {
  const valid = {
    fullName: "Ram",
    phone: "9800000000",
    shippingAddr: "Street 1",
    city: "KTM",
    state: "Bagmati",
    postalCode: "44600",
  }

  it("accepts shipping details with optional coupon and credits", () => {
    expect(orderSchema.safeParse(valid).success).toBe(true)
    expect(orderSchema.safeParse({ ...valid, couponCode: "WELCOME", creditsToApply: 10 }).success).toBe(true)
  })

  it("rejects negative or fractional credits", () => {
    expect(orderSchema.safeParse({ ...valid, creditsToApply: -1 }).success).toBe(false)
    expect(orderSchema.safeParse({ ...valid, creditsToApply: 1.5 }).success).toBe(false)
  })

  it("rejects short phone numbers", () => {
    expect(orderSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false)
  })
})
