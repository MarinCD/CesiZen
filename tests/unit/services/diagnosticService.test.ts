import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    questionnaire: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    diagnostic: { findFirst: vi.fn(), findUnique: vi.fn() },
    question: { findMany: vi.fn() },
    resultatDiagnostic: { create: vi.fn(), findMany: vi.fn() },
  },
}))

import {
  getQuestionnaires,
  getQuestionnaireById,
  getDiagnosticWithQuestions,
  submitDiagnostic,
  getHistoriqueDiagnostics,
  getFirstDiagnostic,
  createQuestionnaire,
} from "@/lib/services/diagnosticService"
import { prisma } from "@/lib/prisma"

beforeEach(() => vi.clearAllMocks())

describe("diagnosticService", () => {
  it("getQuestionnaires inclut questions, diagnostics et créateur", async () => {
    vi.mocked(prisma.questionnaire.findMany).mockResolvedValue([] as any)
    await getQuestionnaires()
    const args = vi.mocked(prisma.questionnaire.findMany).mock.calls[0][0]
    expect(args.include).toHaveProperty("questions")
    expect(args.include).toHaveProperty("diagnostics")
    expect(args.include).toHaveProperty("createur")
  })

  it("getQuestionnaireById ordonne les questions par points décroissants", async () => {
    vi.mocked(prisma.questionnaire.findUnique).mockResolvedValue(null)
    await getQuestionnaireById(1)
    const args = vi.mocked(prisma.questionnaire.findUnique).mock.calls[0][0]
    expect((args?.include as any)?.questions?.orderBy).toEqual({ pointsAssocies: "desc" })
  })

  it("getDiagnosticWithQuestions inclut le questionnaire et ses questions", async () => {
    vi.mocked(prisma.diagnostic.findUnique).mockResolvedValue(null)
    await getDiagnosticWithQuestions(1)
    const args = vi.mocked(prisma.diagnostic.findUnique).mock.calls[0][0]
    expect(args?.include).toHaveProperty("questionnaire")
  })

  it("submitDiagnostic somme correctement les points associés", async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([
      { pointsAssocies: 100 }, { pointsAssocies: 80 }, { pointsAssocies: 50 },
    ] as any)
    vi.mocked(prisma.resultatDiagnostic.create).mockResolvedValue({ id: 1 } as any)

    await submitDiagnostic({ diagnosticId: 1, questionIds: [1, 2, 3], utilisateurId: 42 })

    const args = vi.mocked(prisma.resultatDiagnostic.create).mock.calls[0][0]
    expect(args.data.score).toBe(230)
    expect(args.data.interpretation).toBe("MODERE")
    expect(args.data.utilisateurId).toBe(42)
  })

  it("submitDiagnostic affecte FAIBLE pour un score < 150", async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([
      { pointsAssocies: 50 }, { pointsAssocies: 30 },
    ] as any)
    vi.mocked(prisma.resultatDiagnostic.create).mockResolvedValue({ id: 1 } as any)
    await submitDiagnostic({ diagnosticId: 1, questionIds: [1, 2], utilisateurId: 1 })
    const args = vi.mocked(prisma.resultatDiagnostic.create).mock.calls[0][0]
    expect(args.data.interpretation).toBe("FAIBLE")
  })

  it("submitDiagnostic affecte ELEVE pour un score >= 300", async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([
      { pointsAssocies: 200 }, { pointsAssocies: 150 },
    ] as any)
    vi.mocked(prisma.resultatDiagnostic.create).mockResolvedValue({ id: 1 } as any)
    await submitDiagnostic({ diagnosticId: 1, questionIds: [1, 2], utilisateurId: 1 })
    const args = vi.mocked(prisma.resultatDiagnostic.create).mock.calls[0][0]
    expect(args.data.interpretation).toBe("ELEVE")
  })

  it("getHistoriqueDiagnostics filtre par utilisateurId", async () => {
    vi.mocked(prisma.resultatDiagnostic.findMany).mockResolvedValue([] as any)
    await getHistoriqueDiagnostics(42)
    const args = vi.mocked(prisma.resultatDiagnostic.findMany).mock.calls[0][0]
    expect(args.where.utilisateurId).toBe(42)
  })

  it("getHistoriqueDiagnostics trie par date décroissante", async () => {
    vi.mocked(prisma.resultatDiagnostic.findMany).mockResolvedValue([] as any)
    await getHistoriqueDiagnostics(1)
    const args = vi.mocked(prisma.resultatDiagnostic.findMany).mock.calls[0][0]
    expect(args.orderBy).toEqual({ dateRealisation: "desc" })
  })

  it("getFirstDiagnostic inclut questionnaire et questions ordonnées", async () => {
    vi.mocked(prisma.diagnostic.findFirst).mockResolvedValue(null)
    await getFirstDiagnostic()
    const args = vi.mocked(prisma.diagnostic.findFirst).mock.calls[0]?.[0]
    expect(args?.include).toHaveProperty("questionnaire")
  })

  it("createQuestionnaire crée diagnostic imbriqué + questions + réponses", async () => {
    vi.mocked(prisma.questionnaire.create).mockResolvedValue({ id: 1 } as any)
    await createQuestionnaire({
      titre: "T", diagnosticNom: "D", idCreateur: 1,
      questions: [
        { texte: "Q1", pointsAssocies: 10, reponses: [{ texte: "R", valeur: 5 }] },
      ],
    })
    const args = vi.mocked(prisma.questionnaire.create).mock.calls[0][0]
    expect(args.data.titre).toBe("T")
    expect(args.data.diagnostics.create.nom).toBe("D")
    expect(args.data.questions.create).toHaveLength(1)
  })
})
