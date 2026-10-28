import { describe, it, expect } from "vitest"
import { spawnSync } from "node:child_process"
import path from "node:path"

// The test database was built only from prisma/migrations (global-setup.ts).
// If schema.prisma has changes no migration covers, this diff is non-empty:
// run `npx prisma migrate dev --name <change>` against a dev database and
// commit the new migration folder.
describe("prisma migrations", () => {
  it("produce exactly the schema in schema.prisma", () => {
    const result = spawnSync(
      "npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --exit-code",
      {
        cwd: path.resolve(__dirname, "../.."),
        shell: true,
        encoding: "utf8",
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      }
    )
    if (result.status !== 0) {
      throw new Error(`Schema drift (exit ${result.status}) — missing migration:\n${result.stdout}\n${result.stderr}`)
    }
    expect(result.status).toBe(0)
  })
})
