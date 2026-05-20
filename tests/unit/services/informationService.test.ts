import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    information: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import {
  getInformations,
  getInformationById,
  createInformation,
  updateInformation,
  deleteInformation,
  getCategories,
} from "@/lib/services/informationService"
import { prisma } from "@/lib/prisma"

beforeEach(() => vi.clearAllMocks())

describe("informationService", () => {
  it("getInformations applique pagination par défaut (page 1, limit 10)", async () => {
    vi.mocked(prisma.information.findMany).mockResolvedValue([] as any)
    vi.mocked(prisma.information.count).mockResolvedValue(0 as any)
    await getInformations()
    const args = vi.mocked(prisma.information.findMany).mock.calls[0][0]
    expect(args.skip).toBe(0)
    expect(args.take).toBe(10)
  })

  it("getInformations calcule skip selon page", async () => {
    vi.mocked(prisma.information.findMany).mockResolvedValue([] as any)
    vi.mocked(prisma.information.count).mockResolvedValue(0 as any)
    await getInformations({ page: 3, limit: 5 })
    const args = vi.mocked(prisma.information.findMany).mock.calls[0][0]
    expect(args.skip).toBe(10)
    expect(args.take).toBe(5)
  })

  it("getInformations applique le filtre catégorie (sauf 'Toutes')", async () => {
    vi.mocked(prisma.information.findMany).mockResolvedValue([] as any)
    vi.mocked(prisma.information.count).mockResolvedValue(0 as any)
    await getInformations({ categorie: "Stress" })
    const args = vi.mocked(prisma.information.findMany).mock.calls[0][0]
    expect(args.where.categorie).toBe("Stress")
  })

  it("getInformations ignore le filtre catégorie 'Toutes'", async () => {
    vi.mocked(prisma.information.findMany).mockResolvedValue([] as any)
    vi.mocked(prisma.information.count).mockResolvedValue(0 as any)
    await getInformations({ categorie: "Toutes" })
    const args = vi.mocked(prisma.information.findMany).mock.calls[0][0]
    expect(args.where.categorie).toBeUndefined()
  })

  it("getInformations construit le filtre de recherche full-text (titre OU texte)", async () => {
    vi.mocked(prisma.information.findMany).mockResolvedValue([] as any)
    vi.mocked(prisma.information.count).mockResolvedValue(0 as any)
    await getInformations({ search: "stress" })
    const args = vi.mocked(prisma.information.findMany).mock.calls[0][0]
    expect(args.where.OR).toHaveLength(2)
    expect(args.where.OR[0].titre.contains).toBe("stress")
    expect(args.where.OR[1].texte.contains).toBe("stress")
  })

  it("getInformations calcule le nombre de pages", async () => {
    vi.mocked(prisma.information.findMany).mockResolvedValue([] as any)
    vi.mocked(prisma.information.count).mockResolvedValue(25 as any)
    const r = await getInformations({ limit: 10 })
    expect(r.pages).toBe(3)
    expect(r.total).toBe(25)
  })

  it("createInformation utilise la date courante si datePublication absent", async () => {
    vi.mocked(prisma.information.create).mockResolvedValue({ id: 1 } as any)
    await createInformation({ titre: "T", texte: "TT", idCreateur: 1 })
    const args = vi.mocked(prisma.information.create).mock.calls[0][0]
    expect(args.data.datePublication).toBeInstanceOf(Date)
  })

  it("updateInformation ignore les champs non fournis", async () => {
    vi.mocked(prisma.information.update).mockResolvedValue({ id: 1 } as any)
    await updateInformation(1, { titre: "Nouveau titre" })
    const args = vi.mocked(prisma.information.update).mock.calls[0][0]
    expect(args.data).toEqual({ titre: "Nouveau titre" })
  })

  it("deleteInformation appelle prisma avec l'id", async () => {
    vi.mocked(prisma.information.delete).mockResolvedValue({ id: 1 } as any)
    await deleteInformation(7)
    expect(prisma.information.delete).toHaveBeenCalledWith({ where: { id: 7 } })
  })

  it("getInformationById inclut le créateur (nom + prénom)", async () => {
    vi.mocked(prisma.information.findUnique).mockResolvedValue(null)
    await getInformationById(1)
    const args = vi.mocked(prisma.information.findUnique).mock.calls[0][0]
    expect(args?.include).toEqual({ createur: { select: { nom: true, prenom: true } } })
  })

  it("getCategories retourne les catégories distinctes non nulles", async () => {
    vi.mocked(prisma.information.findMany).mockResolvedValue([
      { categorie: "Stress" }, { categorie: "Bien-être" },
    ] as any)
    const cats = await getCategories()
    expect(cats).toEqual(["Stress", "Bien-être"])
  })
})
