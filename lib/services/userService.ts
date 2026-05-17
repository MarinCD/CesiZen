import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export async function getAllUsers() {
  return prisma.utilisateur.findMany({
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      dateCreation: true,
      consentementRGPD: true,
    },
    orderBy: { dateCreation: "desc" },
  })
}

export async function getUserById(id: number) {
  return prisma.utilisateur.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      dateCreation: true,
      consentementRGPD: true,
    },
  })
}

export async function createUser(data: {
  nom: string
  prenom: string
  email: string
  motDePasse: string
  consentementRGPD: boolean
}) {
  const hashedPassword = await bcrypt.hash(data.motDePasse, 12)
  return prisma.utilisateur.create({
    data: {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      motDePasse: hashedPassword,
      consentementRGPD: data.consentementRGPD,
      role: Role.UTILISATEUR,
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
    },
  })
}

export async function updateUser(
  id: number,
  data: {
    nom?: string
    prenom?: string
    email?: string
    motDePasse?: string
    role?: Role
  }
) {
  const updateData: any = {}
  if (data.nom !== undefined) updateData.nom = data.nom
  if (data.prenom !== undefined) updateData.prenom = data.prenom
  if (data.email !== undefined) updateData.email = data.email
  if (data.role !== undefined) updateData.role = data.role
  if (data.motDePasse && data.motDePasse.length > 0) {
    updateData.motDePasse = await bcrypt.hash(data.motDePasse, 12)
  }

  return prisma.utilisateur.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
    },
  })
}

export async function deleteUser(id: number) {
  return prisma.utilisateur.delete({ where: { id } })
}

export async function getGlobalStats() {
  const [totalUtilisateurs, diagnosticsRealises, articlesPublies, entreeTrackerCeMois] =
    await Promise.all([
      prisma.utilisateur.count(),
      prisma.resultatDiagnostic.count(),
      prisma.information.count(),
      prisma.trackerEmotion.count({
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])

  return { totalUtilisateurs, diagnosticsRealises, articlesPublies, entreeTrackerCeMois }
}

export async function getRecentUsers(limit = 5) {
  return prisma.utilisateur.findMany({
    take: limit,
    orderBy: { dateCreation: "desc" },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      dateCreation: true,
    },
  })
}

export async function getRecentDiagnostics(limit = 5) {
  return prisma.resultatDiagnostic.findMany({
    take: limit,
    orderBy: { dateRealisation: "desc" },
    include: {
      utilisateur: { select: { nom: true, prenom: true, email: true } },
      diagnostic: { select: { nom: true } },
    },
  })
}
