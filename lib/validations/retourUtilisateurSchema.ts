import { z } from "zod"

export const retourUtilisateurSchema = z.object({
  type: z.enum(["PROPOSITION", "ANOMALIE"]),
  estBloquant: z.boolean(),
  emplacement: z
    .string()
    .trim()
    .min(3, "Précisez où se produit le problème")
    .max(160, "L'emplacement est trop long"),
  pageUrl: z
    .string()
    .trim()
    .max(500, "L'adresse de la page est trop longue")
    .refine((value) => value === "" || value.startsWith("/"), "Adresse de page invalide")
    .optional()
    .transform((value) => value || undefined),
  description: z
    .string()
    .trim()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(2000, "La description ne peut pas dépasser 2 000 caractères"),
})

export const statutRetourUtilisateurSchema = z.object({
  statut: z.enum(["NOUVEAU", "EN_COURS", "TRAITE"]),
})

export type RetourUtilisateurInput = z.infer<typeof retourUtilisateurSchema>
