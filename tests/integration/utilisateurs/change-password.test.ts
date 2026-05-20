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
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}))

import { PUT } from "@/app/api/utilisateurs/[id]/route"
import { getServerSession } from "next-auth"
import { updateUser } from "@/lib/services/userService"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const mockSession = vi.mocked(getServerSession)
const mockUpdate = vi.mocked(updateUser)
const mockFind = vi.mocked(prisma.utilisateur.findUnique)
const mockCompare = vi.mocked(bcrypt.compare)

const reqBody = (body: object) =>
  new NextRequest("http://localhost:3000/api/utilisateurs/42", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })

beforeEach(() => vi.clearAllMocks())

describe("PUT /api/utilisateurs/[id] — changement de mot de passe", () => {
  const selfSession = { user: { id: "42", role: "UTILISATEUR" } }

  it("rejette 400 si nouveau mdp fourni sans ancien (self-update)", async () => {
    mockSession.mockResolvedValue(selfSession as any)
    const res = await PUT(reqBody({ motDePasse: "Nouveau1234!" }), { params: { id: "42" } })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/ancien/i)
  })

  it("rejette 400 si ancien mdp incorrect", async () => {
    mockSession.mockResolvedValue(selfSession as any)
    mockFind.mockResolvedValue({ motDePasse: "hash-actuel" } as any)
    mockCompare.mockResolvedValue(false as any)

    const res = await PUT(
      reqBody({ ancienMotDePasse: "FauxMdp1!", motDePasse: "Nouveau1234!" }),
      { params: { id: "42" } }
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/incorrect/i)
  })

  it("accepte le changement quand ancien mdp est correct", async () => {
    mockSession.mockResolvedValue(selfSession as any)
    mockFind.mockResolvedValue({ motDePasse: "hash-actuel" } as any)
    mockCompare.mockResolvedValue(true as any)
    mockUpdate.mockResolvedValue({ id: 42, email: "x@y.fr" } as any)

    const res = await PUT(
      reqBody({ ancienMotDePasse: "Ancien1234!", motDePasse: "Nouveau1234!" }),
      { params: { id: "42" } }
    )
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalled()
    // ancienMotDePasse ne doit pas être propagé au service
    expect(mockUpdate.mock.calls[0][1]).not.toHaveProperty("ancienMotDePasse")
  })

  it("un admin peut modifier un autre compte SANS ancien mdp", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    mockUpdate.mockResolvedValue({ id: 42 } as any)

    const res = await PUT(reqBody({ motDePasse: "Nouveau1234!" }), { params: { id: "42" } })
    expect(res.status).toBe(200)
    // bcrypt.compare ne doit PAS être appelé pour un admin
    expect(mockCompare).not.toHaveBeenCalled()
  })

  it("refuse 403 si un utilisateur tente de modifier le compte d'un autre", async () => {
    mockSession.mockResolvedValue({ user: { id: "7", role: "UTILISATEUR" } } as any)
    const res = await PUT(reqBody({ prenom: "Hack" }), { params: { id: "42" } })
    expect(res.status).toBe(403)
  })

  it("refuse 403 si un utilisateur tente de modifier son rôle", async () => {
    mockSession.mockResolvedValue(selfSession as any)
    const res = await PUT(reqBody({ role: "ADMINISTRATEUR" }), { params: { id: "42" } })
    expect(res.status).toBe(403)
  })

  it("autorise une mise à jour profil sans toucher au mot de passe", async () => {
    mockSession.mockResolvedValue(selfSession as any)
    mockUpdate.mockResolvedValue({ id: 42, prenom: "Marin" } as any)

    const res = await PUT(reqBody({ prenom: "Marin" }), { params: { id: "42" } })
    expect(res.status).toBe(200)
    expect(mockCompare).not.toHaveBeenCalled()
  })
})
