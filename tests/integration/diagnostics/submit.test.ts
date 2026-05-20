import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/rateLimit", () => ({ rateLimit: vi.fn() }))
vi.mock("@/lib/services/diagnosticService", () => ({
  getFirstDiagnostic: vi.fn(),
  submitDiagnostic: vi.fn(),
  interpreterScore: vi.fn((s: number) => (s < 150 ? "FAIBLE" : s < 300 ? "MODERE" : "ELEVE")),
}))
vi.mock("@/lib/prisma", () => ({
  prisma: { question: { findMany: vi.fn() } },
}))

import { POST } from "@/app/api/diagnostics/route"
import { getServerSession } from "next-auth"
import { submitDiagnostic } from "@/lib/services/diagnosticService"
import { rateLimit } from "@/lib/rateLimit"
import { logAudit } from "@/lib/audit"
import { prisma } from "@/lib/prisma"

const mockSession = vi.mocked(getServerSession)
const mockSubmit = vi.mocked(submitDiagnostic)
const mockRl = vi.mocked(rateLimit)
const mockLog = vi.mocked(logAudit)
const mockQuestions = vi.mocked(prisma.question.findMany)

const req = (body: any) =>
  new NextRequest("http://localhost:3000/api/diagnostics", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })

beforeEach(() => {
  vi.clearAllMocks()
  mockRl.mockReturnValue(null)
})

describe("POST /api/diagnostics", () => {
  it("calcule le score et l'interprétation pour un visiteur (non sauvegardé)", async () => {
    mockSession.mockResolvedValue(null as any)
    mockQuestions.mockResolvedValue([{ pointsAssocies: 100 }, { pointsAssocies: 80 }] as any)

    const res = await POST(req({ diagnosticId: 1, questionIds: [1, 2] }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.score).toBe(180)
    expect(data.interpretation).toBe("MODERE")
    expect(data.saved).toBe(false)
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it("sauvegarde et audite pour un utilisateur connecté", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockQuestions.mockResolvedValue([{ pointsAssocies: 200 }, { pointsAssocies: 150 }] as any)
    mockSubmit.mockResolvedValue({ id: 1, score: 350, interpretation: "ELEVE" } as any)

    const res = await POST(req({ diagnosticId: 1, questionIds: [1, 2] }))
    expect(res.status).toBe(201)
    expect(mockSubmit).toHaveBeenCalled()
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "DIAGNOSTIC_SUBMIT", actorId: 42 })
    )
  })

  it("rejette 400 si questionIds vide", async () => {
    const res = await POST(req({ diagnosticId: 1, questionIds: [] }))
    expect(res.status).toBe(400)
  })

  it("rejette 400 si diagnosticId non positif", async () => {
    const res = await POST(req({ diagnosticId: 0, questionIds: [1] }))
    expect(res.status).toBe(400)
  })

  it("retourne 429 et log un RATE_LIMIT_HIT quand rate-limit", async () => {
    const blocked = new Response(JSON.stringify({ error: "Too many" }), { status: 429 }) as any
    mockRl.mockReturnValue(blocked)
    const res = await POST(req({ diagnosticId: 1, questionIds: [1] }))
    expect(res.status).toBe(429)
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "RATE_LIMIT_HIT", metadata: { route: "diagnostic" } })
    )
  })
})
