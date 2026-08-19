import { prisma } from "@/lib/prisma"
import type { RetourUtilisateurInput } from "@/lib/validations/retourUtilisateurSchema"
import type { StatutRetourUtilisateur } from "@prisma/client"

export async function createRetourUtilisateur(
  data: RetourUtilisateurInput & { utilisateurId?: number }
) {
  return prisma.retourUtilisateur.create({ data })
}

export async function getRetoursUtilisateur() {
  return prisma.retourUtilisateur.findMany({
    orderBy: [{ estBloquant: "desc" }, { dateCreation: "desc" }],
    include: {
      utilisateur: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
    },
  })
}

export async function updateStatutRetourUtilisateur(
  id: number,
  statut: StatutRetourUtilisateur
) {
  return prisma.retourUtilisateur.update({
    where: { id },
    data: { statut },
  })
}
