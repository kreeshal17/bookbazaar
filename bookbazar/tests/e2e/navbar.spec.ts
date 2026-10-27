import { test, expect, type Page, type Locator } from "@playwright/test"

// Regression test for "navbar tabs overlap after login". Layout can only be
// checked in a real browser, so this measures every visible top-bar item.
// /help is used because it renders the Navbar without any DB access; the
// two APIs the Navbar calls are mocked.

type Role = "BUYER" | "SELLER" | "ADMIN"

async function mockSession(page: Page, user: { role: Role; full_name: string } | null) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: user ? { id: "u1", email: "someone.with.a.long.email@test.local", ...user } : null,
    })
  )
  await page.route("**/api/wishlist/get", (route) => route.fulfill({ json: [{ id: "w1" }, { id: "w2" }] }))
}

async function boxes(locators: Locator[]) {
  const result: { name: string; x: number; y: number; width: number; height: number }[] = []
  for (const l of locators) {
    for (const el of await l.all()) {
      if (!(await el.isVisible())) continue
      const box = await el.boundingBox()
      if (!box) continue
      const name = (await el.getAttribute("aria-label")) || (await el.innerText()).trim() || "element"
      result.push({ name, ...box })
    }
  }
  return result
}

function overlaps(a: { x: number; y: number; width: number; height: number }, b: typeof a) {
  // 0.5px tolerance for sub-pixel rounding between touching neighbours.
  return a.x + a.width - 0.5 > b.x && b.x + b.width - 0.5 > a.x && a.y + a.height - 0.5 > b.y && b.y + b.height - 0.5 > a.y
}

/** The top-level items in the header row: logo, nav links, search, action buttons. */
function topBarItems(page: Page) {
  const header = page.locator("header")
  return [
    header.getByRole("link", { name: "📚 BookMandu" }),
    header.locator("nav > a"),
    header.locator("form"),
    header.locator(":scope > div > div.ml-auto > div > a"),
    header.locator(":scope > div > div.ml-auto > div > button"),
    header.locator(":scope > div > div.ml-auto > div > div > a"),
    header.locator("button[aria-haspopup=menu]"),
  ]
}

async function expectCleanTopBar(page: Page, viewportWidth: number) {
  const items = await boxes(topBarItems(page))
  expect(items.length).toBeGreaterThan(3)

  for (const item of items) {
    // Single line: a wrapped text link is ~2x the 36px row height.
    expect(item.height, `"${item.name}" wrapped onto multiple lines`).toBeLessThanOrEqual(44)
    expect(item.x, `"${item.name}" starts off-screen`).toBeGreaterThanOrEqual(0)
    expect(item.x + item.width, `"${item.name}" overflows the viewport`).toBeLessThanOrEqual(viewportWidth + 0.5)
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      expect(overlaps(items[i], items[j]), `"${items[i].name}" overlaps "${items[j].name}"`).toBe(false)
    }
  }
}

const NAV_LABELS = ["Home", "Books", "How we function", "Categories", "Study Hub"]
const BUYER_ACCOUNT_LINKS = ["My orders", "Become a Seller", "Become a Contributor", "My Contributions"]

test.describe("desktop navbar", () => {
  for (const width of [1024, 1152, 1280, 1440, 1920]) {
    for (const role of ["BUYER", "SELLER", "ADMIN"] as const) {
      test(`${role} logged in at ${width}px: no overlap, nothing wraps`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await mockSession(page, { role, full_name: "Bishnu Prasad Shrestha" })
        await page.goto("/help")
        await expect(page.locator("header button[aria-haspopup=menu]")).toBeVisible()

        await expectCleanTopBar(page, width)

        for (const label of NAV_LABELS) {
          await page.locator("header nav").getByRole("link", { name: label, exact: true }).click({ trial: true })
        }
        const search = await page.locator("header form").boundingBox()
        expect(search!.width, "search box squeezed too small to use").toBeGreaterThanOrEqual(150)
      })
    }

    test(`logged out at ${width}px: no overlap`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await mockSession(page, null)
      await page.goto("/help")
      await expect(page.locator("header").getByRole("link", { name: "Login" })).toBeVisible()
      await expectCleanTopBar(page, width)
    })
  }

  test("account links moved into the user menu and are clickable", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await mockSession(page, { role: "BUYER", full_name: "Bishnu" })
    await page.goto("/help")

    const menuButton = page.locator("header button[aria-haspopup=menu]")
    await menuButton.click()
    await expect(menuButton).toHaveAttribute("aria-expanded", "true")
    const menu = page.getByRole("menu")
    for (const label of [...BUYER_ACCOUNT_LINKS, "My Profile", "Wishlist", "Settings"]) {
      await menu.getByRole("link", { name: label, exact: true }).click({ trial: true })
    }
    await expect(menu.getByRole("button", { name: "Logout" })).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(menuButton).toHaveAttribute("aria-expanded", "false")
  })

  test("role-specific links: seller sees no 'Become a Seller', admin sees no contributor links", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await mockSession(page, { role: "SELLER", full_name: "Sita" })
    await page.goto("/help")
    await page.locator("header button[aria-haspopup=menu]").click()
    await expect(page.getByRole("menu").getByRole("link", { name: "Become a Seller" })).toHaveCount(0)
    await expect(page.getByRole("menu").getByRole("link", { name: "My Contributions" })).toHaveCount(1)

    await page.unrouteAll()
    await mockSession(page, { role: "ADMIN", full_name: "Admin" })
    await page.reload()
    await page.locator("header button[aria-haspopup=menu]").click()
    await expect(page.getByRole("menu").getByRole("link", { name: "My Contributions" })).toHaveCount(0)
    await expect(page.getByRole("menu").getByRole("link", { name: "My orders" })).toHaveCount(1)
  })
})

test.describe("mobile navbar", () => {
  for (const width of [375, 768]) {
    test(`logged in at ${width}px: drawer holds every link`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await mockSession(page, { role: "BUYER", full_name: "Bishnu Prasad Shrestha" })
      await page.goto("/help")

      await expect(page.locator("header nav")).toBeHidden()
      await expectCleanTopBar(page, width)

      await page.getByRole("button", { name: "Open menu" }).click()
      const drawer = page.getByRole("dialog", { name: "Menu" })
      for (const label of [...NAV_LABELS, ...BUYER_ACCOUNT_LINKS, "My Profile", "Settings"]) {
        await drawer.getByRole("link", { name: label, exact: true }).click({ trial: true })
      }
      await expect(drawer.getByRole("button", { name: "Logout" })).toBeVisible()

      await page.keyboard.press("Escape")
      await expect(drawer).toBeHidden()
    })
  }
})
