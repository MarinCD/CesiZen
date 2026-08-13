/**
 * Contrôle de robustesse des secrets au démarrage.
 *
 * Avec des sessions JWT, `NEXTAUTH_SECRET` *est* l'authentification : un secret
 * devinable (nom du projet, "change-me", valeur de CI) permet de forger un jeton
 * `role: "ADMINISTRATEUR"` sans jamais toucher à un mot de passe. En production
 * le démarrage échoue donc plutôt que de servir une application ouverte.
 */

const WEAK_PATTERNS = [
  /change[-_ ]?me/i,
  /cesizen/i,
  /^ci-/i,
  /secret[-_]?key/i,
  /not[-_]used[-_]in[-_]production/i,
  /localhost/i,
  /^(test|demo|dev|password|azerty|qwerty)/i,
]

const MIN_LENGTH = 32
const MIN_DISTINCT_CHARS = 16

export interface SecretCheck {
  valid: boolean
  reason?: string
}

export function checkSecretStrength(value: string | undefined): SecretCheck {
  if (!value || value.trim().length === 0) {
    return { valid: false, reason: "valeur absente" }
  }
  if (value.length < MIN_LENGTH) {
    return { valid: false, reason: `moins de ${MIN_LENGTH} caractères` }
  }
  if (WEAK_PATTERNS.some((pattern) => pattern.test(value))) {
    return { valid: false, reason: "chaîne devinable (mot du projet, gabarit ou valeur de CI)" }
  }
  if (new Set(value).size < MIN_DISTINCT_CHARS) {
    return { valid: false, reason: "entropie insuffisante (trop peu de caractères distincts)" }
  }
  return { valid: true }
}

export function assertStrongSecret(name: string, value: string | undefined) {
  const { valid, reason } = checkSecretStrength(value)
  if (valid) return

  const message =
    `${name} est faible ou absent (${reason}). ` +
    `Générez une valeur distincte par environnement : openssl rand -base64 48`

  // `next build` s'exécute avec NODE_ENV=production mais sans les secrets
  // d'exécution : l'échec doit survenir au démarrage du serveur, pas à la
  // compilation.
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

  if (process.env.NODE_ENV === "production" && !isBuildPhase) {
    throw new Error(message)
  }
  console.warn(`[sécurité] ${message}`)
}

export function assertSecurityEnv() {
  assertStrongSecret("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET)
  assertStrongSecret(
    "AUDIT_HMAC_KEY",
    process.env.AUDIT_HMAC_KEY || process.env.NEXTAUTH_SECRET
  )
  assertStrongSecret(
    "RATE_LIMIT_HMAC_KEY",
    process.env.RATE_LIMIT_HMAC_KEY || process.env.NEXTAUTH_SECRET
  )
}
