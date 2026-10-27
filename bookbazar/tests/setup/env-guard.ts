import { inject } from "vitest"
import { assertLocalUrl } from "./local-url"

// Runs in each test worker: switch to the per-run database global-setup.ts
// created. Must happen before anything imports lib/prisma.
process.env.DATABASE_URL = inject("databaseUrl")
assertLocalUrl("DATABASE_URL", process.env.DATABASE_URL)
assertLocalUrl("REDIS_URL", process.env.REDIS_URL)
