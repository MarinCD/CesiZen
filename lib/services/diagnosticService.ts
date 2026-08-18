import { prisma } from "@/lib/prisma"

export function interpreterScore(score: number): string {
  if (score < 150) return "FAIBLE"
  if (score < 300) return "MODERE"
  return "ELEVE"
}

export class InvalidDiagnosticSelectionError extends Error {
  constructor() {
    super("Les questions sélectionnées n'appartiennent pas au diagnostic demandé")
    this.name = "InvalidDiagnosticSelectionError"
  }
}

export async function evaluateDiagnostic(diagnosticId: number, questionIds: number[]) {
  const diagnostic = await prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    select: { questionnaireId: true },
  })
  if (!diagnostic) throw new InvalidDiagnosticSelectionError()

  const questions = await prisma.question.findMany({
    where: {
      id: { in: questionIds },
      questionnaireId: diagnostic.questionnaireId,
    },
    select: { pointsAssocies: true },
  })

  if (questions.length !== questionIds.length) {
    throw new InvalidDiagnosticSelectionError()
  }

  const score = questions.reduce((sum, q) => sum + q.pointsAssocies, 0)
  return { score, interpretation: interpreterScore(score) }
}

export async function saveDiagnosticResult(data: {
  diagnosticId: number
  utilisateurId: number
  score: number
  interpretation: string
}) {
  return prisma.resultatDiagnostic.create({ data })
}


// Le barème (points par question) est une donnée d'administration : servi au
// répondant, il oriente les réponses et permet de reconstituer son propre score.
// L'ordre par points décroissants le trahit tout autant que la valeur elle-même :
// les écrans publics reçoivent donc le texte des questions dans l'ordre de saisie.
const QUESTIONS_PUBLIQUES = {
  select: { id: true, texte: true },
  orderBy: { id: "asc" },
} as const

const QUESTIONS_AVEC_BAREME = {
  orderBy: { pointsAssocies: "desc" },
} as const

export async function getQuestionnaires(options?: {
  includeCreateur?: boolean
  includeBareme?: boolean
}) {
  return prisma.questionnaire.findMany({
    include: {
      questions: options?.includeBareme ? QUESTIONS_AVEC_BAREME : QUESTIONS_PUBLIQUES,
      diagnostics: true,
      ...(options?.includeCreateur
        ? { createur: { select: { nom: true, prenom: true } } }
        : {}),
    },
    orderBy: { dateCreation: "desc" },
  })
}

export async function getQuestionnaireById(id: number) {
  return prisma.questionnaire.findUnique({
    where: { id },
    include: {
      questions: QUESTIONS_PUBLIQUES,
      diagnostics: true,
    },
  })
}

/** Variante réservée aux écrans d'édition du back-office : inclut la pondération. */
export async function getQuestionnaireAvecBareme(id: number) {
  return prisma.questionnaire.findUnique({
    where: { id },
    include: {
      questions: QUESTIONS_AVEC_BAREME,
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
  const evaluation = await evaluateDiagnostic(data.diagnosticId, data.questionIds)
  return saveDiagnosticResult({
    ...evaluation,
    utilisateurId: data.utilisateurId,
    diagnosticId: data.diagnosticId,
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
          questions: QUESTIONS_PUBLIQUES,
        },
      },
    },
  })
}

export async function createQuestionnaire(data: {
  titre: string
  description?: string
  diagnosticNom: string
  idCreateur: number
  questions: Array<{
    texte: string
    pointsAssocies: number
    reponses?: Array<{ texte: string; valeur: number }>
  }>
}) {
  return prisma.questionnaire.create({
    data: {
      titre: data.titre,
      description: data.description,
      idCreateur: data.idCreateur,
      diagnostics: {
        create: {
          nom: data.diagnosticNom,
          description: data.description,
          questions: {
            create: data.questions.map((q) => ({
              texte: q.texte,
              pointsAssocies: q.pointsAssocies,
              reponses: q.reponses && q.reponses.length > 0
                ? { create: q.reponses.map((r) => ({ texte: r.texte, valeur: r.valeur })) }
                : undefined,
            })),
          },
        },
      },
      questions: {
        create: data.questions.map((q) => ({
          texte: q.texte,
          pointsAssocies: q.pointsAssocies,
        })),
      },
    },
  })
}
