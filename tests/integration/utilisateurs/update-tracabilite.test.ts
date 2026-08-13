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
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/rateLimit", () => ({ clientIp: vi.fn(() => "203.0.113.7") }))

import { PUT, DELETE } from "@/app/api/utilisateurs/[id]/route"
import { getServerSession } from "next-auth"
import { updateUser, deleteUser } from "@/lib/services/userService"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcryptjs"

const mockSession = vi.mocked(getServerSession)
const mockUpdate = vi.mocked(updateUser)
const mockDelete = vi.mocked(deleteUser)
const mockFind = vi.mocked(prisma.utilisateur.findUnique)
const mockCompare = vi.mocked(bcrypt.compare)
const mockLog = vi.mocked(logAudit)

const reqBody = (body: object) =>
  new NextRequest("http://localhost:3000/api/utilisateurs/42", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })

const selfSession = { user: { id: "42", role: "UTILISATEUR" } }
const adminSession = { user: { id: "1", role: "ADMINISTRATEUR" } }

beforeEach(() => {
  vi.clearAllMocks()
  mockFind.mockResolvedValue({
    motDePasse: "hash-actuel",
    email: "cible@cesizen.fr",
    role: "UTILISATEUR",
  } as any)
  mockUpdate.mockResolvedValue({ id: 42 } as any)
})

describe("PUT /api/utilisateurs/[id] — changement d'email", () => {
  it("exige le mot de passe actuel pour changer sa propre adresse", async () => {
    mockSession.mockResolvedValue(selfSession as any)

    const res = await PUT(reqBody({ email: "nouvelle@cesizen.fr" }), { params: { id: "42" } })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/mot de passe actuel/i)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("accepte le changement d'email avec le bon mot de passe", async () => {
    mockSession.mockResolvedValue(selfSession as any)
    mockCompare.mockResolvedValue(true as any)

    const res = await PUT(
      reqBody({ email: "nouvelle@cesizen.fr", ancienMotDePasse: "Ancien1234!" }),
      { params: { id: "42" } }
    )
    expect(res.status).toBe(200)
  })

  it("n'exige rien si l'email est renvoyé inchangé", async () => {
    mockSession.mockResolvedValue(selfSession as any)

    const res = await PUT(reqBody({ email: "CIBLE@cesizen.fr", prenom: "Marin" }), {
      params: { id: "42" },
    })
    expect(res.status).toBe(200)
    expect(mockCompare).not.toHaveBeenCalled()
  })

  it("renvoie 409 si l'email est déjà utilisé", async () => {
    mockSession.mockResolvedValue(adminSession as any)
    mockUpdate.mockRejectedValue({ code: "P2002" })

    const res = await PUT(reqBody({ email: "pris@cesizen.fr" }), { params: { id: "42" } })
    expect(res.status).toBe(409)
  })

  it("renvoie 400 sur un identifiant non numérique", async () => {
    mockSession.mockResolvedValue(adminSession as any)

    const res = await PUT(reqBody({ prenom: "Marin" }), { params: { id: "abc" } })
    expect(res.status).toBe(400)
  })
})

describe("Traçabilité des actions d'administration", () => {
  it("journalise un changement de rôle avec l'ancien et le nouveau", async () => {
    mockSession.mockResolvedValue(adminSession as any)

    const res = await PUT(reqBody({ role: "ADMINISTRATEUR" }), { params: { id: "42" } })
    expect(res.status).toBe(200)

    const entry = mockLog.mock.calls[0][0]
    expect(entry.action).toBe("USER_ROLE_CHANGED")
    expect(entry.actorId).toBe(1)
    expect(entry.targetId).toBe(42)
    expect(entry.metadata).toMatchObject({
      ancienRole: "UTILISATEUR",
      nouveauRole: "ADMINISTRATEUR",
      parAdmin: true,
    })
  })

  it("journalise une modification sans exposer les valeurs saisies", async () => {
    mockSession.mockResolvedValue(selfSession as any)

    await PUT(reqBody({ prenom: "Marin", nom: "Coc" }), { params: { id: "42" } })

    const entry = mockLog.mock.calls[0][0]
    expect(entry.action).toBe("USER_UPDATED")
    expect(entry.metadata?.champs).toEqual(["nom", "prenom"])
    expect(JSON.stringify(entry.metadata)).not.toMatch(/Marin|Coc/)
  })

  it("journalise la suppression d'un compte par un administrateur", async () => {
    mockSession.mockResolvedValue(adminSession as any)
    mockDelete.mockResolvedValue({} as any)

    const req = new NextRequest("http://localhost:3000/api/utilisateurs/42", { method: "DELETE" })
    const res = await DELETE(req, { params: { id: "42" } } as any)
    expect(res.status).toBe(200)

    const entry = mockLog.mock.calls[0][0]
    expect(entry.action).toBe("USER_DELETED")
    expect(entry.metadata).toMatchObject({ parAdmin: true })
  })
})
