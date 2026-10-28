import { execSync } from "node:child_process"
import path from "node:path"
import { Client } from "pg"
import type { TestProject } from "vitest/node"
import { assertLocalUrl } from "./local-url"
import { testEnv } from "./test-env"

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string
  }
}

const root = path.resolve(__dirname, "../..")

// Creates a brand-new, empty database for this run inside the test
// container and builds it with `prisma migrate deploy` — the exact path a
// new developer or a fresh environment takes. Nothing is ever reset or
// dropped; old run databases disappear with `npm run test:db:down` (tmpfs).
// tests/integration/schema-drift.test.ts then checks the result matches
// schema.prisma, so a schema change without a migration fails the suite.
export default async function setup(project: TestProject) {
  const baseUrl = testEnv.DATABASE_URL
  assertLocalUrl("DATABASE_URL", baseUrl)

  const dbName = `bookbazaar_test_${Date.now()}`
  const runUrl = new URL(baseUrl)
  runUrl.pathname = `/${dbName}`

  const admin = new Client({ connectionString: baseUrl })
  try {
    await admin.connect()
  } catch (err) {
    throw new Error(`Can't reach the test database at ${baseUrl} — run \`npm run test:db:up\` first.\n${err}`)
  }
  try {
    await admin.query(`CREATE DATABASE "${dbName}"`)
  } finally {
    await admin.end()
  }

  try {
    execSync("npx prisma migrate deploy", {
      cwd: root,
      stdio: "pipe",
      // Explicit DATABASE_URL wins over .env — prisma.config.ts's dotenv never overrides a set var.
      env: { ...process.env, DATABASE_URL: runUrl.toString() },
    })
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer }
    throw new Error("prisma migrate deploy failed on the test database:\n" + (e.stdout ?? "") + (e.stderr ?? ""))
  }

  project.provide("databaseUrl", runUrl.toString())
}
