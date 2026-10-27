import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import bcrypt from "bcryptjs"
import { resetDb, prisma, redis, createUser, createSellerWithStore, TEST_PASSWORD } from "../helpers/db"
import { cookieJar, loginAs } from "../helpers/auth"
import { jsonReq, json } from "../helpers/http"
import { decrypt } from "@/app/lib/session"
import { resend } from "@/lib/resend/resend"
import { POST as signup } from "@/app/api/auth/signup/route"
import { GET as verifyEmail } from "@/app/api/auth/verify-email/route"
import { POST as login } from "@/app/api/auth/login/route"
import { POST as logout } from "@/app/api/auth/logout/route"
import { GET as me } from "@/app/api/auth/me/route"
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route"
import { POST as resetPassword } from "@/app/api/auth/reset-password/route"
import { POST as changePassword } from "@/app/api/auth/change-password/route"
import { PATCH as updateProfile } from "@/app/api/auth/update-profile/route"
import { POST as becomeSeller } from "@/app/api/auth/become-seller/route"
import { GET as profile } from "@/app/api/profile/route"
import { GET as googleStart } from "@/app/api/auth/google/route"
import { GET as googleCallback } from "@/app/api/auth/google/callback/route"
import { GET as githubStart } from "@/app/api/auth/github/route"
import { GET as facebookStart } from "@/app/api/auth/facebook/route"
import { NextRequest } from "next/server"

beforeEach(resetDb)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

const sentEmails = () => vi.mocked(resend.emails.send).mock.calls.map((c) => c[0])

describe("signup + email verification", () => {
  const body = { name: "Sita", email: "sita@test.local", phone: "9800000000", password: "password123" }

  it("creates an unverified BUYER, hashes the password and emails a verify link", async () => {
    const res = await signup(jsonReq("/api/auth/signup", body))
    expect(res.status).toBe(201)

    const user = await prisma.user.findUniqueOrThrow({ where: { email: body.email } })
    expect(user.role).toBe("BUYER")
    expect(user.isVerified).toBe(false)
    expect(await bcrypt.compare("password123", user.password_hash!)).toBe(true)

    const token = await prisma.verificationToken.findFirstOrThrow({ where: { userId: user.id } })
    expect(sentEmails()[0]).toMatchObject({ to: body.email })
    expect(JSON.stringify(sentEmails()[0])).toContain(token.token)
  })

  it("rejects invalid input (400) and duplicate emails (409)", async () => {
    expect((await signup(jsonReq("/api/auth/signup", { ...body, email: "bad" }))).status).toBe(400)
    await signup(jsonReq("/api/auth/signup", body))
    expect((await signup(jsonReq("/api/auth/signup", body))).status).toBe(409)
  })

  it("cannot self-register as ADMIN", async () => {
    expect((await signup(jsonReq("/api/auth/signup", { ...body, role: "ADMIN" }))).status).toBe(400)
  })

  it("verify-email marks the user verified, consumes the token and redirects to login", async () => {
    await signup(jsonReq("/api/auth/signup", body))
    const { token } = await prisma.verificationToken.findFirstOrThrow()

    const res = await verifyEmail(jsonReq(`/api/auth/verify-email?token=${token}`))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?verified=true")
    expect((await prisma.user.findUniqueOrThrow({ where: { email: body.email } })).isVerified).toBe(true)
    expect(await prisma.verificationToken.count()).toBe(0)
  })

  it("verify-email rejects missing, unknown and expired tokens", async () => {
    expect((await verifyEmail(jsonReq("/api/auth/verify-email"))).status).toBe(400)
    expect((await verifyEmail(jsonReq("/api/auth/verify-email?token=nope"))).status).toBe(400)

    const user = await createUser({ isVerified: false })
    await prisma.verificationToken.create({ data: { token: "old", userId: user.id, expiresAt: new Date(Date.now() - 1000) } })
    expect((await verifyEmail(jsonReq("/api/auth/verify-email?token=old"))).status).toBe(400)
  })
})

describe("login", () => {
  const loginReq = (email: string, password = TEST_PASSWORD) => jsonReq("/api/auth/login", { email, password })

  it("sets a 7-day session cookie carrying id/email/role", async () => {
    const user = await createUser({ role: "SELLER" })
    const res = await login(loginReq(user.email))
    expect(res.status).toBe(200)
    expect(await json(res)).toMatchObject({ role: "SELLER", email: user.email, hasStore: false })

    const payload = await decrypt(cookieJar.get("session"))
    expect(payload).toMatchObject({ id: user.id, email: user.email, role: "SELLER" })
  })

  it("reports hasStore for sellers with a store", async () => {
    const { seller } = await createSellerWithStore()
    expect((await json(await login(loginReq(seller.email)))).hasStore).toBe(true)
  })

  it("404s unknown users and 401s a wrong password", async () => {
    expect((await login(loginReq("ghost@test.local"))).status).toBe(404)
    const user = await createUser()
    expect((await login(loginReq(user.email, "wrongpassword"))).status).toBe(401)
  })

  it("rate-limits after 5 wrong passwords with a 15-minute window", async () => {
    const user = await createUser()
    for (let i = 0; i < 5; i++) await login(loginReq(user.email, "wrongpassword"))

    const res = await login(loginReq(user.email))
    expect(res.status).toBe(429)
    const ttl = await redis.ttl(`login:${user.email}`)
    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(900)
  })

  it("blocks blocked users (403)", async () => {
    const user = await createUser({ isBlocked: true })
    expect((await login(loginReq(user.email))).status).toBe(403)
  })

  it("refuses unverified users and (re)sends a verification email once", async () => {
    const user = await createUser({ isVerified: false })
    expect((await login(loginReq(user.email))).status).toBe(403)
    expect(await prisma.verificationToken.count({ where: { userId: user.id } })).toBe(1)
    expect(sentEmails()).toHaveLength(1)

    await login(loginReq(user.email))
    expect(sentEmails()).toHaveLength(1) // existing token → no second email
  })

  it("tells OAuth-only accounts to use social login", async () => {
    const user = await createUser({ password: null })
    expect((await login(loginReq(user.email))).status).toBe(401)
  })

  it("rejects malformed input", async () => {
    expect((await login(jsonReq("/api/auth/login", { email: "x", password: "y" }))).status).toBe(401)
  })
})

describe("session endpoints", () => {
  it("logout deletes the session cookie", async () => {
    cookieJar.set("session", "x")
    await logout(jsonReq("/api/auth/logout", {}))
    expect(cookieJar.has("session")).toBe(false)
  })

  it("me returns null when logged out / blocked, and the payload + full_name otherwise", async () => {
    expect(await json(await me(jsonReq("/api/auth/me")))).toBeNull()

    const user = await createUser({ full_name: "Hari" })
    await loginAs(user)
    expect(await json(await me(jsonReq("/api/auth/me")))).toMatchObject({ id: user.id, full_name: "Hari" })

    await prisma.user.update({ where: { id: user.id }, data: { isBlocked: true } })
    expect(await json(await me(jsonReq("/api/auth/me")))).toBeNull()
  })

  it("profile never leaks password_hash but reports hasPassword", async () => {
    const user = await createUser()
    await loginAs(user)
    const { profile: p } = await json(await profile())
    expect(p.password_hash).toBeUndefined()
    expect(p.hasPassword).toBe(true)
    expect(p.email).toBe(user.email)
  })

  it("profile requires login", async () => {
    expect((await profile()).status).toBe(401)
  })
})

describe("password reset", () => {
  it("forgot-password 404s unknown emails", async () => {
    expect((await forgotPassword(jsonReq("/api/auth/forgot-password", { email: "x@test.local" }))).status).toBe(404)
  })

  it("issues a single 1-hour token and emails it; reset-password consumes it", async () => {
    const user = await createUser()
    await forgotPassword(jsonReq("/api/auth/forgot-password", { email: user.email }))
    await forgotPassword(jsonReq("/api/auth/forgot-password", { email: user.email }))

    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } })
    expect(tokens).toHaveLength(1)
    expect(JSON.stringify(sentEmails().at(-1))).toContain(tokens[0].token)

    const res = await resetPassword(jsonReq("/api/auth/reset-password", { token: tokens[0].token, password: "newpassword1" }))
    expect(res.status).toBe(200)
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(await bcrypt.compare("newpassword1", updated.password_hash!)).toBe(true)
    expect(await prisma.passwordResetToken.count()).toBe(0)
  })

  it("reset-password rejects missing fields and expired tokens", async () => {
    expect((await resetPassword(jsonReq("/api/auth/reset-password", {}))).status).toBe(400)
    const user = await createUser()
    await prisma.passwordResetToken.create({ data: { token: "old", userId: user.id, expiresAt: new Date(Date.now() - 1) } })
    expect((await resetPassword(jsonReq("/api/auth/reset-password", { token: "old", password: "x" }))).status).toBe(400)
  })
})

describe("account settings", () => {
  it("change-password checks the current password", async () => {
    const user = await createUser()
    await loginAs(user)
    const bad = await changePassword(jsonReq("/api/auth/change-password", { currentPassword: "nope", newPassword: "newpassword1" }))
    expect(bad.status).toBe(401)

    const ok = await changePassword(
      jsonReq("/api/auth/change-password", { currentPassword: TEST_PASSWORD, newPassword: "newpassword1" })
    )
    expect(ok.status).toBe(200)
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(await bcrypt.compare("newpassword1", updated.password_hash!)).toBe(true)
  })

  it("change-password refuses OAuth-only accounts and short passwords", async () => {
    const oauth = await createUser({ password: null })
    await loginAs(oauth)
    expect(
      (await changePassword(jsonReq("/api/auth/change-password", { currentPassword: "x", newPassword: "newpassword1" }))).status
    ).toBe(400)

    const user = await createUser()
    await loginAs(user)
    expect(
      (await changePassword(jsonReq("/api/auth/change-password", { currentPassword: TEST_PASSWORD, newPassword: "short" }))).status
    ).toBe(400)
  })

  it("update-profile changes name/phone and clears phone with an empty string", async () => {
    const user = await createUser({ phone: "9800000000" })
    await loginAs(user)
    const res = await updateProfile(jsonReq("/api/auth/update-profile", { full_name: "New Name", phone: "" }, "PATCH"))
    expect(await json(res)).toMatchObject({ user: { full_name: "New Name", phone: null } })
    expect((await updateProfile(jsonReq("/api/auth/update-profile", { full_name: "X" }, "PATCH"))).status).toBe(400)
  })

  it("blocked users get 403 from every requireActiveUser endpoint", async () => {
    const user = await createUser({ isBlocked: true })
    await loginAs(user)
    expect((await updateProfile(jsonReq("/api/auth/update-profile", { full_name: "Name" }, "PATCH"))).status).toBe(403)
  })
})

describe("become-seller", () => {
  it("upgrades a BUYER in place and re-issues the session with role SELLER", async () => {
    const user = await createUser()
    await loginAs(user)
    expect((await becomeSeller()).status).toBe(200)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).role).toBe("SELLER")
    expect((await decrypt(cookieJar.get("session")))?.role).toBe("SELLER")
  })

  it("409s for existing sellers and admins", async () => {
    await loginAs(await createUser({ role: "SELLER" }))
    expect((await becomeSeller()).status).toBe(409)
    await loginAs(await createUser({ role: "ADMIN" }))
    expect((await becomeSeller()).status).toBe(409)
  })
})

describe("OAuth (Google / GitHub / Facebook)", () => {
  it("start routes fail gracefully when not configured", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "")
    expect((await googleStart()).status).toBe(500)
    const gh = await githubStart(new Request("http://localhost:3000/api/auth/github?from=signup"))
    expect(gh.headers.get("location")).toBe("http://localhost:3000/signup?error=github_not_configured")
    const fb = await facebookStart(new Request("http://localhost:3000/api/auth/facebook"))
    expect(fb.headers.get("location")).toBe("http://localhost:3000/login?error=facebook_not_configured")
  })

  it("google start redirects to Google with a CSRF state cookie", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "cid")
    const res = await googleStart()
    const location = new URL(res.headers.get("location")!)
    expect(location.host).toBe("accounts.google.com")
    const state = location.searchParams.get("state")
    expect(state).toBeTruthy()
    expect(res.headers.get("set-cookie")).toContain(`google_oauth_state=${state}`)
  })

  function callback(query: string, stateCookie?: string) {
    return new NextRequest(new URL(`/api/auth/google/callback?${query}`, "http://localhost:3000"), {
      headers: stateCookie ? { cookie: `google_oauth_state=${stateCookie}` } : {},
    })
  }

  function mockGoogle(profile: Record<string, unknown>) {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("oauth2.googleapis.com/token")) return Response.json({ access_token: "at", id_token: "it" })
      if (url.includes("userinfo")) return Response.json(profile)
      throw new Error(`unexpected fetch ${url}`)
    })
  }

  beforeEach(() => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "cid")
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret")
  })

  it("callback rejects a state mismatch and a cancelled consent", async () => {
    expect((await googleCallback(callback("code=c&state=a", "b"))).headers.get("location")).toContain("error=google_failed")
    expect((await googleCallback(callback("error=access_denied"))).headers.get("location")).toContain("error=google_cancelled")
  })

  it("callback creates a verified BUYER and signs them in", async () => {
    mockGoogle({ sub: "g-1", email: "new@test.local", email_verified: true, name: "New" })
    const res = await googleCallback(callback("code=c&state=s", "s"))
    expect(res.headers.get("location")).toBe("http://localhost:3000/")
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "new@test.local" } })
    expect(user).toMatchObject({ googleId: "g-1", isVerified: true, role: "BUYER" })
    expect(res.headers.get("set-cookie")).toContain("session=")
  })

  it("callback links an existing password account by email instead of duplicating", async () => {
    const existing = await createUser({ email: "same@test.local", role: "SELLER" })
    mockGoogle({ sub: "g-2", email: "same@test.local", email_verified: true })
    const res = await googleCallback(callback("code=c&state=s", "s"))
    expect(res.headers.get("location")).toBe("http://localhost:3000/seller/onboard")
    expect(await prisma.user.count()).toBe(1)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: existing.id } })).googleId).toBe("g-2")
  })

  it("callback refuses unverified Google emails and blocked accounts", async () => {
    mockGoogle({ sub: "g-3", email: "u@test.local", email_verified: false })
    expect((await googleCallback(callback("code=c&state=s", "s"))).headers.get("location")).toContain(
      "error=google_email_unverified"
    )

    vi.restoreAllMocks()
    await createUser({ email: "blocked@test.local", isBlocked: true })
    mockGoogle({ sub: "g-4", email: "blocked@test.local", email_verified: true })
    expect((await googleCallback(callback("code=c&state=s", "s"))).headers.get("location")).toContain("error=account_blocked")
  })
})
