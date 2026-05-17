import { prisma } from "@/lib/prisma"

export function interpreterScore(score: number): string {
  if (score < 150) return "FAIBLE"
  if (score < 300) return "MODERE"
  return "ELEVE"
}

export async function getQuestionnaires() {
  return prisma.questionnaire.findMany({
    include: {
      questions: true,
      diagnostics: true,
      createur: { select: { nom: true, prenom: true } },
    },
    orderBy: { dateCreation: "desc" },
  })
}

export async function getQuestionnaireById(id: number) {
  return prisma.questionnaire.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { pointsAssocies: "desc" } },
      diagnostics: true,
    },
  })
}

export async function getDiagnosticWithQuestions(diagnosticId: number) {
  return prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    include: {
      questionnaire: {
        include: {
          questions: { orderBy: { pointsAssocies: "desc" } },
        },
      },
    },
  })
}

export async function submitDiagnostic(data: {
  diagnosticId: number
  questionIds: number[]
  utilisateurId: number
}) {
  // Récupérer les points associés aux questions cochées
  const questions = await prisma.question.findMany({
    where: { id: { in: data.questionIds } },
    select: { pointsAssocies: true },
  })

  const score = questions.reduce((sum, q) => sum + q.pointsAssocies, 0)
  const interpretation = interpreterScore(score)

  return prisma.resultatDiagnostic.create({
    data: {
      score,
      interpretation,
      utilisateurId: data.utilisateurId,
      diagnosticId: data.diagnosticId,
    },
  })
}

export async function getHistoriqueDiagnostics(utilisateurId: number) {
  return prisma.resultatDiagnostic.findMany({
    where: { utilisateurId },
    include: { diagnostic: { select: { nom: true } } },
    orderBy: { dateRealisation: "desc" },
  })
}

export async function getFirstDiagnostic() {
  return prisma.diagnostic.findFirst({
    include: {
      questionnaire: {
        include: {
          questions: { orderBy: { pointsAssocies: "desc" } },
        },
      },
    },
  })
}
