import { NextResponse } from "next/server"
import { createHmac } from "crypto"
import { prisma } from "@/lib/prisma"

interface Bucket {
  count: number
  resetAt: number
}

// Utilisé uniquement en développement et dans les tests. En production, les
// tentatives sont persistées en base afin d'être partagées entre les instances.
const localStore = new Map<string, Bucket>()

export interface RateLimitOptions {
  windowMs: number
  max: number
  keyPrefix?: string
  /**
   * Compteur rattaché à un compte (email) plutôt qu'à une IP. Seul contrôle
   * efficace contre un brute-force distribué, où l'IP change à chaque requête.
   */
  identifier?: string
}

type RequestHeaders = Headers | Record<string, string | string[] | undefined>
type RateLimitRequest = { headers: RequestHeaders }

function headerValue(headers: RequestHeaders, name: string) {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name)
  }
  const value = (headers as Record<string, string | string[] | undefined>)[name]
  return Array.isArray(value) ? value[0] : value || null
}

/**
 * Adresse IP réellement observée par l'infrastructure.
 *
 * `X-Forwarded-For` est une liste concaténée : un proxy y *ajoute* l'IP qu'il
 * voit sans effacer ce que le client a envoyé. La première entrée est donc
 * toujours falsifiable — la lire revenait à offrir un compteur neuf à chaque
 * requête. On lit l'en-tête posé par le proxy de confiance (Cloudflare), sinon
 * on remonte la liste depuis la droite du nombre de proxys déclarés.
 */
export function clientIp(req: RateLimitRequest) {
  const cloudflareIp = headerValue(req.headers, "cf-connecting-ip")
  if (cloudflareIp) return cloudflareIp.trim()

  const hops =
    headerValue(req.headers, "x-forwarded-for")
      ?.split(",")
      .map((hop) => hop.trim())
      .filter(Boolean) ?? []

  if (hops.length > 0) {
    const trustedHops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? 1) || 1)
    return hops[Math.max(0, hops.length - trustedHops)]
  }

  // Dernier recours : n'est fiable que si le proxy local écrase cet en-tête.
  return headerValue(req.headers, "x-real-ip")?.trim() || "unknown"
}

function subject(req: RateLimitRequest, opts: RateLimitOptions) {
  return opts.identifier
    ? `acct:${opts.identifier.trim().toLowerCase()}`
    : `ip:${clientIp(req)}`
}

function keyHash(req: RateLimitRequest, opts: RateLimitOptions) {
  const secret = process.env.RATE_LIMIT_HMAC_KEY || process.env.NEXTAUTH_SECRET
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("RATE_LIMIT_HMAC_KEY ou NEXTAUTH_SECRET doit être configuré")
  }
  return createHmac("sha256", secret || "cesizen-test-only")
    .update(`${opts.keyPrefix || ""}:${subject(req, opts)}`)
    .digest("hex")
}

function blockedResponse(max: number, retryAfter: number) {
  return NextResponse.json(
    { error: "Trop de requêtes. Veuillez réessayer plus tard." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": "0",
      },
    }
  )
}

function localRateLimit(req: RateLimitRequest, opts: RateLimitOptions) {
  const key = keyHash(req, opts)
  const now = Date.now()
  const bucket = localStore.get(key)

  if (!bucket || bucket.resetAt < now) {
    localStore.set(key, { count: 1, resetAt: now + opts.windowMs })
    return null
  }

  // Incrément avant contrôle : une tentative bloquée reste comptabilisée.
  bucket.count += 1
  if (bucket.count > opts.max) {
    return blockedResponse(opts.max, Math.ceil((bucket.resetAt - now) / 1000))
  }

  return null
}

export async function rateLimit(
  req: RateLimitRequest,
  opts: RateLimitOptions
): Promise<NextResponse | null> {
  // Désactivé en dev/test pour ne pas gêner les E2E (les buckets sont basés sur l'IP localhost)
  if (process.env.NODE_ENV !== "production" && process.env.RATE_LIMIT_ENABLED !== "1") {
    return null
  }

  if (process.env.NODE_ENV !== "production") {
    return localRateLimit(req, opts)
  }

  try {
    const hash = keyHash(req, opts)
    const since = new Date(Date.now() - opts.windowMs)

    // Insertion *avant* comptage : un COUNT suivi d'un INSERT laissait passer
    // toutes les requêtes concurrentes lancées avant la première écriture.
    await prisma.$executeRaw`
      INSERT INTO rate_limit_attempt (keyHash, createdAt)
      VALUES (${hash}, CURRENT_TIMESTAMP(3))
    `
    const rows = await prisma.$queryRaw<Array<{ attempts: bigint }>>`
      SELECT COUNT(*) AS attempts
      FROM rate_limit_attempt
      WHERE keyHash = ${hash} AND createdAt >= ${since}
    `
    const count = Number(rows[0]?.attempts || 0)

    if (count > opts.max) {
      return blockedResponse(opts.max, Math.ceil(opts.windowMs / 1000))
    }

    return null
  } catch (error) {
    console.error("[rate-limit] persistent store unavailable", error)
    return NextResponse.json(
      { error: "Protection de sécurité temporairement indisponible." },
      { status: 503 }
    )
  }
}

setInterval(() => {
  const now = Date.now()
  localStore.forEach((v, k) => { if (v.resetAt < now) localStore.delete(k) })
}, 60_000).unref?.()
