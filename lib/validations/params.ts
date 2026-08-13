/**
 * Validation des paramètres d'URL.
 *
 * `parseInt` renvoie `NaN` sur une entrée non numérique, valeur qui traversait
 * les routes jusqu'à Prisma et produisait un 500 sur une simple requête
 * malformée (`/api/informations/abc`, `?page=-5`).
 */

export function parseId(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw.trim() === "") return null
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) return null
  return value
}

export function parsePage(raw: string | null | undefined, fallback = 1): number | null {
  if (raw === null || raw === undefined || raw.trim() === "") return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) return null
  return value
}
