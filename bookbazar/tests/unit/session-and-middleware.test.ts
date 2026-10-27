import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { SignJWT } from "jose"
import { encrypt, decrypt } from "@/app/lib/session"
import { middleware, config } from "@/middleware"

async function reqWithRole(path: string, role?: "ADMIN" | "SELLER" | "BUYER") {
  const headers = new Headers()
  if (role) headers.set("cookie", `session=${await encrypt({ id: "u1", email: "u@test.local", role })}`)
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers })
}

const location = (res: Response) => res.headers.get("location")

describe("session JWT", () => {
  it("round-trips id/email/role", async () => {
    const token = await encrypt({ id: "u1", email: "u@test.local", role: "SELLER" })
    const payload = await decrypt(token)
    expect(payload).toMatchObject({ id: "u1", email: "u@test.local", role: "SELLER" })
    expect(payload!.exp! - payload!.iat!).toBe(7 * 24 * 60 * 60)
  })

  it("rejects tokens signed with a different secret, and garbage", async () => {
    const forged = await new SignJWT({ id: "u1", role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode("some-other-secret-some-other-secret"))
    expect(await decrypt(forged)).toBeUndefined()
    expect(await decrypt("not-a-jwt")).toBeUndefined()
    expect(await decrypt(undefined)).toBeUndefined()
  })
})

describe("middleware route protection", () => {
  it("only runs on /admin, /buyer and /seller", () => {
    expect(config.matcher).toEqual(["/admin/:path*", "/buyer/:path*", "/seller/:path*"])
  })

  it("redirects anonymous users to /login", async () => {
    const res = await middleware(await reqWithRole("/admin"))
    expect(location(res)).toBe("http://localhost:3000/login")
  })

  it("redirects an invalid session to /login", async () => {
    const req = new NextRequest(new URL("/seller/dashboard", "http://localhost:3000"), {
      headers: { cookie: "session=garbage" },
    })
    expect(location(await middleware(req))).toBe("http://localhost:3000/login")
  })

  it.each([
    ["/admin", "ADMIN"],
    ["/seller/dashboard", "SELLER"],
    ["/buyer", "BUYER"],
  ] as const)("lets %s through for %s", async (path, role) => {
    const res = await middleware(await reqWithRole(path, role))
    expect(location(res)).toBeNull()
  })

  it("blocks the wrong role", async () => {
    expect(location(await middleware(await reqWithRole("/admin", "SELLER")))).toBe("http://localhost:3000/login")
    expect(location(await middleware(await reqWithRole("/seller/dashboard", "BUYER")))).toBe("http://localhost:3000/login")
    expect(location(await middleware(await reqWithRole("/buyer", "SELLER")))).toBe("http://localhost:3000/")
  })
})
