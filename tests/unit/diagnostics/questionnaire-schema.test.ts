import { describe, it, expect } from "vitest"
import {
  questionnaireSchema,
  questionSchema,
  reponseSchema,
} from "@/lib/validations/diagnosticSchema"

describe("reponseSchema", () => {
  it("valide une réponse correcte", () => {
    expect(reponseSchema.safeParse({ texte: "Oui", valeur: 5 }).success).toBe(true)
  })
  it("rejette une réponse au texte vide", () => {
    expect(reponseSchema.safeParse({ texte: "", valeur: 5 }).success).toBe(false)
  })
  it("rejette une valeur non entière", () => {
    expect(reponseSchema.safeParse({ texte: "Oui", valeur: 1.5 }).success).toBe(false)
  })
})

describe("questionSchema", () => {
  it("valide une question sans réponses (optionnel)", () => {
    expect(questionSchema.safeParse({ texte: "Décès d'un proche", pointsAssocies: 100 }).success).toBe(true)
  })
  it("rejette un texte trop court (< 3c)", () => {
    expect(questionSchema.safeParse({ texte: "Hi", pointsAssocies: 10 }).success).toBe(false)
  })
  it("rejette des points négatifs", () => {
    expect(questionSchema.safeParse({ texte: "Question A", pointsAssocies: -1 }).success).toBe(false)
  })
})

describe("questionnaireSchema", () => {
  const valid = {
    titre: "Echelle stress",
    diagnosticNom: "Holmes & Rahe",
    questions: [{ texte: "Question 1", pointsAssocies: 50 }],
  }
  it("valide un questionnaire minimal", () => {
    expect(questionnaireSchema.safeParse(valid).success).toBe(true)
  })
  it("rejette un titre trop court", () => {
    expect(questionnaireSchema.safeParse({ ...valid, titre: "X" }).success).toBe(false)
  })
  it("rejette un questionnaire sans questions", () => {
    expect(questionnaireSchema.safeParse({ ...valid, questions: [] }).success).toBe(false)
  })
  it("rejette si diagnosticNom est manquant", () => {
    const r = questionnaireSchema.safeParse({ titre: valid.titre, questions: valid.questions } as any)
    expect(r.success).toBe(false)
  })
  it("accepte les réponses imbriquées", () => {
    const r = questionnaireSchema.safeParse({
      ...valid,
      questions: [
        {
          texte: "Question complexe",
          pointsAssocies: 30,
          reponses: [
            { texte: "Jamais", valeur: 0 },
            { texte: "Souvent", valeur: 10 },
          ],
        },
      ],
    })
    expect(r.success).toBe(true)
  })
})
