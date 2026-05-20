import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/services/diagnosticService", () => ({
  getQuestionnaireById: vi.fn(),
}))

import { GET } from "@/app/api/questionnaires/[id]/route"
import { getQuestionnaireById } from "@/lib/services/diagnosticService"

const mockGet = vi.mocked(getQuestionnaireById)

const req = () => new NextRequest("http://localhost:3000/api/questionnaires/1")

beforeEach(() => vi.clearAllMocks())

describe("GET /api/questionnaires/[id]", () => {
  it("renvoie le questionnaire (200)", async () => {
    mockGet.mockResolvedValue({ id: 1, titre: "Stress" } as any)
    const res = await GET(req(), { params: { id: "1" } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe(1)
  })

  it("renvoie 404 si introuvable", async () => {
    mockGet.mockResolvedValue(null)
    const res = await GET(req(), { params: { id: "999" } })
    expect(res.status).toBe(404)
  })

  it("parse correctement l'id de l'URL", async () => {
    mockGet.mockResolvedValue({ id: 42, titre: "X" } as any)
    const res = await GET(req(), { params: { id: "42" } })
    expect(mockGet).toHaveBeenCalledWith(42)
    expect(res.status).toBe(200)
  })
})
