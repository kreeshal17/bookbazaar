import { NextRequest } from "next/server"

const BASE = "http://localhost:3000"

/** A JSON request to a route handler. `path` may include a query string. */
export function jsonReq(path: string, body?: unknown, method = body === undefined ? "GET" : "POST") {
  return new NextRequest(new URL(path, BASE), {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function formReq(path: string, form: FormData) {
  return new NextRequest(new URL(path, BASE), { method: "POST", body: form })
}

/** Next 16 passes dynamic route params as a Promise. */
export function params<T extends Record<string, string>>(p: T) {
  return { params: Promise.resolve(p) }
}

export async function json(res: Response) {
  return res.json() as Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
}
