import { describe, it, expect } from "vitest"
import { buildWhatsAppLink } from "@/lib/whatsapp"
import { authErrorMessage } from "@/lib/auth-errors"
import { getCanonicalUrl, SITE_NAME } from "@/lib/site"
import { generateSlug } from "@/lib/slug"
import { sha256 } from "@/lib/file-hash"
import { cn } from "@/lib/utils"

describe("buildWhatsAppLink", () => {
  it("returns null without a usable phone", () => {
    expect(buildWhatsAppLink(null, "hi")).toBeNull()
    expect(buildWhatsAppLink("", "hi")).toBeNull()
    expect(buildWhatsAppLink("abc", "hi")).toBeNull()
  })

  it("prefixes Nepal's 977 country code and strips leading zeros", () => {
    expect(buildWhatsAppLink("9800000000", "hi")).toBe("https://wa.me/9779800000000?text=hi")
    expect(buildWhatsAppLink("09800000000", "hi")).toBe("https://wa.me/9779800000000?text=hi")
  })

  it("keeps an existing 977 prefix and strips formatting", () => {
    expect(buildWhatsAppLink("+977 980-000-0000", "hi")).toBe("https://wa.me/9779800000000?text=hi")
  })

  it("URL-encodes the message", () => {
    expect(buildWhatsAppLink("9800000000", "Order #1 & more")).toContain("text=Order%20%231%20%26%20more")
  })
})

describe("authErrorMessage", () => {
  it("maps known OAuth error codes", () => {
    expect(authErrorMessage("google_cancelled")).toBe("Google sign-in was cancelled.")
    expect(authErrorMessage("account_blocked")).toMatch(/blocked/)
  })
  it("falls back for unknown codes and returns null for none", () => {
    expect(authErrorMessage("weird")).toBe("Something went wrong. Please try again.")
    expect(authErrorMessage(null)).toBeNull()
  })
})

describe("site helpers", () => {
  it("builds canonical URLs off SITE_URL", () => {
    expect(SITE_NAME).toBe("BookMandu")
    expect(getCanonicalUrl("/books")).toMatch(/\/books$/)
  })
})

describe("generateSlug", () => {
  it("lowercases, strips punctuation and joins with dashes", () => {
    expect(generateSlug("Harry Potter & the Goblet!")).toBe("harry-potter-and-the-goblet")
  })
  it("falls back to 'book' for an empty result", () => {
    expect(generateSlug("!!!")).toBe("book")
  })
})

describe("sha256", () => {
  it("hashes deterministically", () => {
    expect(sha256(Buffer.from("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  })
})

describe("cn", () => {
  it("merges tailwind classes, last one wins", () => {
    expect(cn("p-2", false && "hidden", "p-4")).toBe("p-4")
  })
})
