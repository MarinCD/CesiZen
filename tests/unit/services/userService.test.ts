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
    resultatDiagnostic: { count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
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
  getRepartitionStress,
  SEUIL_K_ANONYMAT,
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

  it("getRepartitionStress n'interroge jamais l'identité des répondants", async () => {
    vi.mocked(prisma.resultatDiagnostic.groupBy).mockResolvedValue([] as any)
    await getRepartitionStress()
    const args = vi.mocked(prisma.resultatDiagnostic.groupBy).mock.calls[0][0] as any
    expect(args.by).toEqual(["interpretation"])
    expect(args).not.toHaveProperty("include")
    expect(JSON.stringify(args)).not.toContain("utilisateur")
  })

  it("getRepartitionStress masque toute la répartition si un effectif est sous le seuil", async () => {
    vi.mocked(prisma.resultatDiagnostic.groupBy).mockResolvedValue([
      { interpretation: "FAIBLE", _count: { _all: 12 } },
      { interpretation: "MODERE", _count: { _all: SEUIL_K_ANONYMAT } },
      { interpretation: "ELEVE", _count: { _all: 1 } },
    ] as any)

    const { total, repartition } = await getRepartitionStress()
    expect(total).toBe(18)
    expect(repartition.every((r) => r.effectif === null)).toBe(true)
  })

  it("getRepartitionStress publie la répartition quand tous les effectifs atteignent le seuil", async () => {
    vi.mocked(prisma.resultatDiagnostic.groupBy).mockResolvedValue([
      { interpretation: "FAIBLE", _count: { _all: 12 } },
      { interpretation: "MODERE", _count: { _all: SEUIL_K_ANONYMAT } },
      { interpretation: "ELEVE", _count: { _all: 7 } },
    ] as any)

    const { total, repartition } = await getRepartitionStress()
    expect(total).toBe(24)
    expect(repartition.map((r) => r.effectif)).toEqual([12, SEUIL_K_ANONYMAT, 7])
  })
})
