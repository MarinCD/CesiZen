import { prisma } from "@/lib/prisma"

export async function getInformations(params?: {
  search?: string
  categorie?: string
  page?: number
  limit?: number
}) {
  const { search, categorie, page = 1, limit = 10 } = params || {}
  const skip = (page - 1) * limit

  const where: any = {}
  if (search) {
    where.OR = [
      { titre: { contains: search } },
      { texte: { contains: search } },
    ]
  }
  if (categorie && categorie !== "Toutes") {
    where.categorie = categorie
  }

  const [items, total] = await Promise.all([
    prisma.information.findMany({
      where,
      skip,
      take: limit,
      orderBy: { datePublication: "desc" },
      include: { createur: { select: { nom: true, prenom: true } } },
    }),
    prisma.information.count({ where }),
  ])

  return { items, total, pages: Math.ceil(total / limit) }
}

export async function getInformationById(id: number) {
  return prisma.information.findUnique({
    where: { id },
    include: { createur: { select: { nom: true, prenom: true } } },
  })
}

export async function createInformation(data: {
  titre: string
  texte: string
  categorie?: string
  datePublication?: string
  idCreateur: number
}) {
  return prisma.information.create({
    data: {
      titre: data.titre,
      texte: data.texte,
      categorie: data.categorie,
      datePublication: data.datePublication ? new Date(data.datePublication) : new Date(),
      idCreateur: data.idCreateur,
    },
  })
}

export async function updateInformation(
  id: number,
  data: {
    titre?: string
    texte?: string
    categorie?: string
    datePublication?: string
  }
) {
  const updateData: any = {}
  if (data.titre) updateData.titre = data.titre
  if (data.texte) updateData.texte = data.texte
  if (data.categorie !== undefined) updateData.categorie = data.categorie
  if (data.datePublication) updateData.datePublication = new Date(data.datePublication)

  return prisma.information.update({ where: { id }, data: updateData })
}

export async function deleteInformation(id: number) {
  return prisma.information.delete({ where: { id } })
}

export async function getCategories() {
  const result = await prisma.information.findMany({
    select: { categorie: true },
    distinct: ["categorie"],
    where: { categorie: { not: null } },
  })
  return result.map((r) => r.categorie).filter(Boolean) as string[]
}
