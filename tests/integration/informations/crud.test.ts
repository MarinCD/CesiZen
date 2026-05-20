import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/services/informationService", () => ({
  getInformationById: vi.fn(),
  updateInformation: vi.fn(),
  deleteInformation: vi.fn(),
}))

import { GET, PUT, DELETE } from "@/app/api/informations/[id]/route"
import { getServerSession } from "next-auth"
import {
  getInformationById,
  updateInformation,
  deleteInformation,
} from "@/lib/services/informationService"

const mockSession = vi.mocked(getServerSession)
const mockGet = vi.mocked(getInformationById)
const mockUpd = vi.mocked(updateInformation)
const mockDel = vi.mocked(deleteInformation)

const reqJson = (method: "PUT" | "DELETE", body?: any) =>
  new NextRequest("http://localhost:3000/api/informations/1", {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : {},
  })

const validBody = {
  titre: "Mon article",
  texte: "Contenu suffisamment long pour passer la validation",
  categorie: "Stress",
  datePublication: new Date().toISOString(),
}

beforeEach(() => vi.clearAllMocks())

describe("GET /api/informations/[id]", () => {
  it("retourne l'article", async () => {
    mockGet.mockResolvedValue({ id: 1, titre: "Test" } as any)
    const res = await GET(new NextRequest("http://localhost/x"), { params: { id: "1" } })
    expect(res.status).toBe(200)
  })

  it("retourne 404 si introuvable", async () => {
    mockGet.mockResolvedValue(null)
    const res = await GET(new NextRequest("http://localhost/x"), { params: { id: "999" } })
    expect(res.status).toBe(404)
  })
})

describe("PUT /api/informations/[id]", () => {
  it("refuse 403 si non admin", async () => {
    mockSession.mockResolvedValue({ user: { role: "UTILISATEUR" } } as any)
    const res = await PUT(reqJson("PUT", validBody), { params: { id: "1" } })
    expect(res.status).toBe(403)
  })

  it("autorise un admin (200)", async () => {
    mockSession.mockResolvedValue({ user: { role: "ADMINISTRATEUR" } } as any)
    mockUpd.mockResolvedValue({ id: 1, ...validBody } as any)
    const res = await PUT(reqJson("PUT", validBody), { params: { id: "1" } })
    expect(res.status).toBe(200)
    expect(mockUpd).toHaveBeenCalled()
  })

  it("refuse 400 si payload invalide", async () => {
    mockSession.mockResolvedValue({ user: { role: "ADMINISTRATEUR" } } as any)
    const res = await PUT(reqJson("PUT", { titre: "X" }), { params: { id: "1" } })
    expect(res.status).toBe(400)
  })
})

describe("DELETE /api/informations/[id]", () => {
  it("refuse 403 si non admin", async () => {
    mockSession.mockResolvedValue({ user: { role: "UTILISATEUR" } } as any)
    const res = await DELETE(reqJson("DELETE"), { params: { id: "1" } })
    expect(res.status).toBe(403)
  })

  it("supprime pour un admin (200)", async () => {
    mockSession.mockResolvedValue({ user: { role: "ADMINISTRATEUR" } } as any)
    mockDel.mockResolvedValue({} as any)
    const res = await DELETE(reqJson("DELETE"), { params: { id: "1" } })
    expect(res.status).toBe(200)
    expect(mockDel).toHaveBeenCalledWith(1)
  })

  it("refuse 403 sans session", async () => {
    mockSession.mockResolvedValue(null as any)
    const res = await DELETE(reqJson("DELETE"), { params: { id: "1" } })
    expect(res.status).toBe(403)
  })
})
