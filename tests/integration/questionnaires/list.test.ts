import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/services/diagnosticService", () => ({
  getQuestionnaires: vi.fn(),
  createQuestionnaire: vi.fn(),
}))

import { GET } from "@/app/api/questionnaires/route"
import { getQuestionnaires } from "@/lib/services/diagnosticService"

const mockList = vi.mocked(getQuestionnaires)

beforeEach(() => vi.clearAllMocks())

describe("GET /api/questionnaires", () => {
  it("renvoie la liste 200", async () => {
    mockList.mockResolvedValue([{ id: 1, titre: "Test" }] as any)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0].titre).toBe("Test")
  })

  it("renvoie un tableau vide si aucun questionnaire", async () => {
    mockList.mockResolvedValue([] as any)
    const res = await GET()
    const data = await res.json()
    expect(data).toEqual([])
  })
})
