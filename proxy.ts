import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"

const authProxy = withAuth(
  function authorizedRequest(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (pathname.startsWith("/admin") && token?.role !== "ADMINISTRATEUR") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

const protectedPrefixes = ["/dashboard", "/profil", "/historique", "/tracker", "/admin"]
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"])

function contentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV === "development"
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Certains composants Radix/Recharts utilisent encore des attributs style.
    // Les scripts, qui constituent le vecteur XSS critique, restent strictement noncés.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ")
}

function securedRequest(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const csp = contentSecurityPolicy(nonce)
  const headers = new Headers(req.headers)
  headers.set("x-nonce", nonce)
  headers.set("Content-Security-Policy", csp)
  return { request: new NextRequest(req, { headers }), headers, csp }
}

function csrfError(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/") || req.nextUrl.pathname.startsWith("/api/auth/")) {
    return null
  }
  if (!unsafeMethods.has(req.method)) return null

  const origin = req.headers.get("origin")
  const fetchSite = req.headers.get("sec-fetch-site")
  const configuredOrigin = process.env.NEXTAUTH_URL
  const allowedOrigins = new Set([req.nextUrl.origin])

  if (configuredOrigin) {
    try {
      allowedOrigins.add(new URL(configuredOrigin).origin)
    } catch {
      // Une NEXTAUTH_URL invalide sera également signalée au démarrage de NextAuth.
    }
  }

  if (fetchSite === "cross-site" || (origin && !allowedOrigins.has(origin))) {
    return NextResponse.json({ error: "Origine de requête non autorisée" }, { status: 403 })
  }

  if (!origin && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "En-tête Origin requis" }, { status: 403 })
  }

  return null
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const csrfFailure = csrfError(req)
  if (csrfFailure) return csrfFailure

  const secured = securedRequest(req)
  let response: NextResponse

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    response = await (authProxy as any)(secured.request)
  } else {
    response = NextResponse.next({ request: { headers: secured.headers } })
  }

  response.headers.set("Content-Security-Policy", secured.csp)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}
