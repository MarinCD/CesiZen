import { z } from "zod"

export const diagnosticSubmitSchema = z.object({
  diagnosticId: z.number().int().positive(),
  questionIds: z.array(z.number().int().positive()),
})

export const trackerSchema = z.object({
  emotion: z.string().min(1, "Émotion requise"),
  intensite: z.number().int().min(1).max(5),
  note: z.string().optional(),
  date: z.string().optional(),
})

export type DiagnosticSubmitInput = z.infer<typeof diagnosticSubmitSchema>
export type TrackerInput = z.infer<typeof trackerSchema>
