import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// CT-IT-001 / CT-IT-002 adaptés : POST /api/utilisateurs (inscription)
vi.mock("@/lib/services/userService", () => ({
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
}))
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

import { POST } from "@/app/api/utilisateurs/route"
import { createUser } from "@/lib/services/userService"

const mockCreateUser = vi.mocked(createUser)

const makeReq = (body: object) =>
  new NextRequest("http://localhost:3000/api/utilisateurs", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })

const validPayload = {
  nom: "Doe",
  prenom: "Jane",
  email: "new@test.fr",
  motDePasse: "Aa1!aaaaaa",
  consentementRGPD: true,
}

beforeEach(() => vi.clearAllMocks())

describe("POST /api/utilisateurs", () => {
  it("CT-IT-001 — inscription nominale retourne 201", async () => {
    mockCreateUser.mockResolvedValue({ id: 1, nom: "Doe", prenom: "Jane", email: "new@test.fr", role: "UTILISATEUR" } as any)

    const res = await POST(makeReq(validPayload))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.email).toBe("new@test.fr")
  })

  it("CT-IT-002 — retourne 409 si email déjà utilisé", async () => {
    const prismaError: any = new Error("Unique constraint failed")
    prismaError.code = "P2002"
    mockCreateUser.mockRejectedValue(prismaError)

    const res = await POST(makeReq({ ...validPayload, email: "dup@test.fr" }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toMatch(/email/i)
  })

  it("retourne 400 si le payload ne respecte pas le schéma Zod", async () => {
    const res = await POST(makeReq({ email: "a@b.fr", motDePasse: "abc", consentementRGPD: true }))
    expect(res.status).toBe(400)
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it("retourne 400 si consentementRGPD est absent", async () => {
    const { consentementRGPD: _, ...withoutConsent } = validPayload
    const res = await POST(makeReq(withoutConsent))
    expect(res.status).toBe(400)
  })
})
