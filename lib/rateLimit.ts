import { NextRequest, NextResponse } from "next/server"
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

function clientIp(req: RateLimitRequest) {
  const ip =
    headerValue(req.headers, "x-forwarded-for")?.split(",")[0].trim() ||
    headerValue(req.headers, "x-real-ip") ||
    "unknown"
  return ip
}

function keyHash(req: RateLimitRequest, prefix: string) {
  const secret = process.env.RATE_LIMIT_HMAC_KEY || process.env.NEXTAUTH_SECRET
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("RATE_LIMIT_HMAC_KEY ou NEXTAUTH_SECRET doit être configuré")
  }
  return createHmac("sha256", secret || "cesizen-test-only")
    .update(`${prefix}:${clientIp(req)}`)
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
  const key = keyHash(req, opts.keyPrefix || "")
  const now = Date.now()
  const bucket = localStore.get(key)

  if (!bucket || bucket.resetAt < now) {
    localStore.set(key, { count: 1, resetAt: now + opts.windowMs })
    return null
  }

  if (bucket.count >= opts.max) {
    return blockedResponse(opts.max, Math.ceil((bucket.resetAt - now) / 1000))
  }

  bucket.count += 1
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
    const hash = keyHash(req, opts.keyPrefix || "")
    const since = new Date(Date.now() - opts.windowMs)
    const rows = await prisma.$queryRaw<Array<{ attempts: bigint }>>`
      SELECT COUNT(*) AS attempts
      FROM rate_limit_attempt
      WHERE keyHash = ${hash} AND createdAt >= ${since}
    `
    const count = Number(rows[0]?.attempts || 0)

    if (count >= opts.max) {
      return blockedResponse(opts.max, Math.ceil(opts.windowMs / 1000))
    }

    await prisma.$executeRaw`
      INSERT INTO rate_limit_attempt (keyHash, createdAt)
      VALUES (${hash}, CURRENT_TIMESTAMP(3))
    `
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
