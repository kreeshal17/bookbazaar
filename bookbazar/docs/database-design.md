# 📚 Book Marketplace — Database Design Documentation

> **Project:** nexmart-books  
> **Stack:** Next.js (Full Backend) · PostgreSQL · Prisma ORM  
> **Auth:** Custom JWT + bcrypt  

---

## Table of Contents

1. [Entities & Tables](#1-entities--tables)
2. [Relationships](#2-relationships)
3. [ER Diagram](#3-er-diagram)
4. [Foreign Keys](#4-foreign-keys)
5. [How a Seller Sees Orders](#5-how-a-seller-sees-orders)
6. [How a Buyer's Order Links to a Book](#6-how-a-buyers-order-links-to-a-book)
7. [Normalization Decisions](#7-normalization-decisions)
8. [Indexes](#8-indexes)
9. [PostgreSQL CREATE TABLE Statements](#9-postgresql-create-table-statements)
10. [Checkout Flow](#10-checkout-flow)

---

## 1. Entities & Tables

### `users`
Central identity table for all roles — buyer, seller, and admin. Every person on the platform is one row here. Role drives all authorization logic.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | TEXT | Unique |
| full_name | TEXT | |
| password_hash | TEXT | bcrypt hash — never plaintext |
| avatar_url | TEXT | Optional |
| role | ENUM | `buyer`, `seller`, `admin` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

### `categories`
Normalized lookup table for book genres. Storing a category ID instead of a raw string prevents typos, allows renaming, and makes filtering efficient.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | e.g. "Science Fiction" |
| slug | TEXT | e.g. "science-fiction" |

---

### `books`
The product catalog. Each book belongs to exactly one seller. Holds all product metadata.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| seller_id | UUID | FK → users.id |
| category_id | UUID | FK → categories.id |
| title | TEXT | |
| description | TEXT | |
| price | NUMERIC(10,2) | Must be ≥ 0 |
| stock_qty | INT | Must be ≥ 0 |
| image_url | TEXT | |
| is_active | BOOLEAN | Soft delete / delist |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

### `orders`
One order per checkout session per buyer. Holds buyer reference, status, and total amount.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| buyer_id | UUID | FK → users.id |
| book_id | UUID | FK → books.id |
| seller_id | UUID | FK → users.id (denormalized) |
| quantity | INT | |
| unit_price | NUMERIC(10,2) | Price snapshot at time of purchase |
| total_amount | NUMERIC(10,2) | quantity × unit_price |
| status | ENUM | `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` |
| shipping_addr | TEXT | Snapshot at purchase time |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

> **Note:** For this simple marketplace, `order_items` table is not needed. One order = one book. The book details (seller, price) are stored directly on the order.

---

### `cart_items`
Temporary holding area before an order is placed. Keeps the order table clean and avoids polluting it with abandoned sessions.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users.id |
| book_id | UUID | FK → books.id |
| quantity | INT | Default 1 |
| added_at | TIMESTAMPTZ | |

> **Constraint:** `UNIQUE(user_id, book_id)` — one row per book per user cart.

---

## 2. Relationships

### One-to-Many

| Parent | Child | Meaning |
|---|---|---|
| `users` (seller) | `books` | One seller lists many books |
| `users` (buyer) | `orders` | One buyer places many orders |
| `categories` | `books` | One category has many books |
| `users` (buyer) | `cart_items` | One user has many cart rows |
| `books` | `cart_items` | One book appears in many carts |

### Many-to-Many
**Buyers ↔ Books** — A buyer can purchase many books; a book can be bought by many buyers. Resolved through the `orders` table.

---

## 3. ER Diagram

```
┌──────────────────────────────────────────────────────┐
│                        users                         │
│──────────────────────────────────────────────────────│
│ PK  id              UUID                             │
│     email           TEXT         UNIQUE              │
│     full_name       TEXT                             │
│     password_hash   TEXT         bcrypt              │
│     avatar_url      TEXT                             │
│     role            ENUM         buyer/seller/admin  │
│     created_at      TIMESTAMPTZ                      │
│     updated_at      TIMESTAMPTZ                      │
└──────────────┬───────────────────────────────────────┘
               │
       ┌───────┴──────────────────────┐
       │                              │
  [role = seller]                [role = buyer]
       │ 1:M                          │ 1:M
       ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│        books         │    │             orders               │
│──────────────────────│    │──────────────────────────────────│
│ PK  id       UUID    │    │ PK  id           UUID            │
│ FK  seller_id  ──────┼────┼──► users.id (seller)            │
│ FK  category_id ─────┼─┐  │ FK  buyer_id ───────────────────┼──► users.id
│     title      TEXT  │ │  │ FK  book_id  ───────────────────┼──► books.id
│     description TEXT │ │  │     quantity     INT            │
│     price      NUM   │ │  │     unit_price   NUMERIC        │
│     stock_qty  INT   │ │  │     total_amount NUMERIC        │
│     image_url  TEXT  │ │  │     status       ENUM           │
│     is_active  BOOL  │ │  │     created_at   TIMESTAMPTZ    │
│     created_at TSTZ  │ │  └──────────────────────────────────┘
│     updated_at TSTZ  │ │
└──────────────────────┘ │
                         │ M:1
                         ▼
               ┌───────────────────────┐
               │       categories      │
               │───────────────────────│
               │ PK  id    UUID        │
               │     name  TEXT UNIQUE │
               │     slug  TEXT UNIQUE │
               └───────────────────────┘

┌──────────────────────────────────────────────────────┐
│                     cart_items                       │
│──────────────────────────────────────────────────────│
│ PK  id        UUID                                   │
│ FK  user_id   UUID  ────────────────────────────────►│ users.id
│ FK  book_id   UUID  ────────────────────────────────►│ books.id
│     quantity  INT            DEFAULT 1               │
│     added_at  TIMESTAMPTZ                            │
│     UNIQUE (user_id, book_id)                        │
└──────────────────────────────────────────────────────┘
```

---

## 4. Foreign Keys

| FK Column | Table | References | On Delete | Purpose |
|---|---|---|---|---|
| `books.seller_id` | `books` | `users.id` | CASCADE | Tracks which seller owns the listing |
| `books.category_id` | `books` | `categories.id` | SET NULL | Normalized category reference |
| `orders.buyer_id` | `orders` | `users.id` | RESTRICT | Who placed the order |
| `orders.book_id` | `orders` | `books.id` | RESTRICT | Which book was ordered |
| `orders.seller_id` | `orders` | `users.id` | RESTRICT | Denormalized for fast seller queries |
| `cart_items.user_id` | `cart_items` | `users.id` | CASCADE | Cart belongs to one user |
| `cart_items.book_id` | `cart_items` | `books.id` | CASCADE | Cart references a book |

---

## 5. How a Seller Sees Orders

Query path:

```
users (seller) → books → orders
```

```sql
SELECT
  o.id           AS order_id,
  o.status,
  o.quantity,
  o.unit_price,
  o.total_amount,
  o.created_at,
  b.title        AS book_title,
  u.full_name    AS buyer_name
FROM orders o
JOIN books b ON o.book_id = b.id
JOIN users u ON o.buyer_id = u.id
WHERE o.seller_id = $1   -- current logged-in seller
ORDER BY o.created_at DESC;
```

The `seller_id` on `orders` makes this a **single-hop query** — no complex joins needed.

---

## 6. How a Buyer's Order Links to a Book

```
users (buyer)
  └── orders         (buyer_id → users.id)
        └── books    (book_id  → books.id)
              └── users (seller)  (seller_id → users.id)
```

A buyer places an order → order stores `book_id` and `seller_id` directly → no need for a separate junction table for this simple marketplace.

---

## 7. Normalization Decisions

| Decision | Justification |
|---|---|
| `categories` is a separate table | Avoids repeating "Science Fiction" on every book row. Rename in one place. |
| `unit_price` stored on `orders` | Price snapshot — if seller changes price tomorrow, old orders still show what buyer paid |
| `seller_id` on `orders` | Technically derivable via `books.seller_id` but denormalized here for fast seller dashboard queries |
| `total_amount` on `orders` | Stored for performance and historical accuracy |
| `role` on `users` | Single role per user is sufficient. Multi-role would need a `user_roles` junction table |
| `is_active` on `books` | Soft delete — delisting a book keeps order history intact |
| No `order_items` table | Simple marketplace: one order = one book. No cart-to-multi-book complexity needed |

---

## 8. Indexes

| Index | Table | Column(s) | Reason |
|---|---|---|---|
| `idx_books_seller_id` | `books` | `seller_id` | Seller listing their own books |
| `idx_books_category_id` | `books` | `category_id` | Browse/filter by category |
| `idx_books_is_active` | `books` | `is_active` | Exclude delisted books |
| `idx_books_fts` | `books` | `title + description` | Full-text search (GIN) |
| `idx_orders_buyer_id` | `orders` | `buyer_id` | Buyer's order history |
| `idx_orders_seller_id` | `orders` | `seller_id` | Seller's sales dashboard |
| `idx_orders_status` | `orders` | `status` | Filter by order status |
| `idx_cart_items_user_id` | `cart_items` | `user_id` | Load cart for a user |

---

## 9. PostgreSQL CREATE TABLE Statements

```sql
-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
);


-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────

CREATE TABLE users (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT          NOT NULL UNIQUE,
  full_name      TEXT          NOT NULL,
  password_hash  TEXT          NOT NULL,
  avatar_url     TEXT,
  role           user_role     NOT NULL DEFAULT 'buyer',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────

CREATE TABLE categories (
  id    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT  NOT NULL UNIQUE,
  slug  TEXT  NOT NULL UNIQUE
);


-- ─────────────────────────────────────────
-- BOOKS
-- ─────────────────────────────────────────

CREATE TABLE books (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  UUID           REFERENCES categories(id) ON DELETE SET NULL,
  title        TEXT           NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2)  NOT NULL CHECK (price >= 0),
  stock_qty    INT            NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  image_url    TEXT,
  is_active    BOOLEAN        NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_seller_id   ON books (seller_id);
CREATE INDEX idx_books_category_id ON books (category_id);
CREATE INDEX idx_books_is_active   ON books (is_active);
CREATE INDEX idx_books_fts         ON books
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));


-- ─────────────────────────────────────────
-- CART ITEMS
-- ─────────────────────────────────────────

CREATE TABLE cart_items (
  id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id   UUID         NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity  INT          NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

  UNIQUE (user_id, book_id)
);

CREATE INDEX idx_cart_items_user_id ON cart_items (user_id);


-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────

CREATE TABLE orders (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id       UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  book_id        UUID          NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  seller_id      UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  quantity       INT           NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_amount   NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  status         order_status  NOT NULL DEFAULT 'pending',
  shipping_addr  TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_buyer_id  ON orders (buyer_id);
CREATE INDEX idx_orders_seller_id ON orders (seller_id);
CREATE INDEX idx_orders_status    ON orders (status);
```

---

## 10. Checkout Flow

When a buyer clicks **Place Order**, the Next.js API does this in a single transaction:

```
Step 1 — Read cart_items WHERE user_id = current_user

Step 2 — JOIN books to get:
          → books.price       (unit_price snapshot)
          → books.seller_id   (who to notify)
          → books.stock_qty   (availability check)

Step 3 — Calculate total:
          total_amount = books.price × cart_items.quantity

Step 4 — INSERT INTO orders:
          buyer_id     = current_user
          book_id      = cart_items.book_id
          seller_id    = books.seller_id
          quantity     = cart_items.quantity
          unit_price   = books.price        ← snapshot
          total_amount = calculated value
          status       = 'pending'

Step 5 — UPDATE books SET stock_qty = stock_qty - quantity

Step 6 — DELETE FROM cart_items WHERE user_id = current_user
```

### Why Price is Snapshotted

```
Today:    books.price = ₹299
          orders.unit_price = ₹299  ✅ saved forever

Tomorrow: seller updates books.price = ₹499

Old order still shows ₹299  ✅ correct history
Without snapshot it would show ₹499  ❌ wrong
```

---

## Design Summary

| Principle | Applied As |
|---|---|
| All roles in one table | `users.role` enum |
| Passwords never plaintext | `password_hash` with bcrypt |
| Price immutability | `unit_price` snapshot on `orders` |
| Soft delete for books | `is_active` flag |
| Fast seller dashboard | `seller_id` directly on `orders` |
| Searchable catalog | GIN full-text index on `books` |
| Cart isolation | `cart_items` separate from `orders` |
| Simple structure | No `order_items` — one order = one book |

---

*Generated for nexmart-books — Next.js Full-Stack Book Marketplace*