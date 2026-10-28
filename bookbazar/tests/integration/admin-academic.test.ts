import { describe, it, expect, beforeEach } from "vitest"
import { resetDb, prisma, createUser, createAcademicTree, createMaterial } from "../helpers/db"
import { loginAs } from "../helpers/auth"
import { jsonReq, params, json } from "../helpers/http"
import { GET as listUnis, POST as createUni } from "@/app/api/admin/universities/route"
import { PATCH as patchUni, DELETE as deleteUni } from "@/app/api/admin/universities/[id]/route"
import { GET as listPrograms, POST as createProgram } from "@/app/api/admin/programs/route"
import { PATCH as patchProgram, DELETE as deleteProgram } from "@/app/api/admin/programs/[id]/route"
import { GET as listSemesters, POST as createSemester } from "@/app/api/admin/semesters/route"
import { PATCH as patchSemester, DELETE as deleteSemester } from "@/app/api/admin/semesters/[id]/route"
import { GET as listSubjects, POST as createSubject } from "@/app/api/admin/subjects/route"
import { PATCH as patchSubject, DELETE as deleteSubject } from "@/app/api/admin/subjects/[id]/route"
import { GET as listStreams, POST as createStream } from "@/app/api/admin/streams/route"
import { PATCH as patchStream, DELETE as deleteStream } from "@/app/api/admin/streams/[id]/route"
import { GET as listClasses } from "@/app/api/admin/school-classes/route"
import { PATCH as patchClass } from "@/app/api/admin/school-classes/[id]/route"
import { GET as listClassSubjects, POST as assignClassSubject } from "@/app/api/admin/class-subjects/route"
import { DELETE as deleteClassSubject } from "@/app/api/admin/class-subjects/[id]/route"
import { GET as listProgramSubjects, POST as assignProgramSubject } from "@/app/api/admin/program-subjects/route"
import { DELETE as deleteProgramSubject } from "@/app/api/admin/program-subjects/[id]/route"
import { GET as listChapters, POST as createChapter } from "@/app/api/admin/chapters/route"
import { PATCH as patchChapter, DELETE as deleteChapter } from "@/app/api/admin/chapters/[id]/route"

beforeEach(async () => {
  await resetDb()
  await loginAs(await createUser({ role: "ADMIN" }))
})

const id = (x: string) => params({ id: x })

describe("Academic Management is admin-only", () => {
  it.each([
    ["universities", () => listUnis()],
    ["programs", () => listPrograms(jsonReq("/x"))],
    ["semesters", () => listSemesters(jsonReq("/x"))],
    ["subjects", () => listSubjects()],
    ["streams", () => listStreams()],
    ["school-classes", () => listClasses()],
    ["class-subjects", () => listClassSubjects(jsonReq("/x"))],
    ["program-subjects", () => listProgramSubjects(jsonReq("/x"))],
    ["chapters", () => listChapters(jsonReq("/x"))],
  ] as const)("%s rejects buyers", async (_n, call) => {
    await loginAs(await createUser())
    expect((await call()).status).toBe(403)
  })
})

describe("universities → programs → semesters", () => {
  it("creates with generated slugs and blocks duplicates", async () => {
    const uni = (await json(await createUni(jsonReq("/x", { name: "Tribhuvan University" })))).university
    expect(uni.slug).toBe("tribhuvan-university")
    expect((await createUni(jsonReq("/x", { name: "Tribhuvan University" }))).status).toBe(409)

    const program = (await json(await createProgram(jsonReq("/x", { universityId: uni.id, name: "BSc CSIT" })))).program
    expect(program).toMatchObject({ slug: "bsc-csit", totalSemesters: 8 })
    expect((await createProgram(jsonReq("/x", { universityId: uni.id, name: "BSc CSIT" }))).status).toBe(409)
    expect((await createProgram(jsonReq("/x", { universityId: "missing", name: "X Y" }))).status).toBe(404)

    const sem = (await json(await createSemester(jsonReq("/x", { programId: program.id, number: 3 })))).semester
    expect(sem.label).toBe("Semester 3")
    expect((await createSemester(jsonReq("/x", { programId: program.id, number: 3 }))).status).toBe(409)

    expect((await json(await listPrograms(jsonReq(`/x?universityId=${uni.id}`)))).programs).toHaveLength(1)
    expect((await json(await listSemesters(jsonReq(`/x?programId=${program.id}`)))).semesters).toHaveLength(1)
  })

  it("patches names/flags", async () => {
    const { university, program, semester } = await createAcademicTree()
    expect((await json(await patchUni(jsonReq("/x", { isActive: false }, "PATCH"), id(university.id)))).university.isActive).toBe(false)
    expect((await json(await patchProgram(jsonReq("/x", { totalSemesters: 6 }, "PATCH"), id(program.id)))).program.totalSemesters).toBe(6)
    expect((await json(await patchSemester(jsonReq("/x", { label: "Year 1" }, "PATCH"), id(semester.id)))).semester.label).toBe("Year 1")
    expect((await patchProgram(jsonReq("/x", { totalSemesters: 99 }, "PATCH"), id(program.id))).status).toBe(400)
  })

  it("refuses to delete anything that still has study materials under it", async () => {
    const { university, program, semester, programSubject } = await createAcademicTree()
    const u = await createUser()
    await createMaterial(u.id, { programSubjectId: programSubject.id })

    expect((await deleteUni(jsonReq("/x"), id(university.id))).status).toBe(409)
    expect((await deleteProgram(jsonReq("/x"), id(program.id))).status).toBe(409)
    expect((await deleteSemester(jsonReq("/x"), id(semester.id))).status).toBe(409)
    expect((await deleteProgramSubject(jsonReq("/x"), id(programSubject.id))).status).toBe(409)

    await prisma.studyMaterial.deleteMany()
    expect((await deleteUni(jsonReq("/x"), id(university.id))).status).toBe(200)
    expect(await prisma.program.count()).toBe(0) // cascades
  })
})

describe("subjects and streams", () => {
  it("subjects are shared and de-duplicated by slug; assigned subjects can't be deleted", async () => {
    const created = (await json(await createSubject(jsonReq("/x", { name: "Computer Science" })))).subject
    expect((await createSubject(jsonReq("/x", { name: "computer science" }))).status).toBe(409)
    expect((await json(await patchSubject(jsonReq("/x", { name: "CS" }, "PATCH"), id(created.id)))).subject.name).toBe("CS")

    const { subject } = await createAcademicTree()
    expect((await deleteSubject(jsonReq("/x"), id(subject.id))).status).toBe(409)
    expect((await deleteSubject(jsonReq("/x"), id(created.id))).status).toBe(200)
  })

  it("streams: create, duplicate 409, delete blocked while in use", async () => {
    const stream = (await json(await createStream(jsonReq("/x", { name: "Science" })))).stream
    expect((await createStream(jsonReq("/x", { name: "Science" }))).status).toBe(409)
    await patchStream(jsonReq("/x", { isActive: false }, "PATCH"), id(stream.id))

    const sc = await prisma.schoolClass.create({ data: { level: 11, name: "Class 11", hasStreams: true } })
    const subj = await prisma.subject.create({ data: { name: "Physics", slug: "physics" } })
    await prisma.classSubject.create({ data: { schoolClassId: sc.id, subjectId: subj.id, streamId: stream.id } })
    expect((await deleteStream(jsonReq("/x"), id(stream.id))).status).toBe(409)
  })
})

describe("school classes and class subjects", () => {
  it("classes can be renamed/toggled", async () => {
    const sc = await prisma.schoolClass.create({ data: { level: 5, name: "Class 5" } })
    expect((await json(await patchClass(jsonReq("/x", { name: "Grade 5" }, "PATCH"), id(sc.id)))).schoolClass.name).toBe("Grade 5")
    expect((await json(await listClasses())).schoolClasses).toHaveLength(1)
  })

  it("11-12 require a stream, 1-10 forbid one, and null-stream duplicates are caught", async () => {
    const c10 = await prisma.schoolClass.create({ data: { level: 10, name: "Class 10" } })
    const c11 = await prisma.schoolClass.create({ data: { level: 11, name: "Class 11", hasStreams: true } })
    const stream = await prisma.stream.create({ data: { name: "Science", slug: "science" } })
    const subj = await prisma.subject.create({ data: { name: "Maths", slug: "maths" } })
    const assign = (body: object) => assignClassSubject(jsonReq("/x", body))

    expect((await assign({ schoolClassId: c11.id, subjectId: subj.id })).status).toBe(400)
    expect((await assign({ schoolClassId: c10.id, subjectId: subj.id, streamId: stream.id })).status).toBe(400)
    expect((await assign({ schoolClassId: c10.id, subjectId: subj.id })).status).toBe(201)
    expect((await assign({ schoolClassId: c10.id, subjectId: subj.id })).status).toBe(409)
    expect((await assign({ schoolClassId: c11.id, subjectId: subj.id, streamId: stream.id })).status).toBe(201)
    expect((await json(await listClassSubjects(jsonReq(`/x?schoolClassId=${c10.id}`)))).classSubjects).toHaveLength(1)
  })

  it("class-subject delete is blocked by materials", async () => {
    const { classSubject } = await createAcademicTree()
    await createMaterial((await createUser()).id, { classSubjectId: classSubject.id })
    expect((await deleteClassSubject(jsonReq("/x"), id(classSubject.id))).status).toBe(409)
  })

  it("program subjects: assign once per semester", async () => {
    const { semester } = await createAcademicTree()
    const subj = await prisma.subject.create({ data: { name: "DBMS", slug: "dbms" } })
    expect((await assignProgramSubject(jsonReq("/x", { semesterId: semester.id, subjectId: subj.id }))).status).toBe(201)
    expect((await assignProgramSubject(jsonReq("/x", { semesterId: semester.id, subjectId: subj.id }))).status).toBe(409)
    expect((await assignProgramSubject(jsonReq("/x", { semesterId: "missing", subjectId: subj.id }))).status).toBe(404)
  })
})

describe("chapters", () => {
  it("CRUD; deleting a chapter leaves its materials chapterless", async () => {
    const { subject, programSubject } = await createAcademicTree()
    const chapter = (await json(await createChapter(jsonReq("/x", { subjectId: subject.id, title: "Intro" })))).chapter
    expect((await createChapter(jsonReq("/x", { subjectId: "missing", title: "X" }))).status).toBe(404)
    expect((await json(await patchChapter(jsonReq("/x", { sortOrder: 3 }, "PATCH"), id(chapter.id)))).chapter.sortOrder).toBe(3)

    const material = await createMaterial((await createUser()).id, { programSubjectId: programSubject.id })
    await prisma.studyMaterial.update({ where: { id: material.id }, data: { chapterId: chapter.id } })
    expect((await json(await listChapters(jsonReq(`/x?subjectId=${subject.id}`)))).chapters[0]._count.studyMaterials).toBe(1)

    await deleteChapter(jsonReq("/x"), id(chapter.id))
    expect((await prisma.studyMaterial.findUniqueOrThrow({ where: { id: material.id } })).chapterId).toBeNull()
    expect((await deleteChapter(jsonReq("/x"), id(chapter.id))).status).toBe(404)
  })
})
