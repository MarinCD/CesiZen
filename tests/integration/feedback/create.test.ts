import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
  clientIp: vi.fn(() => "127.0.0.1"),
}))
vi.mock("@/lib/services/retourUtilisateurService", () => ({
  createRetourUtilisateur: vi.fn(),
}))

import { POST } from "@/app/api/retours-utilisateur/route"
import { getServerSession } from "next-auth"
import { logAudit } from "@/lib/audit"
import { rateLimit } from "@/lib/rateLimit"
import { createRetourUtilisateur } from "@/lib/services/retourUtilisateurService"

const mockSession = vi.mocked(getServerSession)
const mockLog = vi.mocked(logAudit)
const mockRateLimit = vi.mocked(rateLimit)
const mockCreate = vi.mocked(createRetourUtilisateur)

const valid = {
  type: "ANOMALIE",
  estBloquant: true,
  emplacement: "Page Diagnostic",
  pageUrl: "/diagnostic",
  description: "Le calcul ne se termine pas après la validation.",
}

const request = (body: unknown) =>
  new NextRequest("http://localhost:3000/api/retours-utilisateur", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
  mockRateLimit.mockResolvedValue(null)
  mockCreate.mockResolvedValue({ id: 12 } as never)
})

describe("POST /api/retours-utilisateur", () => {
  it("accepte un retour anonyme", async () => {
    mockSession.mockResolvedValue(null as never)
    const response = await POST(request(valid))

    expect(response.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ ...valid, utilisateurId: undefined })
    )
  })

  it("associe le retour au compte connecté", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as never)
    const response = await POST(request(valid))

    expect(response.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ utilisateurId: 42 })
    )
  })

  it("refuse un retour invalide", async () => {
    const response = await POST(request({ ...valid, description: "court" }))

    expect(response.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("applique la limitation de débit", async () => {
    mockRateLimit.mockResolvedValue(
      NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    )
    const response = await POST(request(valid))

    expect(response.status).toBe(429)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("journalise seulement le type et le caractère bloquant", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as never)
    await POST(request(valid))

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "USER_FEEDBACK_CREATED",
        actorId: 42,
        targetId: 12,
        metadata: { type: "ANOMALIE", bloquant: true },
      })
    )
    expect(JSON.stringify(mockLog.mock.calls[0][0])).not.toContain(valid.description)
  })
})
