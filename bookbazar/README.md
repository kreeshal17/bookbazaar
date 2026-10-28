# BookMandu

BookMandu is a book marketplace for Nepal. Buyers order new and second-hand books from independent sellers and pay cash on delivery. A separate **Study Hub** gives students free notes and question papers for school (Class 1–12) and university programs. Students write that material themselves and admins approve it.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, PostgreSQL + Prisma 7 (`@prisma/adapter-pg`), Redis (`ioredis`), Cloudinary, Resend, Google Gemini via the Vercel AI SDK. It is deployed on Vercel.

Live site: [bookmandu.vercel.app](https://www.bookmandu.vercel.app)

---

## Contents

- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [npm scripts](#npm-scripts)
- [Features](#features)
- [Architecture](#architecture)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Pages](#pages)
- [Database migrations](#database-migrations)
- [Testing](#testing)
- [Known issues and gotchas](#known-issues-and-gotchas)

---

## Repository layout

The git repository root is the folder **above** this one. The Next.js app lives in `bookbazar/`, spelled with one "a":

```
bookbazaar/                 ← git root
├── package.json            ← only Prisma/pg/dotenv/tsx (seed scripts resolve these from here)
├── README.md               ← older copy of this README
└── bookbazar/              ← the Next.js app — run all commands here
    ├── app/
    │   ├── api/            ← REST route handlers (≈110 endpoints, see API reference)
    │   ├── admin/          ← admin dashboard (+ academic, coupons, credits, seller-payouts, study-review)
    │   ├── seller/         ← seller onboarding + dashboard (books, orders)
    │   ├── study/          ← Study Hub browsing (school / university / subject / material)
    │   ├── contribute/, contributor/, become-contributor/   ← Study Hub contributor flow
    │   ├── books/, cart/, checkout/, orders/, wishlist/, profile/, settings/ …
    │   └── lib/            ← session (JWT), requireActiveUser, requireAdmin
    ├── components/         ← Navbar, home sections, book cards, auth UI, dashboard sidebar
    ├── lib/                ← domain logic: credits, coupons, payouts, fuzzy search, slugs, recommendations, email
    │   └── generated/prisma/   ← generated Prisma client (checked in, do not edit)
    ├── prisma/
    │   ├── schema.prisma   ← source of truth for the data model
    │   ├── migrations/
    │   └── schemas/        ← zod user schema + seed scripts
    ├── public/             ← PWA service worker (sw.js), icons
    ├── middleware.ts       ← role-based page protection for /admin, /seller, /buyer
    ├── tests/              ← Vitest unit + integration suites
    ├── docker-compose.test.yml
    └── docs/database-design.md   ← original design notes (predates most features)
```

---

## Getting started

**Prerequisites:** Node.js 20+ (22 is used locally), a PostgreSQL database, a Redis server, and accounts for Cloudinary, Resend and Google Gemini. Docker is needed only for the test suite.

```bash
cd bookbazar
npm install            # also runs `prisma generate`
# create .env (see the next section)
npm run dev            # http://localhost:3000
```

**Database schema:** on a brand-new, empty database, run `npx prisma migrate deploy`. If your database already exists, follow the one-time step in [Database migrations](#database-migrations) instead.

**Reference data** (optional). These scripts fill a database with starter data:

```bash
npm run seed              # school classes 1–12, streams, Nepali universities
npm run seed:curriculum   # school subjects per class/stream
npm run seed:chapters     # starter chapters for Class 10–11 core subjects
npm run seed:coupons      # FIRST10 first-order coupon
```

**Making an admin:** nobody can sign up as `ADMIN`. Promote an existing user directly in the database (`UPDATE users SET role = 'ADMIN' WHERE email = '…'`), then log in again so the session cookie picks up the new role.

---

## Environment variables

Create `bookbazar/.env`. It is ignored by git.

| Variable | Required | Used for |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection (Prisma + `pg` adapter) |
| `SESSION_SECRET` | yes | HS256 key for the session JWT |
| `REDIS_URL` | yes | Login rate limiting, contributor daily upload cap |
| `NEXT_PUBLIC_APP_URL` | yes | Absolute links in emails, OAuth redirect URIs |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | yes | Book covers, KYC docs, study-material uploads |
| `RESEND_API_KEY` | yes | Verification, password reset, seller and contributor emails |
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes | AI book assistant (`/api/chat`, Gemini 2.5 Flash) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Google sign-in. Redirect URI: `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | optional | GitHub sign-in. The button shows a "not configured" error if unset |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | optional | Facebook sign-in, same behaviour |
| `ADMIN_EMAIL` | optional | Gets an email whenever a seller submits onboarding |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical URL for SEO metadata (defaults to the Vercel URL) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | Google Analytics. Tracking is skipped if unset |

---

## npm scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run seed`, `seed:curriculum`, `seed:chapters`, `seed:coupons` | Reference data (see above) |
| `npm test` | Unit + integration tests (the test containers must be running) |
| `npm run test:docker` | Start the test containers, then run every test |
| `npm run test:unit` | Unit tests only. No Docker needed |
| `npm run test:e2e` | Playwright browser tests (layout checks). Starts its own dev server on port 3100 |
| `npm run test:integration` | Integration tests only |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:db:up` / `test:db:down` | Start or stop and wipe the test Postgres + Redis |

---

## Features

### Buyers
- **Catalog and search:** browse active books from approved stores and filter by category. Search matches title, author, description and ISBN. Searches are **typo-tolerant**: "Muna Modan" finds "Muna Madan" via Postgres `pg_trgm` word-similarity. Exact matches always come first.
- **Book pages:** cover, condition, price, reviews, QR code and a WhatsApp click-to-chat link to the seller.
- **Cart:** add, increment (capped by stock), decrement and remove.
- **Checkout (cash on delivery):** shipping details, an optional **coupon**, and optional **BookMandu Credits**. Each order gets a 6-digit **delivery code**; the seller needs it to mark the order delivered.
- **Orders:** order history with status, plus the seller's public contact details.
- **Wishlist**, **reviews** (only for books from a *delivered* order, one per book), **recently viewed** and **search history**.
- **Personalized homepage:** greeting, recent searches, recently viewed, wishlist teaser, and "Recommended for you". Recommendations are books in the same categories you viewed or bought. New users see the newest listings instead.
- **AI book assistant:** a Gemini chat widget that only talks about books actually listed on BookMandu.
- **Account:** email/password signup with email verification, Google, GitHub or Facebook sign-in (an existing account is linked by verified email), forgot/reset password, change password, profile editing, and a credits wallet.
- **PWA:** installable, with an offline fallback page. The service worker never caches `/api/*`.

### Sellers
- **Become a seller:** a buyer can upgrade in place (`/become-seller`), or sign up as a seller directly.
- **Onboarding:** store name, description, phone and an identity document upload. The store starts unapproved and inactive until an admin approves it, and the admin gets an email.
- **Listings:** add, edit and soft-delete books (`isActive: false`, so order history is kept). Covers are uploaded to Cloudinary. Categories are upserted by slug. Only approved stores can list books.
- **Orders:** see only your own store's items. Move status through PENDING → CONFIRMED → SHIPPED → DELIVERED; DELIVERED requires the buyer's delivery code. Delivered and cancelled orders are locked.
- **Payouts:** see what BookMandu owes you for coupon and credit discounts buyers used on your orders (see [Money flows](#money-flows-coupons-credits-payouts)).
- **Public store page** at `/store/[slug]`.

### Study Hub (students and contributors)
- **Browse** free notes and question papers by school class (and stream for 11–12) or by university → program → semester → subject, optionally by chapter.
- **Become a contributor:** request to help with a class or program. Admin approval alone grants nothing: the admin then grants **subject-level** permissions.
- **Upload** PDF/JPG/PNG/WEBP files up to 20 MB, with an optional thumbnail. The contributor must confirm they own the content. Each upload is SHA-256 hashed so the admin can spot duplicates. Limit: 5 new uploads per day; resubmissions don't count toward it. Contributors can suggest a chapter that doesn't exist yet.
- **Review loop:** every upload starts PENDING. The admin approves, rejects, or requests changes (a note is required). The contributor can resubmit rejected or changes-requested material. Approval awards **credits** (5 by default, admin-configurable), and only once per material.
- **Reports:** anyone can report published material. The admin either unpublishes it or dismisses the report.

### Admins
- **Users:** search, block and unblock. A blocked user's existing session stops working on every protected API at once.
- **Sellers:** approve pending stores (the seller gets an email), ban/unban, verify, delete a seller entirely (cascade), see per-store sales stats, and email one seller or all of them.
- **Banners:** homepage carousel CRUD.
- **Reviews:** search and delete.
- **Coupons:** create percentage or fixed coupons with an optional minimum order, maximum discount, usage cap, expiry and first-order-only flag. Coupons can be edited or deactivated; used coupons can't be deleted.
- **Credits:** set the rupee value per credit and the contribution reward. Make manual adjustments (each is a ledger entry with a reason; balances can't go negative) and view any user's ledger.
- **Seller payouts:** list PENDING/PAID adjustments and mark them paid after paying the seller manually.
- **Academic Management:** universities, programs, semesters, subjects (shared between school and university), streams, school classes, class/program subject assignments, and chapters. Anything that still has study materials under it can't be deleted; deactivate it instead.
- **Study review:** the review queue (with possible-duplicate flags), reports, chapter suggestions, contributor requests and permissions, and direct publishing (admin uploads skip the queue).

---

## Architecture

### Auth and sessions
- **Session:** a JWT (HS256, signed with `jose`, valid 7 days) in an HTTP-only `session` cookie. Payload: `{ id, email, role }`. See `app/lib/session.ts`.
- **Password hashing:** `bcryptjs`, cost 10.
- **Login rate limit:** Redis key `login:<email>`. Five wrong passwords lock the account for 15 minutes.
- **Email verification:** an unverified user can't log in. Logging in sends a fresh link if none is pending.
- **OAuth:** a `state` cookie protects against CSRF. Accounts are linked by verified email, never duplicated.
- **Role changes** (becoming a seller) re-issue the cookie, because the role lives in the JWT.

### Route protection: three layers
1. **`middleware.ts`** guards pages only: `/admin/*` → ADMIN, `/seller/*` → SELLER, `/buyer/*` → BUYER. Other pages (cart, orders, profile…) are public routes that call protected APIs.
2. **`requireActiveUser()`** (`app/lib/active-user.ts`) is used by most user APIs. It checks the session cookie *and* re-reads the user from the database, so a blocked user gets 403 even with a valid JWT.
3. **`requireAdmin()`** (`app/lib/require-admin.ts`) checks for the ADMIN role. Some older admin routes have their own copy of this function; new routes should import the shared one.

Some older seller routes (`book/*`, `seller/orders/*`, `store/create`) only decode the JWT and don't check `isBlocked`.

### API conventions
- Route handlers return `Response.json({ message, … }, { status })`.
- Input is validated with **zod** `safeParse`, and failures return 400.
- Dynamic params are a `Promise` (Next 16): `context: { params: Promise<{ id: string }> }`.
- "Exactly one of X or Y" relations (school vs university) are enforced in the API layer. Postgres treats NULLs in a unique key as distinct, so the API also checks for duplicates by hand. The comments in `schema.prisma` explain this.

### Money flows: coupons, credits, payouts
All three are written inside the order's single `prisma.$transaction` in `app/api/order/create/route.ts`:

1. **Coupon first** (`lib/coupons.ts`): `evaluateCoupon` validates it and computes the discount, capped by `maxDiscount` and by the order total. `redeemCoupon` bumps `redeemedCount` with a conditional update so concurrent orders can't exceed `maxRedemptions`.
2. **Credits next** (`lib/credits.ts`): the requested amount is clamped to the buyer's balance and to what's left of the order. `applyCreditTransaction` is the **only** place `User.creditBalance` is written. It writes a `CreditTransaction` ledger row together with a conditional, race-safe debit. The ledger is the source of truth; the balance is a cache.
3. **Seller payouts** (`lib/seller-payouts.ts`): COD cash goes straight to the seller, so a discount would otherwise come out of the seller's pocket. The total discount is split across stores in proportion to each store's subtotal, and the last store absorbs rounding. The result is recorded as `SellerPayoutAdjustment` rows that an admin settles by hand.
4. **Stock** is decremented with a conditional `updateMany` (`stockQty >= qty`). If any book runs short, the whole order rolls back.

### Other notable pieces
- **Fuzzy search:** `lib/fuzzy-search.ts` uses `word_similarity` with a 0.3 threshold and GIN trigram indexes on `books.title`/`author`. The indexes are declared in `schema.prisma`; the `pg_trgm` extension is created by the `0_init` migration.
- **Slugs:** `lib/slug.ts` generates unique slugs for books, stores and study materials by appending `-2`, `-3`, …
- **Email:** `lib/resend/*` sends from `noreply@krishalkarna.com.np`. If an email fails during a review decision, the decision still saves.
- **Recommendations:** `lib/recommendations.ts` uses only real signals (wishlist, purchases, views, searches).

---

## Data model

`prisma/schema.prisma` is the source of truth and is heavily commented. Overview:

| Area | Models |
|---|---|
| Users and auth | `User` (role BUYER/SELLER/ADMIN, `isVerified`, `isBlocked`, `creditBalance`, OAuth ids), `VerificationToken`, `PasswordResetToken` |
| Marketplace | `Store` (`isApproved`, `isActive`, `isVerified`, KYC `identityUrl`), `Book` (soft delete via `isActive`, `condition`, unique `slug`), `Category` |
| Orders | `CartItem`, `Order` (`deliveryCode`, `couponDiscount`, `creditsApplied`), `OrderItem` (price snapshot per store) |
| Engagement | `Review` (one per user per book), `WishlistItem`, `RecentlyViewedBook`, `SearchHistoryEntry`, `Banner` |
| Money | `Coupon`, `CouponRedemption`, `CreditTransaction` (ledger), `CreditSettings` (single row), `SellerPayoutAdjustment` |
| Study Hub hierarchy | `SchoolClass` → `ClassSubject` (+ optional `Stream`); `University` → `Program` → `Semester` → `ProgramSubject`; `Subject` is shared; `Chapter` belongs to `Subject` |
| Study Hub content | `StudyMaterial` (exactly one of `classSubjectId`/`programSubjectId`), `StudyMaterialReport`, `StudyMaterialPurchase` (not used yet; every material is FREE) |
| Contributors | `ContributorRequest` (class- or program-level ask), `ContributorPermission` (subject-level grant), `ChapterSuggestion` |

---

## API reference

All routes are under `app/api/`. Auth: **public** = none, **user** = `requireActiveUser`, **session** = JWT only, **seller** = session + own store, **admin** = ADMIN role.

**Auth and account**

| Method + path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/signup` | public | Create BUYER/SELLER, send verification email |
| `GET /api/auth/verify-email?token=` | public | Verify email, redirect to `/login?verified=true` |
| `POST /api/auth/login` | public | Rate-limited login, sets `session` cookie |
| `POST /api/auth/logout` | public | Clear cookie |
| `GET /api/auth/me` | public | Session payload + `full_name`, or `null` |
| `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | public | 1-hour reset token flow |
| `POST /api/auth/change-password`, `PATCH /api/auth/update-profile` | user | Account settings |
| `POST /api/auth/become-seller` | user | BUYER → SELLER, re-issues cookie |
| `GET /api/auth/{google,github,facebook}` (+ `/callback`) | public | OAuth sign-in |
| `GET /api/profile` | user | Profile (no password hash; `hasPassword` flag) |

**Catalog, cart, orders**

| Method + path | Auth | Purpose |
|---|---|---|
| `GET /api/book/all?search=&category=` | public | Catalog + substring and fuzzy search |
| `GET /api/books/[slug]` | public | Book detail |
| `GET /api/banners`, `GET /api/credits/settings` | public | Homepage banners, credit config |
| `POST /api/cart/add` · `GET /api/cart/get` · `PATCH/DELETE /api/cart/[id]` · `PATCH /api/cart/decrease` | user | Cart |
| `POST /api/coupons/validate` | user | Checkout coupon preview (does not redeem) |
| `POST /api/order/create` · `GET /api/order/get` | user | Checkout, order history |
| `GET /api/credits/wallet` | user | Balance + ledger |
| `POST /api/wishlist/toggle` · `GET /api/wishlist/get` | user | Wishlist |
| `POST /api/reviews/create` · `GET /api/reviews/[bookId]` | user / public | Reviews |
| `POST /api/recently-viewed` · `POST /api/search-history` | user | Personalization signals |
| `POST /api/chat` | public | AI assistant (streams) |
| `POST /api/upload` | session | Image upload to Cloudinary (10 MB max) |

**Seller**

| Method + path | Auth | Purpose |
|---|---|---|
| `POST /api/store/create` | session (SELLER) | Onboarding |
| `GET/PATCH /api/store/mine` · `GET /api/store/payouts` | user | Store info, description edit, payouts owed |
| `POST /api/book/create` · `GET /api/book/get` · `GET/PATCH/DELETE /api/book/[id]` | seller | Listings |
| `GET /api/seller/orders` · `PATCH /api/seller/orders/[id]` | seller | Orders + status |

**Study Hub**

| Method + path | Auth | Purpose |
|---|---|---|
| `GET /api/school-classes`, `GET /api/universities`, `GET /api/chapters?subjectId=` | public | Pickers |
| `POST /api/contributor/request` · `GET /api/contributor/my-requests` | user | Contributor access |
| `POST /api/contributor/upload` · `GET /api/contributor/materials` | user (+ permission) | Upload/resubmit, list own |
| `POST /api/study-materials/report` | user | Report published material |

**Admin** (all `requireAdmin`)

`users`, `pending-sellers`, `approve-seller/[storeId]`, `stores`, `stores/[storeId]`, `banners`, `banners/[id]`, `reviews`, `send-message`, `coupons`, `coupons/[id]`, `credit-settings`, `credits`, `credits/[userId]`, `credits/adjust`, `seller-payouts`, `seller-payouts/[id]`, `study-review`, `study-review/[id]`, `study-reports`, `study-reports/[id]`, `study-materials`, `chapter-suggestions`, `chapter-suggestions/[id]`, `contributor-requests`, `contributor-requests/[id]`, `contributor-permissions`, `contributor-permissions/[id]`, `universities`, `programs`, `semesters`, `subjects`, `streams`, `school-classes`, `class-subjects`, `program-subjects`, `chapters` (each with an `/[id]` variant for PATCH/DELETE where it applies).

---

## Pages

| Path | Who | What |
|---|---|---|
| `/` | everyone | Hero, banners, categories, featured books, Study Hub teaser, personalized rows when logged in |
| `/books`, `/books/[slug]`, `/categories`, `/category`, `/store/[slug]` | everyone | Catalog |
| `/cart`, `/checkout`, `/orders`, `/wishlist`, `/profile`, `/settings` | logged in | Buyer flows |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | everyone | Auth |
| `/become-seller`, `/seller/onboard`, `/seller/dashboard/*` | sellers | Selling |
| `/study/*` | everyone | Study Hub browsing and material viewer |
| `/become-contributor`, `/contribute/upload`, `/contributor/dashboard` | logged in | Contributing |
| `/admin`, `/admin/{academic,coupons,credits,seller-payouts,study-review}` | admin | Admin panel |
| `/chat`, `/help`, `/offline` | everyone | AI chat, help, PWA offline fallback |

---

## Database migrations

`prisma/migrations/0_init` is a **baseline**: one migration containing the full schema as of 2026-10-27. It replaced the old history, which never added several columns and tables production already has. The old files are kept, unused, in `prisma/migrations-archive/`.

### One-time step for every database that already exists (production, your local dev DB)

These databases already have the schema, so `0_init` must be **marked** as applied, not run:

```bash
# 1. Check the database matches schema.prisma. Read-only.
#    Prints nothing if they match. Any SQL it prints is a real difference — see below.
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script

# 2. Record 0_init as already applied. This writes one row to _prisma_migrations
#    and does not change any tables.
npx prisma migrate resolve --applied 0_init

# 3. Confirm: should report the database schema is up to date.
npx prisma migrate status
```

Each command uses the `DATABASE_URL` in `.env`, so point it at the right database before you run it. Old rows for the archived migrations stay in `_prisma_migrations`; that's expected and harmless.

If step 1 prints SQL, production differs from `schema.prisma`. **Don't run step 2 yet.** Review what it printed with the team: either fix `schema.prisma` to match production, or add a follow-up migration (see below) after `0_init`.

### New databases

`npx prisma migrate deploy` builds everything from `0_init`. The test suite does exactly this on every run.

### Every future schema change

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name short_description` against your **local dev database, never production**. This creates `prisma/migrations/<timestamp>_short_description/` and applies it locally.
3. Commit the migration folder together with the schema change.
4. Apply it in production with `npx prisma migrate deploy`. You can run this by hand, or change the build script to `prisma generate && prisma migrate deploy && next build`.

Don't use `prisma db push` on shared databases: it changes the schema without leaving a migration, which is how the history got out of sync. The `schema-drift` test fails if `schema.prisma` has changes that no migration covers.

---

## Testing

The suite uses **Vitest**. It calls the real route handlers directly, with no HTTP server.

```bash
npm run test:docker    # start Postgres 16 + Redis 7 in Docker, then run everything
npm run test:unit      # pure logic only, no Docker
npm run test:e2e       # browser tests (first time: npx playwright install chromium)
npm run test:db:down   # stop the containers and delete their data
```

- **Unit** tests (`tests/unit/`) cover the session JWT, middleware, zod schemas, coupon/credit/payout arithmetic, and small helpers.
- **Browser** tests (`tests/e2e/`, Playwright) cover things only a real layout engine can check. `navbar.spec.ts` measures every top-bar item for overlap and wrapping across roles and screen widths (375–1920px). Specs mock the APIs they need with `page.route()`, and the dev server runs with the test-only env.
- **Integration** tests (`tests/integration/`) run every API feature area against a real Postgres (with `pg_trgm`) and Redis from `docker-compose.test.yml`, on host ports **54329** and **63799**. Each run creates a new database in that container and builds it with `prisma migrate deploy`; `test:db:down` deletes them all. `schema-drift.test.ts` fails if `schema.prisma` has changes without a migration.
- **Mocked:** `next/headers` cookies (use `loginAs(user)` from `tests/helpers/auth.ts`), Resend (no real email is sent), Cloudinary, and Gemini.
- **Safety:** `tests/setup/local-url.ts` refuses to run if the database or Redis URL isn't local, so the suite can never touch the real `.env` services.
- **Helpers:** `tests/helpers/db.ts` has factories (`createUser`, `createSellerWithStore`, `createBook`, `createAcademicTree`, …) and `resetDb()`.

**Adding a test:** add `tests/integration/<feature>.test.ts`, call `beforeEach(resetDb)`, build data with the factories, `await loginAs(user)`, then call the route's exported `GET`/`POST`/… with `jsonReq(...)` and, for dynamic routes, `params({ id })`.

---

## Known issues and gotchas

- **Existing databases need the one-time baseline step.** Until `npx prisma migrate resolve --applied 0_init` has been run on production and on each developer's database, `migrate deploy` there will try to run `0_init` and fail, because the tables already exist. See [Database migrations](#database-migrations).
- **The seed scripts depend on packages in the parent folder.** `tsx` and `dotenv` are listed only in the parent `package.json`. Run `npm install` in the git root as well, or the `seed:*` scripts fail.
- **`node_modules` is committed at the git root** (about 8k files). There's no `.gitignore` at the git root; the only one is in `bookbazar/`.
- **A stale `.next/dev/types` folder** can break `tsc --noEmit`. Delete `.next` if you see errors in `validator.ts`.
- **Some admin routes define their own `requireAdmin`** instead of importing `app/lib/require-admin.ts`. Some seller routes skip the `isBlocked` check.
- `docs/database-design.md` describes the original MVP design and is out of date. Use `schema.prisma`.
