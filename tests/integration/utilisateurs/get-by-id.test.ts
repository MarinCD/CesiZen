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

import { GET } from "@/app/api/utilisateurs/[id]/route"
import { getServerSession } from "next-auth"
import { getUserById } from "@/lib/services/userService"

const mockSession = vi.mocked(getServerSession)
const mockGet = vi.mocked(getUserById)

const req = () => new NextRequest("http://localhost:3000/api/utilisateurs/42")

beforeEach(() => vi.clearAllMocks())

describe("GET /api/utilisateurs/[id]", () => {
  it("refuse 401 sans session", async () => {
    mockSession.mockResolvedValue(null as any)
    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(401)
  })

  it("refuse 403 si tentative d'accès à un autre profil (non admin)", async () => {
    mockSession.mockResolvedValue({ user: { id: "5", role: "UTILISATEUR" } } as any)
    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(403)
  })

  it("autorise l'accès à son propre profil (200)", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockGet.mockResolvedValue({ id: 42, email: "x@y.fr" } as any)
    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(200)
  })

  it("admin peut accéder à n'importe quel profil", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    mockGet.mockResolvedValue({ id: 42, email: "x@y.fr" } as any)
    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(200)
  })

  it("renvoie 404 si l'utilisateur n'existe pas", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockGet.mockResolvedValue(null)
    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(404)
  })
})
