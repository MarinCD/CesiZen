import { z } from "zod"

export const informationSchema = z.object({
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  texte: z.string().min(10, "Le texte doit contenir au moins 10 caractères"),
  categorie: z.string().optional(),
  datePublication: z.string().optional(),
})

export type InformationInput = z.infer<typeof informationSchema>
