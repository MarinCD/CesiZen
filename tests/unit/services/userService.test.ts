import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    utilisateur: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    resultatDiagnostic: { count: vi.fn(), findMany: vi.fn() },
    information: { count: vi.fn() },
  },
}))
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(async (p: string) => "hashed:" + p) } }))

import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getGlobalStats,
  getRecentUsers,
  getRecentDiagnostics,
} from "@/lib/services/userService"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

beforeEach(() => vi.clearAllMocks())

describe("userService", () => {
  it("getAllUsers utilise un select sans motDePasse", async () => {
    vi.mocked(prisma.utilisateur.findMany).mockResolvedValue([] as any)
    await getAllUsers()
    const args = vi.mocked(prisma.utilisateur.findMany).mock.calls[0][0]
    expect(args?.select).toBeDefined()
    expect((args?.select as any).motDePasse).toBeFalsy()
  })

  it("getUserById utilise un select sans motDePasse", async () => {
    vi.mocked(prisma.utilisateur.findUnique).mockResolvedValue(null)
    await getUserById(1)
    const args = vi.mocked(prisma.utilisateur.findUnique).mock.calls[0][0]
    expect((args?.select as any).motDePasse).toBeFalsy()
  })

  it("createUser hash le mot de passe avant insertion (bcrypt cost 12)", async () => {
    vi.mocked(prisma.utilisateur.create).mockResolvedValue({ id: 1 } as any)
    await createUser({
      nom: "X", prenom: "Y", email: "a@b.fr", motDePasse: "plain", consentementRGPD: true,
    })
    expect(bcrypt.hash).toHaveBeenCalledWith("plain", 12)
    const args = vi.mocked(prisma.utilisateur.create).mock.calls[0][0]
    expect(args.data.motDePasse).toBe("hashed:plain")
    expect(args.data.motDePasse).not.toBe("plain")
  })

  it("updateUser ne hash pas si motDePasse est vide", async () => {
    vi.mocked(prisma.utilisateur.update).mockResolvedValue({ id: 1 } as any)
    await updateUser(1, { motDePasse: "" })
    expect(bcrypt.hash).not.toHaveBeenCalled()
  })

  it("updateUser hash si motDePasse est fourni", async () => {
    vi.mocked(prisma.utilisateur.update).mockResolvedValue({ id: 1 } as any)
    await updateUser(1, { motDePasse: "nouveau" })
    expect(bcrypt.hash).toHaveBeenCalledWith("nouveau", 12)
  })

  it("updateUser ne touche que les champs fournis", async () => {
    vi.mocked(prisma.utilisateur.update).mockResolvedValue({ id: 1 } as any)
    await updateUser(1, { prenom: "Marin" })
    const args = vi.mocked(prisma.utilisateur.update).mock.calls[0][0]
    expect(args.data).toEqual({ prenom: "Marin" })
  })

  it("deleteUser appelle prisma.utilisateur.delete avec l'id", async () => {
    vi.mocked(prisma.utilisateur.delete).mockResolvedValue({ id: 1 } as any)
    await deleteUser(42)
    expect(prisma.utilisateur.delete).toHaveBeenCalledWith({ where: { id: 42 } })
  })

  it("getGlobalStats agrège 4 compteurs en parallèle", async () => {
    vi.mocked(prisma.utilisateur.count).mockResolvedValue(10 as any)
    vi.mocked(prisma.resultatDiagnostic.count).mockResolvedValueOnce(50 as any).mockResolvedValueOnce(7 as any)
    vi.mocked(prisma.information.count).mockResolvedValue(3 as any)

    const stats = await getGlobalStats()
    expect(stats.totalUtilisateurs).toBe(10)
    expect(stats.diagnosticsRealises).toBe(50)
    expect(stats.articlesPublies).toBe(3)
    expect(stats.diagnosticsCeMois).toBe(7)
  })

  it("getRecentUsers respecte la limite", async () => {
    vi.mocked(prisma.utilisateur.findMany).mockResolvedValue([] as any)
    await getRecentUsers(3)
    expect(vi.mocked(prisma.utilisateur.findMany).mock.calls[0][0].take).toBe(3)
  })

  it("getRecentDiagnostics inclut utilisateur et diagnostic", async () => {
    vi.mocked(prisma.resultatDiagnostic.findMany).mockResolvedValue([] as any)
    await getRecentDiagnostics()
    const args = vi.mocked(prisma.resultatDiagnostic.findMany).mock.calls[0][0]
    expect(args.include).toHaveProperty("utilisateur")
    expect(args.include).toHaveProperty("diagnostic")
  })
})
