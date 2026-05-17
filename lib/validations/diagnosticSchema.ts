import { z } from "zod"

export const diagnosticSubmitSchema = z.object({
  diagnosticId: z.number().int().positive(),
  questionIds: z.array(z.number().int().positive()),
})

export type DiagnosticSubmitInput = z.infer<typeof diagnosticSubmitSchema>
