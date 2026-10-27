import { defineConfig, devices } from "@playwright/test"
import { testEnv } from "./tests/setup/test-env"

const PORT = 3100

// Browser tests for things only a real layout engine can check (e.g. navbar
// overlap). The dev server runs with the test-only env from
// tests/setup/test-env.ts, so even if a page touched the DB or Redis it
// would hit the Docker test containers, never the real .env services.
// Specs mock the API responses they need with page.route().
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/help`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: { ...testEnv, NODE_ENV: "development" },
  },
})
