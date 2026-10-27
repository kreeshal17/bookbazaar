import { vi, beforeEach } from "vitest"

function jar(): Map<string, string> {
  const g = globalThis as unknown as { __cookieJar?: Map<string, string> }
  return (g.__cookieJar ??= new Map())
}

// next/headers only works inside a Next request scope. Route handlers read
// the session cookie through it, so tests drive it from an in-memory jar
// (see tests/helpers/auth.ts → loginAs).
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar().has(name) ? { name, value: jar().get(name)! } : undefined),
    set: (nameOrObj: string | { name: string; value: string }, value?: string) => {
      if (typeof nameOrObj === "string") jar().set(nameOrObj, value ?? "")
      else jar().set(nameOrObj.name, nameOrObj.value)
    },
    delete: (name: string) => jar().delete(name),
    has: (name: string) => jar().has(name),
  }),
  headers: async () => new Headers(),
}))

// No real email is ever sent. Tests can inspect `resend.emails.send` calls.
vi.mock("@/lib/resend/resend", () => ({
  resend: { emails: { send: vi.fn(async () => ({ data: { id: "test-email" }, error: null })) } },
}))

// No real Cloudinary upload — returns a fake secure_url.
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: (options: { folder?: string }, cb: (err: unknown, res: unknown) => void) => ({
        end: () => cb(null, { secure_url: `https://res.cloudinary.com/test/${options.folder ?? "upload"}/file` }),
      }),
    },
  },
}))

beforeEach(() => {
  jar().clear()
  vi.clearAllMocks()
})
