import { NextRequest, NextResponse } from "next/server"

interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

export interface RateLimitOptions {
  windowMs: number
  max: number
  keyPrefix?: string
}

function clientKey(req: NextRequest, prefix = "") {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  return `${prefix}:${ip}`
}

export function rateLimit(req: NextRequest, opts: RateLimitOptions): NextResponse | null {
  const key = clientKey(req, opts.keyPrefix)
  const now = Date.now()
  const bucket = store.get(key)

  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs })
    return null
  }

  if (bucket.count >= opts.max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez réessayer plus tard." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(opts.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
        },
      }
    )
  }

  bucket.count += 1
  return null
}

setInterval(() => {
  const now = Date.now()
  store.forEach((v, k) => { if (v.resetAt < now) store.delete(k) })
}, 60_000).unref?.()
