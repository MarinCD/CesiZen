import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/services/userService", () => ({
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
}))
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/rateLimit", () => ({ rateLimit: vi.fn() }))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))

import { POST } from "@/app/api/utilisateurs/route"
import { rateLimit } from "@/lib/rateLimit"
import { logAudit } from "@/lib/audit"
import { createUser } from "@/lib/services/userService"

const mockRl = vi.mocked(rateLimit)
const mockLog = vi.mocked(logAudit)
const mockCreate = vi.mocked(createUser)

const req = () =>
  new NextRequest("http://localhost:3000/api/utilisateurs", {
    method: "POST",
    body: JSON.stringify({
      nom: "Bot",
      prenom: "Spam",
      email: "spam@x.fr",
      motDePasse: "Aa1!aaaaaa",
      consentementRGPD: true,
    }),
    headers: { "Content-Type": "application/json", "x-forwarded-for": "9.9.9.9" },
  })

beforeEach(() => vi.clearAllMocks())

describe("POST /api/utilisateurs — rate-limit", () => {
  it("retourne 429 et log un RATE_LIMIT_HIT quand bloqué", async () => {
    const blocked = new Response(JSON.stringify({ error: "TM" }), { status: 429 }) as any
    mockRl.mockReturnValue(blocked)

    const res = await POST(req())
    expect(res.status).toBe(429)
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "RATE_LIMIT_HIT", metadata: { route: "register" } })
    )
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("laisse passer si pas de rate-limit", async () => {
    mockRl.mockReturnValue(null)
    mockCreate.mockResolvedValue({ id: 1 } as any)

    const res = await POST(req())
    expect(res.status).toBe(201)
    expect(mockLog).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "RATE_LIMIT_HIT" })
    )
  })
})
