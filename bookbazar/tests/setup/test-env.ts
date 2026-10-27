// Every value here is test-only. DATABASE_URL / REDIS_URL point at the
// containers in docker-compose.test.yml — never at the real .env services.
// env-guard.ts refuses to run if DATABASE_URL isn't local.
export const testEnv: Record<string, string> = {
  NODE_ENV: "test",
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ?? "postgresql://bookbazaar:bookbazaar@localhost:54329/bookbazaar_test",
  REDIS_URL: process.env.TEST_REDIS_URL ?? "redis://localhost:63799",
  SESSION_SECRET: "test-session-secret-at-least-32-characters-long",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  RESEND_API_KEY: "re_test_dummy",
  CLOUDINARY_CLOUD_NAME: "test",
  CLOUDINARY_API_KEY: "test",
  CLOUDINARY_API_SECRET: "test",
  GOOGLE_GENERATIVE_AI_API_KEY: "test",
}
