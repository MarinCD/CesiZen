import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/services/userService", () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}))
vi.mock("@/lib/prisma", () => ({
  prisma: { utilisateur: { findUnique: vi.fn() } },
}))
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn() } }))

import { DELETE } from "@/app/api/utilisateurs/[id]/route"
import { getServerSession } from "next-auth"
import { deleteUser } from "@/lib/services/userService"

const mockSession = vi.mocked(getServerSession)
const mockDel = vi.mocked(deleteUser)

const req = () =>
  new NextRequest("http://localhost:3000/api/utilisateurs/42", { method: "DELETE" })

beforeEach(() => vi.clearAllMocks())

describe("DELETE /api/utilisateurs/[id] — droit à l'effacement (RGPD art. 17)", () => {
  it("refuse 401 sans session", async () => {
    mockSession.mockResolvedValue(null as any)
    const res = await DELETE(req(), { params: { id: "42" } })
    expect(res.status).toBe(401)
  })

  it("refuse 403 si tentative de suppression d'un autre compte", async () => {
    mockSession.mockResolvedValue({ user: { id: "5", role: "UTILISATEUR" } } as any)
    const res = await DELETE(req(), { params: { id: "42" } })
    expect(res.status).toBe(403)
    expect(mockDel).not.toHaveBeenCalled()
  })

  it("autorise la suppression de son propre compte (200)", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockDel.mockResolvedValue({} as any)
    const res = await DELETE(req(), { params: { id: "42" } })
    expect(res.status).toBe(200)
    expect(mockDel).toHaveBeenCalledWith(42)
  })

  it("un admin peut supprimer n'importe quel compte", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    mockDel.mockResolvedValue({} as any)
    const res = await DELETE(req(), { params: { id: "42" } })
    expect(res.status).toBe(200)
  })

  it("retourne 500 si la BDD échoue", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockDel.mockRejectedValue(new Error("DB error"))
    const res = await DELETE(req(), { params: { id: "42" } })
    expect(res.status).toBe(500)
  })
})
