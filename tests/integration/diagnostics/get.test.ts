import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/services/diagnosticService", () => ({
  getFirstDiagnostic: vi.fn(),
  submitDiagnostic: vi.fn(),
  interpreterScore: vi.fn((score: number) => (score > 150 ? "Stress élevé" : "Stress modéré")),
}))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    question: { findMany: vi.fn() },
    resultatDiagnostic: { create: vi.fn() },
  },
}))
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

import { GET, POST } from "@/app/api/diagnostics/route"
import { getFirstDiagnostic, submitDiagnostic, interpreterScore } from "@/lib/services/diagnosticService"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

const mockGetFirstDiagnostic = vi.mocked(getFirstDiagnostic)
const mockGetServerSession = vi.mocked(getServerSession)
const mockFindMany = vi.mocked(prisma.question.findMany)

beforeEach(() => vi.clearAllMocks())

describe("GET /api/diagnostics", () => {
  it("retourne 200 avec le diagnostic disponible", async () => {
    mockGetFirstDiagnostic.mockResolvedValue({ id: 1, nom: "Holmes & Rahe" } as any)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.nom).toBe("Holmes & Rahe")
  })

  it("retourne 404 si aucun diagnostic en base", async () => {
    mockGetFirstDiagnostic.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(404)
  })
})

describe("POST /api/diagnostics", () => {
  it("calcule le score et retourne saved:false pour un visiteur anonyme", async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockFindMany.mockResolvedValue([{ pointsAssocies: 50 }, { pointsAssocies: 100 }] as any)

    const req = new NextRequest("http://localhost:3000/api/diagnostics", {
      method: "POST",
      body: JSON.stringify({ diagnosticId: 1, questionIds: [1, 2] }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.score).toBe(150)
    expect(data.saved).toBe(false)
  })

  it("retourne 400 si questionIds est vide", async () => {
    const req = new NextRequest("http://localhost:3000/api/diagnostics", {
      method: "POST",
      body: JSON.stringify({ diagnosticId: 1, questionIds: [] }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
