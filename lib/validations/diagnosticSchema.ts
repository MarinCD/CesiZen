import { z } from "zod"

export const diagnosticSubmitSchema = z.object({
  diagnosticId: z.number().int().positive(),
  questionIds: z.array(z.number().int().positive()).min(1, "Au moins une question est requise"),
})

export type DiagnosticSubmitInput = z.infer<typeof diagnosticSubmitSchema>

export const reponseSchema = z.object({
  texte: z.string().min(1, "Le texte de la réponse est requis"),
  valeur: z.number().int(),
})

export const questionSchema = z.object({
  texte: z.string().min(3, "Le texte doit contenir au moins 3 caractères"),
  pointsAssocies: z.number().int().min(0, "Les points doivent être ≥ 0"),
  reponses: z.array(reponseSchema).optional(),
})

export const questionnaireSchema = z.object({
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  diagnosticNom: z.string().min(2, "Le nom du diagnostic est requis"),
  questions: z.array(questionSchema).min(1, "Au moins une question est requise"),
})

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>
