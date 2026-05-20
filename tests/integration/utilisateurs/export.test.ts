import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/prisma", () => ({
  prisma: { utilisateur: { findUnique: vi.fn() } },
}))

import { GET } from "@/app/api/utilisateurs/[id]/export/route"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

const mockSession = vi.mocked(getServerSession)
const mockFind = vi.mocked(prisma.utilisateur.findUnique)
const mockLog = vi.mocked(logAudit)

const req = () => new NextRequest("http://localhost:3000/api/utilisateurs/42/export")

beforeEach(() => vi.clearAllMocks())

describe("GET /api/utilisateurs/[id]/export", () => {
  it("refuse 401 sans session", async () => {
    mockSession.mockResolvedValue(null as any)
    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(401)
  })

  it("refuse 403 si l'utilisateur tente d'exporter un autre compte", async () => {
    mockSession.mockResolvedValue({ user: { id: "5", role: "UTILISATEUR" } } as any)
    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(403)
  })

  it("autorise l'export de son propre compte (200 + Content-Disposition attachment)", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockFind.mockResolvedValue({
      id: 42, nom: "Test", prenom: "User", email: "u@t.fr",
      role: "UTILISATEUR", dateCreation: new Date(), consentementRGPD: true,
      resultatsDiagnostic: [], informations: [],
    } as any)

    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(200)
    expect(res.headers.get("content-disposition")).toMatch(/attachment/)
    expect(res.headers.get("content-disposition")).toMatch(/cesizen-export-utilisateur-42/)
  })

  it("un admin peut exporter le compte d'un autre", async () => {
    mockSession.mockResolvedValue({ user: { id: "1", role: "ADMINISTRATEUR" } } as any)
    mockFind.mockResolvedValue({
      id: 42, nom: "X", prenom: "Y", email: "x@y.fr",
      role: "UTILISATEUR", dateCreation: new Date(), consentementRGPD: true,
      resultatsDiagnostic: [], informations: [],
    } as any)
    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(200)
  })

  it("retourne 404 si l'utilisateur n'existe pas", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockFind.mockResolvedValue(null)
    const res = await GET(req(), { params: { id: "42" } })
    expect(res.status).toBe(404)
  })

  it("écrit une entrée d'audit EXPORT_USER_DATA", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockFind.mockResolvedValue({
      id: 42, nom: "X", prenom: "Y", email: "x@y.fr",
      role: "UTILISATEUR", dateCreation: new Date(), consentementRGPD: true,
      resultatsDiagnostic: [], informations: [],
    } as any)
    await GET(req(), { params: { id: "42" } })
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "EXPORT_USER_DATA", actorId: 42, targetId: 42 })
    )
  })

  it("payload contient la notice RGPD", async () => {
    mockSession.mockResolvedValue({ user: { id: "42", role: "UTILISATEUR" } } as any)
    mockFind.mockResolvedValue({
      id: 42, nom: "X", prenom: "Y", email: "x@y.fr",
      role: "UTILISATEUR", dateCreation: new Date(), consentementRGPD: true,
      resultatsDiagnostic: [], informations: [],
    } as any)
    const res = await GET(req(), { params: { id: "42" } })
    const body = await res.json()
    expect(body.notice).toMatch(/RGPD/)
    expect(body.utilisateur.id).toBe(42)
  })
})
