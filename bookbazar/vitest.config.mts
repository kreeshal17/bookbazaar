import { defineConfig } from "vitest/config"
import path from "node:path"
import { testEnv } from "./tests/setup/test-env"

const root = path.resolve(__dirname)

const resolve = {
  alias: {
    // `server-only` throws outside a React Server Component bundle.
    "server-only": path.join(root, "tests/setup/server-only-stub.ts"),
    "@": root,
  },
}

export default defineConfig({
  test: {
    projects: [
      {
        resolve,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
          env: testEnv,
        },
      },
      {
        resolve,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          env: testEnv,
          globalSetup: ["tests/setup/global-setup.ts"],
          setupFiles: ["tests/setup/env-guard.ts", "tests/setup/mocks.ts"],
          // One shared database — files must not truncate each other's data
          // mid-run, so every integration file runs in one process, in sequence.
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
          testTimeout: 20000,
          hookTimeout: 60000,
        },
      },
    ],
  },
})
