import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/services/informationService", () => ({
  getInformations: vi.fn(),
  createInformation: vi.fn(),
}))

import { POST } from "@/app/api/informations/route"
import { getServerSession } from "next-auth"
import { createInformation } from "@/lib/services/informationService"

const mockSession = vi.mocked(getServerSession)
const mockCreate = vi.mocked(createInformation)

const req = (body: any) =>
  new NextRequest("http://localhost:3000/api/informations", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })

const valid = {
  titre: "Gestion du stress au travail",
  texte: "Article informatif sur le bien-être en milieu professionnel.",
  categorie: "Stress",
}

beforeEach(() => vi.clearAllMocks())

describe("POST /api/informations", () => {
  it("refuse 403 sans session", async () => {
    mockSession.mockResolvedValue(null as any)
    const res = await POST(req(valid))
    expect(res.status).toBe(403)
  })

  it("refuse 403 si non admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "5", role: "UTILISATEUR" } } as any)
    const res = await POST(req(valid))
    expect(res.status).toBe(403)
  })

  it("crée l'article pour un admin (201)", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    mockCreate.mockResolvedValue({ id: 1, ...valid } as any)
    const res = await POST(req(valid))
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ idCreateur: 1 }))
  })

  it("refuse 400 si titre trop court", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    const res = await POST(req({ ...valid, titre: "X" }))
    expect(res.status).toBe(400)
  })

  it("refuse 400 si texte trop court", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    const res = await POST(req({ ...valid, texte: "court" }))
    expect(res.status).toBe(400)
  })
})
