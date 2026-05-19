import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// CT-IT-012 adapté : GET /api/informations (public, pas de filtre publié dans ce schéma)
vi.mock("@/lib/services/informationService", () => ({
  getInformations: vi.fn(),
  createInformation: vi.fn(),
}))
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

import { GET, POST } from "@/app/api/informations/route"
import { getInformations, createInformation } from "@/lib/services/informationService"
import { getServerSession } from "next-auth"

const mockGetInformations = vi.mocked(getInformations)
const mockCreateInformation = vi.mocked(createInformation)
const mockGetServerSession = vi.mocked(getServerSession)

const makeReq = (url = "http://localhost:3000/api/informations", init?: RequestInit) =>
  new NextRequest(url, init)

beforeEach(() => vi.clearAllMocks())

describe("GET /api/informations", () => {
  it("CT-IT-012 — retourne HTTP 200 avec la liste des articles (public)", async () => {
    mockGetInformations.mockResolvedValue({
      items: [{ id: 1, titre: "Stress", texte: "..." }] as any,
      total: 1,
      pages: 1,
    })

    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.items).toHaveLength(1)
    expect(data.total).toBe(1)
  })

  it("transmet les paramètres search et categorie au service", async () => {
    mockGetInformations.mockResolvedValue({ items: [], total: 0, pages: 0 })
    await GET(makeReq("http://localhost:3000/api/informations?search=stress&categorie=Bien-être"))
    expect(mockGetInformations).toHaveBeenCalledWith(
      expect.objectContaining({ search: "stress", categorie: "Bien-être" })
    )
  })
})

describe("POST /api/informations", () => {
  it("CT-IT-015 — retourne 403 si l'utilisateur n'est pas ADMINISTRATEUR", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { role: "UTILISATEUR", id: "2" },
    } as any)

    const req = makeReq("http://localhost:3000/api/informations", {
      method: "POST",
      body: JSON.stringify({ titre: "Test", texte: "Contenu suffisamment long" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it("CT-IT-014 — crée un article et retourne 201 si admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { role: "ADMINISTRATEUR", id: "1" },
    } as any)
    mockCreateInformation.mockResolvedValue({ id: 5, titre: "Stress", texte: "..." } as any)

    const req = makeReq("http://localhost:3000/api/informations", {
      method: "POST",
      body: JSON.stringify({
        titre: "Stress au travail",
        texte: "Le stress chronique nuit à la santé.",
      }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(mockCreateInformation).toHaveBeenCalledOnce()
  })

  it("retourne 400 si le payload est invalide", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { role: "ADMINISTRATEUR", id: "1" },
    } as any)

    const req = makeReq("http://localhost:3000/api/informations", {
      method: "POST",
      body: JSON.stringify({ titre: "Ab", texte: "Court" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
