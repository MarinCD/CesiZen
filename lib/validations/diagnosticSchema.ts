import { z } from "zod"

export const diagnosticSubmitSchema = z.object({
  diagnosticId: z.number().int().positive(),
  questionIds: z.array(z.number().int().positive()).min(1, "Au moins une question est requise"),
})

export type DiagnosticSubmitInput = z.infer<typeof diagnosticSubmitSchema>
