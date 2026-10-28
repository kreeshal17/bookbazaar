import bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"
import prisma from "@/lib/prisma"
import redis from "@/lib/redis/redis"

export { prisma, redis }

/** Wipes every table (except Prisma's migration log) and the Redis test DB. */
export async function resetDb() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `
  if (tables.length) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${tables.map((t) => `"public"."${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`
    )
  }
  await redis.flushdb()
}

const uid = () => randomUUID().slice(0, 8)

export const TEST_PASSWORD = "password123"

export async function createUser(
  overrides: Partial<{
    email: string
    full_name: string
    role: "BUYER" | "SELLER" | "ADMIN"
    isVerified: boolean
    isBlocked: boolean
    password: string | null
    creditBalance: number
    phone: string
  }> = {}
) {
  const password = overrides.password === undefined ? TEST_PASSWORD : overrides.password
  return prisma.user.create({
    data: {
      email: overrides.email ?? `user-${uid()}@test.local`,
      full_name: overrides.full_name ?? "Test User",
      role: overrides.role ?? "BUYER",
      isVerified: overrides.isVerified ?? true,
      isBlocked: overrides.isBlocked ?? false,
      creditBalance: overrides.creditBalance ?? 0,
      phone: overrides.phone,
      password_hash: password ? await bcrypt.hash(password, 4) : null,
    },
  })
}

export async function createSellerWithStore(
  storeOverrides: Partial<{ isApproved: boolean; isActive: boolean; name: string; phone: string }> = {}
) {
  const seller = await createUser({ role: "SELLER" })
  const name = storeOverrides.name ?? `Store ${uid()}`
  const store = await prisma.store.create({
    data: {
      sellerId: seller.id,
      name,
      slug: `store-${uid()}`,
      description: "A test store",
      phone: storeOverrides.phone ?? "9800000000",
      isApproved: storeOverrides.isApproved ?? true,
      isActive: storeOverrides.isActive ?? true,
    },
  })
  return { seller, store }
}

export async function createBook(
  storeId: string,
  overrides: Partial<{
    title: string
    author: string
    price: number
    stockQty: number
    isActive: boolean
    categoryId: string | null
    description: string
    isbn: string
  }> = {}
) {
  const title = overrides.title ?? `Book ${uid()}`
  return prisma.book.create({
    data: {
      storeId,
      title,
      slug: `book-${uid()}`,
      author: overrides.author ?? "Some Author",
      description: overrides.description ?? "A perfectly fine test book description.",
      isbn: overrides.isbn,
      price: overrides.price ?? 100,
      stockQty: overrides.stockQty ?? 10,
      isActive: overrides.isActive ?? true,
      categoryId: overrides.categoryId ?? null,
    },
  })
}

export async function createCategory(slug = `cat-${uid()}`) {
  return prisma.category.create({ data: { slug, name: slug } })
}

export async function addToCart(userId: string, bookId: string, quantity = 1) {
  return prisma.cartItem.create({ data: { userId, bookId, quantity } })
}

export const SHIPPING = {
  fullName: "Test Buyer",
  phone: "9800000000",
  shippingAddr: "Some street 12",
  city: "Kathmandu",
  state: "Bagmati",
  postalCode: "44600",
}

/** A delivered order containing `bookId` — what reviews require. */
export async function createDeliveredOrder(buyerId: string, bookId: string, storeId: string) {
  return prisma.order.create({
    data: {
      buyerId,
      status: "DELIVERED",
      totalAmount: 100,
      ...SHIPPING,
      items: { create: { bookId, storeId, quantity: 1, unitPrice: 100, totalPrice: 100 } },
    },
  })
}

/** University → Program → Semester → Subject → ProgramSubject, and a school ClassSubject. */
export async function createAcademicTree() {
  const subject = await prisma.subject.create({ data: { name: `Subject ${uid()}`, slug: `subject-${uid()}` } })
  const university = await prisma.university.create({ data: { name: `Uni ${uid()}`, slug: `uni-${uid()}` } })
  const program = await prisma.program.create({
    data: { universityId: university.id, name: "BCA", slug: `bca-${uid()}` },
  })
  const semester = await prisma.semester.create({ data: { programId: program.id, number: 1, label: "Semester 1" } })
  const programSubject = await prisma.programSubject.create({ data: { semesterId: semester.id, subjectId: subject.id } })
  const schoolClass = await prisma.schoolClass.create({
    data: { level: 10, name: "Class 10", hasStreams: false },
  })
  const classSubject = await prisma.classSubject.create({ data: { schoolClassId: schoolClass.id, subjectId: subject.id } })
  return { subject, university, program, semester, programSubject, schoolClass, classSubject }
}

export async function createMaterial(
  uploadedById: string,
  overrides: Partial<{
    status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "UNPUBLISHED"
    programSubjectId: string
    classSubjectId: string
    fileHash: string
    title: string
  }> = {}
) {
  return prisma.studyMaterial.create({
    data: {
      title: overrides.title ?? "Notes",
      slug: `notes-${uid()}`,
      fileUrl: "https://res.cloudinary.com/test/file.pdf",
      uploadedById,
      status: overrides.status ?? "PENDING",
      programSubjectId: overrides.programSubjectId,
      classSubjectId: overrides.classSubjectId,
      fileHash: overrides.fileHash,
    },
  })
}
