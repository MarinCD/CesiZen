import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/services/informationService", () => ({
  getInformations: vi.fn(),
  getInformationById: vi.fn(),
  createInformation: vi.fn(),
  updateInformation: vi.fn(),
  deleteInformation: vi.fn(),
}))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/rateLimit", () => ({ clientIp: vi.fn(() => "203.0.113.7") }))

import { GET as LIST } from "@/app/api/informations/route"
import { GET as DETAIL } from "@/app/api/informations/[id]/route"
import { getInformations, getInformationById } from "@/lib/services/informationService"

const mockList = vi.mocked(getInformations)
const mockDetail = vi.mocked(getInformationById)

const listReq = (query: string) =>
  new NextRequest(`http://localhost:3000/api/informations${query}`)

beforeEach(() => {
  vi.clearAllMocks()
  mockList.mockResolvedValue({ items: [], total: 0, pages: 0 } as any)
  mockDetail.mockResolvedValue({ id: 1 } as any)
})

describe("Validation des paramètres publics", () => {
  it("répond 400 sur une page non numérique au lieu de planter", async () => {
    const res = await LIST(listReq("?page=abc"))
    expect(res.status).toBe(400)
    expect(mockList).not.toHaveBeenCalled()
  })

  it("répond 400 sur une page négative", async () => {
    const res = await LIST(listReq("?page=-5"))
    expect(res.status).toBe(400)
  })

  it("accepte une page valide", async () => {
    const res = await LIST(listReq("?page=2"))
    expect(res.status).toBe(200)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
  })

  it("répond 400 sur un identifiant d'article non numérique", async () => {
    const res = await DETAIL(new NextRequest("http://localhost:3000/api/informations/abc"), {
      params: Promise.resolve({ id: "abc" }),
    })
    expect(res.status).toBe(400)
    expect(mockDetail).not.toHaveBeenCalled()
  })

  it("sert un article existant sur un identifiant valide", async () => {
    const res = await DETAIL(new NextRequest("http://localhost:3000/api/informations/1"), {
      params: Promise.resolve({ id: "1" }),
    })
    expect(res.status).toBe(200)
    expect(mockDetail).toHaveBeenCalledWith(1)
  })
})
