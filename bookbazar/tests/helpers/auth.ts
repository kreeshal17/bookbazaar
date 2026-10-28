import { encrypt } from "@/app/lib/session"

type Role = "ADMIN" | "BUYER" | "SELLER"

// Shared with the next/headers mock in tests/setup/mocks.ts. Lives on
// globalThis so the mock factory and the test file see the same Map.
const g = globalThis as unknown as { __cookieJar?: Map<string, string> }
export const cookieJar: Map<string, string> = (g.__cookieJar ??= new Map())

export async function sessionTokenFor(user: { id: string; email: string; role: Role }) {
  return encrypt({ id: user.id, email: user.email, role: user.role })
}

/** Makes the next route-handler call look like it came from this user. */
export async function loginAs(user: { id: string; email: string; role: Role }) {
  cookieJar.set("session", await sessionTokenFor(user))
}

export function logout() {
  cookieJar.delete("session")
}
