import { describe, it, expect, beforeEach, vi } from "vitest"
import { resetDb, prisma, redis, createUser, createAcademicTree, createMaterial } from "../helpers/db"
import { loginAs } from "../helpers/auth"
import { jsonReq, formReq, params, json } from "../helpers/http"
import { resend } from "@/lib/resend/resend"
import { POST as requestAccess } from "@/app/api/contributor/request/route"
import { GET as myRequests } from "@/app/api/contributor/my-requests/route"
import { POST as uploadMaterial } from "@/app/api/contributor/upload/route"
import { GET as myMaterials } from "@/app/api/contributor/materials/route"
import { POST as reportMaterial } from "@/app/api/study-materials/report/route"
import { GET as adminRequests } from "@/app/api/admin/contributor-requests/route"
import { PATCH as decideRequest } from "@/app/api/admin/contributor-requests/[id]/route"
import { GET as listPermissions, POST as grantPermission } from "@/app/api/admin/contributor-permissions/route"
import { PATCH as togglePermission } from "@/app/api/admin/contributor-permissions/[id]/route"
import { GET as reviewQueue } from "@/app/api/admin/study-review/route"
import { PATCH as reviewMaterial } from "@/app/api/admin/study-review/[id]/route"
import { GET as listReports } from "@/app/api/admin/study-reports/route"
import { PATCH as resolveReport } from "@/app/api/admin/study-reports/[id]/route"
import { GET as listSuggestions } from "@/app/api/admin/chapter-suggestions/route"
import { PATCH as decideSuggestion } from "@/app/api/admin/chapter-suggestions/[id]/route"
import { POST as adminPublish } from "@/app/api/admin/study-materials/route"

beforeEach(resetDb)

const pdf = () => new File([new TextEncoder().encode("%PDF-1.4 test")], "notes.pdf", { type: "application/pdf" })

function uploadForm(fields: Record<string, string>, file: File | null = pdf()) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  if (file) fd.append("file", file)
  return fd
}

async function contributorWithAccess() {
  const tree = await createAcademicTree()
  const user = await createUser()
  await prisma.contributorPermission.create({ data: { userId: user.id, programSubjectId: tree.programSubject.id } })
  await loginAs(user)
  return { user, ...tree }
}

describe("contributor access requests", () => {
  it("must target exactly one of class or program", async () => {
    const tree = await createAcademicTree()
    await loginAs(await createUser())
    expect((await requestAccess(jsonReq("/x", {}))).status).toBe(400)
    expect(
      (await requestAccess(jsonReq("/x", { schoolClassId: tree.schoolClass.id, programId: tree.program.id }))).status
    ).toBe(400)
  })

  it("creates a PENDING request, blocks duplicates, and lets a REJECTED one be resubmitted", async () => {
    const tree = await createAcademicTree()
    const user = await createUser()
    await loginAs(user)

    expect((await requestAccess(jsonReq("/x", { programId: tree.program.id, message: "I teach this" }))).status).toBe(201)
    expect((await requestAccess(jsonReq("/x", { programId: tree.program.id }))).status).toBe(409)

    await prisma.contributorRequest.updateMany({ data: { status: "REJECTED" } })
    expect((await requestAccess(jsonReq("/x", { programId: tree.program.id }))).status).toBe(201)
    expect(await prisma.contributorRequest.count()).toBe(1)
    expect((await prisma.contributorRequest.findFirstOrThrow()).status).toBe("PENDING")

    const mine = await json(await myRequests())
    expect(mine.requests).toHaveLength(1)
  })

  it("404s inactive targets", async () => {
    const tree = await createAcademicTree()
    await prisma.schoolClass.update({ where: { id: tree.schoolClass.id }, data: { isActive: false } })
    await loginAs(await createUser())
    expect((await requestAccess(jsonReq("/x", { schoolClassId: tree.schoolClass.id }))).status).toBe(404)
  })

  it("admin approves/rejects once and emails the user", async () => {
    const tree = await createAcademicTree()
    const user = await createUser()
    const req = await prisma.contributorRequest.create({ data: { userId: user.id, schoolClassId: tree.schoolClass.id } })
    const admin = await createUser({ role: "ADMIN" })
    await loginAs(admin)

    expect((await json(await adminRequests())).requests).toHaveLength(1)
    const res = await decideRequest(jsonReq("/x", { decision: "APPROVE" }, "PATCH"), params({ id: req.id }))
    expect((await json(res)).request).toMatchObject({ status: "APPROVED", reviewedById: admin.id })
    expect(vi.mocked(resend.emails.send)).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }))
    expect((await decideRequest(jsonReq("/x", { decision: "REJECT" }, "PATCH"), params({ id: req.id }))).status).toBe(409)
  })

  it("admin grants subject-level permissions, de-dupes, revokes and restores", async () => {
    const tree = await createAcademicTree()
    const user = await createUser()
    await loginAs(await createUser({ role: "ADMIN" }))
    const grant = () => grantPermission(jsonReq("/x", { userId: user.id, classSubjectId: tree.classSubject.id }))

    const created = await json(await grant())
    expect((await grant()).status).toBe(409)

    await togglePermission(jsonReq("/x", { isActive: false }, "PATCH"), params({ id: created.permission.id }))
    const restored = await grant()
    expect(restored.status).toBe(200)
    expect((await json(restored)).message).toBe("Access restored")
    expect(await prisma.contributorPermission.count()).toBe(1)

    expect((await json(await listPermissions(jsonReq(`/x?userId=${user.id}`)))).permissions).toHaveLength(1)
    expect((await listPermissions(jsonReq("/x"))).status).toBe(400)
    expect(
      (await grantPermission(jsonReq("/x", { userId: user.id, classSubjectId: "a", programSubjectId: "b" }))).status
    ).toBe(400)
  })
})

describe("contributor uploads — POST /api/contributor/upload", () => {
  it("rejects uploads without a permission for that subject", async () => {
    const tree = await createAcademicTree()
    await loginAs(await createUser())
    const res = await uploadMaterial(
      formReq("/x", uploadForm({ title: "Notes", programSubjectId: tree.programSubject.id, ownershipConfirmed: "true" }))
    )
    expect(res.status).toBe(403)
  })

  it("validates title, type, subject choice, ownership and file type", async () => {
    const { programSubject } = await contributorWithAccess()
    const base = { title: "Notes", programSubjectId: programSubject.id, ownershipConfirmed: "true" }
    const send = (f: Record<string, string>, file: File | null = pdf()) => uploadMaterial(formReq("/x", uploadForm(f, file)))

    expect((await send({ ...base, title: "" })).status).toBe(400)
    expect((await send({ ...base, type: "VIDEO" })).status).toBe(400)
    expect((await send({ ...base, classSubjectId: "x" })).status).toBe(400)
    expect((await send({ ...base, ownershipConfirmed: "false" })).status).toBe(400)
    expect((await send(base, null)).status).toBe(400)
    expect((await send(base, new File(["x"], "a.txt", { type: "text/plain" }))).status).toBe(400)
  })

  it("creates a PENDING material with a SHA-256 hash and counts toward the daily limit", async () => {
    const { user, programSubject } = await contributorWithAccess()
    const res = await uploadMaterial(
      formReq("/x", uploadForm({ title: "Unit 1 Notes", programSubjectId: programSubject.id, ownershipConfirmed: "true" }))
    )
    expect(res.status).toBe(201)
    const { material } = await json(res)
    expect(material).toMatchObject({ status: "PENDING", accessType: "FREE", fileType: "PDF", uploadedById: user.id })
    expect(material.fileHash).toMatch(/^[0-9a-f]{64}$/)
    expect(material.fileUrl).toContain("study-materials")

    const today = new Date().toISOString().slice(0, 10)
    expect(await redis.get(`contributor-upload:${user.id}:${today}`)).toBe("1")
    expect((await json(await myMaterials())).materials).toHaveLength(1)
  })

  it("enforces 5 new uploads per day", async () => {
    const { user, programSubject } = await contributorWithAccess()
    const today = new Date().toISOString().slice(0, 10)
    await redis.set(`contributor-upload:${user.id}:${today}`, "5")
    const res = await uploadMaterial(
      formReq("/x", uploadForm({ title: "Notes", programSubjectId: programSubject.id, ownershipConfirmed: "true" }))
    )
    expect(res.status).toBe(429)
  })

  it("records a chapter suggestion and rejects a chapter from another subject", async () => {
    const { programSubject } = await contributorWithAccess()
    await uploadMaterial(
      formReq(
        "/x",
        uploadForm({ title: "N", programSubjectId: programSubject.id, ownershipConfirmed: "true", suggestedChapterTitle: "Ch 9" })
      )
    )
    expect((await prisma.chapterSuggestion.findFirstOrThrow()).title).toBe("Ch 9")

    const otherSubject = await prisma.subject.create({ data: { name: "Other", slug: "other" } })
    const foreign = await prisma.chapter.create({ data: { subjectId: otherSubject.id, title: "X" } })
    const res = await uploadMaterial(
      formReq("/x", uploadForm({ title: "N", programSubjectId: programSubject.id, ownershipConfirmed: "true", chapterId: foreign.id }))
    )
    expect(res.status).toBe(400)
  })

  it("resubmission only works for the owner's REJECTED/CHANGES_REQUESTED material and skips the daily cap", async () => {
    const { user, programSubject } = await contributorWithAccess()
    const today = new Date().toISOString().slice(0, 10)
    await redis.set(`contributor-upload:${user.id}:${today}`, "5")
    const approved = await createMaterial(user.id, { status: "APPROVED", programSubjectId: programSubject.id })
    const needsWork = await createMaterial(user.id, { status: "CHANGES_REQUESTED", programSubjectId: programSubject.id })
    const fields = (id: string) => ({ title: "Fixed", programSubjectId: programSubject.id, ownershipConfirmed: "true", resubmitMaterialId: id })

    expect((await uploadMaterial(formReq("/x", uploadForm(fields(approved.id))))).status).toBe(409)
    const res = await uploadMaterial(formReq("/x", uploadForm(fields(needsWork.id))))
    expect(res.status).toBe(200)
    expect((await prisma.studyMaterial.findUniqueOrThrow({ where: { id: needsWork.id } })).status).toBe("PENDING")
  })
})

describe("admin review queue — /api/admin/study-review", () => {
  it("lists PENDING + CHANGES_REQUESTED oldest first and flags duplicate file hashes", async () => {
    const { programSubject } = await createAcademicTree()
    const u = await createUser()
    await createMaterial(u.id, { programSubjectId: programSubject.id, fileHash: "same" })
    await createMaterial(u.id, { programSubjectId: programSubject.id, fileHash: "same", status: "APPROVED" })
    await createMaterial(u.id, { programSubjectId: programSubject.id, fileHash: "unique", status: "CHANGES_REQUESTED" })
    await loginAs(await createUser({ role: "ADMIN" }))

    const { materials } = await json(await reviewQueue(jsonReq("/x")))
    expect(materials).toHaveLength(2)
    expect(materials.find((m: { fileHash: string }) => m.fileHash === "same").possibleDuplicate).toBe(true)
    expect(materials.find((m: { fileHash: string }) => m.fileHash === "unique").possibleDuplicate).toBe(false)
  })

  it("APPROVE awards the contribution reward exactly once and emails the contributor", async () => {
    const { programSubject } = await createAcademicTree()
    const contributor = await createUser()
    const material = await createMaterial(contributor.id, { programSubjectId: programSubject.id })
    await loginAs(await createUser({ role: "ADMIN" }))
    const decide = (body: object) => reviewMaterial(jsonReq("/x", body, "PATCH"), params({ id: material.id }))

    const body = await json(await decide({ decision: "APPROVE" }))
    expect(body.creditsAwarded).toBe(5)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: contributor.id } })).creditBalance).toBe(5)
    expect(await prisma.creditTransaction.findFirstOrThrow()).toMatchObject({ type: "CONTRIBUTION_REWARD", referenceId: material.id })
    expect(vi.mocked(resend.emails.send)).toHaveBeenCalled()

    expect((await decide({ decision: "APPROVE" })).status).toBe(409)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: contributor.id } })).creditBalance).toBe(5)
  })

  it("REQUEST_CHANGES needs a note; REJECT gives no credits", async () => {
    const { programSubject } = await createAcademicTree()
    const contributor = await createUser()
    const m1 = await createMaterial(contributor.id, { programSubjectId: programSubject.id })
    const m2 = await createMaterial(contributor.id, { programSubjectId: programSubject.id })
    await loginAs(await createUser({ role: "ADMIN" }))

    expect((await reviewMaterial(jsonReq("/x", { decision: "REQUEST_CHANGES" }, "PATCH"), params({ id: m1.id }))).status).toBe(400)
    await reviewMaterial(jsonReq("/x", { decision: "REQUEST_CHANGES", reviewNote: "Blurry" }, "PATCH"), params({ id: m1.id }))
    expect((await prisma.studyMaterial.findUniqueOrThrow({ where: { id: m1.id } })).reviewNote).toBe("Blurry")

    await reviewMaterial(jsonReq("/x", { decision: "REJECT" }, "PATCH"), params({ id: m2.id }))
    expect((await prisma.user.findUniqueOrThrow({ where: { id: contributor.id } })).creditBalance).toBe(0)
  })

  it("admins can publish directly (APPROVED, no queue)", async () => {
    const { programSubject } = await createAcademicTree()
    await loginAs(await createUser({ role: "ADMIN" }))
    const res = await adminPublish(formReq("/x", uploadForm({ title: "Official", programSubjectId: programSubject.id })))
    expect(res.status).toBe(201)
    expect((await json(res)).material.status).toBe("APPROVED")
    expect((await adminPublish(formReq("/x", uploadForm({ title: "x", programSubjectId: "missing" })))).status).toBe(404)
  })
})

describe("post-publish reports", () => {
  it("users report; admin UNPUBLISHes or DISMISSes once", async () => {
    const { programSubject } = await createAcademicTree()
    const contributor = await createUser()
    const material = await createMaterial(contributor.id, { programSubjectId: programSubject.id, status: "APPROVED" })
    await loginAs(await createUser())
    expect((await reportMaterial(jsonReq("/x", { studyMaterialId: material.id, reason: "bad" }))).status).toBe(400)
    expect((await reportMaterial(jsonReq("/x", { studyMaterialId: "missing", reason: "Wrong subject" }))).status).toBe(404)
    await reportMaterial(jsonReq("/x", { studyMaterialId: material.id, reason: "Wrong subject" }))
    await reportMaterial(jsonReq("/x", { studyMaterialId: material.id, reason: "Copyrighted" }))

    await loginAs(await createUser({ role: "ADMIN" }))
    const { reports } = await json(await listReports())
    expect(reports).toHaveLength(2)

    await resolveReport(jsonReq("/x", { action: "UNPUBLISH" }, "PATCH"), params({ id: reports[0].id }))
    expect((await prisma.studyMaterial.findUniqueOrThrow({ where: { id: material.id } })).status).toBe("UNPUBLISHED")
    expect((await resolveReport(jsonReq("/x", { action: "DISMISS" }, "PATCH"), params({ id: reports[0].id }))).status).toBe(409)

    await resolveReport(jsonReq("/x", { action: "DISMISS" }, "PATCH"), params({ id: reports[1].id }))
    expect((await json(await listReports())).reports).toHaveLength(0)
  })
})

describe("chapter suggestions", () => {
  it("approving creates a real chapter at the end of the list; reviewed suggestions are locked", async () => {
    const { subject } = await createAcademicTree()
    const contributor = await createUser()
    await prisma.chapter.create({ data: { subjectId: subject.id, title: "Existing", sortOrder: 0 } })
    const s1 = await prisma.chapterSuggestion.create({ data: { subjectId: subject.id, suggestedById: contributor.id, title: "New Ch" } })
    const s2 = await prisma.chapterSuggestion.create({ data: { subjectId: subject.id, suggestedById: contributor.id, title: "Nope" } })
    await loginAs(await createUser({ role: "ADMIN" }))

    expect((await json(await listSuggestions(jsonReq("/x")))).suggestions).toHaveLength(2)
    const body = await json(await decideSuggestion(jsonReq("/x", { decision: "APPROVE" }, "PATCH"), params({ id: s1.id })))
    expect(body.chapter).toMatchObject({ title: "New Ch", sortOrder: 1, subjectId: subject.id })
    expect(body.updatedSuggestion).toMatchObject({ status: "APPROVED", chapterId: body.chapter.id })

    await decideSuggestion(jsonReq("/x", { decision: "REJECT" }, "PATCH"), params({ id: s2.id }))
    expect((await decideSuggestion(jsonReq("/x", { decision: "APPROVE" }, "PATCH"), params({ id: s2.id }))).status).toBe(409)
    expect(await prisma.chapter.count()).toBe(2)
  })
})
