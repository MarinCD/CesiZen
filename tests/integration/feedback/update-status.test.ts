import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/rateLimit", () => ({ clientIp: vi.fn(() => "127.0.0.1") }))
vi.mock("@/lib/services/retourUtilisateurService", () => ({
  updateStatutRetourUtilisateur: vi.fn(),
}))

import { PATCH } from "@/app/api/retours-utilisateur/[id]/route"
import { getServerSession } from "next-auth"
import { updateStatutRetourUtilisateur } from "@/lib/services/retourUtilisateurService"

const mockSession = vi.mocked(getServerSession)
const mockUpdate = vi.mocked(updateStatutRetourUtilisateur)

const request = (body: unknown) =>
  new NextRequest("http://localhost:3000/api/retours-utilisateur/12", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

const context = (id = "12") => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdate.mockResolvedValue({ id: 12, statut: "EN_COURS" } as never)
})

describe("PATCH /api/retours-utilisateur/[id]", () => {
  it("refuse une personne non connectée", async () => {
    mockSession.mockResolvedValue(null as never)
    const response = await PATCH(request({ statut: "EN_COURS" }), context())
    expect(response.status).toBe(403)
  })

  it("refuse un utilisateur non administrateur", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as never)
    const response = await PATCH(request({ statut: "EN_COURS" }), context())
    expect(response.status).toBe(403)
  })

  it("refuse un identifiant invalide", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as never)
    const response = await PATCH(request({ statut: "EN_COURS" }), context("abc"))
    expect(response.status).toBe(400)
  })

  it("refuse un statut invalide", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as never)
    const response = await PATCH(request({ statut: "ARCHIVE" }), context())
    expect(response.status).toBe(400)
  })

  it("permet à un administrateur de changer le statut", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as never)
    const response = await PATCH(request({ statut: "EN_COURS" }), context())

    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(12, "EN_COURS")
  })

  it("retourne 404 si le retour n'existe plus", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as never)
    mockUpdate.mockRejectedValue({ code: "P2025" })
    const response = await PATCH(request({ statut: "TRAITE" }), context())
    expect(response.status).toBe(404)
  })
})
