import { prisma } from "@/lib/prisma"

export async function getTrackerEmotions(utilisateurId: number, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.trackerEmotion.findMany({
    where: {
      utilisateurId,
      date: { gte: since },
    },
    orderBy: { date: "desc" },
  })
}

export async function addTrackerEmotion(data: {
  emotion: string
  intensite: number
  note?: string
  date?: string
  utilisateurId: number
}) {
  return prisma.trackerEmotion.create({
    data: {
      emotion: data.emotion,
      intensite: data.intensite,
      note: data.note,
      date: data.date ? new Date(data.date) : new Date(),
      utilisateurId: data.utilisateurId,
    },
  })
}

export async function deleteTrackerEmotion(id: number, utilisateurId: number) {
  const entry = await prisma.trackerEmotion.findUnique({ where: { id } })
  if (!entry || entry.utilisateurId !== utilisateurId) {
    throw new Error("Non autorisé")
  }
  return prisma.trackerEmotion.delete({ where: { id } })
}
