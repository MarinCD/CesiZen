import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/services/diagnosticService", () => ({
  getQuestionnaires: vi.fn(),
  createQuestionnaire: vi.fn(),
}))

import { POST } from "@/app/api/questionnaires/route"
import { getServerSession } from "next-auth"
import { createQuestionnaire } from "@/lib/services/diagnosticService"

const mockSession = vi.mocked(getServerSession)
const mockCreate = vi.mocked(createQuestionnaire)

const validPayload = {
  titre: "Echelle stress",
  diagnosticNom: "Holmes & Rahe",
  questions: [{ texte: "Question 1", pointsAssocies: 50 }],
}

const req = (body: any) =>
  new NextRequest("http://localhost:3000/api/questionnaires", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })

beforeEach(() => vi.clearAllMocks())

describe("POST /api/questionnaires", () => {
  it("refuse 403 si non admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "5", role: "UTILISATEUR" } } as any)
    const res = await POST(req(validPayload))
    expect(res.status).toBe(403)
  })

  it("refuse 403 sans session", async () => {
    mockSession.mockResolvedValue(null as any)
    const res = await POST(req(validPayload))
    expect(res.status).toBe(403)
  })

  it("crée le questionnaire pour un admin (201)", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    mockCreate.mockResolvedValue({ id: 99, titre: validPayload.titre } as any)
    const res = await POST(req(validPayload))
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalled()
    expect(mockCreate.mock.calls[0][0].idCreateur).toBe(1)
  })

  it("refuse 400 si titre trop court", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    const res = await POST(req({ ...validPayload, titre: "X" }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("refuse 400 si aucune question", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    const res = await POST(req({ ...validPayload, questions: [] }))
    expect(res.status).toBe(400)
  })

  it("accepte des questions avec réponses imbriquées", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    mockCreate.mockResolvedValue({ id: 1 } as any)
    const res = await POST(
      req({
        ...validPayload,
        questions: [
          {
            texte: "Avec réponses",
            pointsAssocies: 20,
            reponses: [{ texte: "Non", valeur: 0 }, { texte: "Oui", valeur: 10 }],
          },
        ],
      })
    )
    expect(res.status).toBe(201)
  })
})
