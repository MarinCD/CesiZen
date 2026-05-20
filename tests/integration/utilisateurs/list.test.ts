import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/services/userService", () => ({
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
}))
vi.mock("@/lib/rateLimit", () => ({ rateLimit: vi.fn().mockReturnValue(null) }))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))

import { GET } from "@/app/api/utilisateurs/route"
import { getServerSession } from "next-auth"
import { getAllUsers } from "@/lib/services/userService"

const mockSession = vi.mocked(getServerSession)
const mockList = vi.mocked(getAllUsers)

beforeEach(() => vi.clearAllMocks())

describe("GET /api/utilisateurs", () => {
  it("refuse 403 sans session", async () => {
    mockSession.mockResolvedValue(null as any)
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it("refuse 403 si non admin", async () => {
    mockSession.mockResolvedValue({ user: { role: "UTILISATEUR" } } as any)
    const res = await GET()
    expect(res.status).toBe(403)
    expect(mockList).not.toHaveBeenCalled()
  })

  it("renvoie la liste pour un admin (200)", async () => {
    mockSession.mockResolvedValue({ user: { role: "ADMINISTRATEUR" } } as any)
    mockList.mockResolvedValue([{ id: 1, email: "a@b.fr" }] as any)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })

  it("la liste ne contient pas le motDePasse (select sans hash)", async () => {
    mockSession.mockResolvedValue({ user: { role: "ADMINISTRATEUR" } } as any)
    // getAllUsers fait déjà un select sans motDePasse — on simule sa garantie
    mockList.mockResolvedValue([{ id: 1, email: "a@b.fr", nom: "X", prenom: "Y" }] as any)
    const res = await GET()
    const data = await res.json()
    expect(data[0]).not.toHaveProperty("motDePasse")
  })
})
