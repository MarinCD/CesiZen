import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/services/diagnosticService", () => ({
  getHistoriqueDiagnostics: vi.fn(),
}))

import { GET } from "@/app/api/resultats/route"
import { getServerSession } from "next-auth"
import { getHistoriqueDiagnostics } from "@/lib/services/diagnosticService"

const mockSession = vi.mocked(getServerSession)
const mockHist = vi.mocked(getHistoriqueDiagnostics)

beforeEach(() => vi.clearAllMocks())

describe("GET /api/resultats", () => {
  it("refuse 401 sans session", async () => {
    mockSession.mockResolvedValue(null as any)
    const res = await GET()
    expect(res.status).toBe(401)
    expect(mockHist).not.toHaveBeenCalled()
  })

  it("renvoie l'historique de l'utilisateur connecté (200)", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockHist.mockResolvedValue([
      { id: 1, score: 200, interpretation: "MODERE", dateRealisation: new Date() },
    ] as any)

    const res = await GET()
    expect(res.status).toBe(200)
    expect(mockHist).toHaveBeenCalledWith(42)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it("isole les historiques par utilisateur (ne renvoie que le sien)", async () => {
    mockSession.mockResolvedValue({ user: { id: "7", role: "UTILISATEUR" } } as any)
    mockHist.mockResolvedValue([] as any)
    await GET()
    expect(mockHist).toHaveBeenCalledWith(7)
    expect(mockHist).not.toHaveBeenCalledWith(42)
  })
})
